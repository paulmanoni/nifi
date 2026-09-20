package flow

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/exprx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/script"
	"github.com/paulmanoni/nifi/record"
)

var nameCase = []Option{{Value: "preserve", Label: "Preserve"}, {Value: "lower", Label: "lowercase"}, {Value: "snake", Label: "snake_case"}}

func init() {
	register(&Spec{
		Type: "transform.rename", Label: "Rename Columns", Category: "Transform", Icon: "pencil",
		Description:   "Renames columns. Indexes, keys and foreign keys follow the new names.",
		Relationships: []string{"success"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "mapping", Label: "Renames", Kind: "keyvalue", Required: true, Help: "old name → new name",
				Columns: []ListColumn{{Key: "key", Label: "Column", Kind: "column"}, {Key: "value", Label: "New name", Kind: "string"}}},
			{Key: "case", Label: "Then convert all names to", Kind: "select", Default: "preserve", Options: nameCase},
			onlyTables,
		},
		build: buildRename,
	})
	register(&Spec{
		Type: "transform.select", Label: "Select / Drop Columns", Category: "Transform", Icon: "columns",
		Description:   "Keeps only the chosen columns, or drops them.",
		Relationships: []string{"success"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "mode", Label: "Mode", Kind: "select", Default: "drop", Options: []Option{{Value: "drop", Label: "Drop these columns"}, {Value: "keep", Label: "Keep only these columns"}}},
			{Key: "columns", Label: "Columns", Kind: "columns", Required: true},
			onlyTables,
		},
		build: buildSelect,
	})
	register(&Spec{
		Type: "transform.compute", Label: "Compute Columns", Category: "Transform", Icon: "function-square",
		Description:   "Adds or overwrites columns from expressions, e.g. lower(trim(email)) or concat(first_name, ' ', last_name).",
		Relationships: []string{"success", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "columns", Label: "Columns", Kind: "list", Required: true, Columns: []ListColumn{
				{Key: "column", Label: "Column", Kind: "column"},
				{Key: "expr", Label: "Expression", Kind: "expr"},
				{Key: "type", Label: "Type", Kind: "type"},
			}, Help: "Columns are evaluated top to bottom; later rows see earlier results. Leave type empty to keep/infer."},
			onlyTables,
		},
		build: buildCompute,
	})
	register(&Spec{
		Type: "transform.filter", Label: "Filter Rows", Category: "Route", Icon: "filter",
		Description:   "Sends rows matching a condition to 'matched', the rest to 'unmatched'.",
		Relationships: []string{"matched", "unmatched", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "condition", Label: "Condition", Kind: "expr", Required: true, Help: "e.g. status != 'deleted' && created_at != nil"},
			onlyTables,
		},
		build: buildFilter,
	})
	register(&Spec{
		Type: "transform.route", Label: "Route", Category: "Route", Icon: "git-fork",
		Description:          "Routes rows to named relationships by condition — one output per rule, plus 'unmatched'. Use table == 'x' to split by table.",
		Relationships:        []string{"unmatched", "failure"},
		DynamicRelationships: "rules", SupportsConcurrency: true,
		Properties: []Property{
			{Key: "rules", Label: "Rules", Kind: "list", Required: true, Columns: []ListColumn{
				{Key: "name", Label: "Relationship", Kind: "string"},
				{Key: "expr", Label: "Condition", Kind: "expr"},
			}},
			{Key: "strategy", Label: "When several match", Kind: "select", Default: "first",
				Options: []Option{{Value: "first", Label: "Send to the first match"}, {Value: "all", Label: "Send to every match"}}},
		},
		build: buildRoute,
	})
	register(&Spec{
		Type: "transform.cast", Label: "Convert Types", Category: "Transform", Icon: "arrow-right-left",
		Description:   "Converts column values to another type (text → integer, string → date…). Unconvertible rows go to 'failure'.",
		Relationships: []string{"success", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "casts", Label: "Conversions", Kind: "list", Required: true, Columns: []ListColumn{
				{Key: "column", Label: "Column", Kind: "column"},
				{Key: "type", Label: "To type", Kind: "type"},
				{Key: "format", Label: "Date format (optional)", Kind: "string"},
			}},
			{Key: "invalid", Label: "Invalid values", Kind: "select", Default: "fail",
				Options: []Option{{Value: "fail", Label: "Send row to failure"}, {Value: "null", Label: "Set to NULL"}}},
			onlyTables,
		},
		build: buildCast,
	})
	register(&Spec{
		Type: "transform.valuemap", Label: "Map Values", Category: "Transform", Icon: "replace",
		Description:   "Replaces values of a column using a lookup list (e.g. status codes → labels).",
		Relationships: []string{"success", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "column", Label: "Column", Kind: "column", Required: true},
			{Key: "target", Label: "Write to column", Kind: "string", Help: "Empty = overwrite the same column."},
			{Key: "mapping", Label: "Mapping", Kind: "keyvalue", Required: true, Help: "from → to",
				Columns: []ListColumn{{Key: "key", Label: "From value", Kind: "string"}, {Key: "value", Label: "To value", Kind: "string"}}},
			{Key: "unmapped", Label: "Unmapped values", Kind: "select", Default: "keep",
				Options: []Option{{Value: "keep", Label: "Keep as is"}, {Value: "null", Label: "Set NULL"}, {Value: "default", Label: "Use default"}, {Value: "fail", Label: "Send row to failure"}}},
			{Key: "default", Label: "Default", Kind: "string", ShowIf: &Cond{Key: "unmapped", Equals: "default"}},
			{Key: "type", Label: "Result type", Kind: "select", Options: append([]Option{{Value: "", Label: "Same as column"}}, typeOptions()...)},
			onlyTables,
		},
		build: buildValueMap,
	})
	register(&Spec{
		Type: "transform.lookup", Label: "Lookup", Category: "Transform", Icon: "search",
		Description:   "Enriches rows with columns from one or more other tables, matched by key and applied in order (batched IN queries, cached).",
		Relationships: []string{"success", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "lookups", Label: "Lookup tables", Kind: "list", Help: "Applied top to bottom. Each entry: connection, table, key, match, fields, existing, missing, where. Edit in the Lookup editor.",
				Columns: []ListColumn{{Key: "table", Label: "Table", Kind: "string"}, {Key: "key", Label: "Lookup column", Kind: "string"}, {Key: "match", Label: "Incoming column", Kind: "column"}}},
			{Key: "connection", Label: "Look up in (connection)", Kind: "connection"},
			{Key: "table", Label: "Look up in (table)", Kind: "table", ConnectionKey: "connection"},
			{Key: "key", Label: "Match: lookup table column", Kind: "string", Help: "e.g. applicant.user_id"},
			{Key: "match", Label: "Match: incoming column", Kind: "column", Help: "e.g. id of the incoming user row"},
			{Key: "fields", Label: "Copy these columns", Kind: "keyvalue", Help: "lookup column → name in the output"},
			{Key: "existing", Label: "When the column already has a value", Kind: "select", Default: "overwrite",
				Options: []Option{{Value: "overwrite", Label: "Overwrite it"}, {Value: "fill", Label: "Keep it — only fill empty values"}},
				Help:    "Chain lookups with “only fill empty” to take a field from the first table that has it (like COALESCE)."},
			{Key: "missing", Label: "No match", Kind: "select", Default: "null",
				Options: []Option{{Value: "null", Label: "Leave NULL (or keep existing)"}, {Value: "drop", Label: "Drop the row"}, {Value: "fail", Label: "Send row to failure"}}},
			{Key: "where", Label: "Only lookup rows where", Kind: "string", Help: "SQL condition on the lookup table, e.g. deleted_at IS NULL"},
			{Key: "multiple", Label: "Several rows match", Kind: "select", Default: "first",
				Options: []Option{{Value: "first", Label: "Use the first (lowest primary key)"}, {Value: "last", Label: "Use the last (highest primary key)"}}},
			{Key: "null_key", Label: "Incoming value is NULL", Kind: "select", Default: "missing",
				Options: []Option{{Value: "missing", Label: "Treat as no match"}, {Value: "keep", Label: "Keep the row unchanged"}}},
			{Key: "cache_size", Label: "Cache entries", Kind: "int", Default: 200000},
			onlyTables,
		},
		build: buildLookup,
	})
	register(&Spec{
		Type: "transform.tables", Label: "Rename Tables", Category: "Transform", Icon: "table",
		Description:   "Renames tables on the way to the target: explicit mapping, prefix/suffix and name casing.",
		Relationships: []string{"success"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "mapping", Label: "Renames", Kind: "keyvalue", Help: "source table → target table",
				Columns: []ListColumn{{Key: "key", Label: "Incoming table", Kind: "string"}, {Key: "value", Label: "New name", Kind: "string"}}},
			{Key: "prefix", Label: "Prefix", Kind: "string"},
			{Key: "suffix", Label: "Suffix", Kind: "string"},
			{Key: "case", Label: "Name case", Kind: "select", Default: "preserve", Options: nameCase},
		},
		build: buildTableRename,
	})
	register(&Spec{
		Type: "transform.script", Label: "Python Script", Category: "Script", Icon: "code",
		Description:   "Transforms rows with a Python-dialect (Starlark) script — for logic the GUI steps can't express.",
		Relationships: []string{"success", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "script", Label: "Script", Kind: "script", Required: true,
				Default: "# Python (Starlark dialect). Available imports: json, re, math, time, datetime, hashlib, uuid.\n# Not available: other modules, classes, try/except, with.\n\ndef transform(row):\n    # row is a dict of column -> value. Return a dict, a list of dicts (fan out),\n    # or None to drop the row. Set row[\"_table\"] = \"name\" to send it to another table.\n    return row\n"},
			onlyTables,
		},
		build: buildScript,
	})
}

