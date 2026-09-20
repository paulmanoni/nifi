package flow

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

func init() {
	register(&Spec{
		Type: "sink.postgres", Label: "PostgreSQL Tables", Category: "Sink", Icon: "database-zap",
		Description:   "Writes each incoming table into PostgreSQL with COPY. Creates missing tables, loads idempotently, then builds indexes, foreign keys and sequences.",
		Relationships: []string{"failure"}, Inputs: 1, SupportsConcurrency: true,
		Properties: []Property{
			{Key: "connection", Label: "Target connection", Kind: "connection", Required: true},
			{Key: "schema", Label: "Target schema", Kind: "string", Default: "public"},
			{Key: "table_map", Label: "Table names", Kind: "keyvalue", Help: "incoming table → target table (optionally schema.table)",
				Columns: []ListColumn{{Key: "key", Label: "Incoming table", Kind: "string"}, {Key: "value", Label: "Target table", Kind: "string"}}},
			{Key: "name_case", Label: "Name case", Kind: "select", Default: "preserve", Options: nameCase,
				Help: "Applied to table and column names. MySQL sources usually want lowercase or snake_case."},
			{Key: "column_map", Label: "Column mapping", Kind: "list", Columns: []ListColumn{
				{Key: "table", Label: "Incoming table", Kind: "string"},
				{Key: "from", Label: "Incoming column", Kind: "column"},
				{Key: "to", Label: "Target column (empty = skip)", Kind: "string"},
				{Key: "cast", Label: "Convert to", Kind: "type"},
				{Key: "type", Label: "Target type (PostgreSQL)", Kind: "string"},
			}, Help: "Write an incoming column into a differently named target column, or skip it. Edit it from the Target tables dialog (double-click the node)."},
			{Key: "expressions", Label: "Computed columns", Kind: "list", Columns: []ListColumn{
				{Key: "table", Label: "Incoming table (empty = all)", Kind: "string"},
				{Key: "column", Label: "Target column", Kind: "string"},
				{Key: "expr", Label: "Expression", Kind: "expr"},
				{Key: "type", Label: "PostgreSQL type", Kind: "string"},
			}, Help: "Extra columns computed from the incoming row, e.g. concat(first_name, ' ', last_name). Empty type = inferred."},
			{Key: "mode", Label: "Write mode", Kind: "select", Default: "merge", Options: []Option{
				{Value: "merge", Label: "Merge — upsert by primary key (re-runnable)"},
				{Value: "merge_ignore", Label: "Merge — insert new, keep existing"},
				{Value: "copy", Label: "COPY only — fastest, empty tables"},
				{Value: "insert", Label: "Insert — fail on duplicates"},
			}},
			{Key: "apply_changes", Label: "Apply changes from a feed", Kind: "bool", Default: false,
				Help: "For a flow that follows its source. A row the feed reports as changed overwrites the matching row, " +
					"and a row it reports as deleted is removed. The write mode above still governs the first load."},
			{Key: "conflict_columns", Label: "Match existing rows on", Kind: "string",
				Help: "Comma-separated columns with a unique constraint used by merge instead of the primary key (e.g. codename). With “Merge — insert new, keep existing”, * skips a row on any unique conflict."},
			{Key: "no_update_columns", Label: "Never overwrite", Kind: "string",
				Help: "Comma-separated columns a merge keeps as they are in the target (e.g. created_at)."},
			{Key: "create_tables", Label: "Create missing tables", Kind: "bool", Default: true},
			{Key: "add_columns", Label: "Add missing columns", Kind: "bool", Default: true},
			{Key: "truncate", Label: "Before loading", Kind: "select", Default: "none", Options: []Option{
				{Value: "none", Label: "Keep existing rows"}, {Value: "truncate", Label: "Truncate each table"}, {Value: "cascade", Label: "Truncate … CASCADE"},
			}},
			{Key: "create_indexes", Label: "Create indexes after load", Kind: "bool", Default: true},
			{Key: "create_foreign_keys", Label: "Create foreign keys after load", Kind: "bool", Default: true},
			{Key: "reset_sequences", Label: "Reset identity sequences", Kind: "bool", Default: true},
			{Key: "analyze", Label: "ANALYZE after load", Kind: "bool", Default: true},
			{Key: "sanitize", Label: "Sanitize values", Kind: "bool", Default: true,
				Help: "Strip NUL bytes and repair invalid UTF-8 (common in MySQL data)."},
			{Key: "disable_triggers", Label: "Disable triggers & FK checks while loading", Kind: "bool", Default: false,
				Help: "session_replication_role = replica. Requires superuser."},
			{Key: "max_retries", Label: "Retries on connection errors", Kind: "int", Default: 5},
			{Key: "pre_sql", Label: "SQL before load", Kind: "text"},
			{Key: "post_sql", Label: "SQL after load", Kind: "text"},
		},
		build: buildPGSink,
	})
	register(&Spec{
		Type: "sink.discard", Label: "Discard", Category: "Sink", Icon: "trash-2",
		Description: "Counts and drops rows. Useful to terminate a branch or to dry-run a source.",
		Inputs:      1,
		build:       func(*model.Node, Config, *Runtime) (any, error) { return discard{}, nil },
	})
}

