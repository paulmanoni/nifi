package flow

import (
	"sort"
	"strings"
	"testing"

	"github.com/paulmanoni/nifi/internal/model"
)

func pdGraph(script string, extra ...model.Node) *model.Graph {
	nodes := []model.Node{
		{ID: "src", Type: "source.tables", Name: "Users", Config: map[string]any{"connection": "c", "tables": []any{"user"}}},
		{ID: "dst", Type: "sink.postgres", Name: "PG", Config: map[string]any{"connection": "c", "column_map": []any{
			map[string]any{"table": "user", "from": "remember_code", "to": ""},
			map[string]any{"table": "user", "from": "new_ui", "to": ""},
			map[string]any{"table": "user", "from": "created_on", "to": ""},
			map[string]any{"table": "user", "from": "family_name", "to": "last_name"},
		}}},
	}
	edges := []model.Edge{}
	if script != "" {
		nodes = append(nodes, model.Node{ID: "py", Type: "transform.script", Name: "Py", Config: map[string]any{"script": script}})
		edges = append(edges, model.Edge{ID: "a", From: "src", FromPort: "success", To: "py"}, model.Edge{ID: "b", From: "py", FromPort: "success", To: "dst"})
	} else {
		edges = append(edges, model.Edge{ID: "a", From: "src", FromPort: "success", To: "dst"})
	}
	nodes = append(nodes, extra...)
	return &model.Graph{Nodes: nodes, Edges: edges}
}

func pushed(t *testing.T, g *model.Graph) string {
	t.Helper()
	rt := NewPreviewRuntime(nil)
	sinks := map[string]*pgSink{}
	for i := range g.Nodes {
		if g.Nodes[i].Type == "sink.postgres" {
			b, err := Build(&g.Nodes[i], rt)
			if err != nil {
				t.Fatal(err)
			}
			sinks[g.Nodes[i].ID] = b.(*pgSink)
		}
	}
	var out []string
	cols := []string{"id", "username", "email", "remember_code", "new_ui", "created_on", "family_name", "ip_address"}
	for c := range pushdownFor(g, "src", sinks)("user", cols) {
		out = append(out, c)
	}
	sort.Strings(out)
	return strings.Join(out, ",")
}

func TestPushdown(t *testing.T) {
	if got := pushed(t, pdGraph("")); got != "created_on,new_ui,remember_code" {
		t.Errorf("direct: %q", got)
	}
	// a script that mentions one ignored column keeps reading it
	if got := pushed(t, pdGraph("def transform(row):\n    row['x'] = row.get('created_on')\n    return row\n")); got != "new_ui,remember_code" {
		t.Errorf("script mentions created_on: %q", got)
	}
	// the user's script inspects the whole row: read everything
	if got := pushed(t, pdGraph("def transform(row):\n    if str(row).find('b\"') != -1:\n        row['ip_address'] = None\n    return row\n")); got != "" {
		t.Errorf("whole-row script: %q", got)
	}
	// a second destination that keeps remember_code limits the pushdown
	g := pdGraph("")
	g.Nodes = append(g.Nodes, model.Node{ID: "dst2", Type: "sink.postgres", Name: "PG2", Config: map[string]any{"connection": "c", "column_map": []any{
		map[string]any{"table": "user", "from": "new_ui", "to": ""},
	}}})
	g.Edges = append(g.Edges, model.Edge{ID: "c", From: "src", FromPort: "success", To: "dst2"})
	if got := pushed(t, g); got != "new_ui" {
		t.Errorf("two sinks: %q", got)
	}
	// a discard branch doesn't limit it
	g = pdGraph("")
	g.Nodes = append(g.Nodes, model.Node{ID: "bin", Type: "sink.discard", Name: "Bin"})
	g.Edges = append(g.Edges, model.Edge{ID: "c", From: "src", FromPort: "success", To: "bin"})
	if got := pushed(t, g); got != "created_on,new_ui,remember_code" {
		t.Errorf("discard branch: %q", got)
	}
	// a column rename disables it (names change on the way)
	g = pdGraph("")
	g.Nodes = append(g.Nodes, model.Node{ID: "rn", Type: "transform.rename", Name: "Rename", Config: map[string]any{"mapping": []any{map[string]any{"key": "a", "value": "b"}}}})
	g.Edges = []model.Edge{{ID: "a", From: "src", FromPort: "success", To: "rn"}, {ID: "b", From: "rn", FromPort: "success", To: "dst"}}
	if got := pushed(t, g); got != "" {
		t.Errorf("rename: %q", got)
	}
}

func TestPushdownProjectBoundary(t *testing.T) {
	g := pdGraph("")
	g.Nodes = append(g.Nodes, model.Node{ID: "pj", Type: "transform.project", Name: "Map", Config: map[string]any{"columns": []any{
		map[string]any{"column": "id", "expr": `Uint(row["id"])`},
		map[string]any{"column": "email", "expr": `lower(trim(String(row["email"])))`},
	}}})
	g.Edges = []model.Edge{{ID: "a", From: "src", FromPort: "success", To: "pj"}, {ID: "b", From: "pj", FromPort: "success", To: "dst"}}
	if got := pushed(t, g); got != "created_on,family_name,ip_address,new_ui,remember_code,username" {
		t.Errorf("project boundary: %q", got)
	}
}