// ---- helpers ----

func applyCase(name, mode string) string {
	switch mode {
	case "lower":
		return strings.ToLower(name)
	case "snake":
		return exprx.Snake(name)
	}
	return name
}

type rowFailer struct {
	fail *record.Batch
}

func (f *rowFailer) add(b *record.Batch, i int, row []any, err error) {
	if f.fail == nil {
		f.fail = b.Derive()
		f.fail.Errors = []string{}
	}
	f.fail.Append(row, b.Op(i))
	f.fail.Errors = append(f.fail.Errors, err.Error())
}

// rowKeep filters a batch's rows while keeping the per-row operations aligned
// with them. Kept in place, so dropping rows still allocates nothing.
type rowKeep struct {
	rows [][]any
	ops  []record.Op
	has  bool
}

func keepInPlace(b *record.Batch) rowKeep {
	return rowKeep{rows: b.Rows[:0], ops: b.Ops[:0], has: b.Ops != nil}
}

func keepNew(b *record.Batch) rowKeep {
	k := rowKeep{rows: make([][]any, 0, len(b.Rows)), has: b.Ops != nil}
	if k.has {
		k.ops = make([]record.Op, 0, len(b.Rows))
	}
	return k
}

// add keeps row, which is source row i of b (possibly rewritten in place).
func (k *rowKeep) add(b *record.Batch, i int, row []any) {
	k.rows = append(k.rows, row)
	if k.has {
		k.ops = append(k.ops, b.Op(i))
	}
}

func (k *rowKeep) apply(b *record.Batch) {
	b.Rows = k.rows
	if k.has {
		b.Ops = k.ops
	}
}

func (f *rowFailer) emit(out Emitter) {
	if f.fail != nil {
		out.Emit("failure", f.fail)
	}
}

