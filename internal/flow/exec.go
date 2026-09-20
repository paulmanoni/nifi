package flow

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sync"
	"sync/atomic"
	"time"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
	"github.com/paulmanoni/nifi/record"
)

// Event is pushed to live subscribers of a run.
type Event struct {
	Type string // detail | bulletin | end
	Data any
}

type edgeRT struct {
	edge     model.Edge
	from     *nodeRT
	to       *nodeRT
	capacity int64
	queued   atomic.Int64
	passed   atomic.Int64
	// dropping counts rows still to be discarded after "empty queue".
	dropping atomic.Int64
	dropped  atomic.Int64
	retried  atomic.Int64
	// peek holds a copy of the most recent batch (up to peekRows rows) so
	// the queue can be inspected while the run is going.
	peek atomic.Pointer[queuePeek]
	// retries/backoff/onFailure come from the connection's settings.
	retries    int
	backoff    time.Duration
	deadLetter bool
}

type queuePeek struct {
	table   string
	columns []record.Column
	rows    [][]any
	at      time.Time
}

const peekRows = 20

type msg struct {
	b *record.Batch
	e *edgeRT
}

type nodeRT struct {
	node    *model.Node
	spec    *Spec
	impl    any
	in      chan msg
	out     map[string][]*edgeRT
	workers int

	upstream   map[*nodeRT]bool
	downstream map[*nodeRT]bool
	pending    atomic.Int64

	rowsIn, rowsOut, batchesIn, errors, active atomic.Int64
	lastRows                                   int64
	rate                                       atomic.Uint64 // float64 bits
}

// Executor runs one flow run.
type Executor struct {
	store *store.Store
	rt    *Runtime
	graph *model.Graph
	nodes []*nodeRT
	edges []*edgeRT

	mu        sync.Mutex
	run       model.RunSummary
	err       error
	cancel    context.CancelFunc
	flowName  string
	waitFor   []*Executor
	beforeRun func(ctx context.Context) error
	afterRun  func(ctx context.Context, run model.RunSummary) error

	// live marks a run fed by a streaming source: it has no natural end, so
	// nothing waits for it to finish and it holds no run slot.
	live bool
	// A flow can hold both kinds of source: tables that are read once and a
	// feed that follows them afterwards. The feed waits here until the
	// one-off sources are done, so the load is not racing the changes it is
	// being overtaken by. The feed's own position is taken in Start, before
	// any of it — so the changes made while the load ran are not lost.
	snapshot        chan struct{}
	snapshotPending atomic.Int64
	stopped         atomic.Bool
	started         atomic.Bool
	ended           atomic.Bool
	done            chan struct{}

	bulletinSeq  atomic.Int64
	unroutedSeen sync.Map
	subsMu       sync.Mutex
	subs         map[chan Event]struct{}
}