type discard struct{}

func (discard) Process(context.Context, *record.Batch, Emitter) error { return nil }

type pgSink struct {
	node     *model.Node
	rt       *Runtime
	connID   string
	schema   string
	tableMap map[string]string
	caseTo   string
	opts     dbx.WriteOptions
	create   bool
	addCols  bool
	truncate string
	indexes  bool
	fks      bool
	seqs     bool
	analyze  bool
	retries  int
	preSQL   string
	postSQL  string
	// apply honours the per-row operations a feed puts on its batches: a
	// changed row overwrites, a deleted row is removed. Rows that carry no
	// operation — everything a table read produces — are written by the
	// configured mode, so the first load is unaffected.
	apply bool

	// colMap: lower(incoming table) → incoming column → target column
	// ("" = skip). Unlisted columns keep their name (after name case).
	colMap map[string]map[string]string
	// colSet: lower(incoming table) → incoming column → cast / target type
	colSet map[string]map[string]colSetting
	exprs  []sinkExpr

	mu      sync.Mutex
	tables  map[string]*sinkTable
	sources map[string]string // source table → target display name
	// pending holds the schema batch of tables that have not received rows
	// yet: a table is created from its first batch WITH rows (so columns a
	// script or compute step changes get their real types), and tables that
	// never receive rows are created from their schema at Finish.
	pending map[string]*record.Batch
}

type sinkTable struct {
	mu      sync.Mutex
	ready   bool
	target  *dbx.Target
	dialect string
	source  string
	warned  map[string]bool
	// feeders are the incoming tables writing into this target, with their
	// (mapped) metadata; several feeders merge into one table.
	feeders []string
	metas   map[string]*record.TableMeta
}

// mergedMeta unions the feeders' indexes and foreign keys (deduplicated by
// definition) for post-load.
func (st *sinkTable) mergedMeta() *record.TableMeta {
	if len(st.feeders) == 0 {
		return nil
	}
	var out *record.TableMeta
	seenIx, seenFK := map[string]bool{}, map[string]bool{}
	for _, f := range st.feeders {
		m := st.metas[f]
		if m == nil {
			continue
		}
		if out == nil {
			out = m.Clone()
			out.Indexes, out.ForeignKeys = nil, nil
		}
		for _, ix := range m.Indexes {
			k := fmt.Sprint(ix.Unique, ix.Columns)
			if !seenIx[k] {
				seenIx[k] = true
				out.Indexes = append(out.Indexes, ix)
			}
		}
		for _, fk := range m.ForeignKeys {
			k := fmt.Sprint(fk.Columns, fk.RefTable, fk.RefColumns)
			if !seenFK[k] {
				seenFK[k] = true
				out.ForeignKeys = append(out.ForeignKeys, fk)
			}
		}
	}
	return out
}