// ---- rename ----

type rename struct {
	mapping map[string]string
	caseTo  string
	only    tableFilter
	cache   sync.Map // *record.TableMeta / []Column identity → renamed
}

func buildRename(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	return &rename{mapping: cfg.PairMap("mapping"), caseTo: cfg.String("case"), only: newTableFilter(cfg)}, nil
}

type renamed struct {
	cols []record.Column
	meta *record.TableMeta
}

func (r *rename) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if r.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	if len(b.Columns) == 0 {
		out.Emit("success", b)
		return nil
	}
	key := fmt.Sprintf("%p|%p", b.Meta, &b.Columns[0])
	v, ok := r.cache.Load(key)
	if !ok {
		ren := map[string]string{}
		cols := append([]record.Column(nil), b.Columns...)
		for i := range cols {
			to := cols[i].Name
			if m, ok := r.mapping[to]; ok && m != "" {
				to = m
			}
			to = applyCase(to, r.caseTo)
			if to != cols[i].Name {
				ren[cols[i].Name] = to
				cols[i].Name = to
			}
		}
		meta := b.Meta.Clone()
		meta.RenameColumns(ren)
		v, _ = r.cache.LoadOrStore(key, renamed{cols, meta})
	}
	rn := v.(renamed)
	b.Columns, b.Meta = rn.cols, rn.meta
	out.Emit("success", b)
	return nil
}

// ---- select ----

type selectCols struct {
	keep bool
	cols map[string]bool
	only tableFilter
}

func buildSelect(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	s := &selectCols{keep: cfg.String("mode") == "keep", cols: map[string]bool{}, only: newTableFilter(cfg)}
	for _, c := range cfg.Strings("columns") {
		// columns picked per table arrive as "table.column"; accept both.
		s.cols[strings.ToLower(c)] = true
	}
	return s, nil
}

func (s *selectCols) want(table, col string) bool {
	hit := s.cols[strings.ToLower(col)] || s.cols[strings.ToLower(table+"."+col)]
	return hit == s.keep
}

func (s *selectCols) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if s.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	var idx []int
	var cols []record.Column
	for i, c := range b.Columns {
		if s.want(b.Table, c.Name) {
			idx = append(idx, i)
			cols = append(cols, c)
		}
	}
	for r, row := range b.Rows {
		nr := make([]any, len(idx))
		for j, i := range idx {
			if i < len(row) {
				nr[j] = row[i]
			}
		}
		b.Rows[r] = nr
	}
	keep := map[string]bool{}
	for _, c := range cols {
		keep[c.Name] = true
	}
	m := b.Meta.Clone()
	m.DropColumns(func(n string) bool { return keep[n] })
	b.Columns, b.Meta = cols, m
	out.Emit("success", b)
	return nil
}

// ---- compute ----

type computeCol struct {
	name string
	prog *exprx.Program
	typ  record.Type
}

type compute struct {
	cols []computeCol
	only tableFilter
}

func buildCompute(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	c := &compute{only: newTableFilter(cfg)}
	for i, r := range cfg.List("columns") {
		name, src := str(r, "column"), str(r, "expr")
		if name == "" || src == "" {
			continue
		}
		p, err := exprx.Compile(src)
		if err != nil {
			return nil, fmt.Errorf("column %d (%s): %w", i+1, name, err)
		}
		c.cols = append(c.cols, computeCol{name: name, prog: p, typ: record.Type(str(r, "type"))})
	}
	if len(c.cols) == 0 {
		return nil, fmt.Errorf("add at least one column")
	}
	return c, nil
}

func (c *compute) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if c.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	cols := append([]record.Column(nil), b.Columns...)
	pos := make([]int, len(c.cols))
	for i, cc := range c.cols {
		pos[i] = -1
		for j, col := range cols {
			if col.Name == cc.name {
				pos[i] = j
				if cc.typ != "" {
					cols[j].Type, cols[j].NativeType = cc.typ, ""
				}
			}
		}
		if pos[i] < 0 {
			pos[i] = len(cols)
			cols = append(cols, record.Column{Name: cc.name, Type: cc.typ, Nullable: true})
		}
	}
	names := make([]string, len(cols))
	for i, col := range cols {
		names[i] = col.Name
	}
	var f rowFailer
	good := keepInPlace(b)
	var env map[string]any
	for ri, row := range b.Rows {
		for len(row) < len(cols) {
			row = append(row, nil)
		}
		var rerr error
		for i, cc := range c.cols {
			env = exprx.Env(env, b.Table, names, row)
			v, err := cc.prog.Run(env)
			if err == nil && cc.typ != "" {
				v, err = castValue(v, cc.typ, "")
			}
			if err != nil {
				rerr = fmt.Errorf("%s: %w", cc.name, err)
				break
			}
			row[pos[i]] = normalize(v)
		}
		if rerr != nil {
			f.add(b, ri, row, rerr)
			continue
		}
		good.add(b, ri, row)
	}
	// Infer types for new columns from the first non-null value.
	for i := range cols {
		if cols[i].Type == "" {
			for _, row := range good.rows {
				if row[i] != nil {
					cols[i].Type = script.InferColumn(cols[i].Name, row[i]).Type
					break
				}
			}
			if cols[i].Type == "" {
				cols[i].Type = record.Text
			}
		}
	}
	good.apply(b)
	b.Columns = cols
	if f.fail != nil {
		f.fail.Columns = cols
	}
	out.Emit("success", b)
	f.emit(out)
	return nil
}

// normalize folds expr-lang results onto canonical value types.
func normalize(v any) any {
	switch x := v.(type) {
	case int:
		return int64(x)
	case int32:
		return int64(x)
	case float32:
		return float64(x)
	case time.Duration:
		return x.String()
	}
	return v
}

