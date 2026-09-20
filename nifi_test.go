package nifi_test

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/paulmanoni/nifi"
)

func call(t *testing.T, srv *httptest.Server, method, path string, body any, out any) int {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req, _ := http.NewRequest(method, srv.URL+path, &buf)
	req.Header.Set("Content-Type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if out != nil {
		json.NewDecoder(res.Body).Decode(out)
	}
	return res.StatusCode
}

func TestAPI(t *testing.T) {
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"), BasePath: "/nifi",
		Connections: []nifi.Connection{
			{ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
			{ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
		}})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	mux := http.NewServeMux()
	mux.Handle("/nifi/", eng.Handler())
	srv := httptest.NewServer(mux)
	defer srv.Close()

	res, _ := http.Get(srv.URL + "/nifi/")
	var page bytes.Buffer
	page.ReadFrom(res.Body)
	if !strings.Contains(page.String(), `window.__NIFI__={"base":"/nifi"`) {
		t.Fatalf("index not injected: %.200s", page.String())
	}

	var specs []map[string]any
	if call(t, srv, "GET", "/nifi/api/processors", nil, &specs); len(specs) < 10 {
		t.Fatalf("processors: %d", len(specs))
	}
	var sr map[string]any
	call(t, srv, "POST", "/nifi/api/script/test", map[string]any{
		"script":  "def transform(row):\n    row['full'] = row['a'] + '-' + str(row['n'] * 2)\n    return row",
		"columns": []map[string]any{{"name": "a", "type": "text"}, {"name": "n", "type": "int64"}},
		"rows":    [][]any{{"x", 2}, {"y", 5}},
	}, &sr)
	if rows, _ := sr["rows"].([]any); len(rows) != 2 || rows[1].([]any)[2] != "y-10" {
		t.Fatalf("script test: %+v", sr)
	}
	call(t, srv, "POST", "/nifi/api/script/test", map[string]any{"script": "def transform(row):\n    return row['missing']", "columns": []any{}, "rows": [][]any{{}}}, &sr)
	if sr["error"] == nil || sr["line"] != float64(2) {
		t.Fatalf("script error line: %+v", sr)
	}
	var er map[string]any
	call(t, srv, "POST", "/nifi/api/expr/test", map[string]any{"expr": `upper(name) + "!"`,
		"columns": []map[string]any{{"name": "name", "type": "text"}}, "row": []any{"ada"}}, &er)
	if er["value"] != "ADA!" {
		t.Fatalf("expr: %+v", er)
	}

	if os.Getenv("NIFI_TEST_PG") == "" {
		return
	}
	var conns []map[string]any
	if call(t, srv, "GET", "/nifi/api/connections", nil, &conns); len(conns) != 2 || conns[0]["password"] != nil {
		t.Fatalf("connections: %+v", conns)
	}
	var test map[string]any
	call(t, srv, "POST", "/nifi/api/connections/test", map[string]any{"id": "src"}, &test)
	if test["ok"] != true {
		t.Fatalf("test connection: %+v", test)
	}
	var tables []map[string]any
	call(t, srv, "GET", "/nifi/api/connections/src/tables", nil, &tables)
	if len(tables) < 4 {
		t.Fatalf("tables: %+v", tables)
	}
	var flow map[string]any
	if code := call(t, srv, "POST", "/nifi/api/flows/wizard", map[string]any{"sourceConnectionId": "src",
		"targetConnectionId": "tgt", "tables": []string{"tags", "logs"}, "targetSchema": "wiz", "mode": "merge"}, &flow); code != 200 {
		t.Fatalf("wizard: %d %+v", code, flow)
	}
	graph := flow["graph"].(map[string]any)
	sinkID := graph["nodes"].([]any)[1].(map[string]any)["id"]
	var pv struct {
		Table  string
		Tables []string
		Stages []struct {
			NodeID  string
			Port    string
			Table   string
			Columns []map[string]any
			Rows    [][]any
		}
	}
	call(t, srv, "POST", "/nifi/api/flows/preview", map[string]any{"graph": graph, "nodeId": sinkID, "table": "tags", "limit": 5}, &pv)
	if pv.Table != "tags" || len(pv.Stages) != 2 || len(pv.Stages[1].Rows) != 5 || pv.Stages[1].Table != "wiz.tags" {
		t.Fatalf("preview: %+v", pv)
	}
	var schema struct{ Tables []struct{ Table string } }
	call(t, srv, "POST", "/nifi/api/flows/schema", map[string]any{"graph": graph, "nodeId": sinkID}, &schema)
	if len(schema.Tables) != 2 {
		t.Fatalf("schema: %+v", schema)
	}
	var run map[string]any
	if code := call(t, srv, "POST", "/nifi/api/flows/"+flow["id"].(string)+"/runs", map[string]any{}, &run); code != 200 {
		t.Fatalf("start: %d %+v", code, run)
	}
	// Follow the SSE stream until the run ends.
	res, err = http.Get(srv.URL + "/nifi/api/runs/" + run["id"].(string) + "/events")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	sc := bufio.NewScanner(res.Body)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	var last string
	deadline := time.Now().Add(time.Minute)
	for sc.Scan() && time.Now().Before(deadline) {
		line := sc.Text()
		if strings.HasPrefix(line, "event: ") {
			last = strings.TrimPrefix(line, "event: ")
		}
		if last == "end" && strings.HasPrefix(line, "data: ") {
			var sum map[string]any
			json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &sum)
			if sum["status"] != "completed" || sum["rowsWritten"] != float64(7000) {
				t.Fatalf("run end: %+v", sum)
			}
			return
		}
	}
	t.Fatal("no end event")
}