func buildPGSink(n *model.Node, cfg Config, rt *Runtime) (any, error) {
	s := &pgSink{node: n, rt: rt, connID: cfg.String("connection"), schema: cfg.String("schema"),
		tableMap: map[string]string{}, caseTo: cfg.String("name_case"),
		opts: dbx.WriteOptions{Mode: dbx.WriteMode(cfg.String("mode")), Sanitize: cfg.Bool("sanitize", true),
			DisableTriggers: cfg.Bool("disable_triggers", false),
			ConflictCols:    cfg.Strings("conflict_columns"), NoUpdate: cfg.Strings("no_update_columns")},
		create: cfg.Bool("create_tables", true), addCols: cfg.Bool("add_columns", true), truncate: cfg.String("truncate"),
		indexes: cfg.Bool("create_indexes", true), fks: cfg.Bool("create_foreign_keys", true),
		seqs: cfg.Bool("reset_sequences", true), analyze: cfg.Bool("analyze", true),
		retries: max(cfg.Int("max_retries", 5), 0), preSQL: cfg.String("pre_sql"), postSQL: cfg.String("post_sql"),
		tables: map[string]*sinkTable{}, sources: map[string]string{}}
	if s.schema == "" {
		s.schema = "public"
	}
	for k, v := range cfg.PairMap("table_map") {
		s.tableMap[strings.ToLower(k)] = v
	}
	s.colMap = map[string]map[string]string{}
	for _, m := range cfg.List("column_map") {
		t, from := strings.ToLower(str(m, "table")), str(m, "from")
		if t == "" || from == "" {
			continue
		}
		if _, has := m["to"]; !has {
			continue // only a cast / type setting
		}
		if s.colMap[t] == nil {
			s.colMap[t] = map[string]string{}
		}
		s.colMap[t][from] = str(m, "to")
	}
	if err := s.parsePrep(cfg); err != nil {
		return nil, err
	}
	if rt.Resume && s.opts.Mode == dbx.ModeCopy {
		// Re-read chunks would collide with rows already copied.
		s.opts.Mode = dbx.ModeMergeIgnore
	}
	switch s.opts.Mode {
	case dbx.ModeMerge, dbx.ModeMergeIgnore, dbx.ModeCopy, dbx.ModeInsert:
	default:
		s.opts.Mode = dbx.ModeMerge
	}
	s.apply = cfg.Bool("apply_changes", false)
	return s, nil
}

// targetName maps an incoming table to (schema, name).
func (s *pgSink) targetName(table string) (string, string) {
	name := table
	if m, ok := s.tableMap[strings.ToLower(table)]; ok && m != "" {
		name = m
	}
	schema, base := dbx.SplitTable(name)
	if _, ok := s.tableMap[strings.ToLower(table)]; !ok {
		// An incoming PostgreSQL schema qualifier is dropped in favor of the
		// configured target schema unless explicitly mapped.
		schema = ""
	}
	if schema == "" {
		schema = s.schema
	}
	return applyCase(schema, s.caseTo), applyCase(base, s.caseTo)
}

// targetColumn resolves one incoming column: its target name, or skip.
func (s *pgSink) targetColumn(table, col string) (string, bool) {
	if m, ok := s.colMap[strings.ToLower(table)]; ok {
		if to, ok := m[col]; ok {
			return to, to != ""
		}
	}
	return applyCase(col, s.caseTo), true
}

// mapColumns applies the column mapping and name case; src[i] is the
// incoming position of output column i.
func (s *pgSink) mapColumns(table string, cols []record.Column) (out []record.Column, src []int) {
	for i, c := range cols {
		name, keep := s.targetColumn(table, c.Name)
		if !keep {
			continue
		}
		c.Name = name
		out = append(out, c)
		src = append(src, i)
	}
	return out, src
}

func (s *pgSink) mapMeta(table string, m *record.TableMeta) *record.TableMeta {
	if m == nil {
		return nil
	}
	c := m.Clone()
	ren := map[string]string{}
	skip := map[string]bool{}
	for _, col := range m.Columns {
		if name, keep := s.targetColumn(table, col.Name); keep {
			ren[col.Name] = name
		} else {
			skip[col.Name] = true
		}
	}
	c.DropColumns(func(n string) bool { return !skip[n] })
	c.RenameColumns(ren)
	for i := range c.ForeignKeys {
		for j, rc := range c.ForeignKeys[i].RefColumns {
			c.ForeignKeys[i].RefColumns[j] = applyCase(rc, s.caseTo)
		}
	}
	return c
}

