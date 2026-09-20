package flow_test

import (
	"context"
	"testing"

	"github.com/paulmanoni/nifi/internal/flow"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

type collector struct{ out map[string][]*record.Batch }

func (c *collector) Emit(port string, b *record.Batch) {
	if c.out == nil {
		c.out = map[string][]*record.Batch{}
	}
	c.out[port] = append(c.out[port], b)
}

func (c *collector) ops(port string) []record.Op {
	var got []record.Op
	for _, b := range c.out[port] {
		for i := range b.Rows {
			got = append(got, b.Op(i))
		}
	}
	return got
}

// changeBatch is three rows whose middle one was deleted at the source.
func changeBatch() *record.Batch {
	b := &record.Batch{Table: "users", Source: "users",
		Meta:    &record.TableMeta{Name: "users", PrimaryKey: []string{"id"}},
		Columns: []record.Column{{Name: "id", Type: record.Int64}, {Name: "name", Type: record.Text}}}
	b.Append([]any{int64(1), "ann"}, record.Insert)
	b.Append([]any{int64(2), "bo"}, record.Delete)
	b.Append([]any{int64(3), "cy"}, record.Update)
	return b
}

func process(t *testing.T, n *model.Node, b *record.Batch) *collector {
	t.Helper()
	impl, err := flow.Build(n, flow.NewPreviewRuntime(nil))
	if err != nil {
		t.Fatalf("build %s: %v", n.Type, err)
	}
	p, ok := impl.(flow.Processor)
	if !ok {
		t.Fatalf("%s is not a processor", n.Type)
	}
	c := &collector{}
	if err := p.Process(context.Background(), b, c); err != nil {
		t.Fatalf("process %s: %v", n.Type, err)
	}
	return c
}

func eq(t *testing.T, what string, got, want []record.Op) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("%s: got %v, want %v", what, got, want)
	}
	for i := range got {
		if got[i] != want[i] {
			t.Fatalf("%s: got %v, want %v", what, got, want)
		}
	}
}

// A row's operation has to survive every node it passes, or a delete would be
// written to the destination as an ordinary row.
func TestOperationsSurviveTransforms(t *testing.T) {
	t.Run("filter", func(t *testing.T) {
		c := process(t, &model.Node{ID: "f", Type: "transform.filter",
			Config: map[string]any{"condition": `id != 1`}}, changeBatch())
		eq(t, "matched", c.ops("matched"), []record.Op{record.Delete, record.Update})
		eq(t, "unmatched", c.ops("unmatched"), []record.Op{record.Insert})
	})

	t.Run("route", func(t *testing.T) {
		c := process(t, &model.Node{ID: "r", Type: "transform.route",
			Config: map[string]any{"rules": []any{map[string]any{"name": "high", "expr": `id > 1`}}}}, changeBatch())
		eq(t, "high", c.ops("high"), []record.Op{record.Delete, record.Update})
		eq(t, "unmatched", c.ops("unmatched"), []record.Op{record.Insert})
	})

	t.Run("compute", func(t *testing.T) {
		c := process(t, &model.Node{ID: "c", Type: "transform.compute",
			Config: map[string]any{"columns": []any{map[string]any{"column": "upper", "expr": `Upper(name)`}}}}, changeBatch())
		eq(t, "success", c.ops("success"), []record.Op{record.Insert, record.Delete, record.Update})
	})

	t.Run("select columns", func(t *testing.T) {
		c := process(t, &model.Node{ID: "p", Type: "transform.select",
			Config: map[string]any{"columns": []any{map[string]any{"name": "id", "expr": `id`}}}}, changeBatch())
		eq(t, "success", c.ops("success"), []record.Op{record.Insert, record.Delete, record.Update})
	})
}

// A batch of plain inserts must not start carrying per-row operations: that is
// every batch a bulk load produces.
func TestBulkBatchesCarryNoOperations(t *testing.T) {
	b := &record.Batch{Table: "users", Source: "users",
		Meta:    &record.TableMeta{Name: "users", PrimaryKey: []string{"id"}},
		Columns: []record.Column{{Name: "id", Type: record.Int64}, {Name: "name", Type: record.Text}},
		Rows:    [][]any{{int64(1), "ann"}, {int64(2), "bo"}}}
	c := process(t, &model.Node{ID: "f", Type: "transform.filter",
		Config: map[string]any{"condition": `id != 1`}}, b)
	got := c.out["matched"][0]
	if got.Ops != nil {
		t.Fatalf("a bulk batch grew an operations slice: %v", got.Ops)
	}
	if got.Changes() {
		t.Fatal("a bulk batch reports changes")
	}
}

func TestStreamingFlowIsLiveAndWantsApply(t *testing.T) {
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "s", Type: "source.changes", Name: "Changes",
				Config: map[string]any{"connection": "src", "tables": []any{"users"}}},
			{ID: "w", Type: "sink.postgres", Name: "Target",
				Config: map[string]any{"connection": "tgt", "mode": "merge"}},
		},
		Edges: []model.Edge{{ID: "e", From: "s", FromPort: "success", To: "w"}},
	}
	if !flow.Streaming(g) {
		t.Fatal("a flow with a change feed should be live")
	}
	var warned bool
	for _, i := range flow.Validate(g) {
		if i.NodeID == "w" && i.Level == "warning" {
			warned = true
		}
	}
	if !warned {
		t.Fatal("a live flow writing in merge mode should be warned about deletes")
	}

	g.Nodes[1].Config["apply_changes"] = true
	for _, i := range flow.Validate(g) {
		if i.NodeID == "w" && i.Level == "warning" {
			t.Fatalf("applying changes should not warn: %s", i.Message)
		}
	}
}
