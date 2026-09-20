package flow

// Streaming sources follow a table instead of reading it once: the run stays
// live, and every row it emits carries what happened to it, so a sink writing
// in "apply changes" mode upserts what changed and removes what was deleted.
//
// This one needs nothing of the database but a column that moves whenever a
// row is written — the pattern every ORM already provides as updated_at. It is
// therefore portable across MySQL and PostgreSQL and needs no replication
// privileges, at the cost of not seeing a hard DELETE (a soft delete is seen,
// via "A row is deleted when"). A source that reads the write-ahead log can be
// supplied by the host as a custom node; everything downstream is the same.

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/exprx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

func init() {
	register(&Spec{
		Type: "source.changes", Label: "Table Changes", Category: "Source", Icon: "radio",
		Description:         "Follows tables by a column that moves when a row is written (updated_at), emitting rows as they change. The run stays live until it is stopped.",
		Relationships:       []string{"success"},
		SupportsConcurrency: true,
		Streaming:           true,
		Properties: []Property{
			{Key: "connection", Label: "Connection", Kind: "connection", Required: true},
			{Key: "tables", Label: "Tables", Kind: "tables", ConnectionKey: "connection", Required: true,
				Help: "Each table is followed independently, from its own position."},
			{Key: "watermark", Label: "Changed-at column", Kind: "string", Default: "updated_at",
				Help: "The column that moves whenever a row is written. Rows are read in its order, so it must never go backwards."},
			{Key: "watermark_map", Label: "Changed-at column per table", Kind: "keyvalue",
				Help:    "For tables whose column is named differently.",
				Columns: []ListColumn{{Key: "key", Label: "Table", Kind: "string"}, {Key: "value", Label: "Changed-at column", Kind: "string"}}},
			{Key: "start", Label: "Start from", Kind: "select", Default: "now", Options: []Option{
				{Value: "now", Label: "Now — only rows written from here on"},
				{Value: "beginning", Label: "The beginning — read every row first, then follow"},
			}, Help: "Only used the first time. After that the flow carries on from where it stopped."},
			{Key: "poll", Label: "Check every (seconds)", Kind: "int", Default: 5},
			{Key: "batch_rows", Label: "Rows per batch", Kind: "int", Default: 1000},
			{Key: "deleted_when", Label: "A row is deleted when", Kind: "expr",
				Help: "An expression over the row, e.g. deleted_at != nil. Rows it is true for are removed from the destination instead of written."},
			{Key: "where", Label: "Row filters", Kind: "keyvalue", Help: "Table → SQL condition in the source dialect.",
				Columns: []ListColumn{{Key: "key", Label: "Table", Kind: "string"}, {Key: "value", Label: "Only rows where (SQL)", Kind: "string"}}},
		},
		build: buildChangeSource,
	})
}

type changeSource struct {
	node      *model.Node
	rt        *Runtime
	connID    string
	tables    []string
	wm        string
	wmMap     map[string]string
	start     string
	poll      time.Duration
	batchRows int
	workers   int
	where     map[string]string
	deleted   *exprx.Program
	// anchors is where each table is followed from, decided before the run
	// begins — so a flow that also loads those tables does not lose the
	// changes made while it was loading them.
	anchors map[string][]string
}

func buildChangeSource(n *model.Node, cfg Config, rt *Runtime) (any, error) {
	s := &changeSource{node: n, rt: rt, connID: cfg.String("connection"), tables: cfg.Strings("tables"),
		wm: cfg.String("watermark"), wmMap: map[string]string{}, start: cfg.String("start"),
		poll:      time.Duration(max(cfg.Int("poll", 5), 1)) * time.Second,
		batchRows: max(cfg.Int("batch_rows", 1000), 1), workers: max(n.Concurrency, 1),
		where: cfg.PairMap("where")}
	if s.wm == "" {
		s.wm = "updated_at"
	}
	if s.start == "" {
		s.start = "now"
	}
	for t, c := range cfg.PairMap("watermark_map") {
		s.wmMap[strings.ToLower(t)] = c
	}
	if src := strings.TrimSpace(cfg.String("deleted_when")); src != "" {
		p, err := exprx.Compile(src)
		if err != nil {
			return nil, fmt.Errorf("a row is deleted when: %w", err)
		}
		s.deleted = p
	}
	return s, nil
}

func (s *changeSource) Tables(context.Context) ([]string, error) { return s.tables, nil }