// Start runs the pre-load SQL hook.
func (s *pgSink) Start(ctx context.Context) error {
	if strings.TrimSpace(s.preSQL) == "" {
		return nil
	}
	pg, err := s.rt.PG(ctx, s.connID)
	if err != nil {
		return err
	}
	if err := pg.Exec(ctx, s.preSQL); err != nil {
		return fmt.Errorf("pre-load SQL: %w", err)
	}
	return nil
}

func (s *pgSink) Preview(_ context.Context, b *record.Batch) (*record.Batch, error) {
	b, _ = s.prepare(b)
	schema, name := s.targetName(b.Table)
	o := b.Derive()
	o.Table = schema + "." + name
	cols, src := s.mapColumns(b.Table, b.Columns)
	o.Columns = cols
	o.Rows = make([][]any, len(b.Rows))
	for r, row := range b.Rows {
		nr := make([]any, len(src))
		for j, i := range src {
			if i < len(row) {
				nr[j] = row[i]
			}
		}
		o.Rows[r] = nr
	}
	return o, nil
}

func (s *pgSink) table(key string) *sinkTable {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.tables[key]
	if !ok {
		t = &sinkTable{warned: map[string]bool{}, metas: map[string]*record.TableMeta{}}
		s.tables[key] = t
	}
	return t
}

// ensure resolves (creating/altering if configured) the target for b.
func (s *pgSink) ensure(ctx context.Context, pg *dbx.PG, b *record.Batch, schema, name string, cols []record.Column) (*sinkTable, error) {
	st := s.table(schema + "." + name)
	st.mu.Lock()
	defer st.mu.Unlock()
	if !st.ready {
		t, err := pg.LoadTarget(ctx, schema, name)
		if err != nil {
			return nil, err
		}
		dialect := ""
		if b.Meta != nil {
			dialect = b.Meta.Dialect
		}
		if t == nil {
			if !s.create {
				return nil, fmt.Errorf("target table %s.%s does not exist (enable \"Create missing tables\")", schema, name)
			}
			var pk []string
			if b.Meta != nil {
				pk = s.mapMeta(b.Table, b.Meta).PrimaryKey
			}
			if err := pg.CreateTable(ctx, schema, name, cols, pk, dialect); err != nil {
				return nil, err
			}
			if t, err = pg.LoadTarget(ctx, schema, name); err != nil || t == nil {
				return nil, fmt.Errorf("table %s.%s missing after create: %v", schema, name, err)
			}
			t.Created = true
			if !s.rt.Preview && s.rt.Store != nil {
				s.rt.Store.SetKV(ctx, s.rt.RunID, "created:"+s.node.ID+":"+schema+"."+name, "1")
			}
			s.rt.Bulletin("info", s.node.ID, b.Source, fmt.Sprintf("created table %s.%s", schema, name))
		} else if s.rt.Store != nil {
			_, t.Created = s.rt.Store.GetKV(ctx, s.rt.RunID, "created:"+s.node.ID+":"+schema+"."+name)
		}
		if s.truncate == "truncate" || s.truncate == "cascade" {
			key := "truncated:" + s.node.ID + ":" + schema + "." + name
			if _, done := s.rt.Store.GetKV(ctx, s.rt.RunID, key); !done {
				if err := pg.Truncate(ctx, t, s.truncate == "cascade"); err != nil {
					return nil, fmt.Errorf("truncate %s: %w", t.Display(), err)
				}
				s.rt.Store.SetKV(ctx, s.rt.RunID, key, "1")
			}
		}
		st.target, st.dialect, st.source, st.ready = t, dialect, b.Source, true
	}
	if !s.rt.Preview {
		for _, c := range cols {
			tc, ok := st.target.Columns[c.Name]
			if c.TargetType == "" || !ok || tc.Generated || sameType(c.TargetType, tc.NativeType) {
				continue
			}
			if err := pg.AlterColumnType(ctx, st.target, c.Name, c.TargetType); err != nil {
				return nil, err
			}
			s.rt.Bulletin("info", s.node.ID, b.Source, fmt.Sprintf("changed %s.%s to %s", st.target.Display(), c.Name, c.TargetType))
		}
	}
	if _, known := st.metas[b.Table]; !known {
		if err := s.addFeeder(ctx, pg, st, b, cols); err != nil {
			return nil, err
		}
	}
	// Columns the target lacks (e.g. added by a script).
	var add []record.Column
	for _, c := range cols {
		if _, ok := st.target.Columns[c.Name]; !ok {
			if s.addCols {
				add = append(add, c)
			} else if !st.warned[c.Name] {
				st.warned[c.Name] = true
				s.rt.Bulletin("warn", s.node.ID, b.Source, fmt.Sprintf("column %s not in %s — dropped", c.Name, st.target.Display()))
			}
		}
	}
	if len(add) > 0 {
		for i := range add {
			if add[i].Type == "" {
				add[i].Type = record.Text
			}
		}
		if err := pg.AddColumns(ctx, st.target, add); err != nil {
			return nil, err
		}
	}
	s.mu.Lock()
	s.sources[b.Source] = st.target.Schema + "." + st.target.Name
	s.mu.Unlock()
	return st, nil
}