func newExecutor(st *store.Store, run model.RunSummary, g *model.Graph, rt *Runtime) (*Executor, error) {
	ex := &Executor{store: st, rt: rt, graph: g, run: run, done: make(chan struct{}), subs: map[chan Event]struct{}{}}
	ex.live = Streaming(g)
	ex.run.Live = ex.live
	ex.snapshot = make(chan struct{})
	ex.bulletinSeq.Store(st.MaxBulletinSeq(context.Background(), run.ID))
	rt.bulletin = ex.addBulletin
	rt.deadLetter = ex.deadLetter
	rt.fail = ex.fail

	byID := map[string]*nodeRT{}
	for i := range g.Nodes {
		n := &g.Nodes[i]
		if n.Disabled {
			continue
		}
		spec, ok := SpecFor(n.Type)
		if !ok {
			return nil, fmt.Errorf("node %s: unknown type %s", n.Name, n.Type)
		}
		impl, err := Build(n, rt)
		if err != nil {
			return nil, fmt.Errorf("node %s: %w", n.Name, err)
		}
		w := n.Concurrency
		if w <= 0 {
			w = DefaultConcurrency(spec)
		}
		nr := &nodeRT{node: n, spec: spec, impl: impl, out: map[string][]*edgeRT{}, workers: w,
			upstream: map[*nodeRT]bool{}, downstream: map[*nodeRT]bool{}}
		byID[n.ID] = nr
		ex.nodes = append(ex.nodes, nr)
	}
	// Projection pushdown for table sources (runs only; see pushdown.go).
	sinks := map[string]*pgSink{}
	for _, n := range ex.nodes {
		if ps, ok := n.impl.(*pgSink); ok {
			sinks[n.node.ID] = ps
		}
	}
	for _, n := range ex.nodes {
		if ts, ok := n.impl.(*tableSource); ok {
			ts.pushdown = pushdownFor(g, n.node.ID, sinks)
		}
	}
	capRows := map[*nodeRT]int64{}
	for _, e := range g.Edges {
		from, to := byID[e.From], byID[e.To]
		if from == nil || to == nil {
			continue
		}
		c := int64(e.BackPressureRows)
		if c <= 0 {
			c = 20000
		}
		backoff := 2 * time.Second
		if d, err := time.ParseDuration(e.RetryBackoff); err == nil && d > 0 {
			backoff = d
		}
		er := &edgeRT{edge: e, from: from, to: to, capacity: c, retries: max(e.Retries, 0),
			backoff: backoff, deadLetter: e.OnFailure == "dead_letter"}
		from.out[e.FromPort] = append(from.out[e.FromPort], er)
		from.downstream[to] = true
		to.upstream[from] = true
		ex.edges = append(ex.edges, er)
		if capRows[to] == 0 || c < capRows[to] {
			capRows[to] = c
		}
	}
	for _, n := range ex.nodes {
		if _, isSource := n.impl.(Source); isSource {
			if !n.spec.Streaming {
				ex.snapshotPending.Add(1)
			}
			continue
		}
		// Capacity in batches, assuming ~5k-row batches; at least 2 so a
		// producer can hand off while the consumer works.
		n.in = make(chan msg, max(capRows[n]/5000, 2))
		n.pending.Store(int64(len(n.upstream)))
	}
	rt.loadSources = int(ex.snapshotPending.Load())
	if ex.snapshotPending.Load() == 0 {
		close(ex.snapshot)
	}
	return ex, nil
}

type emitter struct {
	ex  *Executor
	n   *nodeRT
	ctx context.Context
}

func (e emitter) Emit(port string, b *record.Batch) {
	rows := int64(len(b.Rows))
	e.n.rowsOut.Add(rows)
	edges := e.n.out[port]
	if len(edges) > 0 {
		// Table filters on connections: keep only edges carrying this table.
		var carry []*edgeRT
		for _, ed := range edges {
			if ed.edge.Carries(b.Table) {
				carry = append(carry, ed)
			}
		}
		if len(carry) == 0 && port != "failure" {
			e.ex.unrouted(e.n, port, b.Table)
			return
		}
		edges = carry // failure rows nobody carries fall through to dead letters
	}
	if len(edges) == 0 {
		if port == "failure" && rows > 0 {
			if b.Errors == nil {
				b.Errors = make([]string, len(b.Rows))
			}
			e.ex.rt.DeadLetter(e.n.node.ID, b)
		}
		return
	}
	for i, ed := range edges {
		bb := b
		if i > 0 {
			bb = cloneBatch(b)
		}
		bb.Ticket.Add(1)
		ed.queued.Add(rows)
		ed.setPeek(bb)
		select {
		case ed.to.in <- msg{b: bb, e: ed}:
		case <-e.ctx.Done():
			// The reference is deliberately kept: an undelivered batch must
			// never let its chunk count as committed.
			ed.queued.Add(-rows)
		}
	}
}

