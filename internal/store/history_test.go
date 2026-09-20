package store_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
)

// Every save is kept, and an earlier one can be read back and restored.
func TestFlowHistoryAndFolders(t *testing.T) {
	ctx := context.Background()
	st, err := store.Open(filepath.Join(t.TempDir(), "s.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()

	one := &model.Graph{Nodes: []model.Node{{ID: "a", Type: "sink.discard", Name: "One"}}}
	f, err := st.SaveFlow(ctx, model.Flow{Name: "history", Graph: one, Folder: "migrations/core"})
	if err != nil {
		t.Fatal(err)
	}
	if f.Version != 1 {
		t.Fatalf("first save is version %d", f.Version)
	}
	f.Graph = &model.Graph{Nodes: []model.Node{{ID: "a", Type: "sink.discard", Name: "Two"}, {ID: "b", Type: "sink.discard", Name: "Added"}}}
	f.Note, f.Actor = "added a node", "tester"
	if f, err = st.SaveFlow(ctx, f); err != nil || f.Version != 2 {
		t.Fatalf("second save: version %d (%v)", f.Version, err)
	}

	vs, err := st.ListVersions(ctx, f.ID)
	if err != nil || len(vs) != 2 || vs[0].Version != 2 || vs[0].Note != "added a node" || vs[0].Actor != "tester" {
		t.Fatalf("versions: %+v (%v)", vs, err)
	}
	old, err := st.GetVersion(ctx, f.ID, 1)
	if err != nil || len(old.Graph.Nodes) != 1 || old.Graph.Nodes[0].Name != "One" {
		t.Fatalf("version 1: %+v (%v)", old.Graph, err)
	}

	// folders group flows and move in bulk
	saved, _ := st.GetFlow(ctx, f.ID)
	if saved.Folder != "migrations/core" {
		t.Fatalf("folder %q", saved.Folder)
	}
	if err := st.SetFolder(ctx, []string{f.ID}, "archive"); err != nil {
		t.Fatal(err)
	}
	if saved, _ = st.GetFlow(ctx, f.ID); saved.Folder != "archive" {
		t.Fatalf("folder after move: %q", saved.Folder)
	}

	// deleting the flow takes its history with it
	if err := st.DeleteFlow(ctx, f.ID); err != nil {
		t.Fatal(err)
	}
	if vs, _ = st.ListVersions(ctx, f.ID); len(vs) != 0 {
		t.Fatalf("history survived the delete: %+v", vs)
	}
}
