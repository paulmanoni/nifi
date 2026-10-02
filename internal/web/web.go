// Package web is nifi's user interface: server-rendered templ pages built
// from templUI components (vendored under ui/), styled after Apache NiFi's
// operator console.
//
// Pages read through the JSON API, called in-process with the browser's own
// request (Backend), so the API's authorization applies to every page as it
// does to every call. Everything a page changes goes through the same API
// from the browser (assets/nifi.js). Pages stay current by re-rendering in
// place when /api/live or a run's event stream reports a change.
//
// The flow designer (the canvas) and the dependency graph are interactive
// diagrams, so they stay JavaScript: a prebuilt bundle (assets/islands,
// built from ui/ in the repository root) mounted into the page.
package web

import (
	"bytes"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"
	"path"
	"strings"

	"github.com/a-h/templ"
)

//go:embed all:assets
var assets embed.FS

// Backend is what pages read through.
type Backend interface {
	// Call invokes the JSON API as the request's user: method and path
	// ("/flows", relative to /api), an optional JSON body, and out to decode
	// into. API errors come back as *APIError.
	Call(r *http.Request, method, path string, body, out any) error
	// Allow reports whether the request may perform action ("view", "edit",
	// "run", "data"): nil, ErrUnauthenticated or ErrForbidden.
	Allow(r *http.Request, action string) error
	// Challenge adds what the browser needs to sign in (HTTP Basic's
	// WWW-Authenticate) to an unauthenticated response.
	Challenge(w http.ResponseWriter, err error)
	// Base is the mount prefix of the request ("" at the root).
	Base(r *http.Request) string
}

// ErrUnauthenticated and ErrForbidden are what Backend.Allow returns.
var (
	ErrUnauthenticated = errors.New("authentication required")
	ErrForbidden       = errors.New("not allowed")
)

// APIError is an API call that failed.
type APIError struct {
	Status  int
	Message string
}

func (e *APIError) Error() string { return e.Message }

// Handler serves the pages and their assets. Paths are relative to the
// mount, as the API's are.
type Handler struct {
	B Backend
	// Version is shown in the header.
	Version string
}

// page is what a route renders.
type page struct {
	Nav   string // flows | connections | parameters
	Title string
	// Live names what keeps the page current: "instance" (the /api/live
	// stream), "run:<id>" (a run's events), or "" (nothing).
	Live string
	// Full makes the main area a fixed-height surface (the canvas) rather
	// than a scrolling page; it is never re-rendered in place.
	Full bool
	Body templ.Component
}

// partialHeader asks for the live regions only (status bar + main), which
// nifi.js morphs into the page.
const partialHeader = "X-Nifi-Partial"

// ServeHTTP routes a UI request. Callers send it everything that is not
// under /api/.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	p := path.Clean("/" + r.URL.Path)
	if strings.HasPrefix(p, "/assets/") {
		h.serveAsset(w, r, strings.TrimPrefix(p, "/assets/"))
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	parts := strings.Split(strings.Trim(p, "/"), "/")
	c := &ctx{h: h, w: w, r: r, base: h.B.Base(r)}
	switch {
	case p == "/" || p == "/flows":
		c.serve(flowsRoute)
	case len(parts) == 2 && parts[0] == "flows":
		c.serve(canvasRoute(parts[1]))
	case len(parts) == 2 && parts[0] == "runs":
		c.serve(runRoute(parts[1]))
	case p == "/connections":
		c.serve(connectionsRoute)
	case len(parts) == 3 && parts[0] == "connections" && parts[2] == "tables":
		c.serve(tablesRoute(parts[1]))
	case p == "/parameters":
		c.serve(parametersRoute)
	case p == "/migrate":
		c.serve(migrateRoute)
	default:
		c.serve(func(*ctx) (page, int) {
			return page{Nav: "flows", Title: "Not found", Body: emptyState("alert-triangle", "Not found", "There is nothing at this address.", c.href("/flows"), "Back to flows")}, http.StatusNotFound
		})
	}
}

// ctx is one page request.
type ctx struct {
	h    *Handler
	w    http.ResponseWriter
	r    *http.Request
	base string
	meta *meta
	inst *instance
}

// href is a UI path under the mount.
func (c *ctx) href(p string) string { return c.base + p }