// Start fixes the position of every table before any of the flow runs. When
// the same flow also reads those tables once, the feed waits for that load to
// finish but follows from here — the moment before it started — so a row
// changed while it was loading is still seen.
func (s *changeSource) Start(ctx context.Context) error {
	if s.rt.Preview {
		return nil
	}
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return err
	}
	anchors := make(map[string][]string, len(s.tables))
	for _, t := range s.tables {
		spec, key, err := s.spec(ctx, db, t)
		if err != nil {
			return err
		}
		after, err := s.position(ctx, db, spec, key, t)
		if err != nil {
			return err
		}
		anchors[t] = after
	}
	s.anchors = anchors
	return nil
}

// watermarkFor is the changed-at column this table is followed by.
func (s *changeSource) watermarkFor(table string) string {
	if c, ok := s.wmMap[strings.ToLower(table)]; ok && c != "" {
		return c
	}
	return s.wm
}

// spec describes one table's read, and the key it is ordered and resumed by:
// the changed-at column first, then the primary key to break ties.
func (s *changeSource) spec(ctx context.Context, db dbx.DB, table string) (dbx.ReadSpec, []string, error) {
	meta, err := db.Describe(ctx, table)
	if err != nil {
		return dbx.ReadSpec{}, nil, err
	}
	wm := s.watermarkFor(table)
	found := ""
	for _, c := range meta.Columns {
		if strings.EqualFold(c.Name, wm) {
			found = c.Name
		}
	}
	if found == "" {
		return dbx.ReadSpec{}, nil, fmt.Errorf("%s has no %q column: a change feed needs one column that moves whenever a row is written", table, wm)
	}
	if len(meta.PrimaryKey) == 0 {
		return dbx.ReadSpec{}, nil, fmt.Errorf("%s has no primary key: without one two rows written in the same instant cannot be told apart", table)
	}
	key := append([]string{found}, meta.PrimaryKey...)
	return dbx.ReadSpec{Meta: meta, Columns: meta.Columns, Where: s.where[table]}, key, nil
}

func (s *changeSource) Sample(ctx context.Context, table string, limit int) (*record.Batch, error) {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return nil, err
	}
	spec, _, err := s.spec(ctx, db, table)
	if err != nil {
		return nil, err
	}
	b := &record.Batch{Table: table, Source: table, Meta: spec.Meta, Columns: spec.Columns}
	if limit <= 0 {
		return b, nil
	}
	conv := convertersRaw(db, spec.Columns, false)
	err = db.Scan(ctx, dbx.SampleQuery(db, spec, limit), nil, func(raw [][]byte) error {
		b.Rows = append(b.Rows, convertRow(conv, raw))
		return nil
	})
	if err != nil {
		return nil, err
	}
	s.markOps(b)
	return b, nil
}

// Run follows every table until the run is stopped. Each table has its own
// goroutine and its own position, so a busy table never holds up a quiet one.
func (s *changeSource) Run(ctx context.Context, out Emitter) error {
	db, err := s.rt.DB(ctx, s.connID)
	if err != nil {
		return err
	}
	sem := make(chan struct{}, max(s.workers, 1))
	var wg sync.WaitGroup
	var mu sync.Mutex
	var first error
	for _, t := range s.tables {
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer func() { <-sem; wg.Done() }()
			if err := s.follow(ctx, db, t, out); err != nil && ctx.Err() == nil {
				mu.Lock()
				if first == nil {
					first = err
				}
				mu.Unlock()
			}
		}()
	}
	wg.Wait()
	return first
}

