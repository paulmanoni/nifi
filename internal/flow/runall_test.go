package flow

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
)

func TestRunAllQueuesAndSharesPools(t *testing.T) {
	if os.Getenv("NIFI_TEST_PG") == "" {
		t.Skip("set NIFI_TEST_PG=1")
	}
	ctx := context.Background()
	st, err := store.Open(filepath.Join(t.TempDir(), "n.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	m := NewManager(st, func(_ context.Context, id string) (dbx.Connection, error) { return conns[id], nil }, 0)
	m.MaxParallel = 2
	pg, _ := dbx.OpenPG(ctx, conns["tgt"], 2)
	defer pg.Close()
	flow := func(name, table string) string {
		pg.Pool.Exec(ctx, "DROP SCHEMA IF EXISTS "+name+" CASCADE")
		f, _ := st.SaveFlow(ctx, model.Flow{Name: name, Graph: &model.Graph{
			Nodes: []model.Node{
				{ID: "s", Type: "source.tables", Name: "s", Config: map[string]any{"connection": "src", "tables": []any{table}}},
				{ID: "d", Type: "sink.postgres", Name: "d", Config: map[string]any{"connection": "tgt", "schema": name}},
			},
			Edges: []model.Edge{{ID: "e", From: "s", FromPort: "success", To: "d"}},
		}})
		return f.ID
	}
	ids := []string{flow("ra_a", "users"), flow("ra_b", "orders"), flow("ra_c", "tags"), flow("ra_d", "logs")}
	defer func() {
		for _, s := range []string{"ra_a", "ra_b", "ra_c", "ra_d"} {
			pg.Pool.Exec(ctx, "DROP SCHEMA IF EXISTS "+s+" CASCADE")
		}
	}()

	res, err := m.RunAll(ctx, ids, false, "tester")
	if err != nil || len(res.Started) != 4 || len(res.Skipped) != 0 {
		t.Fatalf("run all: %v %+v", err, res)
	}
	pending := 0
	for _, r := range res.Started {
		if r.Status == model.RunPending {
			pending++
		}
	}
	if pending != 2 {
		t.Fatalf("want 2 queued runs with MaxParallel=2, got %d", pending)
	}
	// Stopping a queued run finishes it without executing.
	var queued model.RunSummary
	for _, r := range res.Started {
		if r.Status == model.RunPending {
			queued = r
		}
	}
	m.StopRuns([]string{queued.FlowID}, "tester")
	var rest []string
	for _, id := range ids {
		if id != queued.FlowID {
			rest = append(rest, id)
		}
	}
	again, _ := m.RunAll(ctx, rest, false, "tester")
	if len(again.Started) != 0 || len(again.Skipped) != 3 {
		t.Fatalf("second run-all should skip the 3 active flows: %+v", again)
	}

	deadline := time.Now().Add(2 * time.Minute)
	for len(m.ActiveRuns()) > 0 && time.Now().Before(deadline) {
		time.Sleep(100 * time.Millisecond)
	}
	for _, r := range res.Started {
		d, _ := m.Detail(ctx, r.ID)
		want := model.RunCompleted
		if r.ID == queued.ID {
			want = model.RunStopped
		}
		if d.Status != want {
			t.Errorf("run %s: %s (%s), want %s", r.ID, d.Status, d.Error, want)
		}
	}
	m.poolMu.Lock()
	open := len(m.pools)
	m.poolMu.Unlock()
	if open != 0 {
		t.Errorf("%d shared pools still open after all runs ended", open)
	}
}

func TestFlowDependencies(t *testing.T) {
	if os.Getenv("NIFI_TEST_PG") == "" {
		t.Skip("set NIFI_TEST_PG=1")
	}
	ctx := context.Background()
	st, _ := store.Open(filepath.Join(t.TempDir(), "n.db"))
	defer st.Close()
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	m := NewManager(st, func(_ context.Context, id string) (dbx.Connection, error) { return conns[id], nil }, 0)
	pg, _ := dbx.OpenPG(ctx, conns["tgt"], 2)
	defer pg.Close()
	pg.Pool.Exec(ctx, "DROP SCHEMA IF EXISTS deps CASCADE")
	defer pg.Pool.Exec(ctx, "DROP SCHEMA IF EXISTS deps CASCADE")
	mk := func(name, table string, create bool, deps ...string) string {
		f, _ := st.SaveFlow(ctx, model.Flow{Name: name, DependsOn: deps, Graph: &model.Graph{
			Nodes: []model.Node{
				{ID: "s", Type: "source.tables", Name: "s", Config: map[string]any{"connection": "src", "tables": []any{table}}},
				{ID: "d", Type: "sink.postgres", Name: "d", Config: map[string]any{"connection": "tgt", "schema": "deps", "create_tables": create}},
			},
			Edges: []model.Edge{{ID: "e", From: "s", FromPort: "success", To: "d"}},
		}})
		return f.ID
	}
	a := mk("A users", "users", true)
	b := mk("B orders", "orders", true, a)
	c := mk("C tags", "tags", true, b)
	bad := mk("E broken", "logs", false) // target table missing and creation disabled → fails
	d := mk("D after broken", "tags", true, bad)

	// Running C alone pulls in B and A first.
	run, res, err := m.StartWithDependencies(ctx, c, false, "t")
	if err != nil || len(res.Started) != 3 || run.Status != model.RunPending {
		t.Fatalf("start C with deps: %v %+v %+v", err, res, run)
	}
	for len(m.ActiveRuns()) > 0 {
		time.Sleep(50 * time.Millisecond)
	}
	var finished []time.Time
	for _, r := range res.Started {
		dt, _ := m.Detail(ctx, r.ID)
		if dt.Status != model.RunCompleted {
			t.Fatalf("%s: %s %s", r.FlowID, dt.Status, dt.Error)
		}
		full, _ := st.GetRun(ctx, r.ID)
		finished = append(finished, *full.FinishedAt)
	}
	if !(finished[0].Before(finished[1]) && finished[1].Before(finished[2])) {
		t.Errorf("runs did not finish in dependency order: %v", finished)
	}

	// Satisfied prerequisites are not re-run; a failing one stops dependents.
	res, err = m.RunAll(ctx, []string{b, d}, false, "t")
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Started) != 3 { // B, E, D (A is completed → satisfied)
		t.Fatalf("started %d: %+v", len(res.Started), res)
	}
	for len(m.ActiveRuns()) > 0 {
		time.Sleep(50 * time.Millisecond)
	}
	for _, r := range res.Started {
		dt, _ := m.Detail(ctx, r.ID)
		switch r.FlowID {
		case bad:
			if dt.Status != model.RunFailed {
				t.Errorf("E: %s", dt.Status)
			}
		case d:
			if dt.Status != model.RunStopped || dt.Error == "" {
				t.Errorf("D should be stopped by its failed dependency: %s %q", dt.Status, dt.Error)
			}
		case b:
			if dt.Status != model.RunCompleted {
				t.Errorf("B: %s", dt.Status)
			}
		}
	}

	// Cycles are rejected.
	flows, _ := st.ListFlows(ctx)
	for i := range flows {
		if flows[i].ID == a {
			flows[i].DependsOn = []string{c}
		}
	}
	if _, err := DependencyOrder(flows, nil); err == nil {
		t.Error("cycle A→C→B→A not detected")
	} else if msg := err.Error(); !strings.HasSuffix(msg, "C tags → B orders → A users → C tags") {
		t.Errorf("cycle message: %s", msg)
	}

	// A resumed run waiting on a prerequisite reports pending, not stopped.
	for i := range flows {
		if flows[i].ID == a {
			flows[i].DependsOn = nil
		}
	}
	m.MaxParallel = 1
	defer func() { m.MaxParallel = 0 }()
	res, _ = m.RunAll(ctx, []string{a, b, c}, false, "t")
	m.StopRuns(nil, "t")
	for len(m.ActiveRuns()) > 0 {
		time.Sleep(50 * time.Millisecond)
	}
	res, _ = m.RunAll(ctx, []string{a, b, c}, true, "t")
	for _, r := range res.Started {
		if r.FlowID == c && r.Status != model.RunPending {
			t.Errorf("waiting resumed run status %s, want pending", r.Status)
		}
	}
	for len(m.ActiveRuns()) > 0 {
		time.Sleep(50 * time.Millisecond)
	}
}
