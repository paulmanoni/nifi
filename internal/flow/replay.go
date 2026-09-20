package flow

import (
	"context"
	"fmt"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/script"
	"github.com/paulmanoni/nifi/record"
	"sort"
)

// Replaying dead letters. A row that failed is kept with the node that
// failed on it and why; replaying feeds those rows back into that node and
// lets them travel the rest of the flow, so a fix can be checked against the
// rows that actually broke rather than the whole table.
//
// The replay is a run of its own: it shows up in the history, writes to the
// same targets, and can itself produce dead letters.

func init() {
	register(&Spec{
		Type: "source.replay", Label: "Replay", Category: "Source", Icon: "rotate-ccw",
		Description:   "Feeds dead-lettered rows of an earlier run back into the flow.",
		Relationships: []string{"success"}, Hidden: true,
		Properties: []Property{
			{Key: "run", Label: "Run", Kind: "string", Required: true},
			{Key: "node", Label: "Node", Kind: "string", Required: true},
			{Key: "ids", Label: "Dead letter ids", Kind: "string", Help: "Comma-separated; empty = every dead letter of that node."},
		},
		build: func(_ *model.Node, cfg Config, rt *Runtime) (any, error) {
			// Validation builds nodes without a store; such an instance simply
			// has nothing to replay.
			return &replaySource{rt: rt, run: cfg.String("run"), node: cfg.String("node"), ids: cfg.Strings("ids")}, nil
		},
	})
}

type replaySource struct {
	rt   *Runtime
	run  string
	node string
	ids  []string
}

func (r *replaySource) load(ctx context.Context) ([]model.DeadLetter, error) {
	if r.rt == nil || r.rt.Store == nil {
		return nil, nil
	}
	_, all, err := r.rt.Store.ListDeadLetters(ctx, r.run, "", 0, 100000)
	if err != nil {
		return nil, err
	}
	want := map[string]bool{}
	for _, id := range r.ids {
		want[id] = true
	}
	out := make([]model.DeadLetter, 0, len(all))
	for _, d := range all {
		if d.NodeID != r.node {
			continue
		}
		if len(want) > 0 && !want[fmt.Sprint(d.ID)] {
			continue
		}
		out = append(out, d)
	}
	return out, nil
}

func (r *replaySource) Tables(ctx context.Context) ([]string, error) {
	items, err := r.load(ctx)
	if err != nil {
		return nil, err
	}
	seen := map[string]bool{}
	out := []string{}
	for _, d := range items {
		if !seen[d.Table] {
			seen[d.Table] = true
			out = append(out, d.Table)
		}
	}
	return out, nil
}

func (r *replaySource) Sample(ctx context.Context, table string, limit int) (*record.Batch, error) {
	items, err := r.load(ctx)
	if err != nil {
		return nil, err
	}
	batches := toBatches(items, limit)
	for _, b := range batches {
		if table == "" || b.Table == table {
			return b, nil
		}
	}
	return &record.Batch{Table: table}, nil
}

func (r *replaySource) Run(ctx context.Context, out Emitter) error {
	items, err := r.load(ctx)
	if err != nil {
		return err
	}
	if len(items) == 0 {
		r.rt.Bulletin("warn", "", "", "nothing to replay: those dead letters are gone")
		return nil
	}
	for _, b := range toBatches(items, 0) {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		r.rt.Progress().Table(b.Table).add(func(t *model.TableProgress) { t.RowsRead += int64(len(b.Rows)) })
		out.Emit("success", b)
	}
	return nil
}

