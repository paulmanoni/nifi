package nifi_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/paulmanoni/nifi"
)

func get(t *testing.T, srv *httptest.Server, path string, h ...string) (*http.Response, string) {
	t.Helper()
	req, _ := http.NewRequest(http.MethodGet, srv.URL+path, nil)
	for i := 0; i+1 < len(h); i += 2 {
		req.Header.Set(h[i], h[i+1])
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	return res, string(b)
}

// The UI is server-rendered: every page answers with a whole document read
// through the API, under the mount's base path.
func TestUIPages(t *testing.T) {
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"), BasePath: "/nifi", Title: "Flows Test",
		Parameters: []nifi.Parameter{{Name: "schema", Value: "public", Description: "target schema"}}})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	mux := http.NewServeMux()
	mux.Handle("/nifi/", eng.Handler())
	srv := httptest.NewServer(mux)
	defer srv.Close()

	var f struct{ ID string }
	if code := call(t, srv, "POST", "/nifi/api/flows", map[string]any{"name": "orders", "description": "orders → warehouse", "graph": map[string]any{"nodes": []any{}, "edges": []any{}}}, &f); code != 200 {
		t.Fatalf("create flow: %d", code)
	}

	for path, want := range map[string][]string{
		"/nifi/":                          {"<title>Flows · Flows Test</title>", ">orders<", "orders → warehouse", `data-live="instance"`},
		"/nifi/flows?view=cards":          {">orders<", "No dependencies"},
		"/nifi/flows?view=graph":          {`data-island="depgraph"`, "/nifi/assets/islands/islands.js"},
		"/nifi/flows?q=nothing-here":      {"No flows match “nothing-here”."},
		"/nifi/flows/" + f.ID:             {`data-island="canvas"`, `data-static`},
		"/nifi/connections":               {"No connections yet"},
		"/nifi/parameters":                {"#{schema}", "fixed", "target schema"},
		"/nifi/migrate":                   {"Migrate a database", "Create a source and a target connection first."},
		"/nifi/assets/nifi.js":            {"X-Nifi-Partial"},
		"/nifi/assets/islands/islands.js": {"mount"},
	} {
		res, body := get(t, srv, path)
		if res.StatusCode != 200 {
			t.Errorf("%s: status %d", path, res.StatusCode)
			continue
		}
		for _, w := range want {
			if !strings.Contains(body, w) {
				t.Errorf("%s: missing %q", path, w)
			}
		}
	}

	for _, path := range []string{"/nifi/flows/nope", "/nifi/runs/nope", "/nifi/somewhere"} {
		if res, _ := get(t, srv, path); res.StatusCode != 404 {
			t.Errorf("%s: want 404, got %d", path, res.StatusCode)
		}
	}
}

// A live refresh asks for the regions only and is a 304 while nothing on
// the page changed.
func TestUIPartialRefresh(t *testing.T) {
	eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db")})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close(context.Background())
	srv := httptest.NewServer(eng.Handler())
	defer srv.Close()

	res, body := get(t, srv, "/flows", "X-Nifi-Partial", "1")
	tag := res.Header.Get("ETag")
	if res.StatusCode != 200 || tag == "" || strings.Contains(body, "<html") || !strings.Contains(body, `id="nf-main"`) {
		t.Fatalf("partial: %d etag=%q html=%v", res.StatusCode, tag, strings.Contains(body, "<html"))
	}
	if res, _ := get(t, srv, "/flows", "X-Nifi-Partial", "1", "If-None-Match", tag); res.StatusCode != 304 {
		t.Fatalf("unchanged partial: want 304, got %d", res.StatusCode)
	}
	call(t, srv, "POST", "/api/flows", map[string]any{"name": "another"}, nil)
	if res, _ := get(t, srv, "/flows", "X-Nifi-Partial", "1", "If-None-Match", tag); res.StatusCode != 200 {
		t.Fatalf("changed partial: want 200, got %d", res.StatusCode)
	}
}

// Pages are gated as the API is: Basic auth challenges, built-in login shows
// its form, and a host hook's refusal is a 403.
func TestUIAuthGates(t *testing.T) {
	t.Run("basic", func(t *testing.T) {
		eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"), BasicAuth: &nifi.BasicAuth{Quiet: true,
			Users: []nifi.User{{Username: "ops", Password: "pw"}}}})
		if err != nil {
			t.Fatal(err)
		}
		defer eng.Close(context.Background())
		srv := httptest.NewServer(eng.Handler())
		defer srv.Close()
		res, body := get(t, srv, "/flows")
		if res.StatusCode != 401 || !strings.HasPrefix(res.Header.Get("WWW-Authenticate"), "Basic") || !strings.Contains(body, "Sign in required") {
			t.Fatalf("anonymous: %d %q", res.StatusCode, res.Header.Get("WWW-Authenticate"))
		}
		req, _ := http.NewRequest("GET", srv.URL+"/flows", nil)
		req.SetBasicAuth("ops", "pw")
		ok, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		ok.Body.Close()
		if ok.StatusCode != 200 {
			t.Fatalf("signed in: %d", ok.StatusCode)
		}
	})
	t.Run("builtin", func(t *testing.T) {
		eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"), Users: []nifi.User{{Username: "admin", Password: "pw"}}})
		if err != nil {
			t.Fatal(err)
		}
		defer eng.Close(context.Background())
		srv := httptest.NewServer(eng.Handler())
		defer srv.Close()
		res, body := get(t, srv, "/flows")
		if res.StatusCode != 200 || !strings.Contains(body, "data-login") || !strings.Contains(body, "Sign in to continue") {
			t.Fatalf("login page: %d", res.StatusCode)
		}
	})
	t.Run("host", func(t *testing.T) {
		eng, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db"),
			Authorize: func(r *http.Request, a nifi.Action) error { return nifi.ErrForbidden }})
		if err != nil {
			t.Fatal(err)
		}
		defer eng.Close(context.Background())
		srv := httptest.NewServer(eng.Handler())
		defer srv.Close()
		if res, body := get(t, srv, "/flows"); res.StatusCode != 403 || !strings.Contains(body, "No access") {
			t.Fatalf("forbidden: %d", res.StatusCode)
		}
	})
}
