package flow

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
	"github.com/paulmanoni/nifi/record"
)

// ConnectionResolver loads a connection profile (with password) by id.
type ConnectionResolver func(ctx context.Context, id string) (dbx.Connection, error)

// Runtime carries the services processors use during a run or a preview.
type Runtime struct {
	Store   *store.Store
	RunID   string
	FlowID  string
	Resume  bool
	Preview bool
	Conns   ConnectionResolver

	// loadSources counts the sources in this run that read their input once,
	// so a streaming source can tell whether it is following a load in the
	// same flow or running on its own.
	loadSources int

	mu  sync.Mutex
	dbs map[string]dbx.DB

	// shared, when set, lends pools owned by the Manager so concurrent runs
	// share connections instead of each opening their own.
	shared *Manager

	bulletin   func(level, nodeID, table, msg string)
	deadLetter func(nodeID string, b *record.Batch)
	progress   *Progress

	phase    atomic.Value
	paused   atomic.Bool
	resumeCh chan struct{}
	pauseMu  sync.Mutex

	// failures counts dead-lettered rows against the run's error budget.
	failures  atomic.Int64
	maxErrors int64
	fail      func(error)
}

// NewPreviewRuntime returns a runtime that never writes state.
func NewPreviewRuntime(conns ConnectionResolver) *Runtime {
	return &Runtime{Preview: true, Conns: conns, dbs: map[string]dbx.DB{}, progress: newProgress(),
		bulletin: func(string, string, string, string) {}, deadLetter: func(string, *record.Batch) {}}
}

// LoadSources is how many sources in this run read their input once. A
// streaming source only starts after all of them have finished, so a non-zero
// count means the flow loaded before it began to follow.
func (rt *Runtime) LoadSources() int { return rt.loadSources }

// DB opens (once per runtime) the database behind a connection id.
func (rt *Runtime) DB(ctx context.Context, id string) (dbx.DB, error) {
	if id == "" {
		return nil, fmt.Errorf("no connection selected")
	}
	rt.mu.Lock()
	defer rt.mu.Unlock()
	if d, ok := rt.dbs[id]; ok {
		return d, nil
	}
	var d dbx.DB
	var err error
	if rt.shared != nil {
		d, err = rt.shared.acquire(ctx, id)
	} else {
		d, err = openConn(ctx, rt.Conns, id)
	}
	if err != nil {
		return nil, err
	}
	rt.dbs[id] = d
	return d, nil
}

func openConn(ctx context.Context, conns ConnectionResolver, id string) (dbx.DB, error) {
	if conns == nil {
		return nil, fmt.Errorf("connection %s: no connections are available here", id)
	}
	c, err := conns(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("connection %s: %w", id, err)
	}
	d, err := dbx.Open(ctx, c)
	if err != nil {
		return nil, fmt.Errorf("connect %s: %w", c.Name, err)
	}
	return d, nil
}

// PG opens a PostgreSQL connection.
func (rt *Runtime) PG(ctx context.Context, id string) (*dbx.PG, error) {
	d, err := rt.DB(ctx, id)
	if err != nil {
		return nil, err
	}
	pg, ok := d.(*dbx.PG)
	if !ok {
		return nil, fmt.Errorf("connection must be PostgreSQL (got %s)", d.Driver())
	}
	return pg, nil
}

// Close releases all opened databases.
func (rt *Runtime) Close() {
	rt.mu.Lock()
	defer rt.mu.Unlock()
	for id, d := range rt.dbs {
		if rt.shared != nil {
			rt.shared.release(id)
		} else {
			d.Close()
		}
	}
	rt.dbs = map[string]dbx.DB{}
}

// Bulletin records a run message.
func (rt *Runtime) Bulletin(level, nodeID, table, msg string) {
	if rt.bulletin != nil {
		rt.bulletin(level, nodeID, table, msg)
	}
}

// DeadLetter stores rows (with Batch.Errors) that could not be processed.
func (rt *Runtime) DeadLetter(nodeID string, b *record.Batch) {
	if len(b.Rows) == 0 {
		return
	}
	if rt.deadLetter != nil {
		rt.deadLetter(nodeID, b)
	}
	rt.progress.Table(b.Source).add(func(t *model.TableProgress) { t.RowsFailed += int64(len(b.Rows)) })
	if n := rt.failures.Add(int64(len(b.Rows))); rt.maxErrors > 0 && n > rt.maxErrors && rt.fail != nil {
		rt.fail(fmt.Errorf("error budget exhausted: %d rows failed (limit %d)", n, rt.maxErrors))
	}
}

// Progress exposes per-table progress.
func (rt *Runtime) Progress() *Progress { return rt.progress }

// WaitIfPaused blocks while the run is paused.
func (rt *Runtime) WaitIfPaused(ctx context.Context) error {
	for rt.paused.Load() {
		rt.pauseMu.Lock()
		ch := rt.resumeCh
		rt.pauseMu.Unlock()
		if ch == nil {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ch:
		case <-time.After(time.Second):
		}
	}
	return ctx.Err()
}

func (rt *Runtime) setPaused(p bool) {
	rt.pauseMu.Lock()
	defer rt.pauseMu.Unlock()
	if p && !rt.paused.Load() {
		rt.resumeCh = make(chan struct{})
		rt.paused.Store(true)
	} else if !p && rt.paused.Load() {
		rt.paused.Store(false)
		close(rt.resumeCh)
	}
}

// Progress tracks per-source-table counters.
type Progress struct {
	mu     sync.Mutex
	tables map[string]*tableProg
	order  []string
}

type tableProg struct {
	mu sync.Mutex
	p  model.TableProgress
}

func newProgress() *Progress { return &Progress{tables: map[string]*tableProg{}} }

// Table returns (creating) the tracker for a source table.
func (p *Progress) Table(name string) *tableProg {
	p.mu.Lock()
	defer p.mu.Unlock()
	t, ok := p.tables[name]
	if !ok {
		t = &tableProg{p: model.TableProgress{Table: name, Status: "pending"}}
		p.tables[name] = t
		p.order = append(p.order, name)
	}
	return t
}

func (t *tableProg) add(f func(*model.TableProgress)) {
	t.mu.Lock()
	f(&t.p)
	t.mu.Unlock()
}

// Snapshot returns a copy of all table progress.
func (p *Progress) Snapshot() []model.TableProgress {
	p.mu.Lock()
	names := append([]string(nil), p.order...)
	p.mu.Unlock()
	out := make([]model.TableProgress, 0, len(names))
	for _, n := range names {
		t := p.Table(n)
		t.mu.Lock()
		out = append(out, t.p)
		t.mu.Unlock()
	}
	return out
}

func (rt *Runtime) setPhase(p string) { rt.phase.Store(p) }

// Phase is the current post-load phase ("" while loading).
func (rt *Runtime) Phase() string {
	p, _ := rt.phase.Load().(string)
	return p
}
