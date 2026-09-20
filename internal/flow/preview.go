package flow

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

// Validate checks a graph without touching any database.
func Validate(g *model.Graph) []model.Issue {
	issues := []model.Issue{}
	if g == nil {
		return append(issues, model.Issue{Level: "error", Message: "empty flow"})
	}
	byID := map[string]*model.Node{}
	rt := NewPreviewRuntime(nil)
	sources, sinks := 0, 0
	for i := range g.Nodes {
		n := &g.Nodes[i]
		byID[n.ID] = n
		if n.Disabled {
			continue
		}
		spec, ok := SpecFor(n.Type)
		if !ok {
			issues = append(issues, model.Issue{NodeID: n.ID, Level: "error", Message: fmt.Sprintf("%s: unknown processor type %q", n.Name, n.Type)})
			continue
		}
		switch spec.Category {
		case "Source":
			sources++
		case "Sink":
			sinks++
		}
		if _, err := Build(n, rt); err != nil {
			issues = append(issues, model.Issue{NodeID: n.ID, Level: "error", Message: err.Error()})
		}
	}
	incoming := map[string]int{}
	for _, e := range g.Edges {
		from, to := byID[e.From], byID[e.To]
		if from == nil || to == nil {
			issues = append(issues, model.Issue{EdgeID: e.ID, Level: "error", Message: "connection points to a missing processor"})
			continue
		}
		if from.Disabled || to.Disabled {
			continue
		}
		incoming[e.To]++
		if spec, ok := SpecFor(to.Type); ok && spec.Inputs == 0 {
			issues = append(issues, model.Issue{EdgeID: e.ID, NodeID: to.ID, Level: "error", Message: fmt.Sprintf("%s is a source and cannot receive data", to.Name)})
		}
		if spec, ok := SpecFor(from.Type); ok {
			found := false
			for _, p := range Ports(spec, from) {
				found = found || p == e.FromPort
			}
			if !found {
				issues = append(issues, model.Issue{EdgeID: e.ID, NodeID: from.ID, Level: "error",
					Message: fmt.Sprintf("%s has no relationship %q", from.Name, e.FromPort)})
			}
		}
	}
	for i := range g.Nodes {
		n := &g.Nodes[i]
		if spec, ok := SpecFor(n.Type); ok && !n.Disabled && spec.Inputs > 0 && incoming[n.ID] == 0 {
			issues = append(issues, model.Issue{NodeID: n.ID, Level: "warning", Message: fmt.Sprintf("%s has no incoming connection", n.Name)})
		}
	}
	if sources == 0 {
		issues = append(issues, model.Issue{Level: "error", Message: "flow has no source"})
	}
	if sinks == 0 && sources > 0 {
		issues = append(issues, model.Issue{Level: "warning", Message: "flow has no sink: data is read but not written anywhere"})
	}
	issues = append(issues, streamingIssues(g)...)
	if cyc := findCycle(g); cyc != "" {
		issues = append(issues, model.Issue{NodeID: cyc, Level: "error", Message: "connections form a loop"})
	} else {
		issues = append(issues, duplicatePaths(g, byID)...)
	}
	return issues
}

// streamingIssues points out the settings a live flow needs that a one-off
// load does not: a destination told to apply changes rather than load rows,
// and a source whose deletes would otherwise be written as ordinary rows.
func streamingIssues(g *model.Graph) []model.Issue {
	if !Streaming(g) {
		return nil
	}
	var issues []model.Issue
	for i := range g.Nodes {
		n := &g.Nodes[i]
		if n.Disabled || n.Type != "sink.postgres" {
			continue
		}
		if !Config(n.Config).Bool("apply_changes", false) {
			issues = append(issues, model.Issue{NodeID: n.ID, Level: "warning", Message: fmt.Sprintf(
				"%s receives a change feed but is not set to apply changes: rows deleted at the source would be left behind. Turn on “Apply changes from a feed”.",
				n.Name)})
		}
	}
	return issues
}

