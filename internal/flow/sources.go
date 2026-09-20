package flow

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

func init() {
	register(&Spec{
		Type: "source.tables", Label: "Database Tables", Category: "Source", Icon: "database",
		Description:         "Reads whole tables from MySQL or PostgreSQL in parallel, resumable chunks. One node can stream an entire database.",
		Relationships:       []string{"success"},
		SupportsConcurrency: true,
		Properties: []Property{
			{Key: "connection", Label: "Connection", Kind: "connection", Required: true},
			{Key: "tables", Label: "Tables", Kind: "tables", ConnectionKey: "connection", Help: "Empty = every table in the database."},
			{Key: "exclude", Label: "Exclude tables", Kind: "tables", ConnectionKey: "connection"},
			{Key: "where", Label: "Row filters", Kind: "keyvalue", Help: "Table → SQL condition in the source dialect, e.g. users → deleted_at IS NULL",
				Columns: []ListColumn{{Key: "key", Label: "Table", Kind: "string"}, {Key: "value", Label: "Only rows where (SQL)", Kind: "string"}}},
			{Key: "exclude_columns", Label: "Skip columns", Kind: "keyvalue", Help: "Table → comma-separated columns not to read.",
				Columns: []ListColumn{{Key: "key", Label: "Table", Kind: "string"}, {Key: "value", Label: "Columns not to read", Kind: "string"}}},
			{Key: "chunk_rows", Label: "Rows per chunk", Kind: "int", Default: 100000, Help: "Unit of parallelism and of resume. Larger = fewer checkpoints."},
			{Key: "batch_rows", Label: "Rows per batch", Kind: "int", Default: 5000, Help: "Rows handed downstream (and written) at a time."},
			{Key: "skip_missing", Label: "Skip tables that don't exist", Kind: "bool", Default: false,
				Help: "A listed table that is missing in the source is skipped with a notice instead of failing the run."},
			{Key: "raw_types", Label: "Keep MySQL raw types", Kind: "bool", Default: false,
				Help: "Read values the way the Go MySQL driver does: tinyint(1) as numbers, BIT as bytes, zero dates as 0001-01-01. For parity with hand-written Go migrations."},
		},
		build: buildTableSource,
	})
	register(&Spec{
		Type: "source.query", Label: "SQL Query", Category: "Source", Icon: "terminal",
		Description:   "Streams the result of a custom SELECT (joins, denormalization). Resumable when a unique, ordered key column is given.",
		Relationships: []string{"success"},
		Properties: []Property{
			{Key: "connection", Label: "Connection", Kind: "connection", Required: true},
			{Key: "sql", Label: "SELECT statement", Kind: "text", Required: true},
			{Key: "table_name", Label: "Output table name", Kind: "string", Required: true, Default: "query_result"},
			{Key: "key_column", Label: "Key column", Kind: "string", Help: "Unique column to page by (enables resume and bounded memory)."},
			{Key: "batch_rows", Label: "Rows per batch", Kind: "int", Default: 5000},
		},
		build: buildQuerySource,
	})
}

type tableSource struct {
	node      *model.Node
	rt        *Runtime
	connID    string
	include   []string
	exclude   map[string]bool
	where     map[string]string
	skipCols  map[string]map[string]bool
	chunkRows int
	batchRows int
	workers   int
	// pushdown (runs only) names further columns no destination needs.
	pushdown    func(table string, columns []string) map[string]bool
	raw         bool
	skipMissing bool
}

func buildTableSource(n *model.Node, cfg Config, rt *Runtime) (any, error) {
	s := &tableSource{node: n, rt: rt, connID: cfg.String("connection"), include: cfg.Strings("tables"),
		exclude: map[string]bool{}, where: cfg.PairMap("where"), skipCols: map[string]map[string]bool{},
		chunkRows: max(cfg.Int("chunk_rows", 100000), 1000), batchRows: max(cfg.Int("batch_rows", 5000), 1),
		workers: max(n.Concurrency, 1), raw: cfg.Bool("raw_types", false),
		skipMissing: cfg.Bool("skip_missing", false)}
	if n.Concurrency == 0 {
		s.workers = 4
	}
	for _, t := range cfg.Strings("exclude") {
		s.exclude[strings.ToLower(t)] = true
	}
	for t, cols := range cfg.PairMap("exclude_columns") {
		m := map[string]bool{}
		for _, c := range strings.Split(cols, ",") {
			if c = strings.TrimSpace(c); c != "" {
				m[strings.ToLower(c)] = true
			}
		}
		s.skipCols[strings.ToLower(t)] = m
	}
	return s, nil
}