// ---- filter ----

type filter struct {
	prog *exprx.Program
	only tableFilter
}

func buildFilter(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	p, err := exprx.Compile(cfg.String("condition"))
	if err != nil {
		return nil, err
	}
	return &filter{prog: p, only: newTableFilter(cfg)}, nil
}

func colNames(cols []record.Column) []string {
	n := make([]string, len(cols))
	for i, c := range cols {
		n[i] = c.Name
	}
	return n
}

func (f *filter) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if f.only.skip(b.Table) {
		out.Emit("matched", b)
		return nil
	}
	names := colNames(b.Columns)
	yes, no := b.Derive(), b.Derive()
	var fl rowFailer
	var env map[string]any
	for i, row := range b.Rows {
		env = exprx.Env(env, b.Table, names, row)
		ok, err := f.prog.Truthy(env)
		switch {
		case err != nil:
			fl.add(b, i, row, err)
		case ok:
			yes.AppendRow(b, i)
		default:
			no.AppendRow(b, i)
		}
	}
	// Empty batches still flow on both sides so downstream sees the schema.
	out.Emit("matched", yes)
	out.Emit("unmatched", no)
	fl.emit(out)
	return nil
}

// ---- route ----

type routeRule struct {
	name string
	prog *exprx.Program
}

type route struct {
	rules []routeRule
	all   bool
}

func buildRoute(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	r := &route{all: cfg.String("strategy") == "all"}
	for i, m := range cfg.List("rules") {
		name, src := str(m, "name"), str(m, "expr")
		if name == "" || src == "" {
			continue
		}
		p, err := exprx.Compile(src)
		if err != nil {
			return nil, fmt.Errorf("rule %d (%s): %w", i+1, name, err)
		}
		r.rules = append(r.rules, routeRule{name, p})
	}
	if len(r.rules) == 0 {
		return nil, fmt.Errorf("add at least one rule")
	}
	return r, nil
}

func (r *route) Process(_ context.Context, b *record.Batch, out Emitter) error {
	names := colNames(b.Columns)
	outs := make([]*record.Batch, len(r.rules))
	for i := range outs {
		outs[i] = b.Derive()
	}
	unmatched := b.Derive()
	var fl rowFailer
	var env map[string]any
	for ri, row := range b.Rows {
		env = exprx.Env(env, b.Table, names, row)
		hit := false
		var rerr error
		for i, rule := range r.rules {
			ok, err := rule.prog.Truthy(env)
			if err != nil {
				rerr = fmt.Errorf("rule %s: %w", rule.name, err)
				break
			}
			if ok {
				if hit {
					row = append([]any(nil), row...)
				}
				outs[i].Append(row, b.Op(ri))
				hit = true
				if !r.all {
					break
				}
			}
		}
		switch {
		case rerr != nil:
			fl.add(b, ri, row, rerr)
		case !hit:
			unmatched.Append(row, b.Op(ri))
		}
	}
	for i, rule := range r.rules {
		out.Emit(rule.name, outs[i])
	}
	out.Emit("unmatched", unmatched)
	fl.emit(out)
	return nil
}

// ---- cast ----

type castSpec struct {
	col    string
	typ    record.Type
	format string
}

type cast struct {
	casts  []castSpec
	toNull bool
	only   tableFilter
}

func buildCast(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	c := &cast{toNull: cfg.String("invalid") == "null", only: newTableFilter(cfg)}
	for _, m := range cfg.List("casts") {
		if col, t := str(m, "column"), str(m, "type"); col != "" && t != "" {
			c.casts = append(c.casts, castSpec{col, record.Type(t), str(m, "format")})
		}
	}
	return c, nil
}

func (c *cast) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if c.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	cols := append([]record.Column(nil), b.Columns...)
	idx := make([]int, len(c.casts))
	for i, cs := range c.casts {
		idx[i] = b.Index(cs.col)
		if idx[i] >= 0 {
			cols[idx[i]].Type, cols[idx[i]].NativeType = cs.typ, ""
			if cs.typ != record.String {
				cols[idx[i]].Length = 0
			}
		}
	}
	var fl rowFailer
	good := keepInPlace(b)
	for ri, row := range b.Rows {
		var rerr error
		for i, cs := range c.casts {
			j := idx[i]
			if j < 0 || j >= len(row) {
				continue
			}
			v, err := castValue(row[j], cs.typ, cs.format)
			if err != nil {
				if c.toNull {
					v = nil
				} else {
					rerr = fmt.Errorf("%s: %w", cs.col, err)
					break
				}
			}
			row[j] = v
		}
		if rerr != nil {
			fl.add(b, ri, row, rerr)
			continue
		}
		good.add(b, ri, row)
	}
	good.apply(b)
	b.Columns = cols
	out.Emit("success", b)
	fl.emit(out)
	return nil
}

