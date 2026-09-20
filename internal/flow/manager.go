package flow

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
)

// Manager owns the active runs and the database pools they share.
type Manager struct {
	Store     *store.Store
	Conns     ConnectionResolver
	MaxErrors int64
	// MaxParallel caps concurrently executing runs; further runs wait as
	// "pending" and start in order as slots free. 0 = unlimited.
	MaxParallel int
	// BeforeRun, when set, runs right before a run starts executing (after
	// any queueing); an error fails the run.
	BeforeRun func(ctx context.Context, flowID, flowName, runID string, resume bool) error
	// AfterRun, when set, runs once a flow's run has finished, whatever the
	// outcome. It is advisory: an error from it is reported as a bulletin and
	// does not change the run.
	AfterRun func(ctx context.Context, flowID, flowName string, run model.RunSummary) error

	mu     sync.Mutex
	active map[string]*Executor // run id → executor (running, paused or queued)
	queue  []*Executor

	poolMu sync.Mutex
	pools  map[string]*sharedPool
}

type sharedPool struct {
	db   dbx.DB
	refs int
}

func NewManager(st *store.Store, conns ConnectionResolver, maxErrors int64) *Manager {
	return &Manager{Store: st, Conns: conns, MaxErrors: maxErrors, active: map[string]*Executor{}, pools: map[string]*sharedPool{}}
}

// acquire lends the shared pool for a connection, opening it on first use.
func (m *Manager) acquire(ctx context.Context, id string) (dbx.DB, error) {
	m.poolMu.Lock()
	defer m.poolMu.Unlock()
	if p, ok := m.pools[id]; ok {
		p.refs++
		return p.db, nil
	}
	d, err := openConn(ctx, m.Conns, id)
	if err != nil {
		return nil, err
	}
	m.pools[id] = &sharedPool{db: d, refs: 1}
	return d, nil
}

// release returns a lent pool, closing it when no run uses it.
func (m *Manager) release(id string) {
	m.poolMu.Lock()
	defer m.poolMu.Unlock()
	if p, ok := m.pools[id]; ok {
		if p.refs--; p.refs <= 0 {
			p.db.Close()
			delete(m.pools, id)
		}
	}
}

// ErrConflict signals a request that clashes with run state.
var ErrConflict = errors.New("conflict")

// Start begins a new run of a flow, or resumes its latest unfinished run.
func (m *Manager) Start(ctx context.Context, flowID string, resume bool, actor string) (model.RunSummary, error) {
	ex, err := m.startRun(ctx, flowID, resume, actor, nil)
	if err != nil {
		return model.RunSummary{}, err
	}
	return ex.Summary(), nil
}

// StartWithDependencies runs a flow after its unfinished prerequisites (the
// transitive dependsOn closure whose latest run is not completed).
func (m *Manager) StartWithDependencies(ctx context.Context, flowID string, resume bool, actor string) (model.RunSummary, RunAllResult, error) {
	res, err := m.RunAll(ctx, []string{flowID}, resume, actor)
	if err != nil {
		return model.RunSummary{}, res, err
	}
	for _, r := range res.Started {
		if r.FlowID == flowID {
			return r, res, nil
		}
	}
	for _, s := range res.Skipped {
		if s.FlowID == flowID {
			if strings.Contains(s.Reason, "active run") {
				return model.RunSummary{}, res, fmt.Errorf("%w: %s", ErrConflict, s.Reason)
			}
			return model.RunSummary{}, res, fmt.Errorf("%s", s.Reason)
		}
	}
	return model.RunSummary{}, res, fmt.Errorf("flow %s was not started", flowID)
}

// prepare builds the executor for a run and registers it as active.
func (m *Manager) prepare(ctx context.Context, run model.RunSummary, g *model.Graph, flowName string, resume bool) (*Executor, error) {
	rt := &Runtime{Store: m.Store, RunID: run.ID, FlowID: run.FlowID, Resume: resume, Conns: m.Conns,
		dbs: map[string]dbx.DB{}, shared: m, progress: newProgress(), maxErrors: m.MaxErrors}
	ex, err := newExecutor(m.Store, run, g, rt)
	if err != nil {
		rt.Close()
		if !resume {
			run.Status, run.Error = model.RunFailed, err.Error()
			m.Store.UpdateRun(ctx, run, nil)
		}
		return nil, err
	}
	ex.flowName = flowName
	return ex, nil
}