func (s *tableSource) Tables(ctx context.Context) ([]string, error) {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return nil, err
	}
	if len(s.include) > 0 {
		out := make([]string, 0, len(s.include))
		for _, t := range s.include {
			if !s.exclude[strings.ToLower(t)] {
				out = append(out, t)
			}
		}
		return out, nil
	}
	all, err := db.ListTables(ctx)
	if err != nil {
		return nil, err
	}
	var out []string
	for _, t := range all {
		name := t.Name
		if db.Driver() == "postgres" {
			name = dbx.TableName(t.Schema, t.Name)
		}
		if !s.exclude[strings.ToLower(name)] {
			out = append(out, name)
		}
	}
	return out, nil
}

func (s *tableSource) spec(meta *record.TableMeta, table string) dbx.ReadSpec {
	spec, _ := s.specWithPushdown(meta, table)
	return spec
}

// specWithPushdown also returns the columns left out because no destination
// uses them (never primary-key columns).
func (s *tableSource) specWithPushdown(meta *record.TableMeta, table string) (dbx.ReadSpec, []string) {
	skip := s.skipCols[strings.ToLower(table)]
	var extra map[string]bool
	if s.pushdown != nil {
		names := make([]string, len(meta.Columns))
		for i, c := range meta.Columns {
			names[i] = c.Name
		}
		extra = s.pushdown(table, names)
		for _, k := range meta.PrimaryKey {
			delete(extra, strings.ToLower(k))
		}
	}
	var cols []record.Column
	var pushed []string
	for _, c := range meta.Columns {
		lc := strings.ToLower(c.Name)
		switch {
		case skip[lc]:
		case extra[lc]:
			pushed = append(pushed, c.Name)
		default:
			cols = append(cols, c)
		}
	}
	return dbx.ReadSpec{Meta: meta, Columns: cols, Where: s.where[table]}, pushed
}

func (s *tableSource) Sample(ctx context.Context, table string, limit int) (*record.Batch, error) {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return nil, err
	}
	meta, err := db.Describe(ctx, table)
	if err != nil {
		if s.skipMissing && isMissingTable(err) {
			return &record.Batch{Table: table, Source: table}, nil
		}
		return nil, err
	}
	if s.raw {
		meta = rawTypes(meta)
	}
	spec := s.spec(meta, table)
	b := &record.Batch{Table: table, Source: table, Meta: metaFor(meta, spec.Columns), Columns: spec.Columns}
	if limit <= 0 {
		return b, nil
	}
	conv := convertersRaw(db, spec.Columns, s.raw)
	err = db.Scan(ctx, dbx.SampleQuery(db, spec, limit), nil, func(raw [][]byte) error {
		b.Rows = append(b.Rows, convertRow(conv, raw))
		return nil
	})
	return b, err
}

// metaFor narrows metadata to the columns actually read.
func metaFor(meta *record.TableMeta, cols []record.Column) *record.TableMeta {
	if len(cols) == len(meta.Columns) {
		return meta
	}
	keep := map[string]bool{}
	for _, c := range cols {
		keep[c.Name] = true
	}
	m := meta.Clone()
	m.DropColumns(func(n string) bool { return keep[n] })
	return m
}

func converters(db dbx.DB, cols []record.Column) []dbx.Converter {
	return convertersRaw(db, cols, false)
}

func convertersRaw(db dbx.DB, cols []record.Column, raw bool) []dbx.Converter {
	out := make([]dbx.Converter, len(cols))
	for i, c := range cols {
		out[i] = dbx.ConverterForOpts(db.Driver(), db.Location(), c, raw && db.Driver() == "mysql")
	}
	return out
}