// duplicatePaths warns when a node receives the same source's rows over more
// than one connection path (e.g. a leftover direct edge next to one through a
// Lookup): every row would then be processed — and written — twice.
func duplicatePaths(g *model.Graph, byID map[string]*model.Node) []model.Issue {
	in := map[string][]model.Edge{}
	for _, e := range g.Edges {
		if n := byID[e.To]; n != nil && !n.Disabled {
			if f := byID[e.From]; f != nil && !f.Disabled {
				in[e.To] = append(in[e.To], e)
			}
		}
	}
	// sources reaching a node, with the table filter along the way (nil = all)
	type reach struct {
		source string
		tables []string // nil = unrestricted
	}
	memo := map[string][]reach{}
	var reaches func(id string) []reach
	reaches = func(id string) []reach {
		if r, ok := memo[id]; ok {
			return r
		}
		memo[id] = nil // cycle guard (cycles are reported separately)
		var out []reach
		if spec, ok := SpecFor(byID[id].Type); ok && spec.Inputs == 0 {
			out = append(out, reach{source: id})
		}
		for _, e := range in[id] {
			for _, r := range reaches(e.From) {
				out = append(out, reach{source: r.source, tables: narrow(r.tables, edgeFilter(e))})
			}
		}
		memo[id] = out
		return out
	}
	var issues []model.Issue
	for id, edges := range in {
		if len(edges) < 2 {
			continue
		}
		type via struct {
			edge model.Edge
			r    reach
		}
		bySource := map[string][]via{}
		for _, e := range edges {
			for _, r := range reaches(e.From) {
				r.tables = narrow(r.tables, edgeFilter(e))
				bySource[r.source] = append(bySource[r.source], via{e, r})
			}
		}
		for src, vs := range bySource {
			for i := 0; i < len(vs); i++ {
				for j := i + 1; j < len(vs); j++ {
					if vs[i].edge.ID == vs[j].edge.ID || !overlap(vs[i].r.tables, vs[j].r.tables) {
						continue
					}
					issues = append(issues, model.Issue{NodeID: id, EdgeID: vs[j].edge.ID, Level: "warning",
						Message: fmt.Sprintf("%s receives rows from %s over two paths (from %s and from %s): each row is processed twice. Remove one connection, or limit the tables each carries.",
							byID[id].Name, byID[src].Name, byID[vs[i].edge.From].Name, byID[vs[j].edge.From].Name)})
					i, j = len(vs), len(vs) // one warning per source is enough
				}
			}
		}
	}
	sort.Slice(issues, func(a, b int) bool { return issues[a].Message < issues[b].Message })
	return issues
}

// edgeFilter returns a connection's table filter, nil meaning all tables.
func edgeFilter(e model.Edge) []string {
	if len(e.Tables) == 0 {
		return nil
	}
	return e.Tables
}

// narrow intersects two table filters: nil = all tables, a non-nil empty
// slice = no tables.
func narrow(a, b []string) []string {
	switch {
	case a == nil:
		return b
	case b == nil:
		return a
	}
	var out []string
	for _, x := range a {
		for _, y := range b {
			if strings.EqualFold(x, y) {
				out = append(out, x)
			}
		}
	}
	if out == nil {
		out = []string{} // non-nil empty: carries nothing
	}
	return out
}

func overlap(a, b []string) bool {
	n := narrow(a, b)
	return n == nil || len(n) > 0
}

func findCycle(g *model.Graph) string {
	adj := map[string][]string{}
	for _, e := range g.Edges {
		adj[e.From] = append(adj[e.From], e.To)
	}
	state := map[string]int{}
	var visit func(string) string
	visit = func(n string) string {
		state[n] = 1
		for _, m := range adj[n] {
			if state[m] == 1 {
				return m
			}
			if state[m] == 0 {
				if c := visit(m); c != "" {
					return c
				}
			}
		}
		state[n] = 2
		return ""
	}
	for _, n := range g.Nodes {
		if state[n.ID] == 0 {
			if c := visit(n.ID); c != "" {
				return c
			}
		}
	}
	return ""
}

// Stage is one node's output in a preview.
type Stage struct {
	NodeID  string
	Name    string
	Type    string
	Port    string
	Batch   *record.Batch
	RowErrs []RowErr
}

type RowErr struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

type collector struct {
	out map[string][]*record.Batch
}

func (c *collector) Emit(port string, b *record.Batch) {
	c.out[port] = append(c.out[port], b)
}

// Simulation is the result of pushing sample rows through part of a graph.
type Simulation struct {
	Table  string
	Tables []string
	Stages []Stage
	// Inputs are the batches arriving at the target node.
	Inputs []*record.Batch
	// Introduced maps a column to the node (name) that first produced it —
	// columns a script or compute step adds, or a rename creates.
	Introduced map[string]string
}

// Simulate runs sample rows of one table from the target's upstream sources
// through every node up to target. Nothing is written.
func Simulate(ctx context.Context, conns ConnectionResolver, g *model.Graph, target, table string, limit int) (*Simulation, error) {
	sm, err := NewSimulator(ctx, conns, g, target)
	if err != nil {
		return nil, err
	}
	defer sm.Close()
	return sm.Run(ctx, table, limit)
}

// Simulator builds the upstream pipeline of a node once and replays sample
// rows of any table through it (connections and compiled scripts reused).
type Simulator struct {
	g      *model.Graph
	target string
	rt     *Runtime
	up     map[string][]model.Edge
	order  []string
	built  map[string]any
	tables []string
	srcFor map[string]string
}