// launch starts a run that is not a flow's own run (a replay): no queueing
// on dependencies, no before-run hook.
func (m *Manager) launch(ctx context.Context, run model.RunSummary, g *model.Graph, name, actor string) (*Executor, error) {
	if issues := Validate(g); hasErrors(issues) {
		for _, i := range issues {
			if i.Level == "error" {
				return nil, fmt.Errorf("flow is invalid: %s", i.Message)
			}
		}
	}
	ex, err := m.prepare(ctx, run, g, name, false)
	if err != nil {
		return nil, err
	}
	m.mu.Lock()
	m.active[run.ID] = ex
	m.mu.Unlock()
	ex.addBulletin("info", "", "", "run started"+by(actor))
	go func() {
		<-ex.Done()
		m.mu.Lock()
		delete(m.active, run.ID)
		m.mu.Unlock()
		m.startQueued()
	}()
	ex.Start()
	return ex, nil
}

func (m *Manager) startRun(ctx context.Context, flowID string, resume bool, actor string, waitFor []*Executor) (*Executor, error) {
	f, err := m.Store.GetFlow(ctx, flowID)
	if err != nil {
		return nil, err
	}
	if issues := Validate(f.Graph); hasErrors(issues) {
		for _, i := range issues {
			if i.Level == "error" {
				return nil, fmt.Errorf("flow is invalid: %s", i.Message)
			}
		}
	}
	m.mu.Lock()
	for _, ex := range m.active {
		if ex.run.FlowID == flowID {
			m.mu.Unlock()
			return nil, fmt.Errorf("%w: flow already has an active run", ErrConflict)
		}
	}
	m.mu.Unlock()

	var run model.RunSummary
	if resume {
		runs, err := m.Store.ListRuns(ctx, flowID, 1)
		if err != nil {
			return nil, err
		}
		if len(runs) == 0 || runs[0].Status == model.RunCompleted {
			return nil, fmt.Errorf("%w: nothing to resume", ErrConflict)
		}
		run = runs[0]
	} else {
		if run, err = m.Store.CreateRun(ctx, flowID, f.Graph); err != nil {
			return nil, err
		}
	}
	ex, err := m.prepare(ctx, run, f.Graph, f.Name, resume)
	if err != nil {
		return nil, err
	}
	ex.waitFor = waitFor
	if m.BeforeRun != nil {
		hook, fid, fname, rid := m.BeforeRun, f.ID, f.Name, run.ID
		ex.beforeRun = func(ctx context.Context) error { return hook(ctx, fid, fname, rid, resume) }
	}
	if m.AfterRun != nil {
		hook, fid, fname := m.AfterRun, f.ID, f.Name
		ex.afterRun = func(ctx context.Context, r model.RunSummary) error { return hook(ctx, fid, fname, r) }
	}
	m.mu.Lock()
	m.active[run.ID] = ex
	m.mu.Unlock()
	if resume {
		ex.addBulletin("info", "", "", "resuming run; committed chunks are skipped"+by(actor))
	} else {
		ex.addBulletin("info", "", "", "run started"+by(actor))
	}
	go func() {
		<-ex.Done()
		m.mu.Lock()
		delete(m.active, run.ID)
		m.mu.Unlock()
		m.startQueued()
	}()
	m.mu.Lock()
	if len(waitFor) > 0 || (m.MaxParallel > 0 && m.runningLocked() >= m.MaxParallel) {
		// A resumed run carries its old stopped/failed state; while it
		// waits it is pending.
		ex.mu.Lock()
		ex.run.Status, ex.run.Error, ex.run.FinishedAt = model.RunPending, "", nil
		ex.mu.Unlock()
		m.queue = append(m.queue, ex)
		m.mu.Unlock()
		if names := pendingNames(waitFor); len(names) > 0 {
			ex.addBulletin("info", "", "", "waiting for "+strings.Join(names, ", "))
		} else {
			ex.addBulletin("info", "", "", fmt.Sprintf("queued: %d runs already executing", m.MaxParallel))
		}
		ex.persist(false)
		m.startQueued()
		return ex, nil
	}
	m.mu.Unlock()
	ex.Start()
	return ex, nil
}

func pendingNames(deps []*Executor) []string {
	var out []string
	for _, d := range deps {
		if !d.finished() {
			out = append(out, d.flowName)
		}
	}
	return out
}

func (m *Manager) runningLocked() int {
	n := 0
	for _, ex := range m.active {
		if ex.started.Load() && !ex.finished() && !ex.live {
			n++
		}
	}
	return n
}