// toBatches turns stored rows back into batches, one per table. Columns are
// the union of the rows' keys, so a row that lost a column still travels.
func toBatches(items []model.DeadLetter, limit int) []*record.Batch {
	byTable := map[string][]model.DeadLetter{}
	var order []string
	for _, d := range items {
		if _, ok := byTable[d.Table]; !ok {
			order = append(order, d.Table)
		}
		byTable[d.Table] = append(byTable[d.Table], d)
	}
	var out []*record.Batch
	for _, table := range order {
		rows := byTable[table]
		if limit > 0 && len(rows) > limit {
			rows = rows[:limit]
		}
		names := map[string]bool{}
		for _, d := range rows {
			for k := range d.Row {
				names[k] = true
			}
		}
		cols := make([]string, 0, len(names))
		for k := range names {
			cols = append(cols, k)
		}
		sort.Strings(cols)
		b := &record.Batch{Table: table, Source: table}
		typed := make([]bool, len(cols))
		b.Columns = make([]record.Column, len(cols))
		for i, c := range cols {
			b.Columns[i] = record.Column{Name: c, Type: record.Text, Nullable: true}
		}
		for _, d := range rows {
			row := make([]any, len(cols))
			for i, c := range cols {
				v := d.Row[c]
				row[i] = v
				if v != nil && !typed[i] {
					typed[i] = true
					b.Columns[i] = script.InferColumn(c, v)
					b.Columns[i].Nullable = true
				}
			}
			b.Rows = append(b.Rows, row)
		}
		out = append(out, b)
	}
	return out
}

// ReplayDeadLetters starts a run that feeds the dead letters of nodeID back
// into that node and on through the rest of the flow. ids empty replays all
// of that node's dead letters.
func (m *Manager) ReplayDeadLetters(ctx context.Context, runID, nodeID string, ids []string, actor string) (model.RunSummary, error) {
	old, err := m.Store.GetRun(ctx, runID)
	if err != nil {
		return model.RunSummary{}, err
	}
	g0, err := m.Store.RunGraph(ctx, runID)
	if err != nil {
		return model.RunSummary{}, err
	}
	if g0 == nil {
		return model.RunSummary{}, fmt.Errorf("that run did not keep its flow")
	}
	n := g0.Node(nodeID)
	if n == nil {
		return model.RunSummary{}, fmt.Errorf("that run has no node %q", nodeID)
	}
	total, _, err := m.Store.ListDeadLetters(ctx, runID, "", 0, 1)
	if err != nil {
		return model.RunSummary{}, err
	}
	if total == 0 {
		return model.RunSummary{}, fmt.Errorf("%w: that run has no dead letters", ErrConflict)
	}

	g := replayGraph(g0, nodeID, runID, ids)
	run, err := m.Store.CreateRun(ctx, old.FlowID, g)
	if err != nil {
		return model.RunSummary{}, err
	}
	ex, err := m.launch(ctx, run, g, fmt.Sprintf("Replay · %s", n.Name), actor)
	if err != nil {
		return model.RunSummary{}, err
	}
	what := "every dead letter"
	if len(ids) > 0 {
		what = fmt.Sprintf("%d dead letter(s)", len(ids))
	}
	ex.addBulletin("info", nodeID, "", fmt.Sprintf("replaying %s of %s from run %s", what, n.Name, runID))
	return ex.Summary(), nil
}

// replayGraph keeps nodeID and everything downstream of it, and feeds it
// from a replay source instead of its original inputs.
func replayGraph(g *model.Graph, nodeID, runID string, ids []string) *model.Graph {
	keep := map[string]bool{nodeID: true}
	var walk func(id string)
	walk = func(id string) {
		for _, e := range g.Edges {
			if e.From == id && !keep[e.To] {
				keep[e.To] = true
				walk(e.To)
			}
		}
	}
	walk(nodeID)

	out := &model.Graph{}
	src := model.Node{ID: "replay_src", Type: "source.replay", Name: "Replayed rows",
		Position: model.Position{X: 40, Y: 120},
		Config:   map[string]any{"run": runID, "node": nodeID, "ids": joinIDs(ids)}}
	out.Nodes = append(out.Nodes, src)
	for _, n := range g.Nodes {
		if keep[n.ID] {
			out.Nodes = append(out.Nodes, n)
		}
	}
	out.Edges = append(out.Edges, model.Edge{ID: "replay_edge", From: src.ID, FromPort: "success", To: nodeID})
	for _, e := range g.Edges {
		if keep[e.From] && keep[e.To] {
			out.Edges = append(out.Edges, e)
		}
	}
	return out
}

func joinIDs(ids []string) string {
	s := ""
	for i, id := range ids {
		if i > 0 {
			s += ","
		}
		s += id
	}
	return s
}