// rawTypes rewrites MySQL column types to what the Go driver delivers:
// tinyint(1) stays a number and BIT stays bytes.
func rawTypes(m *record.TableMeta) *record.TableMeta {
	if m == nil || m.Dialect != "mysql" {
		return m
	}
	c := m.Clone()
	for i := range c.Columns {
		col := &c.Columns[i]
		switch {
		case col.Type == record.Bool && strings.HasPrefix(col.NativeType, "tinyint"):
			col.Type = record.Int16
		case strings.HasPrefix(col.NativeType, "bit"):
			col.Type = record.Bytes
		}
	}
	return c
}

func convertRow(conv []dbx.Converter, raw [][]byte) []any {
	row := make([]any, len(raw))
	for i, r := range raw {
		if r != nil {
			row[i] = conv[i](r)
		}
	}
	return row
}

type tableJob struct {
	table string
	meta  *record.TableMeta
	spec  dbx.ReadSpec
	chunk model.Chunk
	// keyset jobs own the whole table and page sequentially.
	keyset []model.Chunk
}

func (s *tableSource) Run(ctx context.Context, out Emitter) error {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return err
	}
	tables, err := s.Tables(ctx)
	if err != nil {
		return err
	}
	if len(tables) == 0 {
		s.rt.Bulletin("warn", s.node.ID, "", "no tables selected")
		return nil
	}

	// Describe and plan with bounded parallelism.
	type planned struct {
		table string
		meta  *record.TableMeta
		spec  dbx.ReadSpec
		jobs  []tableJob
		err   error
	}
	plans := make([]planned, len(tables))
	sem := make(chan struct{}, 8)
	var wg sync.WaitGroup
	for i, t := range tables {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			p := planned{table: t}
			p.meta, p.err = db.Describe(ctx, t)
			if p.err == nil && s.raw {
				p.meta = rawTypes(p.meta)
			}
			if p.err == nil {
				var pushed []string
				p.spec, pushed = s.specWithPushdown(p.meta, t)
				if len(pushed) > 0 {
					s.rt.Bulletin("info", s.node.ID, t, fmt.Sprintf("not reading %d column(s) no destination uses: %s",
						len(pushed), strings.Join(pushed, ", ")))
				}
				p.jobs, p.err = s.plan(ctx, db, t, p.meta, p.spec)
			}
			plans[i] = p
		}()
	}
	wg.Wait()

	var jobs []tableJob
	for _, p := range plans {
		if p.err != nil && s.skipMissing && isMissingTable(p.err) {
			s.rt.Bulletin("info", s.node.ID, p.table, "table does not exist in the source — skipped")
			s.rt.Progress().Table(p.table).add(func(t *model.TableProgress) { t.Status = "done" })
			continue
		}
		if p.err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			return fmt.Errorf("table %s: %w", p.table, p.err)
		}
		// Schema batch: lets sinks create empty tables and see the shape
		// before any data arrives.
		out.Emit("success", &record.Batch{Table: p.table, Source: p.table, Meta: metaFor(p.meta, p.spec.Columns), Columns: p.spec.Columns})
		jobs = append(jobs, p.jobs...)
	}
	sort.SliceStable(jobs, func(i, j int) bool { return jobs[i].meta.EstimatedRows > jobs[j].meta.EstimatedRows })

	ch := make(chan tableJob)
	errCh := make(chan error, s.workers)
	var rwg sync.WaitGroup
	for w := 0; w < s.workers; w++ {
		rwg.Add(1)
		go func() {
			defer rwg.Done()
			for j := range ch {
				if err := s.read(ctx, db, j, out); err != nil {
					errCh <- fmt.Errorf("table %s: %w", j.table, err)
					return
				}
			}
		}()
	}
	var ferr error
feed:
	for _, j := range jobs {
		select {
		case ch <- j:
		case ferr = <-errCh:
			break feed
		case <-ctx.Done():
			ferr = ctx.Err()
			break feed
		}
	}
	close(ch)
	rwg.Wait()
	if ferr == nil {
		select {
		case ferr = <-errCh:
		default:
		}
	}
	return ferr
}