// addFeeder registers another incoming table writing into st. On a table this
// sink created, columns the new feeder does not provide lose NOT NULL (the
// key excepted) so its rows can land; shared keys in merge mode are flagged.
func (s *pgSink) addFeeder(ctx context.Context, pg *dbx.PG, st *sinkTable, b *record.Batch, cols []record.Column) error {
	st.metas[b.Table] = s.mapMeta(b.Table, b.Meta)
	st.feeders = append(st.feeders, b.Table)
	if len(st.feeders) < 2 {
		return nil
	}
	s.rt.Bulletin("info", s.node.ID, b.Source, fmt.Sprintf("%s also receives %s (feeders: %s)",
		st.target.Display(), b.Table, strings.Join(st.feeders, ", ")))
	has := map[string]bool{}
	for _, c := range cols {
		has[c.Name] = true
	}
	pk := map[string]bool{}
	for _, k := range st.target.PK {
		pk[k] = true
	}
	if st.target.Created {
		var relax []string
		for _, n := range st.target.Order {
			if c := st.target.Columns[n]; !has[n] && !pk[n] && !c.Nullable && !c.AutoIncrement && c.Default == "" {
				relax = append(relax, n)
			}
		}
		if len(relax) > 0 {
			if err := pg.DropNotNull(ctx, st.target, relax); err != nil {
				return err
			}
			s.rt.Bulletin("info", s.node.ID, b.Source, fmt.Sprintf("%s: made %s nullable — %s does not provide them",
				st.target.Display(), strings.Join(relax, ", "), b.Table))
		}
	}
	if len(st.target.PK) > 0 && (s.opts.Mode == dbx.ModeMerge || s.opts.Mode == dbx.ModeMergeIgnore) {
		s.rt.Bulletin("warn", s.node.ID, b.Source, fmt.Sprintf(
			"%s is fed by %s: rows with the same %s from different tables %s. Keep keys disjoint (e.g. map ids to distinct ranges) or add a source column to the key.",
			st.target.Display(), strings.Join(st.feeders, " and "), strings.Join(st.target.PK, ", "),
			map[bool]string{true: "overwrite each other", false: "are kept from whichever arrives first"}[s.opts.Mode == dbx.ModeMerge]))
	}
	return nil
}