// unrouted notes (once per table) that no connection carries a table, so
// its rows stop at this node.
func (ex *Executor) unrouted(n *nodeRT, port, table string) {
	key := n.node.ID + "|" + port + "|" + table
	if _, dup := ex.unroutedSeen.LoadOrStore(key, true); !dup {
		ex.addBulletin("warn", n.node.ID, table, fmt.Sprintf("no connection from %s (%s) carries table %s — its rows stop here", n.node.Name, port, table))
	}
}

func cloneBatch(b *record.Batch) *record.Batch {
	c := *b
	c.Rows = make([][]any, len(b.Rows))
	for i, r := range b.Rows {
		c.Rows[i] = append([]any(nil), r...)
	}
	if b.Errors != nil {
		c.Errors = append([]string(nil), b.Errors...)
	}
	return &c
}

func (ex *Executor) fail(err error) {
	ex.mu.Lock()
	// Errors caused by a user stop (cancelled queries) are not failures.
	if ex.err == nil && !ex.stopped.Load() {
		ex.err = err
	}
	cancel := ex.cancel
	ex.mu.Unlock()
	if cancel != nil {
		cancel()
	}
}

func (ex *Executor) finished() bool { return ex.ended.Load() }

// Start launches the run in the background.
func (ex *Executor) Start() {
	if ex.ended.Load() || !ex.started.CompareAndSwap(false, true) {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	ex.mu.Lock()
	ex.cancel = cancel
	ex.run.Status = model.RunRunning
	ex.run.FinishedAt = nil
	ex.run.Error = ""
	ex.mu.Unlock()
	ex.persist(false)
	go ex.loop(ctx)
	go ex.execute(ctx)
}

func (ex *Executor) execute(ctx context.Context) {
	defer close(ex.done)
	defer ex.rt.Close()
	defer func() {
		if r := recover(); r != nil {
			ex.fail(fmt.Errorf("internal error: %v", r))
			ex.finish()
		}
	}()

	if ex.beforeRun != nil {
		if err := ex.beforeRun(ctx); err != nil {
			ex.fail(fmt.Errorf("before run: %w", err))
			ex.finish()
			return
		}
	}
	for _, n := range ex.nodes {
		if s, ok := n.impl.(interface{ Start(context.Context) error }); ok {
			if err := s.Start(ctx); err != nil {
				ex.fail(fmt.Errorf("%s: %w", n.node.Name, err))
				ex.finish()
				return
			}
		}
	}

	var wg sync.WaitGroup
	for _, n := range ex.nodes {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ex.runNode(ctx, n)
		}()
	}
	wg.Wait()

	// A live run has already had its post-load pass, when its load finished.
	if !ex.live && ex.errOrNil() == nil && !ex.stopped.Load() && ctx.Err() == nil {
		ex.runFinishers(ctx)
	}
	ex.finish()
}

// snapshotFinished releases the streaming sources once the last source that
// reads its tables once has finished. For a live run this is the end of the
// load, so the post-load steps run here — a run that then follows its source
// for a week would otherwise never build its indexes or reset its sequences.
func (ex *Executor) snapshotFinished(ctx context.Context) {
	if ex.snapshotPending.Add(-1) != 0 {
		return
	}
	defer close(ex.snapshot)
	if !ex.live {
		return
	}
	if ex.errOrNil() == nil && !ex.stopped.Load() && ctx.Err() == nil {
		ex.runFinishers(ctx)
	}
	ex.addBulletin("info", "", "", "tables loaded; now following changes")
}

// runFinishers gives every node its post-load pass: indexes, foreign keys,
// sequences, the sink's closing SQL.
func (ex *Executor) runFinishers(ctx context.Context) {
	ex.addBulletin("info", "", "", "all data loaded; running post-load steps")
	for _, n := range ex.nodes {
		f, ok := n.impl.(Finisher)
		if !ok {
			continue
		}
		if err := f.Finish(ctx); err != nil {
			ex.fail(fmt.Errorf("%s: %w", n.node.Name, err))
			break
		}
	}
	ex.rt.setPhase("")
}