func (sm *Simulator) Close() { sm.rt.Close() }

// Tables lists the tables reaching the target.
func (sm *Simulator) Tables() []string { return sm.tables }

func NewSimulator(ctx context.Context, conns ConnectionResolver, g *model.Graph, target string) (*Simulator, error) {
	if g.Node(target) == nil {
		return nil, fmt.Errorf("node %s not found", target)
	}
	rt := NewPreviewRuntime(conns)
	sm := &Simulator{g: g, target: target, rt: rt, built: map[string]any{}, srcFor: map[string]string{}}
	ok := false
	defer func() {
		if !ok {
			rt.Close()
		}
	}()

	// Ancestors of target (inclusive) over enabled nodes.
	up := map[string][]model.Edge{}
	for _, e := range g.Edges {
		up[e.To] = append(up[e.To], e)
	}
	anc := map[string]bool{}
	var walk func(string)
	walk = func(id string) {
		if anc[id] {
			return
		}
		n := g.Node(id)
		if n == nil || n.Disabled {
			return
		}
		anc[id] = true
		for _, e := range up[id] {
			walk(e.From)
		}
	}
	walk(target)

	sm.up = up
	sm.order = topo(g, anc)
	for _, id := range sm.order {
		impl, err := Build(g.Node(id), rt)
		if err != nil {
			return nil, err
		}
		sm.built[id] = impl
	}
	for _, id := range sm.order {
		if s, ok := sm.built[id].(Source); ok {
			ts, err := s.Tables(ctx)
			if err != nil {
				return nil, fmt.Errorf("%s: %w", g.Node(id).Name, err)
			}
			for _, t := range ts {
				if _, dup := sm.srcFor[t]; !dup {
					sm.tables = append(sm.tables, t)
					sm.srcFor[t] = id
				}
			}
		}
	}
	ok = true
	return sm, nil
}

// Run pushes up to limit sample rows of table through the pipeline.
func (sm *Simulator) Run(ctx context.Context, table string, limit int) (*Simulation, error) {
	g, target, up, order, built, srcFor := sm.g, sm.target, sm.up, sm.order, sm.built, sm.srcFor
	sim := &Simulation{Tables: sm.tables, Introduced: map[string]string{}}
	if len(sim.Tables) == 0 {
		return sim, nil
	}
	if _, ok := srcFor[table]; table == "" || !ok {
		table = sim.Tables[0]
	}
	sim.Table = table

	outputs := map[string]map[string][]*record.Batch{}
	for _, id := range order {
		n := g.Node(id)
		spec, _ := SpecFor(n.Type)
		col := &collector{out: map[string][]*record.Batch{}}
		var inputs []*record.Batch
		if s, ok := built[id].(Source); ok {
			if srcFor[table] != id {
				continue
			}
			b, err := s.Sample(ctx, table, limit)
			if err != nil {
				return nil, fmt.Errorf("%s: %w", n.Name, err)
			}
			col.out["success"] = []*record.Batch{b}
		} else {
			for _, e := range up[id] {
				for _, b := range outputs[e.From][e.FromPort] {
					if e.Carries(b.Table) {
						inputs = append(inputs, cloneBatch(b))
					}
				}
			}
			if id == target {
				for _, b := range inputs {
					sim.Inputs = append(sim.Inputs, cloneBatch(b))
				}
			}
			for _, b := range inputs {
				if pv, ok := built[id].(Previewer); ok {
					o, err := pv.Preview(ctx, b)
					if err != nil {
						return nil, fmt.Errorf("%s: %w", n.Name, err)
					}
					col.out["success"] = append(col.out["success"], o)
					continue
				}
				p, ok := built[id].(Processor)
				if !ok {
					continue
				}
				if err := p.Process(ctx, b, col); err != nil {
					return nil, fmt.Errorf("%s: %w", n.Name, err)
				}
			}
		}
		// A node that can say what it emits is asked, rather than guessed at
		// from what came out: with an empty sample there is nothing to guess
		// from, and the columns downstream pickers offer would simply vanish.
		if sc, ok := built[id].(Schematic); ok {
			declareColumns(sc, inputs, col.out)
		}
		outputs[id] = col.out
		if _, isSrc := built[id].(Source); !isSrc {
			had := map[string]bool{}
			for _, b := range inputs {
				for _, c := range b.Columns {
					had[c.Name] = true
				}
			}
			for _, bs := range col.out {
				for _, b := range bs {
					for _, c := range b.Columns {
						if _, known := sim.Introduced[c.Name]; !had[c.Name] && !known {
							sim.Introduced[c.Name] = n.Name
						}
					}
				}
			}
		}
		ports := Ports(spec, n)
		if len(col.out["success"]) > 0 && !contains(ports, "success") {
			ports = append([]string{"success"}, ports...)
		}
		for _, port := range ports {
			bs := col.out[port]
			if len(bs) == 0 {
				continue
			}
			merged := mergeBatches(bs)
			if len(merged.Rows) == 0 && port != "success" && port != ports[0] {
				continue
			}
			st := Stage{NodeID: id, Name: n.Name, Type: n.Type, Port: port, Batch: cloneBatch(merged)}
			for i, e := range merged.Errors {
				if e != "" {
					st.RowErrs = append(st.RowErrs, RowErr{Row: i, Message: e})
				}
			}
			sim.Stages = append(sim.Stages, st)
		}
	}
	return sim, nil
}

