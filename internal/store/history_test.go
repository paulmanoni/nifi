package store_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/paulmanoni/nifi/internal/dbx"
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

// A connection's password is write-only from the API's side, so the rule that
// an edit omitting it keeps the stored one has to be held here.
func TestConnectionPasswordSurvivesAnEditThatOmitsIt(t *testing.T) {
	ctx := context.Background()
	st, err := store.Open(filepath.Join(t.TempDir(), "c.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()

	c := dbx.Connection{ID: "wh", Name: "Warehouse", Driver: "postgres", Host: "localhost",
		Port: 5432, User: "app", Password: "s3cret", Database: "wh", Params: map[string]string{"sslmode": "disable"}}
	if err := st.SaveConnection(ctx, c); err != nil {
		t.Fatal(err)
	}

	// An edit that changes the host and says nothing about the password.
	c2 := c
	c2.Password = ""
	c2.Host = "elsewhere"
	if err := st.SaveConnection(ctx, c2); err != nil {
		t.Fatal(err)
	}

	got, err := st.GetConnection(ctx, "wh")
	if err != nil {
		t.Fatal(err)
	}
	if got.Password != "s3cret" {
		t.Errorf("password is %q; an edit that did not mention it should have kept it", got.Password)
	}
	if got.Host != "elsewhere" {
		t.Errorf("host is %q; the edit should have applied", got.Host)
	}
	if got.Params["sslmode"] != "disable" {
		t.Errorf("params came back as %v", got.Params)
	}

	// And an edit that does give one replaces it.
	c3 := c
	c3.Password = "rotated"
	if err := st.SaveConnection(ctx, c3); err != nil {
		t.Fatal(err)
	}
	if got, _ := st.GetConnection(ctx, "wh"); got.Password != "rotated" {
		t.Errorf("password is %q; want the new one", got.Password)
	}
}
