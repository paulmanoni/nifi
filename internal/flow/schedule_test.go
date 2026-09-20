package flow

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
	"github.com/paulmanoni/nifi/record"
)

type emptySource struct{}

func (emptySource) Tables(context.Context) ([]string, error) { return []string{"t"}, nil }

func (emptySource) Sample(context.Context, string, int) (*record.Batch, error) {
	return &record.Batch{Table: "t"}, nil
}

func (emptySource) Run(context.Context, Emitter) error { return nil }

// A due flow is started once; the fire is recorded so the next tick does not
// start it again, and a flow whose previous run is still going is skipped.
func TestSchedulerFires(t *testing.T) {
	ctx := context.Background()
	st, err := store.Open(filepath.Join(t.TempDir(), "s.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	register(&Spec{Type: "test.sched.src", Label: "Test source", Category: "Source", Relationships: []string{"success"},
		build: func(*model.Node, Config, *Runtime) (any, error) { return emptySource{}, nil }})
	g := &model.Graph{Nodes: []model.Node{
		{ID: "s", Type: "test.sched.src", Name: "Source", Config: map[string]any{}},
		{ID: "d", Type: "sink.discard", Name: "Discard", Config: map[string]any{}},
	}, Edges: []model.Edge{{ID: "e", From: "s", FromPort: "success", To: "d"}}}
	f, err := st.SaveFlow(ctx, model.Flow{Name: "nightly", Graph: g})
	if err != nil {
		t.Fatal(err)
	}
	if err := st.SetSchedule(ctx, f.ID, "@every 1m", true); err != nil {
		t.Fatal(err)
	}
	// last fired two minutes ago, so it is due
	if err := st.MarkFired(ctx, f.ID, time.Now().Add(-2*time.Minute)); err != nil {
		t.Fatal(err)
	}

	m := NewManager(st, nil, 0)
	s := NewScheduler(m)
	s.logger = nil
	s.check(ctx, time.Now())

	runs, err := st.ListRuns(ctx, f.ID, 10)
	if err != nil || len(runs) != 1 {
		t.Fatalf("expected one run, got %d (%v)", len(runs), err)
	}
	saved, _ := st.GetFlow(ctx, f.ID)
	if saved.LastFire == nil || time.Since(*saved.LastFire) > time.Minute {
		t.Fatalf("fire not recorded: %s", saved.LastFire)
	}
	if next := NextRun(saved, time.Now()); next == nil || next.Before(time.Now()) {
		t.Fatalf("next run: %v", next)
	}

	// not due any more
	s.check(ctx, time.Now())
	if runs, _ := st.ListRuns(ctx, f.ID, 10); len(runs) != 1 {
		t.Fatalf("started again: %d runs", len(runs))
	}

	// disabled schedules never fire
	st.SetSchedule(ctx, f.ID, "@every 1m", false)
	st.MarkFired(ctx, f.ID, time.Now().Add(-2*time.Minute))
	s.check(ctx, time.Now())
	if runs, _ := st.ListRuns(ctx, f.ID, 10); len(runs) != 1 {
		t.Fatalf("disabled schedule fired: %d runs", len(runs))
	}
	if next := NextRun(saved, time.Now()); next != nil {
		saved.ScheduleEnabled = false
		if n := NextRun(saved, time.Now()); n != nil {
			t.Fatalf("disabled flow reports a next run: %v", n)
		}
	}
}