func contains(xs []string, v string) bool {
	for _, x := range xs {
		if x == v {
			return true
		}
	}
	return false
}

// declareColumns fills in the schema of empty output batches from what the
// node says it emits. Batches that carry rows are left alone: the rows are
// the truth, and a node whose declaration disagreed with them would be a bug
// worth seeing rather than papering over.
func declareColumns(sc Schematic, inputs []*record.Batch, out map[string][]*record.Batch) {
	in := func(table string) []record.Column {
		for _, b := range inputs {
			if b.Table == table {
				return b.Columns
			}
		}
		if len(inputs) > 0 {
			return inputs[0].Columns
		}
		return nil
	}
	for port, bs := range out {
		if port == "failure" {
			continue // failure carries the input's rows, not the node's output
		}
		for _, b := range bs {
			if len(b.Rows) > 0 {
				continue
			}
			if cols, err := sc.Columns(in(b.Table)); err == nil && len(cols) > 0 {
				b.Columns = cols
			}
		}
	}
}

func mergeBatches(bs []*record.Batch) *record.Batch {
	if len(bs) == 1 {
		return bs[0]
	}
	m := bs[0].Derive()
	for _, b := range bs {
		if len(b.Columns) > len(m.Columns) {
			m.Columns = b.Columns
		}
		m.AppendAll(b)
		if b.Errors != nil {
			for len(m.Errors) < len(m.Rows)-len(b.Rows) {
				m.Errors = append(m.Errors, "")
			}
			m.Errors = append(m.Errors, b.Errors...)
		}
	}
	return m
}

// topo orders the selected nodes so upstream nodes come first.
func topo(g *model.Graph, include map[string]bool) []string {
	indeg := map[string]int{}
	adj := map[string][]string{}
	for id := range include {
		indeg[id] += 0
	}
	for _, e := range g.Edges {
		if include[e.From] && include[e.To] {
			adj[e.From] = append(adj[e.From], e.To)
			indeg[e.To]++
		}
	}
	var ready, out []string
	for id, d := range indeg {
		if d == 0 {
			ready = append(ready, id)
		}
	}
	sort.Strings(ready)
	for len(ready) > 0 {
		id := ready[0]
		ready = ready[1:]
		out = append(out, id)
		for _, m := range adj[id] {
			if indeg[m]--; indeg[m] == 0 {
				ready = append(ready, m)
			}
		}
	}
	return out
}

// InputSchema lists the schema arriving at a node, per table (sources: their
// output). maxTables bounds the work on very wide sources.
func InputSchema(ctx context.Context, conns ConnectionResolver, g *model.Graph, nodeID string, maxTables int) ([]model.TableSchema, error) {
	n := g.Node(nodeID)
	if n == nil {
		return nil, fmt.Errorf("node %s not found", nodeID)
	}
	first, err := Simulate(ctx, conns, g, nodeID, "", 3)
	if err != nil {
		return nil, err
	}
	spec, _ := SpecFor(n.Type)
	isSource := spec != nil && spec.Inputs == 0
	out := []model.TableSchema{}
	collect := func(sim *Simulation) {
		bs := sim.Inputs
		if isSource {
			for _, st := range sim.Stages {
				if st.NodeID == nodeID {
					bs = append(bs, st.Batch)
				}
			}
		}
		seen := map[string]bool{}
		for _, b := range bs {
			if seen[b.Table] {
				continue
			}
			seen[b.Table] = true
			out = append(out, model.TableSchema{Table: b.Table, Columns: b.Columns})
		}
	}
	collect(first)
	for i, t := range first.Tables {
		if i == 0 {
			continue
		}
		if i >= maxTables {
			break
		}
		sim, err := Simulate(ctx, conns, g, nodeID, t, 3)
		if err != nil {
			return out, err
		}
		collect(sim)
	}
	return out, nil
}