func TestAuthorization(t *testing.T) {
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"),
		Authorize: func(r *http.Request, a nifi.Action) error {
			switch {
			case r.Header.Get("X-User") == "":
				return nifi.ErrUnauthenticated
			case a == nifi.ActionData || a == nifi.ActionRun:
				return nifi.ErrForbidden
			}
			return nil
		},
		Actor: func(r *http.Request) string { return r.Header.Get("X-User") },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	srv := httptest.NewServer(eng.Handler())
	defer srv.Close()
	do := func(method, path, user string) (int, map[string]any) {
		req, _ := http.NewRequest(method, srv.URL+path, strings.NewReader(`{"graph":{"nodes":[],"edges":[]},"nodeId":"x"}`))
		if user != "" {
			req.Header.Set("X-User", user)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var out map[string]any
		json.NewDecoder(res.Body).Decode(&out)
		return res.StatusCode, out
	}
	if code, _ := do("GET", "/api/flows", ""); code != 401 {
		t.Errorf("anonymous flows: %d", code)
	}
	if code, _ := do("GET", "/", ""); code != 401 {
		t.Errorf("anonymous UI: %d", code)
	}
	if code, _ := do("GET", "/api/flows", "ada"); code != 200 {
		t.Errorf("viewer flows: %d", code)
	}
	if code, _ := do("POST", "/api/flows/preview", "ada"); code != 403 {
		t.Errorf("viewer preview: %d", code)
	}
	_, meta := do("GET", "/api/meta", "ada")
	perms, _ := meta["permissions"].(map[string]any)
	if perms["view"] != true || perms["edit"] != true || perms["data"] != false || perms["run"] != false || meta["user"] != "ada" {
		t.Errorf("meta: %+v", meta)
	}
}

func TestBuiltinLogin(t *testing.T) {
	hash, _ := bcrypt.GenerateFromPassword([]byte("s3cret"), bcrypt.MinCost)
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"), BasePath: "/m",
		Users: []nifi.User{
			{Username: "admin", Password: string(hash)},
			{Username: "viewer", Password: "plain", Actions: []nifi.Action{nifi.ActionView}},
		}})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	mux := http.NewServeMux()
	mux.Handle("/m/", eng.Handler())
	srv := httptest.NewServer(mux)
	defer srv.Close()
	jar, _ := cookiejar.New(nil)
	cl := &http.Client{Jar: jar}
	post := func(path, body string) int {
		res, err := cl.Post(srv.URL+path, "application/json", strings.NewReader(body))
		if err != nil {
			t.Fatal(err)
		}
		res.Body.Close()
		return res.StatusCode
	}
	get := func(path string) (int, map[string]any) {
		res, err := cl.Get(srv.URL + path)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var m map[string]any
		json.NewDecoder(res.Body).Decode(&m)
		return res.StatusCode, m
	}
	if code, _ := get("/m/api/flows"); code != 401 {
		t.Fatalf("anonymous: %d", code)
	}
	if code, _ := get("/m/"); code != 200 {
		t.Fatalf("login page should render the SPA, got %d", code)
	}
	if code := post("/m/api/auth/login", `{"username":"admin","password":"nope"}`); code != 401 {
		t.Fatalf("bad password: %d", code)
	}
	if code := post("/m/api/auth/login", `{"username":"admin","password":"s3cret"}`); code != 200 {
		t.Fatalf("login: %d", code)
	}
	if code, _ := get("/m/api/flows"); code != 200 {
		t.Fatalf("admin flows: %d", code)
	}
	post("/m/api/auth/logout", "")
	post("/m/api/auth/login", `{"username":"viewer","password":"plain"}`)
	_, meta := get("/m/api/meta")
	if meta["user"] != "viewer" || meta["auth"] != "builtin" || meta["permissions"].(map[string]any)["edit"] != false {
		t.Fatalf("viewer meta: %+v", meta)
	}
	if code := post("/m/api/flows", `{"name":"x"}`); code != 403 {
		t.Fatalf("viewer create: %d", code)
	}
}