// plan loads a persisted chunk plan or builds and persists a new one.
func (s *tableSource) plan(ctx context.Context, db dbx.DB, table string, meta *record.TableMeta, spec dbx.ReadSpec) ([]tableJob, error) {
	prog := s.rt.Progress().Table(table)
	prog.add(func(t *model.TableProgress) { t.EstimatedRows = meta.EstimatedRows })

	var chunks []model.Chunk
	if s.rt.Store != nil {
		var err error
		chunks, err = s.rt.Store.LoadChunks(ctx, s.rt.RunID, s.node.ID, table)
		if err != nil {
			return nil, err
		}
	}
	key := dbx.IntegerKey(meta)
	if len(chunks) == 0 {
		switch {
		case key != "":
			lo, hi, ok, err := db.MinMax(ctx, meta, key)
			if err != nil {
				key = "" // e.g. huge unsigned values: fall back to keyset
				break
			}
			if !ok {
				chunks = []model.Chunk{{Seq: 0, Kind: "range", Lo: 0, Hi: 0}}
				break
			}
			span := hi - lo + 1
			est := meta.EstimatedRows
			if est <= 0 || est > span {
				est = span
			}
			n := max((est+int64(s.chunkRows)-1)/int64(s.chunkRows), 1)
			step := max((span+n-1)/n, 1)
			for i, c := int64(0), lo; c <= hi; i, c = i+1, c+step {
				chunks = append(chunks, model.Chunk{Seq: int(i), Kind: "range", Lo: c, Hi: min(c+step, hi+1)})
				if c > hi-step {
					break
				}
			}
		case len(meta.PrimaryKey) > 0:
			chunks = []model.Chunk{}
		default:
			s.rt.Bulletin("warn", s.node.ID, table, "table has no primary key: read in one pass; an interrupted run re-reads it from the start")
			chunks = []model.Chunk{{Seq: 0, Kind: "full"}}
		}
		if key == "" && len(meta.PrimaryKey) > 0 {
			chunks = []model.Chunk{}
		}
		if s.rt.Store != nil && len(chunks) > 0 {
			if err := s.rt.Store.SaveChunks(ctx, s.rt.RunID, s.node.ID, table, chunks); err != nil {
				return nil, err
			}
		}
	}

	var jobs []tableJob
	isKeyset := len(chunks) == 0 || chunks[0].Kind == "keyset"
	if isKeyset {
		prog.add(func(t *model.TableProgress) {
			t.ChunksTotal = int64(len(chunks))
			for _, c := range chunks {
				if c.Status == "done" {
					t.ChunksDone++
					t.RowsRead += c.Rows
				}
			}
		})
		return []tableJob{{table: table, meta: meta, spec: spec, keyset: chunks}}, nil
	}
	var done, doneRows int64
	for _, c := range chunks {
		if c.Status == "done" {
			done++
			doneRows += c.Rows
			continue
		}
		jobs = append(jobs, tableJob{table: table, meta: meta, spec: spec, chunk: c})
	}
	prog.add(func(t *model.TableProgress) {
		t.ChunksTotal, t.ChunksDone, t.RowsRead = int64(len(chunks)), done, doneRows
		if len(jobs) == 0 {
			t.Status = "done"
		}
	})
	return jobs, nil
}

func (s *tableSource) read(ctx context.Context, db dbx.DB, j tableJob, out Emitter) error {
	prog := s.rt.Progress().Table(j.table)
	prog.add(func(t *model.TableProgress) {
		if t.Status == "pending" {
			t.Status = "reading"
		}
	})
	if j.keyset != nil {
		return s.readKeyset(ctx, db, j, out)
	}
	c := j.chunk
	var q string
	var args []any
	switch c.Kind {
	case "range":
		if c.Lo == c.Hi {
			s.finishChunk(ctx, j.table, c)
			return nil
		}
		q, args = dbx.RangeQuery(db, j.spec, dbx.IntegerKey(j.meta), c.Lo, c.Hi)
	default:
		q = dbx.FullQuery(db, j.spec)
	}
	var rows int64
	ticket := record.NewTicket(func() {
		c.Rows = rows
		s.finishChunk(ctx, j.table, c)
	})
	err := s.stream(ctx, db, j, q, args, ticket, out, func(n int, _ []any) { rows += int64(n) })
	if err != nil {
		return err
	}
	ticket.Release()
	return nil
}