func (ex *Executor) errOrNil() error {
	ex.mu.Lock()
	defer ex.mu.Unlock()
	return ex.err
}

func (ex *Executor) runNode(ctx context.Context, n *nodeRT) {
	defer func() {
		for d := range n.downstream {
			if d.pending.Add(-1) == 0 {
				close(d.in)
			}
		}
	}()
	em := emitter{ex: ex, n: n, ctx: ctx}
	if src, ok := n.impl.(Source); ok {
		if n.spec.Streaming {
			select {
			case <-ex.snapshot:
			case <-ctx.Done():
				return
			}
		} else {
			defer ex.snapshotFinished(ctx)
		}
		n.active.Store(1)
		err := src.Run(ctx, em)
		n.active.Store(0)
		if err != nil && !errors.Is(err, context.Canceled) {
			n.errors.Add(1)
			ex.fail(fmt.Errorf("%s: %w", n.node.Name, err))
		}
		return
	}
	proc, ok := n.impl.(Processor)
	if !ok {
		ex.fail(fmt.Errorf("%s is not a processor", n.node.Name))
		return
	}
	if len(n.upstream) == 0 {
		return
	}
	var wg sync.WaitGroup
	for w := 0; w < n.workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				var m msg
				var open bool
				select {
				case m, open = <-n.in:
				case <-ctx.Done():
					ex.drain(n)
					return
				}
				if !open {
					return
				}
				// Pause holds every worker, not just sources, so a paused run
				// really stops writing.
				if err := ex.rt.WaitIfPaused(ctx); err != nil {
					m.e.queued.Add(-int64(len(m.b.Rows)))
					ex.drain(n)
					return
				}
				rows := int64(len(m.b.Rows))
				m.e.queued.Add(-rows)
				if m.e.takeDrop(rows) {
					// the queue was emptied: discard without processing
					m.b.Ticket.Release()
					continue
				}
				m.e.passed.Add(rows)
				n.rowsIn.Add(rows)
				n.batchesIn.Add(1)
				n.active.Add(1)
				err := ex.process(ctx, n, proc, m, em)
				n.active.Add(-1)
				if err == nil && ctx.Err() == nil {
					m.b.Ticket.Release()
				}
				if err != nil {
					n.errors.Add(1)
					if errors.Is(err, context.Canceled) {
						continue
					}
					if m.e.deadLetter {
						// the connection says to keep going: the batch's rows
						// become dead letters with the error
						f := m.b.Derive()
						f.Rows, f.Ops = m.b.Rows, m.b.Ops
						f.Errors = make([]string, len(m.b.Rows))
						for i := range f.Errors {
							f.Errors[i] = err.Error()
						}
						ex.rt.DeadLetter(n.node.ID, f)
						ex.addBulletin("error", n.node.ID, m.b.Table,
							fmt.Sprintf("%s failed on %d row(s) — sent to dead letters: %v", n.node.Name, len(m.b.Rows), err))
						m.b.Ticket.Release()
						continue
					}
					ex.fail(fmt.Errorf("%s: %w", n.node.Name, err))
				}
			}
		}()
	}
	wg.Wait()
}

// process runs one batch through a node, retrying as the connection it
// arrived on says to. Retries are for the transient: a dropped connection, a
// deadlock, a target that was briefly unavailable.
func (ex *Executor) process(ctx context.Context, n *nodeRT, proc Processor, m msg, em Emitter) error {
	wait := m.e.backoff
	for attempt := 0; ; attempt++ {
		err := func() (err error) {
			defer func() {
				if r := recover(); r != nil {
					err = fmt.Errorf("panic: %v", r)
				}
			}()
			return proc.Process(ctx, m.b, em)
		}()
		if err == nil || attempt >= m.e.retries || errors.Is(err, context.Canceled) || ctx.Err() != nil {
			return err
		}
		m.e.retried.Add(1)
		ex.addBulletin("warn", n.node.ID, m.b.Table,
			fmt.Sprintf("%s failed on %d row(s) (%v) — retrying in %s (%d of %d)", n.node.Name, len(m.b.Rows), err, wait, attempt+1, m.e.retries))
		select {
		case <-time.After(wait):
		case <-ctx.Done():
			return ctx.Err()
		}
		wait *= 2
	}
}