func TestFlowDependencyAPI(t *testing.T) {
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db")})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	srv := httptest.NewServer(eng.Handler())
	defer srv.Close()
	var a, b map[string]any
	call(t, srv, "POST", "/api/flows", map[string]any{"name": "A"}, &a)
	call(t, srv, "POST", "/api/flows", map[string]any{"name": "B", "dependsOn": []string{a["id"].(string)}}, &b)
	if deps, _ := b["dependsOn"].([]any); len(deps) != 1 {
		t.Fatalf("B deps: %+v", b)
	}
	var e map[string]any
	if code := call(t, srv, "PUT", "/api/flows/"+a["id"].(string), map[string]any{"dependsOn": []string{b["id"].(string)}}, &e); code != 400 ||
		!strings.Contains(e["error"].(string), "cycle") {
		t.Fatalf("cycle: %d %+v", code, e)
	}
	if code := call(t, srv, "PUT", "/api/flows/"+a["id"].(string), map[string]any{"dependsOn": []string{"nope"}}, &e); code != 400 {
		t.Fatalf("unknown dep: %d", code)
	}
	if code := call(t, srv, "DELETE", "/api/flows/"+a["id"].(string), nil, &e); code != 409 {
		t.Fatalf("delete depended-on flow: %d %+v", code, e)
	}
}

