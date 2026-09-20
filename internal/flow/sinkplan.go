package flow

import (
	"context"
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

// ColumnPlan says what the sink will do with one column.
type ColumnPlan struct {
	// Name is the target column name.
	Name string `json:"name"`
	// Source is the incoming column (empty for target-only columns).
	Source string `json:"source,omitempty"`
	// Mapped is true when an explicit column_map entry renames or skips it.
	Mapped bool `json:"mapped,omitempty"`
	// IntroducedBy names the flow step that created the column (e.g. a
	// Python Script adding it) — empty for columns read from the source.
	IntroducedBy string `json:"introducedBy,omitempty"`
	// Suggest proposes an existing target column for an unmatched incoming
	// one (same name ignoring case/underscores).
	Suggest string `json:"suggest,omitempty"`
	// SourceType is the PostgreSQL type the incoming column maps to.
	SourceType string `json:"sourceType,omitempty"`
	// TargetType is the existing column's type (existing tables only).
	TargetType string `json:"targetType,omitempty"`
	Nullable   bool   `json:"nullable"`
	PrimaryKey bool   `json:"primaryKey,omitempty"`
	// Cast is the conversion applied to the incoming values (column_map cast).
	Cast string `json:"cast,omitempty"`
	// SetType is the configured PostgreSQL type of the target column.
	SetType string `json:"setType,omitempty"`
	// Expr is set for computed columns (sink expressions).
	Expr string `json:"expr,omitempty"`
	// Status: create (new table) | match | add (ALTER TABLE ADD COLUMN) |
	// type_differs (written, converted by PostgreSQL) | retype (existing
	// column changed to the configured type before loading) | dropped (not in
	// target and adding is off) | skipped (column_map skips it) |
	// target_only (exists only in the target).
	Status string `json:"status"`
	Note   string `json:"note,omitempty"`
}

// TablePlan is what the sink will do for one incoming table.
type TablePlan struct {
	Source      string       `json:"source"`
	Schema      string       `json:"schema"`
	Table       string       `json:"table"`
	Mapped      bool         `json:"mapped"`
	Exists      bool         `json:"exists"`
	Action      string       `json:"action"` // create | load | error
	Mode        string       `json:"mode"`
	ConflictKey []string     `json:"conflictKey"`
	Truncate    string       `json:"truncate"`
	Columns     []ColumnPlan `json:"columns"`
	DDL         string       `json:"ddl,omitempty"`
	// Alter lists ALTER COLUMN … TYPE statements run before loading.
	Alter       []string `json:"alter"`
	Indexes     []string `json:"indexes"`
	ForeignKeys []string `json:"foreignKeys"`
	Warnings    []string `json:"warnings"`
	Error       string   `json:"error,omitempty"`
	// SharedWith lists the other incoming tables writing into the same
	// target; for a new table the DDL is the union of all of them.
	SharedWith []string `json:"sharedWith"`
}

// SinkPlanResult is the full plan for a PostgreSQL sink node.
type SinkPlanResult struct {
	Tables      []TablePlan `json:"tables"`
	TotalTables int         `json:"totalTables"`
	Truncated   bool        `json:"truncated"`
}

// SinkPlan resolves, for every table reaching a PostgreSQL sink, the target
// table and the column-level changes a run would make. Nothing is written.
func SinkPlan(ctx context.Context, conns ConnectionResolver, g *model.Graph, nodeID string, maxTables int) (*SinkPlanResult, error) {
	sm, err := NewSimulator(ctx, conns, g, nodeID)
	if err != nil {
		return nil, err
	}
	defer sm.Close()
	sink, ok := sm.built[nodeID].(*pgSink)
	if !ok {
		return nil, fmt.Errorf("node is not a PostgreSQL sink")
	}
	pg, err := sink.rt.PG(ctx, sink.connID)
	if err != nil {
		return nil, err
	}
	res := &SinkPlanResult{Tables: []TablePlan{}, TotalTables: len(sm.Tables())}
	seen := map[string]bool{}
	var batches []*record.Batch
	for i, t := range sm.Tables() {
		if i >= maxTables {
			res.Truncated = true
			break
		}
		sim, err := sm.Run(ctx, t, 3)
		if err != nil {
			res.Tables = append(res.Tables, TablePlan{Source: t, Action: "error", Error: err.Error(),
				Columns: []ColumnPlan{}, Indexes: []string{}, ForeignKeys: []string{}, Warnings: []string{}, SharedWith: []string{}, Alter: []string{}})
			batches = append(batches, nil)
			continue
		}
		for _, b := range sim.Inputs {
			if seen[b.Table] {
				continue
			}
			seen[b.Table] = true
			pb, _ := sink.prepare(b)
			tp := sink.planTable(ctx, pg, pb, sim.Introduced)
			orderColumns(&tp, pb)
			res.Tables = append(res.Tables, tp)
			batches = append(batches, pb)
		}
	}
	sink.planShared(res.Tables, batches)
	return res, nil
}

// planShared reconciles incoming tables that write into the same target:
// a new table is created once from the union of their columns (columns a
// feeder lacks are nullable), and type conflicts and key overlaps are flagged.
func (s *pgSink) planShared(plans []TablePlan, batches []*record.Batch) {
	groups := map[string][]int{}
	var order []string
	for i, p := range plans {
		if p.Action == "error" || i >= len(batches) || batches[i] == nil {
			continue
		}
		k := p.Schema + "." + p.Table
		if _, ok := groups[k]; !ok {
			order = append(order, k)
		}
		groups[k] = append(groups[k], i)
	}
	for i := range plans {
		plans[i].SharedWith = []string{}
	}
	for _, k := range order {
		idx := groups[k]
		if len(idx) < 2 {
			continue
		}
		names := make([]string, len(idx))
		for j, i := range idx {
			names[j] = plans[i].Source
		}
		type member struct {
			cols []record.Column
			meta *record.TableMeta
		}
		members := make([]member, len(idx))
		for j, i := range idx {
			c, _ := s.mapColumns(batches[i].Table, batches[i].Columns)
			members[j] = member{c, s.mapMeta(batches[i].Table, batches[i].Meta)}
		}
		// Union of columns, first definition wins; nullable unless every
		// feeder provides the column as NOT NULL.
		var union []record.Column
		pos := map[string]int{}
		count := map[string]int{}
		types := map[string]map[string][]string{} // col → pg type → feeders
		for j, m := range members {
			dialect := ""
			if m.meta != nil {
				dialect = m.meta.Dialect
			}
			for _, c := range m.cols {
				count[c.Name]++
				ty := dbx.PGType(c, dialect)
				if types[c.Name] == nil {
					types[c.Name] = map[string][]string{}
				}
				types[c.Name][ty] = append(types[c.Name][ty], names[j])
				if p, ok := pos[c.Name]; ok {
					if c.Nullable {
						union[p].Nullable = true
					}
					continue
				}
				pos[c.Name] = len(union)
				union = append(union, c)
			}
		}
		for i := range union {
			if count[union[i].Name] < len(members) {
				union[i].Nullable = true
			}
		}
		var pk []string
		if m := members[0].meta; m != nil {
			pk = m.PrimaryKey
			for _, k := range pk {
				if count[k] < len(members) {
					pk = nil
				}
			}
		}
		var conflicts []string
		for _, c := range union {
			if len(types[c.Name]) > 1 {
				var parts []string
				for ty, who := range types[c.Name] {
					parts = append(parts, fmt.Sprintf("%s from %s", ty, strings.Join(who, ", ")))
				}
				sort.Strings(parts)
				conflicts = append(conflicts, fmt.Sprintf("column %s has different types: %s", c.Name, strings.Join(parts, "; ")))
			}
		}
		dialect := ""
		if members[0].meta != nil {
			dialect = members[0].meta.Dialect
		}
		for j, i := range idx {
			p := &plans[i]
			for _, n := range names {
				if n != p.Source {
					p.SharedWith = append(p.SharedWith, n)
				}
			}
			p.Warnings = append(p.Warnings, fmt.Sprintf("%d incoming tables write into %s: %s", len(idx), k, strings.Join(names, ", ")))
			p.Warnings = append(p.Warnings, conflicts...)
			if len(pk) > 0 && (s.opts.Mode == dbx.ModeMerge || s.opts.Mode == dbx.ModeMergeIgnore) {
				p.Warnings = append(p.Warnings, fmt.Sprintf("rows with the same %s from different tables %s — keep keys disjoint or add a source column to the key",
					strings.Join(pk, ", "), map[bool]string{true: "overwrite each other", false: "keep whichever arrives first"}[s.opts.Mode == dbx.ModeMerge]))
			}
			if p.Action != "create" {
				continue
			}
			p.DDL = dbx.CreateTableSQL(p.Schema, p.Table, union, pk, dialect)
			p.ConflictKey = append([]string{}, pk...)
			mine := map[string]bool{}
			for _, c := range members[j].cols {
				mine[c.Name] = true
			}
			for ci := range p.Columns {
				if n := p.Columns[ci].Name; p.Columns[ci].Status == "create" && count[n] < len(members) {
					p.Columns[ci].Nullable = true
				}
			}
			for _, c := range union {
				if !mine[c.Name] {
					p.Columns = append(p.Columns, ColumnPlan{Name: c.Name, SourceType: dbx.PGType(c, dialect), Nullable: true,
						Status: "target_only", Note: "created for another incoming table; NULL for rows from this one"})
				}
			}
		}
	}
}

func (s *pgSink) planTable(ctx context.Context, pg *dbx.PG, b *record.Batch, introduced map[string]string) (p TablePlan) {
	schema, name := s.targetName(b.Table)
	_, mapped := s.tableMap[strings.ToLower(b.Table)]
	p = TablePlan{Source: b.Table, Schema: schema, Table: name, Mapped: mapped, Mode: string(s.opts.Mode),
		Truncate: s.truncate, Columns: []ColumnPlan{}, Indexes: []string{}, ForeignKeys: []string{}, Warnings: []string{},
		ConflictKey: []string{}, SharedWith: []string{}, Alter: []string{}}
	defer func() {
		set := s.colSet[strings.ToLower(b.Table)]
		for i := range p.Columns {
			c := &p.Columns[i]
			if c.Source == "" {
				continue
			}
			if cs, ok := set[c.Source]; ok {
				c.Cast, c.SetType = string(cs.cast), cs.typ
			}
			if e := s.exprFor(b.Table, c.Source); e != "" {
				c.Expr = e
				for _, x := range s.exprs {
					if x.src == e && x.column == c.Source {
						c.SetType = x.typ
					}
				}
			}
		}
	}()
	cols, src := s.mapColumns(b.Table, b.Columns)
	meta := s.mapMeta(b.Table, b.Meta)
	explicit := s.colMap[strings.ToLower(b.Table)]
	origin := func(i int) (string, bool, string) {
		in := b.Columns[src[i]].Name
		_, m := explicit[in]
		return in, m, introduced[in]
	}
	var skipped []ColumnPlan
	kept := map[int]bool{}
	for _, i := range src {
		kept[i] = true
	}
	for i, c := range b.Columns {
		if !kept[i] {
			skipped = append(skipped, ColumnPlan{Source: c.Name, Name: c.Name, Mapped: true, IntroducedBy: introduced[c.Name],
				Status: "skipped", Note: "not written (column mapping)"})
		}
	}
	dialect := ""
	var pk []string
	if meta != nil {
		dialect, pk = meta.Dialect, meta.PrimaryKey
	}
	pkSet := map[string]bool{}
	for _, k := range pk {
		pkSet[k] = true
	}

	t, err := pg.LoadTarget(ctx, schema, name)
	if err != nil {
		p.Action, p.Error = "error", err.Error()
		return p
	}
	if t == nil {
		if !s.create {
			p.Action, p.Error = "error", fmt.Sprintf("%s.%s does not exist and table creation is off", schema, name)
			return p
		}
		p.Action = "create"
		for i, c := range cols {
			in, m, by := origin(i)
			p.Columns = append(p.Columns, ColumnPlan{Name: c.Name, Source: in, Mapped: m, IntroducedBy: by, SourceType: dbx.PGType(c, dialect),
				Nullable: c.Nullable && !pkSet[c.Name], PrimaryKey: pkSet[c.Name], Status: "create"})
		}
		p.Columns = append(p.Columns, skipped...)
		p.DDL = dbx.CreateTableSQL(schema, name, cols, pk, dialect)
		p.ConflictKey = append(p.ConflictKey, pk...)
		if meta != nil {
			if s.indexes {
				for _, ix := range meta.Indexes {
					kw := "INDEX"
					if ix.Unique {
						kw = "UNIQUE INDEX"
					}
					p.Indexes = append(p.Indexes, fmt.Sprintf("%s (%s)", kw, strings.Join(ix.Columns, ", ")))
				}
			}
			if s.fks {
				for _, fk := range meta.ForeignKeys {
					p.ForeignKeys = append(p.ForeignKeys, fmt.Sprintf("(%s) → %s (%s)", strings.Join(fk.Columns, ", "),
						fk.RefTable, strings.Join(fk.RefColumns, ", ")))
				}
			}
		}
		if len(pk) == 0 && (s.opts.Mode == dbx.ModeMerge || s.opts.Mode == dbx.ModeMergeIgnore) {
			p.Warnings = append(p.Warnings, "no primary key: merge falls back to plain inserts, so re-runs duplicate rows")
		}
		return p
	}

	p.Exists, p.Action = true, "load"
	p.ConflictKey = append(p.ConflictKey, t.PK...)
	incoming := map[string]bool{}
	for _, c := range cols {
		incoming[c.Name] = true
	}
	loose := func(n string) string { return strings.ReplaceAll(strings.ToLower(n), "_", "") }
	unclaimed := map[string]string{} // loose name → target-only column
	for _, n := range t.Order {
		if !incoming[n] {
			unclaimed[loose(n)] = n
		}
	}
	for i, c := range cols {
		in, m, by := origin(i)
		cp := ColumnPlan{Name: c.Name, Source: in, Mapped: m, IntroducedBy: by, SourceType: dbx.PGType(c, dialect), Nullable: c.Nullable, PrimaryKey: pkSet[c.Name]}
		if _, exists := t.Columns[c.Name]; !exists {
			cp.Suggest = unclaimed[loose(c.Name)]
		}
		tc, ok := t.Columns[c.Name]
		switch {
		case !ok && s.addCols:
			cp.Status, cp.Note = "add", "ALTER TABLE … ADD COLUMN before loading"
		case !ok:
			cp.Status, cp.Note = "dropped", "not in the target; enable “Add missing columns” to keep it"
		case tc.Generated:
			cp.TargetType, cp.Status, cp.Note = tc.NativeType, "dropped", "generated column in the target — computed there"
		case c.TargetType != "" && !sameType(c.TargetType, tc.NativeType):
			cp.TargetType, cp.Nullable = tc.NativeType, tc.Nullable
			cp.Status, cp.Note = "retype", fmt.Sprintf("changed from %s to %s before loading", tc.NativeType, c.TargetType)
			p.Alter = append(p.Alter, dbx.AlterColumnTypeSQL(t, c.Name, c.TargetType))
		default:
			cp.TargetType = tc.NativeType
			cp.Nullable = tc.Nullable
			if sameType(cp.SourceType, tc.NativeType) {
				cp.Status = "match"
			} else {
				cp.Status, cp.Note = "type_differs", "PostgreSQL converts values on write; incompatible rows become dead letters"
			}
		}
		p.Columns = append(p.Columns, cp)
	}
	p.Columns = append(p.Columns, skipped...)
	var extra []string
	for _, n := range t.Order {
		if incoming[n] {
			continue
		}
		tc := t.Columns[n]
		cp := ColumnPlan{Name: n, TargetType: tc.NativeType, Nullable: tc.Nullable, Status: "target_only"}
		switch {
		case tc.Generated:
			cp.Note = "generated"
		case tc.AutoIncrement || tc.Default != "":
			cp.Note = "filled by its default"
		case tc.Nullable:
			cp.Note = "left NULL"
		default:
			cp.Note = "NOT NULL without default — inserts will fail"
			extra = append(extra, n)
		}
		p.Columns = append(p.Columns, cp)
	}
	if len(extra) > 0 {
		sort.Strings(extra)
		p.Warnings = append(p.Warnings, fmt.Sprintf("target requires %s but the flow does not provide it", strings.Join(extra, ", ")))
	}
	if len(t.PK) == 0 && (s.opts.Mode == dbx.ModeMerge || s.opts.Mode == dbx.ModeMergeIgnore) {
		p.Warnings = append(p.Warnings, "target has no primary key: merge falls back to plain inserts")
	}
	for _, k := range t.PK {
		if !incoming[k] && (s.opts.Mode == dbx.ModeMerge || s.opts.Mode == dbx.ModeMergeIgnore) {
			p.Warnings = append(p.Warnings, fmt.Sprintf("primary key column %s is not provided: merge falls back to plain inserts", k))
		}
	}
	if s.truncate == "truncate" || s.truncate == "cascade" {
		p.Warnings = append(p.Warnings, "existing rows are deleted before loading (truncate)")
	}
	return p
}

var typeParens = regexp.MustCompile(`\s+`)

// sameType compares a generated PostgreSQL type with format_type output.
func sameType(a, b string) bool {
	norm := func(s string) string {
		s = strings.ToLower(strings.TrimSpace(s))
		for _, r := range [][2]string{
			{"character varying", "varchar"}, {"timestamp without time zone", "timestamp"},
			{"timestamp with time zone", "timestamptz"}, {"time without time zone", "time"},
			{"time with time zone", "timetz"}, {"int4", "integer"}, {"int8", "bigint"}, {"int2", "smallint"},
			{"float8", "double precision"}, {"float4", "real"}, {"bool", "boolean"}, {"booleanean", "boolean"},
		} {
			s = strings.ReplaceAll(s, r[0], r[1])
		}
		return typeParens.ReplaceAllString(s, " ")
	}
	na, nb := norm(a), norm(b)
	if na == nb {
		return true
	}
	// numeric(20,0) vs numeric, varchar(n) vs text differ only in bounds.
	base := func(s string) string {
		if i := strings.IndexByte(s, '('); i > 0 {
			return s[:i]
		}
		return s
	}
	return base(na) == base(nb) && (na == base(na) || nb == base(nb))
}

// orderColumns keeps incoming columns in their arrival order (ignored ones
// stay in place) with target-only columns after them.
func orderColumns(p *TablePlan, b *record.Batch) {
	pos := map[string]int{}
	for i, c := range b.Columns {
		pos[c.Name] = i
	}
	rank := func(c ColumnPlan) int {
		if c.Source == "" {
			return len(b.Columns)
		}
		return pos[c.Source]
	}
	sort.SliceStable(p.Columns, func(i, j int) bool { return rank(p.Columns[i]) < rank(p.Columns[j]) })
}