func (s *pgSink) Process(ctx context.Context, b *record.Batch, out Emitter) error {
	pg, err := s.rt.PG(ctx, s.connID)
	if err != nil {
		return err
	}
	b, bad := s.prepare(b)
	if bad != nil {
		out.Emit("failure", bad)
	}
	schema, name := s.targetName(b.Table)
	cols, src := s.mapColumns(b.Table, b.Columns)
	if len(b.Rows) == 0 {
		s.mu.Lock()
		key := schema + "." + name + "|" + b.Table
		if s.pending == nil {
			s.pending = map[string]*record.Batch{}
		}
		if _, ok := s.pending[key]; !ok {
			s.pending[key] = b
		}
		s.mu.Unlock()
		return nil
	}
	st, err := s.ensure(ctx, pg, b, schema, name, cols)
	if err != nil {
		return err
	}
	// Project onto writable target columns.
	var names []string
	var idx []int
	for i, c := range cols {
		tc, ok := st.target.Columns[c.Name]
		if !ok || tc.Generated {
			continue
		}
		names = append(names, c.Name)
		idx = append(idx, src[i])
	}
	rows := b.Rows
	if len(idx) != len(b.Columns) {
		rows = make([][]any, len(b.Rows))
		for r, row := range b.Rows {
			nr := make([]any, len(idx))
			for j, i := range idx {
				if i < len(row) {
					nr[j] = row[i]
				}
			}
			rows[r] = nr
		}
	}
	if s.apply && b.Changes() {
		return s.applyChanges(ctx, pg, st, b, names, rows, out)
	}
	failed, err := s.write(ctx, pg, st.target, names, rows)
	if err != nil {
		return fmt.Errorf("write %s: %s", st.target.Display(), dbx.DescribeError(err))
	}
	written := len(rows) - len(failed)
	s.rt.Progress().Table(b.Source).add(func(t *model.TableProgress) { t.RowsWritten += int64(written) })
	if len(failed) > 0 {
		f := b.Derive()
		for i, msg := range failed {
			f.AppendRow(b, i)
			f.Errors = append(f.Errors, msg)
		}
		out.Emit("failure", f)
	}
	return nil
}

// applyChanges writes a batch that carries per-row operations. Rows are
// applied in runs of the same operation, in the order they arrived, so a row
// inserted and then deleted inside one batch ends up deleted — and one deleted
// and then re-inserted ends up present.
func (s *pgSink) applyChanges(ctx context.Context, pg *dbx.PG, st *sinkTable, b *record.Batch, names []string, rows [][]any, out Emitter) error {
	key := st.target.PK
	if len(s.opts.ConflictCols) > 0 && s.opts.ConflictCols[0] != "*" {
		key = s.opts.ConflictCols
	}
	keyIdx := make([]int, 0, len(key))
	for _, k := range key {
		i := -1
		for j, n := range names {
			if n == k {
				i = j
			}
		}
		if i < 0 {
			return fmt.Errorf("apply changes to %s: the incoming rows carry no %s, so a change cannot be matched to a row", st.target.Display(), k)
		}
		keyIdx = append(keyIdx, i)
	}

	// A change overwrites, whatever the load's write mode was: "keep the row
	// that is already there" is right for re-reading a table and wrong for an
	// update that has just happened.
	opts := s.opts
	opts.Mode = dbx.ModeMerge
	if len(opts.ConflictCols) == 1 && opts.ConflictCols[0] == "*" {
		opts.ConflictCols = nil
	}

	var fail *record.Batch
	flushUpserts := func(from, to int) error {
		failed, err := s.writeWith(ctx, pg, st.target, names, rows[from:to], opts)
		if err != nil {
			return fmt.Errorf("write %s: %s", st.target.Display(), dbx.DescribeError(err))
		}
		s.rt.Progress().Table(b.Source).add(func(t *model.TableProgress) {
			t.RowsWritten += int64(to - from - len(failed))
		})
		for i, msg := range failed {
			if fail == nil {
				fail = b.Derive()
			}
			fail.AppendRow(b, from+i)
			fail.Errors = append(fail.Errors, msg)
		}
		return nil
	}
	flushDeletes := func(from, to int) error {
		keys := make([][]any, 0, to-from)
		for _, row := range rows[from:to] {
			k := make([]any, len(keyIdx))
			for j, i := range keyIdx {
				k[j] = row[i]
			}
			keys = append(keys, k)
		}
		n, err := pg.DeleteByKey(ctx, st.target, key, keys, opts)
		if err != nil {
			return fmt.Errorf("delete from %s: %s", st.target.Display(), dbx.DescribeError(err))
		}
		s.rt.Progress().Table(b.Source).add(func(t *model.TableProgress) { t.RowsDeleted += n })
		return nil
	}

	run := 0
	deleting := b.Op(0) == record.Delete
	flush := func(to int) error {
		if to == run {
			return nil
		}
		if deleting {
			return flushDeletes(run, to)
		}
		return flushUpserts(run, to)
	}
	for i := range rows {
		if del := b.Op(i) == record.Delete; del != deleting {
			if err := flush(i); err != nil {
				return err
			}
			run, deleting = i, del
		}
	}
	if err := flush(len(rows)); err != nil {
		return err
	}
	if fail != nil {
		out.Emit("failure", fail)
	}
	return nil
}