// api is the mount's API path, for the browser.
func (c *ctx) api(p string) string { return c.base + "/api" + p }

func (c *ctx) call(method, p string, body, out any) error {
	return c.h.B.Call(c.r, method, p, body, out)
}

func (c *ctx) get(p string, out any) error { return c.call(http.MethodGet, p, nil, out) }

func (c *ctx) can(action string) bool {
	if c.meta == nil {
		return false
	}
	switch action {
	case "edit":
		return c.meta.Permissions.Edit
	case "run":
		return c.meta.Permissions.Run
	case "data":
		return c.meta.Permissions.Data
	}
	return c.meta.Permissions.View
}

// meta is GET /api/meta: who is asking and what they may do.
type meta struct {
	Version     string `json:"version"`
	Title       string `json:"title"`
	User        string `json:"user"`
	Auth        string `json:"auth"` // none | host | basic | builtin
	Permissions struct {
		View bool `json:"view"`
		Edit bool `json:"edit"`
		Run  bool `json:"run"`
		Data bool `json:"data"`
	} `json:"permissions"`
	Authenticated   bool `json:"authenticated"`
	MaxParallelRuns int  `json:"maxParallelRuns"`
}

// serve gates the request, builds the page and renders it: the whole
// document, or the live regions for a refresh (304 when unchanged).
func (c *ctx) serve(route func(*ctx) (page, int)) {
	var m meta
	if err := c.get("/meta", &m); err != nil {
		c.render(page{Title: "Unavailable", Body: emptyState("alert-triangle", "Could not load", err.Error(), "", "")}, http.StatusInternalServerError)
		return
	}
	c.meta = &m
	if err := c.h.B.Allow(c.r, "view"); err != nil {
		switch {
		case errors.Is(err, ErrUnauthenticated) && m.Auth == "builtin":
			c.render(page{Title: "Sign in", Body: loginPage(c)}, http.StatusOK)
		case errors.Is(err, ErrUnauthenticated):
			c.h.B.Challenge(c.w, err)
			c.render(page{Title: "Sign in required", Body: gate(c, "log-in", "Sign in required",
				"Your session has expired or you are not signed in. Sign in through the application that hosts this page, then retry.")}, http.StatusUnauthorized)
		default:
			c.render(page{Title: "No access", Body: gate(c, "shield-x", "No access", "You don't have permission to view data flows.")}, http.StatusForbidden)
		}
		return
	}
	p, status := route(c)
	c.render(p, status)
}

func (c *ctx) render(p page, status int) {
	h := c.w.Header()
	h.Set("Content-Type", "text/html; charset=utf-8")
	h.Set("Cache-Control", "no-store")
	if c.r.Header.Get(partialHeader) == "" {
		c.w.WriteHeader(status)
		_ = document(c, p).Render(c.r.Context(), c.w)
		return
	}
	var buf bytes.Buffer
	if err := partial(c, p).Render(c.r.Context(), &buf); err != nil {
		http.Error(c.w, err.Error(), http.StatusInternalServerError)
		return
	}
	sum := sha256.Sum256(buf.Bytes())
	tag := `"` + hex.EncodeToString(sum[:12]) + `"`
	h.Set("ETag", tag)
	if c.r.Header.Get("If-None-Match") == tag {
		c.w.WriteHeader(http.StatusNotModified)
		return
	}
	c.w.WriteHeader(status)
	_, _ = c.w.Write(buf.Bytes())
}

func (h *Handler) serveAsset(w http.ResponseWriter, r *http.Request, name string) {
	sub, _ := fs.Sub(assets, "assets")
	f, err := sub.Open(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	st, err := f.Stat()
	f.Close()
	if err != nil || st.IsDir() {
		http.NotFound(w, r)
		return
	}
	// Asset URLs carry ?v=<content hash>; anything else revalidates.
	if r.URL.Query().Get("v") != "" {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		w.Header().Set("Cache-Control", "no-cache")
	}
	http.ServeFileFS(w, r, sub, name)
}

// asset is an asset's URL under the mount, versioned by content.
func (c *ctx) asset(name string) string {
	return c.base + "/assets/" + name + "?v=" + assetHash(name)
}

// jsonAttr is v as JSON for a data-* attribute.
func jsonAttr(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		return "null"
	}
	return string(b)
}