// Previewing a node picks a table that actually reaches it (tables can be
// routed per connection) and returns the rows arriving at the node.
func TestPreviewInputFollowsRouting(t *testing.T) {
	addr := os.Getenv("NIFI_TEST_MYSQL")
	if addr == "" || os.Getenv("NIFI_TEST_PG") == "" {
		t.Skip("needs NIFI_TEST_MYSQL and NIFI_TEST_PG")
	}
	host, port, _ := strings.Cut(addr, ":")
	p, _ := strconv.Atoi(port)
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"), Connections: []nifi.Connection{
		{ID: "legacy", Driver: "mysql", Host: host, Port: p, User: "root", Database: "legacy"},
		{ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	srv := httptest.NewServer(eng.Handler())
	defer srv.Close()
	g := map[string]any{
		"nodes": []any{
			map[string]any{"id": "src", "type": "source.tables", "name": "Legacy", "config": map[string]any{"connection": "legacy", "tables": []string{"applicant", "user"}}},
			map[string]any{"id": "lk", "type": "transform.lookup", "name": "Names", "config": map[string]any{"lookups": []any{map[string]any{
				"connection": "legacy", "table": "applicant", "key": "user_id", "match": "user.id",
				"fields": []any{map[string]any{"key": "first_name", "value": "first_name"}}}}}},
			map[string]any{"id": "py", "type": "transform.script", "name": "Script", "config": map[string]any{"script": "def transform(row):\n    return row\n"}},
		},
		"edges": []any{
			map[string]any{"id": "e1", "from": "src", "fromPort": "success", "to": "lk", "tables": []string{"user"}},
			map[string]any{"id": "e2", "from": "lk", "fromPort": "success", "to": "py"},
		},
	}
	var r struct {
		Table   string
		Reaches bool
		Input   *struct {
			Columns []struct{ Name string }
			Rows    [][]any
		}
	}
	call(t, srv, "POST", "/api/flows/preview", map[string]any{"graph": g, "nodeId": "py", "limit": 3}, &r)
	if r.Table != "user" || !r.Reaches || r.Input == nil || len(r.Input.Rows) != 3 {
		t.Fatalf("preview: %+v", r)
	}
	var names []string
	for _, c := range r.Input.Columns {
		names = append(names, c.Name)
	}
	if !strings.Contains(strings.Join(names, ","), "first_name") || r.Input.Rows[0][len(names)-1] != "AppFirst1" {
		t.Errorf("script input lacks lookup columns: %v %v", names, r.Input.Rows[0])
	}
}

func TestBasicAuth(t *testing.T) {
	var logs bytes.Buffer
	log.SetOutput(&logs)
	defer log.SetOutput(os.Stderr)
	dir := t.TempDir()
	cfg := nifi.Config{DataPath: filepath.Join(dir, "n.db"), Title: "Flows", BasicAuth: &nifi.BasicAuth{}}
	eng, err := nifi.New(cfg)
	if err != nil {
		t.Fatal(err)
	}
	m := regexp.MustCompile(`username "admin", password "([^"]+)"`).FindStringSubmatch(logs.String())
	if m == nil {
		t.Fatalf("password not printed: %q", logs.String())
	}
	pw := m[1]
	srv := httptest.NewServer(eng.Handler())
	get := func(path, user, pass string) *http.Response {
		req, _ := http.NewRequest("GET", srv.URL+path, nil)
		if user != "" {
			req.SetBasicAuth(user, pass)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		res.Body.Close()
		return res
	}
	if r := get("/", "", ""); r.StatusCode != 401 || !strings.HasPrefix(r.Header.Get("WWW-Authenticate"), `Basic realm="Flows"`) {
		t.Fatalf("UI without credentials: %d %q", r.StatusCode, r.Header.Get("WWW-Authenticate"))
	}
	if r := get("/api/flows", "admin", "wrong"); r.StatusCode != 401 || r.Header.Get("WWW-Authenticate") == "" {
		t.Fatalf("wrong password: %d", r.StatusCode)
	}
	if r := get("/api/flows", "admin", pw); r.StatusCode != 200 {
		t.Fatalf("right password: %d", r.StatusCode)
	}
	srv.Close()
	eng.Close(context.Background())

	// The generated password survives a restart.
	logs.Reset()
	eng, err = nifi.New(cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	if !strings.Contains(logs.String(), pw) {
		t.Errorf("password changed after restart: %q", logs.String())
	}
}

func TestSeedFlows(t *testing.T) {
	dir := t.TempDir()
	seeds := t.TempDir()
	write := func(name, body string) {
		if err := os.WriteFile(filepath.Join(seeds, name), []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	write("countries.json", `{"id":"mig_countries","version":1,"name":"countries","graph":{"nodes":[],"edges":[]}}`)
	write("regions.json", `{"id":"mig_regions","version":1,"name":"regions","dependsOn":["mig_countries"],"graph":{"nodes":[],"edges":[]}}`)
	open := func() (*nifi.Engine, *httptest.Server) {
		eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(dir, "n.db"), SeedFlows: os.DirFS(seeds)})
		if err != nil {
			t.Fatal(err)
		}
		return eng, httptest.NewServer(eng.Handler())
	}
	eng, srv := open()
	var f map[string]any
	if call(t, srv, "GET", "/api/flows/mig_regions", nil, &f); f["name"] != "regions" || len(f["dependsOn"].([]any)) != 1 {
		t.Fatalf("seeded flow: %+v", f)
	}
	call(t, srv, "PUT", "/api/flows/mig_regions", map[string]any{"name": "regions (edited)"}, &f)
	srv.Close()
	eng.Close(context.Background())

	eng, srv = open() // same version: the UI edit survives
	call(t, srv, "GET", "/api/flows/mig_regions", nil, &f)
	if f["name"] != "regions (edited)" {
		t.Errorf("edit overwritten without a version bump: %v", f["name"])
	}
	srv.Close()
	eng.Close(context.Background())

	write("regions.json", `{"id":"mig_regions","version":2,"name":"regions v2","dependsOn":["mig_countries"],"graph":{"nodes":[],"edges":[]}}`)
	eng, srv = open() // version raised: the file wins
	defer eng.Close(context.Background())
	defer srv.Close()
	call(t, srv, "GET", "/api/flows/mig_regions", nil, &f)
	if f["name"] != "regions v2" {
		t.Errorf("version bump not applied: %v", f["name"])
	}
}