// castValue converts v to the canonical Go value for t.
func castValue(v any, t record.Type, format string) (any, error) {
	if v == nil {
		return nil, nil
	}
	s := func() string {
		switch x := v.(type) {
		case string:
			return strings.TrimSpace(x)
		case []byte:
			return strings.TrimSpace(string(x))
		case time.Time:
			return x.Format(time.RFC3339Nano)
		}
		return fmt.Sprint(v)
	}
	switch t {
	case record.Bool:
		switch x := v.(type) {
		case bool:
			return x, nil
		case int64:
			return x != 0, nil
		case float64:
			return x != 0, nil
		}
		switch strings.ToLower(s()) {
		case "1", "t", "true", "y", "yes", "on":
			return true, nil
		case "0", "f", "false", "n", "no", "off", "":
			return false, nil
		}
		return nil, fmt.Errorf("%q is not a boolean", s())
	case record.Int16, record.Int32, record.Int64, record.Year:
		switch x := v.(type) {
		case int64:
			return x, nil
		case float64:
			return int64(x), nil
		case bool:
			return map[bool]int64{true: 1, false: 0}[x], nil
		case uint64:
			return int64(x), nil
		}
		if s() == "" {
			return nil, nil
		}
		n, err := strconv.ParseInt(s(), 10, 64)
		if err != nil {
			f, ferr := strconv.ParseFloat(s(), 64)
			if ferr != nil {
				return nil, fmt.Errorf("%q is not an integer", s())
			}
			n = int64(f)
		}
		return n, nil
	case record.Uint64:
		n, err := strconv.ParseUint(s(), 10, 64)
		if err != nil {
			return nil, fmt.Errorf("%q is not an unsigned integer", s())
		}
		return n, nil
	case record.Float32, record.Float64:
		switch x := v.(type) {
		case float64:
			return x, nil
		case int64:
			return float64(x), nil
		}
		if s() == "" {
			return nil, nil
		}
		f, err := strconv.ParseFloat(s(), 64)
		if err != nil {
			return nil, fmt.Errorf("%q is not a number", s())
		}
		return f, nil
	case record.Decimal:
		if _, err := strconv.ParseFloat(s(), 64); err != nil {
			return nil, fmt.Errorf("%q is not a number", s())
		}
		return s(), nil
	case record.Date, record.Timestamp, record.TimestampTZ:
		if tv, ok := v.(time.Time); ok {
			return tv, nil
		}
		if s() == "" {
			return nil, nil
		}
		layouts := []string{time.RFC3339Nano, "2006-01-02 15:04:05.999999999Z07:00", "2006-01-02 15:04:05.999999999", "2006-01-02T15:04:05", "2006-01-02", "02/01/2006", "2006/01/02"}
		if format != "" {
			layouts = []string{goLayoutPublic(format)}
		}
		for _, l := range layouts {
			if tv, err := time.ParseInLocation(l, s(), time.UTC); err == nil {
				return tv.UTC(), nil
			}
		}
		if n, err := strconv.ParseInt(s(), 10, 64); err == nil && format == "" {
			return time.Unix(n, 0).UTC(), nil
		}
		return nil, fmt.Errorf("%q is not a date/time", s())
	case record.JSON:
		switch x := v.(type) {
		case map[string]any, []any:
			j, _ := json.Marshal(x)
			return string(j), nil
		}
		if !json.Valid([]byte(s())) {
			return nil, fmt.Errorf("invalid JSON")
		}
		return s(), nil
	case record.Bytes:
		if b, ok := v.([]byte); ok {
			return b, nil
		}
		return []byte(fmt.Sprint(v)), nil
	default:
		if tv, ok := v.(time.Time); ok && format != "" {
			return tv.Format(goLayoutPublic(format)), nil
		}
		switch x := v.(type) {
		case string:
			return x, nil
		case []byte:
			return string(x), nil
		}
		return s(), nil
	}
}

func goLayoutPublic(l string) string {
	if strings.Contains(l, "2006") {
		return l
	}
	return strings.NewReplacer("YYYY", "2006", "YY", "06", "MM", "01", "DD", "02", "HH", "15", "mm", "04", "ss", "05").Replace(l)
}

// ---- value map ----

type valueMap struct {
	col, target string
	mapping     map[string]string
	unmapped    string
	def         string
	typ         record.Type
	only        tableFilter
}

func buildValueMap(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	return &valueMap{col: cfg.String("column"), target: cfg.String("target"), mapping: cfg.PairMap("mapping"),
		unmapped: cfg.String("unmapped"), def: cfg.String("default"), typ: record.Type(cfg.String("type")), only: newTableFilter(cfg)}, nil
}

func (m *valueMap) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if m.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	src := b.Index(m.col)
	if src < 0 {
		out.Emit("success", b)
		return nil
	}
	cols := b.Columns
	dst := src
	if m.target != "" && m.target != m.col {
		if dst = b.Index(m.target); dst < 0 {
			cols = append(append([]record.Column(nil), cols...), record.Column{Name: m.target, Type: b.Columns[src].Type, Nullable: true})
			dst = len(cols) - 1
		}
	}
	if m.typ != "" {
		cols = append([]record.Column(nil), cols...)
		cols[dst].Type, cols[dst].NativeType, cols[dst].Length = m.typ, "", 0
	} else if dst == src && len(m.mapping) > 0 && cols[dst].Type != record.Text {
		// Mapped values are text unless told otherwise.
		cols = append([]record.Column(nil), cols...)
		cols[dst].Type, cols[dst].NativeType, cols[dst].Length = record.Text, "", 0
	}
	var fl rowFailer
	good := keepInPlace(b)
	for ri, row := range b.Rows {
		for len(row) < len(cols) {
			row = append(row, nil)
		}
		v := row[src]
		key := "NULL"
		if v != nil {
			key = keyText(v)
		}
		to, ok := m.mapping[key]
		var nv any = to
		if !ok {
			switch m.unmapped {
			case "null":
				nv = nil
			case "default":
				nv = m.def
			case "fail":
				fl.add(b, ri, row, fmt.Errorf("%s: no mapping for %q", m.col, key))
				continue
			default:
				nv = v
			}
		} else if to == "NULL" {
			nv = nil
		}
		if m.typ != "" && nv != nil {
			c, err := castValue(nv, m.typ, "")
			if err != nil {
				fl.add(b, ri, row, err)
				continue
			}
			nv = c
		}
		row[dst] = nv
		good.add(b, ri, row)
	}
	good.apply(b)
	b.Columns = cols
	out.Emit("success", b)
	fl.emit(out)
	return nil
}

// ---- lookup ----