func (s *tableSource) finishChunk(ctx context.Context, table string, c model.Chunk) {
	if s.rt.Store != nil && !s.rt.Preview {
		if err := s.rt.Store.ChunkDone(context.WithoutCancel(ctx), s.rt.RunID, s.node.ID, table, c); err != nil {
			s.rt.Bulletin("error", s.node.ID, table, "checkpoint failed: "+err.Error())
		}
	}
	s.rt.Progress().Table(table).add(func(t *model.TableProgress) {
		t.ChunksDone++
		if t.ChunksTotal > 0 && t.ChunksDone >= t.ChunksTotal && t.Status != "failed" {
			t.Status = "done"
		}
	})
}

// stream runs q and emits batches carrying ticket.
func (s *tableSource) stream(ctx context.Context, db dbx.DB, j tableJob, q string, args []any, ticket *record.Ticket,
	out Emitter, onRows func(n int, last []any)) error {
	conv := convertersRaw(db, j.spec.Columns, s.raw)
	meta := metaFor(j.meta, j.spec.Columns)
	prog := s.rt.Progress().Table(j.table)
	batch := make([][]any, 0, s.batchRows)
	flush := func() error {
		if len(batch) == 0 {
			return nil
		}
		if err := s.rt.WaitIfPaused(ctx); err != nil {
			return err
		}
		n := len(batch)
		onRows(n, batch[n-1])
		prog.add(func(t *model.TableProgress) { t.RowsRead += int64(n) })
		out.Emit("success", &record.Batch{Table: j.table, Source: j.table, Meta: meta, Columns: j.spec.Columns, Rows: batch, Ticket: ticket})
		batch = make([][]any, 0, s.batchRows)
		return nil
	}
	err := db.Scan(ctx, q, args, func(raw [][]byte) error {
		batch = append(batch, convertRow(conv, raw))
		if len(batch) >= s.batchRows {
			return flush()
		}
		return nil
	})
	if err != nil {
		return err
	}
	return flush()
}

func (s *tableSource) readKeyset(ctx context.Context, db dbx.DB, j tableJob, out Emitter) error {
	// Resume after the longest contiguous run of committed pages.
	var after []string
	seq := 0
	for _, c := range j.keyset {
		if c.Status != "done" || c.Seq != seq {
			break
		}
		after, seq = c.Last, seq+1
	}
	keyIdx := make([]int, len(j.meta.PrimaryKey))
	for i, k := range j.meta.PrimaryKey {
		keyIdx[i] = -1
		for ci, c := range j.spec.Columns {
			if c.Name == k {
				keyIdx[i] = ci
			}
		}
		if keyIdx[i] < 0 {
			return fmt.Errorf("primary key column %s is excluded from reading", k)
		}
	}
	pageRows := s.chunkRows
	prog := s.rt.Progress().Table(j.table)
	for {
		if err := ctx.Err(); err != nil {
			return err
		}
		c := model.Chunk{Seq: seq, Kind: "keyset", After: after}
		q, args := dbx.KeysetQuery(db, j.spec, j.meta.PrimaryKey, after, pageRows)
		var rows int64
		var last []any
		ticket := record.NewTicket(nil)
		err := s.stream(ctx, db, j, q, args, ticket, out, func(n int, l []any) { rows += int64(n); last = l })
		if err != nil {
			return err
		}
		if rows > 0 {
			key := make([]string, len(keyIdx))
			for i, ci := range keyIdx {
				key[i] = keyText(last[ci])
			}
			c.Last, c.Rows = key, rows
			after = key
		}
		done := c
		prog.add(func(t *model.TableProgress) { t.ChunksTotal++ })
		ticketDone(ticket, func() { s.finishChunk(ctx, j.table, done) })
		ticket.Release()
		seq++
		if rows < int64(pageRows) {
			return nil
		}
	}
}

// ticketDone installs the completion callback on a ticket created before the
// page's final key was known.
func ticketDone(t *record.Ticket, f func()) { t.SetOnDone(f) }