// write loads rows with the sink's configured options.
func (s *pgSink) write(ctx context.Context, pg *dbx.PG, t *dbx.Target, cols []string, rows [][]any) (map[int]string, error) {
	return s.writeWith(ctx, pg, t, cols, rows, s.opts)
}

// writeWith loads rows, retrying transient errors and isolating bad rows. It
// returns the failed row positions with their error messages.
func (s *pgSink) writeWith(ctx context.Context, pg *dbx.PG, t *dbx.Target, cols []string, rows [][]any, opts dbx.WriteOptions) (map[int]string, error) {
	failed := map[int]string{}
	var run func(pos []int) error
	run = func(pos []int) error {
		if len(pos) == 0 {
			return nil
		}
		attempt := 0
		for {
			sub := make([][]any, len(pos))
			for i, p := range pos {
				sub[i] = rows[p]
			}
			_, err := pg.Write(ctx, t, cols, sub, opts)
			if err == nil {
				return nil
			}
			if ctx.Err() != nil {
				return ctx.Err()
			}
			switch dbx.Classify(err) {
			case dbx.ErrTransient:
				attempt++
				if attempt > s.retries {
					return err
				}
				s.rt.Bulletin("warn", s.node.ID, "", fmt.Sprintf("%s: retry %d after %s", t.Display(), attempt, dbx.DescribeError(err)))
				select {
				case <-time.After(time.Duration(attempt*attempt) * 500 * time.Millisecond):
				case <-ctx.Done():
					return ctx.Err()
				}
				continue
			case dbx.ErrData:
				if dbx.IsCardinality(err) && !opts.Dedupe {
					opts.Dedupe = true
					continue
				}
				var re *dbx.RowError
				if errors.As(err, &re) && re.Row >= 0 && re.Row < len(pos) {
					failed[pos[re.Row]] = dbx.DescribeError(err)
					pos = append(append([]int(nil), pos[:re.Row]...), pos[re.Row+1:]...)
					if len(pos) == 0 {
						return nil
					}
					continue
				}
				if len(pos) == 1 {
					failed[pos[0]] = dbx.DescribeError(err)
					return nil
				}
				mid := len(pos) / 2
				if err := run(pos[:mid]); err != nil {
					return err
				}
				return run(pos[mid:])
			default:
				return err
			}
		}
	}
	all := make([]int, len(rows))
	for i := range all {
		all[i] = i
	}
	return failed, run(all)
}