type lookup struct {
	rt       *Runtime
	node     *model.Node
	skipMu   sync.Mutex
	skipped  map[string]bool
	connID   string
	table    string
	key      string
	match    string
	fields   [][2]string
	missing  string
	keepNil  bool
	last     bool
	fill     bool
	where    string
	only     tableFilter
	capacity int

	mu    sync.RWMutex
	cache map[string][]any // key → field values; nil slice = known miss
	meta  *record.TableMeta
	cols  []record.Column
}

// buildLookup builds a chain of lookups. The "lookups" list holds one entry
// per lookup table (applied in order); a config without it is a single
// lookup described by the top-level keys (the original shape).
func buildLookup(n *model.Node, cfg Config, rt *Runtime) (any, error) {
	entries := cfg.List("lookups")
	if len(entries) == 0 {
		entries = []map[string]any{cfg}
	}
	chain := &lookupChain{only: newTableFilter(cfg)}
	for i, e := range entries {
		ec := Config(e)
		l := &lookup{rt: rt, node: n, skipped: map[string]bool{}, connID: ec.String("connection"), table: ec.String("table"),
			key: ec.String("key"), match: ec.String("match"), fields: ec.Pairs("fields"), missing: ec.String("missing"),
			fill: ec.String("existing") == "fill", where: ec.String("where"), keepNil: ec.String("null_key") == "keep", last: ec.String("multiple") == "last",
			capacity: cfg.Int("cache_size", 200000), cache: map[string][]any{}}
		if l.missing == "" {
			l.missing = "null"
		}
		what := fmt.Sprintf("lookup %d", i+1)
		if l.table != "" {
			what += " (" + l.table + ")"
		}
		switch {
		case l.connID == "":
			return nil, fmt.Errorf("%s: choose a connection", what)
		case l.table == "":
			return nil, fmt.Errorf("%s: choose a table", what)
		case l.key == "" || l.match == "":
			return nil, fmt.Errorf("%s: choose the columns to match on", what)
		case len(l.fields) == 0:
			return nil, fmt.Errorf("%s: choose at least one column to copy", what)
		}
		chain.steps = append(chain.steps, l)
	}
	return chain, nil
}

// lookupChain applies several lookups in order to the same rows.
type lookupChain struct {
	steps []*lookup
	only  tableFilter
}

func (c *lookupChain) Process(ctx context.Context, b *record.Batch, out Emitter) error {
	if c.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	cur := b
	for _, l := range c.steps {
		col := &collector{out: map[string][]*record.Batch{}}
		if err := l.Process(ctx, cur, col); err != nil {
			return err
		}
		for _, f := range col.out["failure"] {
			out.Emit("failure", f)
		}
		ok := col.out["success"]
		if len(ok) == 0 {
			return nil
		}
		cur = mergeBatches(ok)
	}
	out.Emit("success", cur)
	return nil
}

func (l *lookup) init(ctx context.Context, db dbx.DB) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.meta != nil {
		return nil
	}
	meta, err := db.Describe(ctx, l.table)
	if err != nil {
		return err
	}
	byName := map[string]record.Column{}
	for _, c := range meta.Columns {
		byName[c.Name] = c
	}
	if _, ok := byName[l.key]; !ok {
		return fmt.Errorf("lookup table %s has no column %q", l.table, l.key)
	}
	for _, f := range l.fields {
		c, ok := byName[f[0]]
		if !ok {
			return fmt.Errorf("lookup table %s has no column %q", l.table, f[0])
		}
		l.cols = append(l.cols, c)
	}
	l.meta = meta
	return nil
}

func (l *lookup) Process(ctx context.Context, b *record.Batch, out Emitter) error {
	if l.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	db, err := l.rt.DB(ctx, l.connID)
	if err != nil {
		return err
	}
	if err := l.init(ctx, db); err != nil {
		return err
	}
	// match is "column" or "table.column"; a qualified match applies to that
	// table only. Tables without the column pass through unchanged.
	matchCol := l.match
	if i := strings.LastIndexByte(l.match, '.'); i > 0 {
		if !strings.EqualFold(l.match[:i], b.Table) {
			out.Emit("success", b)
			return nil
		}
		matchCol = l.match[i+1:]
	}
	mi := b.Index(matchCol)
	if mi < 0 {
		l.skipMu.Lock()
		first := !l.skipped[b.Table]
		l.skipped[b.Table] = true
		l.skipMu.Unlock()
		if first {
			l.rt.Bulletin("info", l.node.ID, b.Source, fmt.Sprintf("%s: table %s has no column %q — passed through without lookup", l.node.Name, b.Table, matchCol))
		}
		out.Emit("success", b)
		return nil
	}
	// Collect cache misses and fetch them in one IN query.
	var missing []string
	seen := map[string]bool{}
	l.mu.RLock()
	for _, row := range b.Rows {
		if mi < len(row) && row[mi] != nil {
			k := keyText(row[mi])
			if _, ok := l.cache[k]; !ok && !seen[k] {
				seen[k] = true
				missing = append(missing, k)
			}
		}
	}
	l.mu.RUnlock()
	for start := 0; start < len(missing); start += 1000 {
		if err := l.fetch(ctx, db, missing[start:min(start+1000, len(missing))]); err != nil {
			return err
		}
	}

	cols := append([]record.Column(nil), b.Columns...)
	pos := make([]int, len(l.fields))
	for i, f := range l.fields {
		c := l.cols[i]
		c.Name, c.Nullable = f[1], true
		if l.meta.Dialect != "postgres" {
			c.NativeType = ""
		}
		pos[i] = b.Index(f[1])
		if pos[i] < 0 {
			pos[i] = len(cols)
			cols = append(cols, c)
		}
	}
	var fl rowFailer
	good := keepInPlace(b)
	l.mu.RLock()
	for ri, row := range b.Rows {
		for len(row) < len(cols) {
			row = append(row, nil)
		}
		var vals []any
		if row[mi] != nil {
			vals = l.cache[keyText(row[mi])]
		} else if l.keepNil {
			good.add(b, ri, row)
			continue
		}
		if vals == nil {
			switch {
			case b.Op(ri) == record.Delete:
				// A deleted row says only that it is gone; what it used to
				// point at may be gone too. Dropping it, or failing on it,
				// would leave it in the destination for good — so it travels
				// on unenriched.
				good.add(b, ri, row)
				continue
			case l.missing == "drop":
				continue
			case l.missing == "fail":
				fl.add(b, ri, row, fmt.Errorf("lookup: no %s row with %s = %v", l.table, l.key, row[mi]))
				continue
			}
		}
		for i := range l.fields {
			if l.fill && !isEmptyValue(row[pos[i]]) {
				continue
			}
			if vals != nil {
				row[pos[i]] = vals[i]
			} else if !l.fill {
				row[pos[i]] = nil
			}
		}
		good.add(b, ri, row)
	}
	l.mu.RUnlock()
	good.apply(b)
	b.Columns = cols
	out.Emit("success", b)
	fl.emit(out)
	return nil
}

