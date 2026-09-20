package flow

import (
	"strings"
	"testing"

	"github.com/paulmanoni/nifi/internal/model"
)

func dupGraph(edges ...model.Edge) *model.Graph {
	return &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "User Table", Config: map[string]any{"connection": "c", "tables": []any{"user", "applicant"}}},
			{ID: "py", Type: "transform.script", Name: "Python Script", Config: map[string]any{"script": "def transform(row):\n    return row\n"}},
			{ID: "lk", Type: "transform.lookup", Name: "Names from applicant", Config: map[string]any{"lookups": []any{map[string]any{
				"connection": "c", "table": "applicant", "key": "user_id", "match": "user.id",
				"fields": []any{map[string]any{"key": "first_name", "value": "first_name"}}}}}},
			{ID: "dst", Type: "sink.discard", Name: "Sink"},
		},
		Edges: edges,
	}
}

func dupWarnings(g *model.Graph) []string {
	var out []string
	for _, i := range Validate(g) {
		if strings.Contains(i.Message, "two paths") {
			out = append(out, i.Message)
		}
	}
	return out
}

func TestDuplicatePathWarning(t *testing.T) {
	// The user's flow: a leftover direct edge next to the path through the lookup.
	g := dupGraph(
		model.Edge{ID: "a", From: "src", FromPort: "success", To: "py"},
		model.Edge{ID: "b", From: "src", FromPort: "success", To: "lk"},
		model.Edge{ID: "c", From: "lk", FromPort: "success", To: "py"},
		model.Edge{ID: "d", From: "py", FromPort: "success", To: "dst"},
	)
	if w := dupWarnings(g); len(w) != 1 || !strings.Contains(w[0], "Python Script receives rows from User Table over two paths") {
		t.Fatalf("want one duplicate-path warning, got %v", w)
	}
	// Routed per table: user via the lookup, applicant direct — no overlap.
	g = dupGraph(
		model.Edge{ID: "a", From: "src", FromPort: "success", To: "py", Tables: []string{"applicant"}},
		model.Edge{ID: "b", From: "src", FromPort: "success", To: "lk", Tables: []string{"user"}},
		model.Edge{ID: "c", From: "lk", FromPort: "success", To: "py"},
		model.Edge{ID: "d", From: "py", FromPort: "success", To: "dst"},
	)
	if w := dupWarnings(g); len(w) != 0 {
		t.Fatalf("routed flow should not warn: %v", w)
	}
	// Overlapping filters still warn.
	g.Edges[0].Tables = []string{"applicant", "user"}
	if w := dupWarnings(g); len(w) != 1 {
		t.Fatalf("overlap on user should warn: %v", w)
	}
}
