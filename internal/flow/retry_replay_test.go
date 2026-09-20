package flow

import (
	"context"
	"fmt"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
	"github.com/paulmanoni/nifi/record"
)

// A connection can give the node another try before the run fails, and can
// keep the run going by dead-lettering the batch instead.
func TestConnectionRetryAndDeadLetter(t *testing.T) {
	attempts := &testAttempts
	register(&Spec{Type: "test.rows", Label: "Rows", Category: "Source", Relationships: []string{"success"}, Hidden: true,
		build: func(*model.Node, Config, *Runtime) (any, error) { return rowsSource{}, nil }})
	register(&Spec{Type: "test.flaky", Label: "Flaky", Category: "Transform", Relationships: []string{"success", "failure"}, Hidden: true,
		build: func(n *model.Node, cfg Config, _ *Runtime) (any, error) {
			return &flaky{failFirst: int64(cfg.Int("fail", 0))}, nil
		}})

	run := func(t *testing.T, fail int, retries int, onFailure string) (model.RunDetail, *store.Store, string) {
		t.Helper()
		attempts.Store(0)
		st, err := store.Open(filepath.Join(t.TempDir(), "s.db"))
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { st.Close() })
		g := &model.Graph{
			Nodes: []model.Node{
				{ID: "s", Type: "test.rows", Name: "Rows", Config: map[string]any{}},
				{ID: "f", Type: "test.flaky", Name: "Flaky", Config: map[string]any{"fail": float64(fail)}},
			},
			Edges: []model.Edge{{ID: "e", From: "s", FromPort: "success", To: "f",
				Retries: retries, RetryBackoff: "10ms", OnFailure: onFailure}},
		}
		f, _ := st.SaveFlow(context.Background(), model.Flow{Name: "retry", Graph: g})
		m := NewManager(st, nil, 0)
		r, err := m.Start(context.Background(), f.ID, false, "test")
		if err != nil {
			t.Fatal(err)
		}
		for i := 0; i < 200; i++ {
			d, _ := m.Detail(context.Background(), r.ID)
			if d.Status.Finished() {
				return d, st, r.ID
			}
			time.Sleep(20 * time.Millisecond)
		}
		t.Fatal("run did not finish")
		return model.RunDetail{}, nil, ""
	}

	// two failures, three retries allowed: the run completes on the third try
	d, _, _ := run(t, 2, 3, "")
	if d.Status != model.RunCompleted || attempts.Load() != 3 {
		t.Fatalf("status %s after %d attempts (%s)", d.Status, attempts.Load(), d.Error)
	}
	if d.Edges[0].Retried != 2 {
		t.Fatalf("retried %d times", d.Edges[0].Retried)
	}

	// always fails, no retries: the run fails
	d, _, _ = run(t, 99, 0, "")
	if d.Status != model.RunFailed {
		t.Fatalf("expected a failed run, got %s", d.Status)
	}

	// always fails, dead-letter on failure: the run completes and the rows are kept
	d, st, runID := run(t, 99, 1, "dead_letter")
	if d.Status != model.RunCompleted {
		t.Fatalf("expected the run to survive, got %s (%s)", d.Status, d.Error)
	}
	total, items, err := st.ListDeadLetters(context.Background(), runID, "", 0, 10)
	if err != nil || total != 3 {
		t.Fatalf("dead letters: %d (%v)", total, err)
	}
	if items[0].NodeID != "f" || items[0].Row["n"] == nil {
		t.Fatalf("dead letter: %+v", items[0])
	}

	// and they can be replayed into the node that failed
	m := NewManager(st, nil, 0)
	attempts.Store(0)
	rs, err := m.ReplayDeadLetters(context.Background(), runID, "f", nil, "test")
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 200; i++ {
		rd, _ := m.Detail(context.Background(), rs.ID)
		if rd.Status.Finished() {
			if attempts.Load() == 0 {
				t.Fatal("replay never reached the node")
			}
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("replay did not finish")
}

type rowsSource struct{}

func (rowsSource) Tables(context.Context) ([]string, error) { return []string{"t"}, nil }

func (rowsSource) Sample(context.Context, string, int) (*record.Batch, error) {
	return batchOf(3), nil
}

func (rowsSource) Run(_ context.Context, out Emitter) error {
	out.Emit("success", batchOf(3))
	return nil
}

func batchOf(n int) *record.Batch {
	b := &record.Batch{Table: "t", Source: "t", Columns: []record.Column{{Name: "n", Type: record.Int64}}}
	for i := 1; i <= n; i++ {
		b.Rows = append(b.Rows, []any{int64(i)})
	}
	return b
}

var testAttempts atomic.Int64

type flaky struct {
	failFirst int64
	seen      atomic.Int64
}

func (f *flaky) Process(_ context.Context, b *record.Batch, out Emitter) error {
	n := f.seen.Add(1)
	testAttempts.Add(1)
	if n <= f.failFirst {
		return fmt.Errorf("temporary trouble (attempt %d)", n)
	}
	out.Emit("success", b)
	return nil
}