func (l *lookup) fetch(ctx context.Context, db dbx.DB, keys []string) error {
	sel := make([]string, 0, len(l.cols)+1)
	sel = append(sel, db.Quote(l.key))
	for _, c := range l.cols {
		sel = append(sel, db.Quote(c.Name))
	}
	ph := make([]string, len(keys))
	args := make([]any, len(keys))
	for i, k := range keys {
		if db.Driver() == "postgres" {
			ph[i] = fmt.Sprintf("$%d", i+1)
		} else {
			ph[i] = "?"
		}
		args[i] = k
	}
	keyExpr := db.Quote(l.key)
	if db.Driver() == "postgres" {
		keyExpr += "::text"
	}
	cond := ""
	if strings.TrimSpace(l.where) != "" {
		cond = " AND (" + l.where + ")"
	}
	order := []string{db.Quote(l.key)}
	for _, k := range l.meta.PrimaryKey {
		if l.last {
			order = append(order, db.Quote(k)+" DESC")
		} else {
			order = append(order, db.Quote(k))
		}
	}
	q := fmt.Sprintf("SELECT %s FROM %s WHERE %s IN (%s)%s ORDER BY %s", strings.Join(sel, ", "), db.QualifiedName(l.meta), keyExpr,
		strings.Join(ph, ", "), cond, strings.Join(order, ", "))
	conv := converters(db, l.cols)
	found := map[string][]any{}
	err := db.Scan(ctx, q, args, func(raw [][]byte) error {
		if raw[0] == nil {
			return nil
		}
		// Several rows per key: the first one wins (stable across runs).
		if _, dup := found[string(raw[0])]; !dup {
			found[string(raw[0])] = convertRow(conv, raw[1:])
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("lookup query: %w", err)
	}
	l.mu.Lock()
	if len(l.cache) > l.capacity {
		l.cache = map[string][]any{}
	}
	for _, k := range keys {
		if v, ok := found[k]; ok {
			l.cache[k] = v
		} else {
			l.cache[k] = nil
		}
	}
	l.mu.Unlock()
	return nil
}

// ---- table rename ----

type tableRename struct {
	mapping        map[string]string
	prefix, suffix string
	caseTo         string
}

func buildTableRename(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	m := map[string]string{}
	for k, v := range cfg.PairMap("mapping") {
		m[strings.ToLower(k)] = v
	}
	return &tableRename{mapping: m, prefix: cfg.String("prefix"), suffix: cfg.String("suffix"), caseTo: cfg.String("case")}, nil
}

// Rename maps one table name.
func (t *tableRename) Rename(name string) string {
	if to, ok := t.mapping[strings.ToLower(name)]; ok && to != "" {
		return to
	}
	schema, base := dbx.SplitTable(name)
	base = applyCase(t.prefix+base+t.suffix, t.caseTo)
	if schema != "" {
		return schema + "." + base
	}
	return base
}

func (t *tableRename) Process(_ context.Context, b *record.Batch, out Emitter) error {
	b.Table = t.Rename(b.Table)
	out.Emit("success", b)
	return nil
}

// ---- script ----

type scriptProc struct {
	rt   *Runtime
	node *model.Node
	prog *script.Program
	only tableFilter
}

func buildScript(n *model.Node, cfg Config, rt *Runtime) (any, error) {
	p, err := script.Compile(cfg.String("script"), nil)
	if err != nil {
		return nil, err
	}
	return &scriptProc{rt: rt, node: n, prog: p, only: newTableFilter(cfg)}, nil
}

func (s *scriptProc) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if s.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	logf := func(msg string) { s.rt.Bulletin("info", s.node.ID, b.Table, "script: "+msg) }
	res, err := s.prog.Run(b, logf)
	if err != nil {
		f := b.Derive()
		f.Rows, f.Ops = b.Rows, b.Ops
		f.Errors = make([]string, len(b.Rows))
		for i := range f.Errors {
			f.Errors[i] = err.Error()
		}
		out.Emit("failure", f)
		return nil
	}
	o := b.Derive()
	o.Columns, o.Rows = res.Columns, res.Rows
	if len(res.Rows) == len(b.Rows) {
		o.Ops = b.Ops
	} else if b.Changes() {
		return fmt.Errorf("%s: the script returned %d rows for %d incoming — a script that adds or drops rows cannot carry inserts, updates and deletes through, because it no longer says which row is which",
			s.node.Name, len(res.Rows), len(b.Rows))
	}
	if len(res.Columns) != len(b.Columns) {
		keep := map[string]bool{}
		for _, c := range res.Columns {
			keep[c.Name] = true
		}
		m := b.Meta.Clone()
		m.DropColumns(func(n string) bool { return keep[n] && n != TableKey })
		o.Meta = m
	}
	for _, part := range splitByTable(o) {
		out.Emit("success", part)
	}
	if len(res.Failed) > 0 {
		f := b.Derive()
		for _, fe := range res.Failed {
			f.AppendRow(b, fe.Row)
			f.Errors = append(f.Errors, fe.Err.Error())
		}
		out.Emit("failure", f)
	}
	return nil
}

// TableKey is the row key a script sets to send a row to another table:
// row["_table"] = "archive_users". The key itself is not written.
const TableKey = "_table"

// splitByTable routes rows carrying a _table value into per-table batches.
func splitByTable(b *record.Batch) []*record.Batch {
	ti := -1
	for i, c := range b.Columns {
		if c.Name == TableKey {
			ti = i
		}
	}
	if ti < 0 {
		return []*record.Batch{b}
	}
	cols := append(append([]record.Column{}, b.Columns[:ti]...), b.Columns[ti+1:]...)
	parts := map[string]*record.Batch{}
	var order []string
	for ri, row := range b.Rows {
		table := b.Table
		if ti < len(row) && row[ti] != nil {
			if t := strings.TrimSpace(fmt.Sprint(row[ti])); t != "" {
				table = t
			}
		}
		nr := append(append([]any{}, row[:min(ti, len(row))]...), row[min(ti+1, len(row)):]...)
		p, ok := parts[table]
		if !ok {
			p = b.Derive()
			p.Table, p.Columns, p.Rows = table, cols, nil
			parts[table] = p
			order = append(order, table)
		}
		p.Append(nr, b.Op(ri))
	}
	if len(order) == 0 {
		o := b.Derive()
		o.Columns = cols
		return []*record.Batch{o}
	}
	out := make([]*record.Batch, len(order))
	for i, t := range order {
		out[i] = parts[t]
	}
	return out
}

func isEmptyValue(v any) bool {
	switch x := v.(type) {
	case nil:
		return true
	case string:
		return strings.TrimSpace(x) == ""
	}
	return false
}

func init() {
	register(&Spec{
		Type: "transform.project", Label: "Map Columns", Category: "Transform", Icon: "table-properties",
		Description:   "Builds the output row from scratch: exactly the listed columns, each an expression over the incoming row (like filling a struct). Columns not listed are dropped.",
		Relationships: []string{"success", "failure"}, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "columns", Label: "Output columns", Kind: "list", Required: true, Columns: []ListColumn{
				{Key: "column", Label: "Column", Kind: "string"},
				{Key: "expr", Label: "Expression", Kind: "expr"},
				{Key: "type", Label: "Type", Kind: "type"},
			}, Help: "Each expression sees the incoming row (e.g. PtrString(row[\"iso3\"]), NilIfZero(Int(row[\"region_id\"]))). Leave type empty to infer."},
			onlyTables,
		},
		build: buildProject,
	})
}