func (s *changeSource) follow(ctx context.Context, db dbx.DB, table string, out Emitter) error {
	spec, key, err := s.spec(ctx, db, table)
	if err != nil {
		return err
	}
	after, ok := s.anchors[table]
	if !ok {
		if after, err = s.position(ctx, db, spec, key, table); err != nil {
			return err
		}
	}
	keyIdx := make([]int, len(key))
	for i, k := range key {
		keyIdx[i] = -1
		for ci, c := range spec.Columns {
			if c.Name == k {
				keyIdx[i] = ci
			}
		}
		if keyIdx[i] < 0 {
			return fmt.Errorf("%s: %s is not among the columns read", table, k)
		}
	}
	conv := convertersRaw(db, spec.Columns, false)
	prog := s.rt.Progress().Table(table)
	prog.add(func(t *model.TableProgress) { t.Status = "reading" })

	for {
		if err := ctx.Err(); err != nil {
			return nil
		}
		if err := s.rt.WaitIfPaused(ctx); err != nil {
			return nil
		}
		q, args := dbx.KeysetQuery(db, spec, key, after, s.batchRows)
		rows := make([][]any, 0, s.batchRows)
		next := make([]string, len(keyIdx))
		if err := db.Scan(ctx, q, args, func(raw [][]byte) error {
			// The position is kept as the database's own text for the value,
			// not as the Go value formatted back: that is what the next query
			// casts and compares, and a timestamp does not survive the round
			// trip through Go's default formatting.
			for i, ci := range keyIdx {
				next[i] = string(raw[ci])
			}
			rows = append(rows, convertRow(conv, raw))
			return nil
		}); err != nil {
			return fmt.Errorf("read %s: %w", table, err)
		}
		if len(rows) > 0 {
			b := &record.Batch{Table: table, Source: table, Meta: spec.Meta, Columns: spec.Columns, Rows: rows}
			s.markOps(b)
			// The position only moves once this batch has been written
			// everywhere it goes, and the next page is not read until then —
			// so a stopped or crashed run resumes on the first row it did not
			// finish, and never skips one.
			done := make(chan struct{})
			b.Ticket = record.NewTicket(func() { close(done) })
			prog.add(func(t *model.TableProgress) { t.RowsRead += int64(len(rows)) })
			out.Emit("success", b)
			b.Ticket.Release()
			select {
			case <-done:
			case <-ctx.Done():
				return nil
			}
			after = next
			s.save(ctx, table, after)
		}
		if len(rows) < s.batchRows {
			select {
			case <-ctx.Done():
				return nil
			case <-time.After(s.poll):
			}
		}
	}
}

// markOps says what each row is. Everything the feed emits has changed since
// the last time it looked, so a row is an update — which is what tells a
// destination applying changes to overwrite it, rather than treat it as one
// more row of a load. The "deleted when" expression picks out the rows to
// remove instead.
func (s *changeSource) markOps(b *record.Batch) {
	if len(b.Rows) == 0 {
		return
	}
	names := colNames(b.Columns)
	var env map[string]any
	rows := b.Rows
	b.Rows, b.Ops = nil, nil
	for _, row := range rows {
		op := record.Update
		if s.deleted != nil {
			env = exprx.Env(env, b.Table, names, row)
			if ok, err := s.deleted.Truthy(env); err == nil && ok {
				op = record.Delete
			}
		}
		b.Append(row, op)
	}
}

// position is where this table is followed from: the stored position, else
// the end of the table (start "now") or its beginning.
func (s *changeSource) position(ctx context.Context, db dbx.DB, spec dbx.ReadSpec, key []string, table string) ([]string, error) {
	if after := s.load(ctx, table); after != nil {
		return after, nil
	}
	if s.start != "now" {
		return nil, nil
	}
	cols := make([]string, len(key))
	desc := make([]string, len(key))
	for i, k := range key {
		cols[i] = db.Quote(k)
		desc[i] = db.Quote(k) + " DESC"
	}
	q := fmt.Sprintf("SELECT %s FROM %s ORDER BY %s LIMIT 1",
		strings.Join(cols, ", "), db.QualifiedName(spec.Meta), strings.Join(desc, ", "))
	var last []string
	if err := db.Scan(ctx, q, nil, func(raw [][]byte) error {
		last = make([]string, len(raw))
		for i, v := range raw {
			if v != nil {
				last[i] = string(v)
			}
		}
		return nil
	}); err != nil {
		return nil, fmt.Errorf("find the end of %s: %w", table, err)
	}
	if last != nil {
		s.rt.Bulletin("info", s.node.ID, table, fmt.Sprintf("following %s from %s = %s", table, key[0], last[0]))
	}
	return last, nil
}

func (s *changeSource) cursorKey(table string) string {
	return "changes:" + s.node.ID + ":" + strings.ToLower(table)
}

func (s *changeSource) load(ctx context.Context, table string) []string {
	if s.rt.Store == nil || s.rt.Preview || s.rt.FlowID == "" {
		return nil
	}
	v, ok := s.rt.Store.GetFlowKV(ctx, s.rt.FlowID, s.cursorKey(table))
	if !ok {
		return nil
	}
	var after []string
	if json.Unmarshal([]byte(v), &after) != nil {
		return nil
	}
	return after
}

func (s *changeSource) save(ctx context.Context, table string, after []string) {
	if s.rt.Store == nil || s.rt.Preview || s.rt.FlowID == "" {
		return
	}
	v, err := json.Marshal(after)
	if err != nil {
		return
	}
	if err := s.rt.Store.SetFlowKV(context.WithoutCancel(ctx), s.rt.FlowID, s.cursorKey(table), string(v)); err != nil {
		s.rt.Bulletin("error", s.node.ID, table, "could not remember the position: "+err.Error())
	}
}