// setPeek keeps a copy of the head of a batch for queue inspection.
func (e *edgeRT) setPeek(b *record.Batch) {
	p := &queuePeek{table: b.Table, columns: b.Columns, at: time.Now().UTC()}
	for i, row := range b.Rows {
		if i >= peekRows {
			break
		}
		p.rows = append(p.rows, append([]any(nil), row...))
	}
	e.peek.Store(p)
}

// takeDrop reports whether this batch belongs to a queue being emptied.
func (e *edgeRT) takeDrop(rows int64) bool {
	for {
		left := e.dropping.Load()
		if left <= 0 {
			return false
		}
		if e.dropping.CompareAndSwap(left, max(left-rows, 0)) {
			e.dropped.Add(rows)
			return true
		}
	}
}

// Queues reports what every connection holds, with a peek at its rows.
func (ex *Executor) Queues() []model.QueueInfo {
	out := []model.QueueInfo{}
	for _, e := range ex.edges {
		q := model.QueueInfo{EdgeID: e.edge.ID, From: e.edge.From, FromPort: e.edge.FromPort, To: e.edge.To,
			QueuedRows: max(e.queued.Load(), 0), CapacityRows: e.capacity, RowsPassed: e.passed.Load(),
			RowsDropped: e.dropped.Load(), Retried: e.retried.Load(), Retries: e.retries}
		if e.from != nil {
			q.FromName = e.from.node.Name
		}
		if e.to != nil {
			q.ToName = e.to.node.Name
		}
		if e.deadLetter {
			q.OnFailure = "dead_letter"
		}
		if p := e.peek.Load(); p != nil {
			at := p.at
			q.Table, q.Columns, q.Rows, q.SeenAt = p.table, p.columns, p.rows, &at
		}
		out = append(out, q)
	}
	return out
}

// EmptyQueue discards the rows waiting on one connection; they are counted
// as dropped and their chunks commit as if they had been written.
func (ex *Executor) EmptyQueue(edgeID string) (int64, error) {
	for _, e := range ex.edges {
		if e.edge.ID != edgeID {
			continue
		}
		rows := max(e.queued.Load(), 0)
		if rows == 0 {
			return 0, nil
		}
		e.dropping.Store(rows)
		ex.addBulletin("warn", e.edge.To, "", fmt.Sprintf("queue emptied: %d row(s) discarded before %s", rows, e.to.node.Name))
		return rows, nil
	}
	return 0, fmt.Errorf("no connection %q in this run", edgeID)
}

// drain empties an input channel after cancellation so producers never block.
func (ex *Executor) drain(n *nodeRT) {
	for {
		select {
		case m, ok := <-n.in:
			if !ok {
				return
			}
			m.e.queued.Add(-int64(len(m.b.Rows)))
		default:
			return
		}
	}
}

