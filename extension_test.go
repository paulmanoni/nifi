package nifi_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/paulmanoni/nifi"
	"github.com/paulmanoni/nifi/record"
)

// A host can add a source, a transform and a sink, and its own expression
// functions; a flow built from them runs end to end.
func TestCustomNodesAndFunctions(t *testing.T) {
	var written []string
	e, err := nifi.New(nifi.Config{
		DataPath: filepath.Join(t.TempDir(), "n.db"),
		Functions: []nifi.Function{{
			Name: "shout", Args: "value", Help: "Uppercase with an exclamation mark",
			Fn: func(a ...any) (any, error) { return strings.ToUpper(fmt.Sprint(a[0])) + "!", nil },
		}},
		Sources: []nifi.Source{{
			Type: "test.numbers", Label: "Numbers", Icon: "hash",
			Properties: []nifi.Property{{Key: "count", Label: "How many", Kind: "int", Default: 3}},
			New:        func(s nifi.Settings) (nifi.Reader, error) { return &numbers{n: s.Int("count", 3)}, nil },
		}},
		Processors: []nifi.Processor{
			{
				Type: "test.double", Label: "Double", Ports: []string{"success", "big"},
				New: func(s nifi.Settings) (nifi.Handler, error) {
					return nifi.Func(func(_ context.Context, in *record.Batch) (*record.Batch, error) {
						i := in.Index("n")
						for _, row := range in.Rows {
							row[i] = row[i].(int64) * 2
						}
						return in, nil
					}), nil
				},
			},
			{
				Type: "test.collect", Label: "Collect", Category: "Sink",
				New: func(s nifi.Settings) (nifi.Handler, error) {
					s.Bulletin("info", "collecting into memory")
					return &collector{out: &written}, nil
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer e.Close(context.Background())
	h := e.Handler()
	call := func(method, path string, body any) map[string]any {
		t.Helper()
		var rd *strings.Reader
		raw, _ := json.Marshal(body)
		rd = strings.NewReader(string(raw))
		req := httptest.NewRequest(method, path, rd)
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("%s %s: %d %s", method, path, rec.Code, rec.Body.String())
		}
		var out map[string]any
		json.Unmarshal(rec.Body.Bytes(), &out)
		return out
	}

	// the custom nodes are in the catalog, and the function is listed
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("GET", "/api/processors", nil))
	if !strings.Contains(rec.Body.String(), `"test.numbers"`) || !strings.Contains(rec.Body.String(), `"big"`) {
		t.Fatalf("catalog: %s", rec.Body.String())
	}
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("GET", "/api/functions", nil))
	if !strings.Contains(rec.Body.String(), `"shout"`) || !strings.Contains(rec.Body.String(), `"coalesce"`) {
		t.Fatalf("functions: %d %s", rec.Code, rec.Body.String())
	}

	graph := map[string]any{
		"nodes": []any{
			map[string]any{"id": "src", "type": "test.numbers", "name": "Numbers", "config": map[string]any{"count": 4}},
			map[string]any{"id": "x2", "type": "test.double", "name": "Double", "config": map[string]any{}},
			map[string]any{"id": "cmp", "type": "transform.compute", "name": "Label", "config": map[string]any{
				"columns": []any{map[string]any{"column": "label", "expr": `shout("row" + string(n))`}}}},
			map[string]any{"id": "out", "type": "test.collect", "name": "Collect", "config": map[string]any{}},
		},
		"edges": []any{
			map[string]any{"id": "e1", "from": "src", "fromPort": "success", "to": "x2"},
			map[string]any{"id": "e2", "from": "x2", "fromPort": "success", "to": "cmp"},
			map[string]any{"id": "e3", "from": "cmp", "fromPort": "success", "to": "out"},
		},
	}
	f := call("POST", "/api/flows", map[string]any{"name": "custom", "graph": graph})
	id, _ := f["id"].(string)
	run := call("POST", "/api/flows/"+id+"/runs", map[string]any{})
	runID, _ := run["id"].(string)
	for i := 0; i < 100; i++ {
		d := call("GET", "/api/runs/"+runID, nil)
		if s, _ := d["status"].(string); s == "completed" {
			break
		} else if s == "failed" {
			t.Fatalf("run failed: %v", d["error"])
		}
	}
	if got := strings.Join(written, ","); got != "ROW2!,ROW4!,ROW6!,ROW8!" {
		t.Fatalf("collected %q", got)
	}
}

type numbers struct{ n int }

func (n *numbers) Tables(context.Context) ([]string, error) { return []string{"numbers"}, nil }

func (n *numbers) Sample(ctx context.Context, _ string, limit int) (*record.Batch, error) {
	b := n.batch()
	if limit < len(b.Rows) {
		b.Rows = b.Rows[:limit]
	}
	return b, nil
}

func (n *numbers) batch() *record.Batch {
	b := &record.Batch{Table: "numbers", Source: "numbers",
		Columns: []record.Column{{Name: "n", Type: record.Int64}}}
	for i := 1; i <= n.n; i++ {
		b.Rows = append(b.Rows, []any{int64(i)})
	}
	return b
}

func (n *numbers) Read(ctx context.Context, out nifi.Emitter) error {
	out.Emit("success", n.batch())
	return nil
}

type collector struct{ out *[]string }

func (c *collector) Process(_ context.Context, in *record.Batch, _ nifi.Emitter) error {
	i := in.Index("label")
	for _, row := range in.Rows {
		*c.out = append(*c.out, fmt.Sprint(row[i]))
	}
	return nil
}

// Parameters fill in node settings as #{name}, and a schedule starts a flow
// at its times.
func TestParametersAndSchedule(t *testing.T) {
	var seen []string
	e, err := nifi.New(nifi.Config{
		DataPath:    filepath.Join(t.TempDir(), "n.db"),
		NoScheduler: true,
		Parameters:  []nifi.Parameter{{Name: "greeting", Value: "habari", Description: "what to say"}},
		Sources: []nifi.Source{{Type: "test.one", Label: "One",
			New: func(nifi.Settings) (nifi.Reader, error) { return &numbers{n: 1}, nil }}},
		Processors: []nifi.Processor{{
			Type: "test.note", Label: "Note", Category: "Sink",
			Properties: []nifi.Property{{Key: "text", Label: "Text"}},
			New: func(s nifi.Settings) (nifi.Handler, error) {
				seen = append(seen, s.String("text"))
				return nifi.Func(func(context.Context, *record.Batch) (*record.Batch, error) { return nil, nil }), nil
			},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer e.Close(context.Background())
	h := e.Handler()
	do := func(method, path string, body any) (int, string) {
		raw, _ := json.Marshal(body)
		req := httptest.NewRequest(method, path, strings.NewReader(string(raw)))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code, rec.Body.String()
	}

	// the application's parameter is listed and fixed; more can be added
	if code, body := do("GET", "/api/parameters", nil); code != 200 || !strings.Contains(body, `"greeting"`) || !strings.Contains(body, `"fixed":true`) {
		t.Fatalf("parameters: %d %s", code, body)
	}
	if code, body := do("PUT", "/api/parameters/greeting", map[string]any{"value": "x"}); code != 400 {
		t.Fatalf("fixed parameter should be refused: %d %s", code, body)
	}
	if code, body := do("PUT", "/api/parameters/who", map[string]any{"value": "world", "description": "audience"}); code != 200 {
		t.Fatalf("save parameter: %d %s", code, body)
	}

	graph := map[string]any{
		"nodes": []any{
			map[string]any{"id": "src", "type": "test.one", "name": "One", "config": map[string]any{}},
			map[string]any{"id": "out", "type": "test.note", "name": "Note", "config": map[string]any{"text": "#{greeting} #{who}"}},
		},
		"edges": []any{map[string]any{"id": "e", "from": "src", "fromPort": "success", "to": "out"}},
	}
	// an undefined parameter is an error, and it names the parameter
	bad := map[string]any{"graph": map[string]any{
		"nodes": []any{map[string]any{"id": "out", "type": "test.note", "name": "Note", "config": map[string]any{"text": "#{nope}"}}},
		"edges": []any{}}}
	if _, body := do("POST", "/api/flows/validate", bad); !strings.Contains(body, "#{nope} is not defined") {
		t.Fatalf("validate: %s", body)
	}

	_, body := do("POST", "/api/flows", map[string]any{"name": "params", "graph": graph})
	var f map[string]any
	json.Unmarshal([]byte(body), &f)
	id, _ := f["id"].(string)

	// schedules are validated, stored and reported with their next run
	if code, body := do("PUT", "/api/flows/"+id+"/schedule", map[string]any{"schedule": "every tuesday", "enabled": true}); code != 400 {
		t.Fatalf("bad schedule accepted: %d %s", code, body)
	}
	code, body := do("PUT", "/api/flows/"+id+"/schedule", map[string]any{"schedule": "*/5 * * * *", "enabled": true})
	if code != 200 || !strings.Contains(body, `"nextRun"`) {
		t.Fatalf("schedule: %d %s", code, body)
	}
	if _, body := do("GET", "/api/flows", nil); !strings.Contains(body, `"schedule":"*/5 * * * *"`) || !strings.Contains(body, `"nextRun"`) {
		t.Fatalf("flow list: %s", body)
	}

	// the run resolves both parameters in the sink's setting
	run := map[string]any{}
	_, body = do("POST", "/api/flows/"+id+"/runs", map[string]any{})
	json.Unmarshal([]byte(body), &run)
	runID, _ := run["id"].(string)
	for i := 0; i < 100; i++ {
		_, body = do("GET", "/api/runs/"+runID, nil)
		if strings.Contains(body, `"status":"completed"`) {
			break
		}
		if strings.Contains(body, `"status":"failed"`) {
			t.Fatalf("run failed: %s", body)
		}
	}
	if len(seen) == 0 || seen[len(seen)-1] != "habari world" {
		t.Fatalf("settings resolved to %q", seen)
	}
}

// A node built from a mapping function runs in a real flow, and what it says
// it emits reaches the designer even when there is no data to run it on.
func TestMapperNodeEndToEnd(t *testing.T) {
	var written []string
	e, err := nifi.New(nifi.Config{
		DataPath: filepath.Join(t.TempDir(), "n.db"),
		Sources: []nifi.Source{{
			Type: "test.numbers", Label: "Numbers", Icon: "hash",
			Properties: []nifi.Property{{Key: "count", Label: "How many", Kind: "int", Default: 3}},
			New:        func(s nifi.Settings) (nifi.Reader, error) { return &numbers{n: s.Int("count", 3)}, nil },
		}},
		Processors: []nifi.Processor{
			nifi.Mapper[nifi.Row, labelled]{
				Type: "test.label", Label: "Label", Icon: "tag", PrimaryKey: []string{"n"},
				Properties: []nifi.Property{{Key: "prefix", Label: "Prefix", Kind: "string", Default: "row"}},
				Open: func(s nifi.Settings) (nifi.MapFunc[nifi.Row, labelled], func(), error) {
					prefix := s.String("prefix")
					return func(_ context.Context, in nifi.Row) (*labelled, error) {
						n, _ := in["n"].(int64)
						if n%2 == 1 {
							return nil, nil // odd rows are dropped
						}
						return &labelled{N: n, Label: fmt.Sprintf("%s%d", prefix, n)}, nil
					}, nil, nil
				},
			}.Processor(),
			{
				Type: "test.collect", Label: "Collect", Category: "Sink",
				New: func(s nifi.Settings) (nifi.Handler, error) { return &collector{out: &written}, nil },
			},
			// A node that declares its schema but cannot show it without rows —
			// the shape of a host mapper that renders from an ORM's own schema.
			{
				Type: "test.shy", Label: "Shy", New: func(nifi.Settings) (nifi.Handler, error) { return shy{}, nil },
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer e.Close(context.Background())
	h := e.Handler()
	call := func(method, path string, body any) map[string]any {
		t.Helper()
		raw, _ := json.Marshal(body)
		req := httptest.NewRequest(method, path, strings.NewReader(string(raw)))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("%s %s: %d %s", method, path, rec.Code, rec.Body.String())
		}
		var out map[string]any
		json.Unmarshal(rec.Body.Bytes(), &out)
		return out
	}

	graph := func(count int, mid string) map[string]any {
		return map[string]any{
			"nodes": []any{
				map[string]any{"id": "src", "type": "test.numbers", "name": "Numbers", "config": map[string]any{"count": count}},
				map[string]any{"id": "m", "type": mid, "name": "Middle", "config": map[string]any{"prefix": "n"}},
				map[string]any{"id": "out", "type": "test.collect", "name": "Collect", "config": map[string]any{}},
			},
			"edges": []any{
				map[string]any{"id": "e1", "from": "src", "fromPort": "success", "to": "m"},
				map[string]any{"id": "e2", "from": "m", "fromPort": "success", "to": "out"},
			},
		}
	}

	f := call("POST", "/api/flows", map[string]any{"name": "mapped", "graph": graph(4, "test.label")})
	id, _ := f["id"].(string)
	run := call("POST", "/api/flows/"+id+"/runs", map[string]any{})
	runID, _ := run["id"].(string)
	for i := 0; i < 100; i++ {
		d := call("GET", "/api/runs/"+runID, nil)
		if s, _ := d["status"].(string); s == "completed" {
			break
		} else if s == "failed" {
			t.Fatalf("run failed: %v", d["error"])
		}
	}
	if got := strings.Join(written, ","); got != "n2,n4" {
		t.Fatalf("collected %q; want the even rows labelled", got)
	}

	// A node with no settings still reports an empty list of them. A null
	// there is what crashed the settings panel: every reader of the catalog
	// would have to guard against a case that should not exist.
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest("GET", "/api/processors", nil))
	if strings.Contains(rec.Body.String(), `"properties":null`) {
		t.Fatal("the catalog sent a null properties list")
	}
	var catalog []struct {
		Type       string `json:"type"`
		Properties []any  `json:"properties"`
	}
	json.Unmarshal(rec.Body.Bytes(), &catalog)
	for _, c := range catalog {
		if c.Properties == nil {
			t.Fatalf("%s has no properties list", c.Type)
		}
	}

	// The schema arriving at the sink is the mapper's output, named by its
	// own type — asked for, not sampled.
	cols := schemaAt(t, call, graph(4, "test.label"), "out")
	if cols != "n,label" {
		t.Fatalf("schema at the sink is %q; want n,label", cols)
	}

	// And with nothing to sample, a node that declares its schema still
	// reports it: this is what a node that cannot is blind about.
	if cols := schemaAt(t, call, graph(0, "test.shy"), "out"); cols != "n,label" {
		t.Fatalf("schema with no rows is %q; want n,label from the declaration", cols)
	}
}

func schemaAt(t *testing.T, call func(string, string, any) map[string]any, graph map[string]any, node string) string {
	t.Helper()
	res := call("POST", "/api/flows/schema", map[string]any{"graph": graph, "nodeId": node})
	tables, _ := res["tables"].([]any)
	if len(tables) == 0 {
		return ""
	}
	first, _ := tables[0].(map[string]any)
	cols, _ := first["columns"].([]any)
	var names []string
	for _, c := range cols {
		m, _ := c.(map[string]any)
		names = append(names, fmt.Sprint(m["name"]))
	}
	return strings.Join(names, ",")
}

type labelled struct {
	N     int64  `nifi:"n"`
	Label string `nifi:"label"`
}

// shy emits its columns only when it has rows to show — like a mapper that
// renders from an ORM schema and leaves out columns no row sets.
type shy struct{}

func (shy) Process(_ context.Context, in *record.Batch, out nifi.Emitter) error {
	o := in.Derive()
	o.Columns = []record.Column{{Name: "n", Type: record.Int64}, {Name: "label", Type: record.Text}}
	if len(in.Rows) == 0 {
		o.Columns = o.Columns[:1] // nothing to go on
	}
	for range in.Rows {
		o.Rows = append(o.Rows, []any{int64(0), ""})
	}
	out.Emit("success", o)
	return nil
}

func (shy) Columns([]record.Column) ([]record.Column, error) {
	return []record.Column{{Name: "n", Type: record.Int64}, {Name: "label", Type: record.Text}}, nil
}