// startQueued starts waiting runs whose prerequisites completed, while
// slots are free, and cancels those whose prerequisites did not complete.
func (m *Manager) startQueued() {
	for {
		var next *Executor
		var cancel []*Executor
		var reasons []string
		m.mu.Lock()
		keep := m.queue[:0:0]
		for _, ex := range m.queue {
			if ex.finished() {
				continue
			}
			ready, failed := true, ""
			for _, d := range ex.waitFor {
				switch {
				case d.live && d.started.Load():
					// A live run has no end to wait for: once it is following
					// its source, whatever depends on it can go.
				case !d.finished():
					ready = false
				case d.Summary().Status != model.RunCompleted:
					failed = fmt.Sprintf("dependency %q did not complete (%s)", d.flowName, d.Summary().Status)
				}
			}
			switch {
			case failed != "":
				cancel, reasons = append(cancel, ex), append(reasons, failed)
			case ready && next == nil && (m.MaxParallel <= 0 || m.runningLocked() < m.MaxParallel):
				next = ex
			default:
				keep = append(keep, ex)
			}
		}
		m.queue = keep
		m.mu.Unlock()
		for i, ex := range cancel {
			ex.Abort(reasons[i])
		}
		if next == nil {
			return
		}
		if len(next.waitFor) > 0 {
			next.addBulletin("info", "", "", "dependencies completed; starting")
		} else {
			next.addBulletin("info", "", "", "slot free; starting")
		}
		next.Start()
	}
}

// RunAllResult reports what RunAll did per flow.
type RunAllResult struct {
	Started []model.RunSummary `json:"started"`
	Skipped []SkippedFlow      `json:"skipped"`
}

type SkippedFlow struct {
	FlowID string `json:"flowId"`
	Name   string `json:"name"`
	Reason string `json:"reason"`
}

// RunAll starts every flow (or the given ones) in dependency order. Listed
// flows pull in their prerequisites whose latest run is not completed; a
// completed prerequisite counts as satisfied. Each run waits (pending) until
// the runs it depends on complete, and is stopped if one of them doesn't.
// With resume, a flow whose latest run was stopped or failed continues it.
// Flows with an active run are reused as prerequisites, never restarted.
func (m *Manager) RunAll(ctx context.Context, flowIDs []string, resume bool, actor string) (RunAllResult, error) {
	res := RunAllResult{Started: []model.RunSummary{}, Skipped: []SkippedFlow{}}
	flows, err := m.Store.ListFlows(ctx)
	if err != nil {
		return res, err
	}
	byID := map[string]model.Flow{}
	for _, f := range flows {
		byID[f.ID] = f
	}
	latest := func(id string) (model.RunSummary, bool) {
		runs, _ := m.Store.ListRuns(ctx, id, 1)
		if len(runs) == 0 {
			return model.RunSummary{}, false
		}
		return runs[0], true
	}
	want := map[string]bool{}
	var add func(id string, explicit bool)
	add = func(id string, explicit bool) {
		if want[id] {
			return
		}
		f, ok := byID[id]
		if !ok {
			return
		}
		if !explicit {
			if r, ok := latest(id); ok && r.Status == model.RunCompleted {
				return
			}
		}
		want[id] = true
		for _, d := range f.DependsOn {
			add(d, false)
		}
	}
	if len(flowIDs) == 0 {
		for _, f := range flows {
			add(f.ID, true)
		}
	} else {
		for _, id := range flowIDs {
			if _, ok := byID[id]; !ok {
				return res, fmt.Errorf("flow %s not found", id)
			}
			add(id, true)
		}
	}
	order, err := DependencyOrder(flows, want)
	if err != nil {
		return res, err
	}

	activeByFlow := map[string]*Executor{}
	m.mu.Lock()
	for _, ex := range m.active {
		activeByFlow[ex.run.FlowID] = ex
	}
	m.mu.Unlock()

	started := map[string]*Executor{}
	failed := map[string]string{}
	for _, id := range order {
		f := byID[id]
		var waitFor []*Executor
		blocked := ""
		for _, d := range f.DependsOn {
			if !want[d] {
				continue // already satisfied
			}
			if ex := started[d]; ex != nil {
				waitFor = append(waitFor, ex)
			} else if reason, bad := failed[d]; bad {
				blocked = fmt.Sprintf("dependency %q was not started: %s", byID[d].Name, reason)
			}
		}
		if ex := activeByFlow[id]; ex != nil {
			started[id] = ex
			res.Skipped = append(res.Skipped, SkippedFlow{FlowID: id, Name: f.Name, Reason: "flow already has an active run"})
			continue
		}
		if blocked != "" {
			failed[id] = blocked
			res.Skipped = append(res.Skipped, SkippedFlow{FlowID: id, Name: f.Name, Reason: blocked})
			continue
		}
		cont := false
		if resume {
			if r, ok := latest(id); ok && (r.Status == model.RunStopped || r.Status == model.RunFailed) {
				cont = true
			}
		}
		ex, err := m.startRun(ctx, id, cont, actor, waitFor)
		if err != nil {
			reason := strings.TrimPrefix(err.Error(), ErrConflict.Error()+": ")
			failed[id] = reason
			res.Skipped = append(res.Skipped, SkippedFlow{FlowID: id, Name: f.Name, Reason: reason})
			continue
		}
		started[id] = ex
		res.Started = append(res.Started, ex.Summary())
	}
	return res, nil
}