func (ex *Executor) finish() {
	ex.ended.Store(true)
	ex.mu.Lock()
	now := time.Now().UTC()
	ex.run.FinishedAt = &now
	switch {
	case ex.err != nil:
		ex.run.Status = model.RunFailed
		ex.run.Error = ex.err.Error()
	case ex.stopped.Load():
		ex.run.Status = model.RunStopped
	default:
		ex.run.Status = model.RunCompleted
	}
	ex.mu.Unlock()
	switch ex.run.Status {
	case model.RunFailed:
		ex.addBulletin("error", "", "", "run failed: "+ex.run.Error)
	case model.RunStopped:
		ex.addBulletin("warn", "", "", "run stopped; resume continues from the last committed chunks")
	default:
		ex.addBulletin("info", "", "", "run completed")
	}
	ex.persist(true)
	if ex.afterRun != nil {
		if err := ex.afterRun(context.WithoutCancel(context.Background()), ex.Summary()); err != nil {
			ex.addBulletin("warn", "", "", "after run: "+err.Error())
		}
	}
	ex.broadcast(Event{Type: "end", Data: ex.Summary()})
	ex.subsMu.Lock()
	for ch := range ex.subs {
		close(ch)
		delete(ex.subs, ch)
	}
	ex.subsMu.Unlock()
	if ex.cancel != nil {
		ex.cancel()
	}
}

// Pause holds sources; in-flight batches drain.
func (ex *Executor) Pause(actor string) {
	ex.rt.setPaused(true)
	ex.setStatus(model.RunPaused)
	ex.addBulletin("info", "", "", "paused"+by(actor))
}

func (ex *Executor) Resume(actor string) {
	ex.rt.setPaused(false)
	ex.setStatus(model.RunRunning)
	ex.addBulletin("info", "", "", "resumed"+by(actor))
}

// Stop cancels the run; committed chunks stay committed.
func (ex *Executor) Stop(actor string) {
	if actor != "" {
		ex.addBulletin("info", "", "", "stop requested"+by(actor))
	}
	ex.stopped.Store(true)
	// A queued run never started: finish it in place.
	if !ex.started.Load() && ex.started.CompareAndSwap(false, true) {
		ex.rt.Close()
		ex.finish()
		close(ex.done)
		return
	}
	ex.rt.setPaused(false)
	ex.setStatus(model.RunStopping)
	ex.mu.Lock()
	cancel := ex.cancel
	ex.mu.Unlock()
	if cancel != nil {
		cancel()
	}
}

// Abort finishes a run that never started (queued), recording why.
func (ex *Executor) Abort(reason string) {
	if !ex.started.CompareAndSwap(false, true) {
		return
	}
	ex.mu.Lock()
	ex.run.Error = reason
	ex.mu.Unlock()
	ex.addBulletin("warn", "", "", "not started: "+reason)
	ex.stopped.Store(true)
	ex.rt.Close()
	ex.finish()
	close(ex.done)
}

// Done is closed when the run has finished.
func (ex *Executor) Done() <-chan struct{} { return ex.done }

func (ex *Executor) setStatus(s model.RunStatus) {
	ex.mu.Lock()
	if !ex.run.Status.Finished() {
		ex.run.Status = s
	}
	ex.mu.Unlock()
	ex.broadcast(Event{Type: "detail", Data: ex.Detail()})
}

// Summary returns the current run summary with live counters.
func (ex *Executor) Summary() model.RunSummary {
	ex.mu.Lock()
	r := ex.run
	ex.mu.Unlock()
	for _, t := range ex.rt.Progress().Snapshot() {
		r.RowsRead += t.RowsRead
		r.RowsWritten += t.RowsWritten
		r.RowsFailed += t.RowsFailed
	}
	return r
}

// Detail returns the live run detail.
func (ex *Executor) Detail() model.RunDetail {
	d := model.RunDetail{RunSummary: ex.Summary(), Phase: ex.rt.Phase(), Tables: ex.rt.Progress().Snapshot()}
	for _, n := range ex.nodes {
		d.Nodes = append(d.Nodes, model.NodeStats{NodeID: n.node.ID, RowsIn: n.rowsIn.Load(), RowsOut: n.rowsOut.Load(),
			BatchesIn: n.batchesIn.Load(), Errors: n.errors.Load(), RowsPerSec: math.Float64frombits(n.rate.Load()), Active: n.active.Load()})
	}
	for _, e := range ex.edges {
		d.Edges = append(d.Edges, model.EdgeStats{EdgeID: e.edge.ID, RowsDropped: e.dropped.Load(), Retried: e.retried.Load(), QueuedRows: max(e.queued.Load(), 0),
			CapacityRows: e.capacity, RowsPassed: e.passed.Load()})
	}
	if d.Nodes == nil {
		d.Nodes = []model.NodeStats{}
	}
	if d.Edges == nil {
		d.Edges = []model.EdgeStats{}
	}
	return d
}