type projectCol struct {
	name string
	prog *exprx.Program
	typ  record.Type
}

type project struct {
	cols []projectCol
	only tableFilter
}

func buildProject(_ *model.Node, cfg Config, _ *Runtime) (any, error) {
	p := &project{only: newTableFilter(cfg)}
	seen := map[string]bool{}
	for i, r := range cfg.List("columns") {
		name, src := str(r, "column"), str(r, "expr")
		if name == "" {
			continue
		}
		if seen[name] {
			return nil, fmt.Errorf("column %q is listed twice", name)
		}
		seen[name] = true
		if src == "" {
			src = "nil"
		}
		prog, err := exprx.Compile(src)
		if err != nil {
			return nil, fmt.Errorf("column %d (%s): %w", i+1, name, err)
		}
		p.cols = append(p.cols, projectCol{name: name, prog: prog, typ: record.Type(str(r, "type"))})
	}
	if len(p.cols) == 0 {
		return nil, fmt.Errorf("add at least one output column")
	}
	return p, nil
}

func (p *project) Process(_ context.Context, b *record.Batch, out Emitter) error {
	if p.only.skip(b.Table) {
		out.Emit("success", b)
		return nil
	}
	names := colNames(b.Columns)
	cols := make([]record.Column, len(p.cols))
	for i, c := range p.cols {
		cols[i] = record.Column{Name: c.name, Type: c.typ, Nullable: true}
		// carry the source definition when the column keeps its name and type
		if j := b.Index(c.name); j >= 0 && (c.typ == "" || c.typ == b.Columns[j].Type) {
			src := b.Columns[j]
			src.Nullable = true
			cols[i] = src
		}
	}
	var fl rowFailer
	good := keepNew(b)
	var env map[string]any
	for ri, row := range b.Rows {
		env = exprx.Env(env, b.Table, names, row)
		nr := make([]any, len(p.cols))
		var rerr error
		for i, c := range p.cols {
			v, err := c.prog.Run(env)
			if err == nil && c.typ != "" {
				v, err = castValue(normalize(v), c.typ, "")
			}
			if err != nil {
				rerr = fmt.Errorf("%s: %w", c.name, err)
				break
			}
			nr[i] = normalize(v)
		}
		if rerr != nil {
			fl.add(b, ri, row, rerr)
			continue
		}
		good.add(b, ri, nr)
	}
	for i := range cols {
		if cols[i].Type == "" {
			cols[i].Type = record.Text
			for _, r := range good.rows {
				if r[i] != nil {
					cols[i].Type = script.InferColumn(cols[i].Name, r[i]).Type
					break
				}
			}
		}
	}
	o := b.Derive()
	o.Columns = cols
	good.apply(o)
	keep := map[string]bool{}
	for _, c := range cols {
		keep[c.Name] = true
	}
	m := b.Meta.Clone()
	m.DropColumns(func(n string) bool { return keep[n] })
	o.Meta = m
	out.Emit("success", o)
	fl.emit(out)
	return nil
}