// DependencyOrder topologically sorts the selected flows (dependencies
// first), returning an error naming the flows on a cycle.
func DependencyOrder(flows []model.Flow, include map[string]bool) ([]string, error) {
	deps := map[string][]string{}
	names := map[string]string{}
	for _, f := range flows {
		names[f.ID] = f.Name
		if include == nil || include[f.ID] {
			deps[f.ID] = f.DependsOn
		}
	}
	state := map[string]int{}
	var order []string
	var stack []string
	var visit func(id string) error
	visit = func(id string) error {
		switch state[id] {
		case 1:
			j := len(stack) - 1
			for j > 0 && stack[j] != id {
				j--
			}
			var cyc []string
			for _, x := range stack[j:] {
				cyc = append(cyc, names[x])
			}
			return fmt.Errorf("flow dependencies form a cycle: %s → %s", strings.Join(cyc, " → "), names[id])
		case 2:
			return nil
		}
		state[id] = 1
		stack = append(stack, id)
		for _, d := range deps[id] {
			if _, ok := deps[d]; ok {
				if err := visit(d); err != nil {
					return err
				}
			}
		}
		stack = stack[:len(stack)-1]
		state[id] = 2
		order = append(order, id)
		return nil
	}
	ids := make([]string, 0, len(deps))
	for _, f := range flows {
		if _, ok := deps[f.ID]; ok {
			ids = append(ids, f.ID)
		}
	}
	for _, id := range ids {
		if err := visit(id); err != nil {
			return nil, err
		}
	}
	return order, nil
}

// StopRuns stops every active or queued run (optionally only some flows).
func (m *Manager) StopRuns(flowIDs []string, actor string) []model.RunSummary {
	want := map[string]bool{}
	for _, id := range flowIDs {
		want[id] = true
	}
	m.mu.Lock()
	var list []*Executor
	for _, ex := range m.active {
		if len(want) == 0 || want[ex.run.FlowID] {
			list = append(list, ex)
		}
	}
	m.mu.Unlock()
	out := []model.RunSummary{}
	for _, ex := range list {
		ex.Stop(actor)
		out = append(out, ex.Summary())
	}
	return out
}

// Active returns a live executor.
func (m *Manager) Active(runID string) (*Executor, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	ex, ok := m.active[runID]
	return ex, ok
}

// ActiveRuns lists running and paused runs.
func (m *Manager) ActiveRuns() []model.RunSummary {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []model.RunSummary{}
	for _, ex := range m.active {
		out = append(out, ex.Summary())
	}
	return out
}

// Detail returns live detail for active runs, the stored snapshot otherwise.
func (m *Manager) Detail(ctx context.Context, runID string) (model.RunDetail, error) {
	if ex, ok := m.Active(runID); ok {
		return ex.Detail(), nil
	}
	r, err := m.Store.GetRun(ctx, runID)
	if err != nil {
		return model.RunDetail{}, err
	}
	d, err := m.Store.RunDetail(ctx, runID)
	if err != nil {
		return model.RunDetail{}, err
	}
	d.RunSummary = r
	if d.Nodes == nil {
		d.Nodes = []model.NodeStats{}
	}
	if d.Edges == nil {
		d.Edges = []model.EdgeStats{}
	}
	if d.Tables == nil {
		d.Tables = []model.TableProgress{}
	}
	return *d, nil
}

// StopAll stops every active run and waits for them (graceful shutdown).
func (m *Manager) StopAll(ctx context.Context) {
	m.mu.Lock()
	list := make([]*Executor, 0, len(m.active))
	for _, ex := range m.active {
		list = append(list, ex)
	}
	m.mu.Unlock()
	for _, ex := range list {
		ex.Stop("")
	}
	for _, ex := range list {
		select {
		case <-ex.Done():
		case <-ctx.Done():
			return
		}
	}
}

func hasErrors(issues []model.Issue) bool {
	for _, i := range issues {
		if i.Level == "error" {
			return true
		}
	}
	return false
}

func by(actor string) string {
	if actor == "" {
		return ""
	}
	return " by " + actor
}