func keyText(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case []byte:
		return string(x)
	default:
		return fmt.Sprint(x)
	}
}

// ---- SQL query source ----

type querySource struct {
	node      *model.Node
	rt        *Runtime
	connID    string
	sql       string
	table     string
	key       string
	batchRows int
}

func buildQuerySource(n *model.Node, cfg Config, rt *Runtime) (any, error) {
	q := strings.TrimRight(strings.TrimSpace(cfg.String("sql")), ";")
	if q == "" {
		return nil, errors.New("SQL is required")
	}
	return &querySource{node: n, rt: rt, connID: cfg.String("connection"), sql: q, table: cfg.String("table_name"),
		key: cfg.String("key_column"), batchRows: max(cfg.Int("batch_rows", 5000), 1)}, nil
}

func (s *querySource) Tables(context.Context) ([]string, error) { return []string{s.table}, nil }

func (s *querySource) meta(ctx context.Context, db dbx.DB) (*record.TableMeta, error) {
	cols, err := db.QueryColumns(ctx, s.sql)
	if err != nil {
		return nil, err
	}
	m := &record.TableMeta{Dialect: db.Driver(), Name: s.table, Columns: cols}
	if s.key != "" {
		m.PrimaryKey = []string{s.key}
	}
	return m, nil
}

func (s *querySource) Sample(ctx context.Context, _ string, limit int) (*record.Batch, error) {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return nil, err
	}
	meta, err := s.meta(ctx, db)
	if err != nil {
		return nil, err
	}
	b := &record.Batch{Table: s.table, Source: s.table, Meta: meta, Columns: meta.Columns}
	if limit <= 0 {
		return b, nil
	}
	conv := converters(db, meta.Columns)
	err = db.Scan(ctx, fmt.Sprintf("SELECT * FROM (%s) nifi_q LIMIT %d", s.sql, limit), nil, func(raw [][]byte) error {
		b.Rows = append(b.Rows, convertRow(conv, raw))
		return nil
	})
	return b, err
}

func (s *querySource) Run(ctx context.Context, out Emitter) error {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return err
	}
	meta, err := s.meta(ctx, db)
	if err != nil {
		return err
	}
	// Wrap the query so the generic keyset/full readers apply to it.
	wrapped := &record.TableMeta{Dialect: meta.Dialect, Name: "(" + s.sql + ")", Columns: meta.Columns, PrimaryKey: meta.PrimaryKey}
	ts := &tableSource{node: s.node, rt: s.rt, chunkRows: 50000, batchRows: s.batchRows}
	spec := dbx.ReadSpec{Meta: wrapped, Columns: meta.Columns}
	out.Emit("success", &record.Batch{Table: s.table, Source: s.table, Meta: meta, Columns: meta.Columns})
	j := tableJob{table: s.table, meta: meta, spec: spec}
	var chunks []model.Chunk
	if s.rt.Store != nil {
		chunks, _ = s.rt.Store.LoadChunks(ctx, s.rt.RunID, s.node.ID, s.table)
	}
	if s.key == "" {
		if len(chunks) > 0 && chunks[0].Status == "done" {
			return nil
		}
		j.chunk = model.Chunk{Kind: "full"}
		s.rt.Progress().Table(s.table).add(func(t *model.TableProgress) { t.ChunksTotal = 1 })
		return ts.read(ctx, &subqueryDB{DB: db}, j, out)
	}
	j.keyset = chunks
	return ts.read(ctx, &subqueryDB{DB: db}, j, out)
}

// subqueryDB renders the wrapped query's pseudo table name verbatim.
type subqueryDB struct{ dbx.DB }

func (d *subqueryDB) QualifiedName(m *record.TableMeta) string {
	if strings.HasPrefix(m.Name, "(") {
		return m.Name + " nifi_q"
	}
	return d.DB.QualifiedName(m)
}

// isMissingTable recognizes "no such table" from either dialect.
func isMissingTable(err error) bool {
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "not found") || strings.Contains(msg, "does not exist") ||
		strings.Contains(msg, "doesn't exist") || strings.Contains(msg, "42p01")
}