func (ex *Executor) loop(ctx context.Context) {
	tick := time.NewTicker(time.Second)
	defer tick.Stop()
	last := time.Now()
	persistAt := time.Now()
	for {
		select {
		case <-ex.done:
			return
		case now := <-tick.C:
			dt := now.Sub(last).Seconds()
			last = now
			for _, n := range ex.nodes {
				total := max(n.rowsIn.Load(), n.rowsOut.Load())
				inst := float64(total-n.lastRows) / dt
				r := 0.6*inst + 0.4*math.Float64frombits(n.rate.Load())
				if r < 0.5 {
					r = 0
				}
				n.rate.Store(math.Float64bits(r))
				n.lastRows = total
			}
			ex.broadcast(Event{Type: "detail", Data: ex.Detail()})
			if now.Sub(persistAt) > 5*time.Second {
				persistAt = now
				ex.persist(false)
			}
		}
	}
}

func (ex *Executor) persist(final bool) {
	d := ex.Detail()
	if err := ex.store.UpdateRun(context.Background(), d.RunSummary, &d); err != nil && final {
		fmt.Println("nifi: persist run:", err)
	}
}

func (ex *Executor) addBulletin(level, nodeID, table, message string) {
	b := model.Bulletin{Seq: ex.bulletinSeq.Add(1), Time: time.Now().UTC(), Level: level, NodeID: nodeID, Table: table, Message: message}
	ex.store.AddBulletin(context.Background(), ex.run.ID, b)
	ex.broadcast(Event{Type: "bulletin", Data: b})
}

func (ex *Executor) deadLetter(nodeID string, b *record.Batch) {
	now := time.Now().UTC()
	items := make([]model.DeadLetter, len(b.Rows))
	for i := range b.Rows {
		msg := ""
		if i < len(b.Errors) {
			msg = b.Errors[i]
		}
		if msg == "" {
			msg = "unhandled failure"
		}
		items[i] = model.DeadLetter{NodeID: nodeID, Table: b.Source, Error: msg, Row: b.RowMap(i), Time: now}
	}
	if err := ex.store.AddDeadLetters(context.Background(), ex.run.ID, items); err != nil {
		ex.fail(fmt.Errorf("store dead letters: %w", err))
	}
}

// Subscribe returns a channel of live events; it closes when the run ends.
func (ex *Executor) Subscribe() (chan Event, func()) {
	ch := make(chan Event, 64)
	ex.subsMu.Lock()
	select {
	case <-ex.done:
		close(ch)
	default:
		ex.subs[ch] = struct{}{}
	}
	ex.subsMu.Unlock()
	return ch, func() {
		ex.subsMu.Lock()
		if _, ok := ex.subs[ch]; ok {
			delete(ex.subs, ch)
			close(ch)
		}
		ex.subsMu.Unlock()
	}
}

func (ex *Executor) broadcast(e Event) {
	ex.subsMu.Lock()
	defer ex.subsMu.Unlock()
	for ch := range ex.subs {
		select {
		case ch <- e:
		default: // slow subscriber: drop, the next detail supersedes it
		}
	}
}

// DefaultConcurrency is the worker count of a node that does not set one:
// sources, sinks and scripts are the usual bottlenecks and get 4.
func DefaultConcurrency(spec *Spec) int {
	if !spec.SupportsConcurrency {
		return 1
	}
	switch spec.Category {
	case "Source", "Sink", "Script":
		return 4
	}
	return 2
}