// Finish builds indexes, foreign keys and sequences once all data is in.
func (s *pgSink) Finish(ctx context.Context) error {
	pg, err := s.rt.PG(ctx, s.connID)
	if err != nil {
		return err
	}
	// Tables that never received rows: create them from their schema so an
	// empty source table still exists in the target.
	s.mu.Lock()
	var empty []*record.Batch
	for _, b := range s.pending {
		empty = append(empty, b)
	}
	s.mu.Unlock()
	sort.Slice(empty, func(i, j int) bool { return empty[i].Table < empty[j].Table })
	for _, b := range empty {
		schema, name := s.targetName(b.Table)
		cols, _ := s.mapColumns(b.Table, b.Columns)
		if _, err := s.ensure(ctx, pg, b, schema, name, cols); err != nil {
			return err
		}
	}
	s.mu.Lock()
	tables := make([]*sinkTable, 0, len(s.tables))
	for _, t := range s.tables {
		if t.ready {
			tables = append(tables, t)
		}
	}
	sources := map[string]string{}
	for k, v := range s.sources {
		sources[strings.ToLower(k)] = v
	}
	s.mu.Unlock()

	par := max(s.node.Concurrency, 4)
	each := func(phase string, f func(t *sinkTable) error) error {
		s.rt.setPhase(phase)
		sem := make(chan struct{}, par)
		var wg sync.WaitGroup
		for _, t := range tables {
			if ctx.Err() != nil {
				break
			}
			wg.Add(1)
			sem <- struct{}{}
			go func() {
				defer func() { <-sem; wg.Done() }()
				if err := f(t); err != nil {
					s.rt.Bulletin("warn", s.node.ID, t.source, err.Error())
				}
			}()
		}
		wg.Wait()
		return ctx.Err()
	}

	if s.indexes {
		if err := each("indexes", func(t *sinkTable) error {
			meta := t.mergedMeta()
			if !t.target.Created || meta == nil {
				return nil
			}
			used := map[string]bool{}
			for _, ix := range meta.Indexes {
				name := ix.Name
				if t.dialect != "postgres" || !strings.HasPrefix(name, t.target.Name) {
					name = t.target.Name + "_" + ix.Name
				}
				if used[name] {
					name = t.target.Name + "_" + strings.Join(ix.Columns, "_") + "_idx"
				}
				used[name] = true
				if !hasColumns(t.target, ix.Columns) {
					continue
				}
				if err := pg.CreateIndex(ctx, t.target, name, ix.Columns, ix.Unique); err != nil {
					s.rt.Bulletin("warn", s.node.ID, t.source, fmt.Sprintf("index %s on %s: %s", name, t.target.Display(), dbx.DescribeError(err)))
				}
			}
			return nil
		}); err != nil {
			return err
		}
	}
	if s.fks {
		if err := each("constraints", func(t *sinkTable) error {
			meta := t.mergedMeta()
			if !t.target.Created || meta == nil {
				return nil
			}
			for _, fk := range meta.ForeignKeys {
				ref, ok := sources[strings.ToLower(fk.RefTable)]
				if !ok {
					rs, rn := s.targetName(fk.RefTable)
					if rt, err := pg.LoadTarget(ctx, rs, rn); err != nil || rt == nil {
						s.rt.Bulletin("warn", s.node.ID, t.source, fmt.Sprintf("foreign key %s skipped: referenced table %s is not in the target", fk.Name, fk.RefTable))
						continue
					}
					ref = rs + "." + rn
				}
				rs, rn := dbx.SplitTable(ref)
				if !hasColumns(t.target, fk.Columns) {
					continue
				}
				validated, err := pg.AddForeignKey(ctx, t.target, fk, rs, rn)
				if err != nil {
					s.rt.Bulletin("warn", s.node.ID, t.source, fmt.Sprintf("foreign key %s on %s: %s", fk.Name, t.target.Display(), dbx.DescribeError(err)))
				} else if !validated {
					s.rt.Bulletin("warn", s.node.ID, t.source, fmt.Sprintf("foreign key %s left NOT VALID (orphan rows)", fk.Name))
				}
			}
			return nil
		}); err != nil {
			return err
		}
	}
	if s.seqs {
		if err := each("sequences", func(t *sinkTable) error {
			for _, name := range t.target.Order {
				if c := t.target.Columns[name]; c.AutoIncrement {
					if err := pg.ResetSequence(ctx, t.target, name); err != nil {
						return fmt.Errorf("reset sequence %s.%s: %s", t.target.Display(), name, dbx.DescribeError(err))
					}
				}
			}
			return nil
		}); err != nil {
			return err
		}
	}
	if s.analyze {
		if err := each("analyze", func(t *sinkTable) error { return pg.Analyze(ctx, t.target) }); err != nil {
			return err
		}
	}
	if strings.TrimSpace(s.postSQL) != "" {
		s.rt.setPhase("post-sql")
		if err := pg.Exec(ctx, s.postSQL); err != nil {
			return fmt.Errorf("post-load SQL: %w", err)
		}
	}
	return nil
}

func hasColumns(t *dbx.Target, cols []string) bool {
	for _, c := range cols {
		if _, ok := t.Columns[c]; !ok {
			return false
		}
	}
	return len(cols) > 0
}
