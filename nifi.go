// Package nifi is an embeddable, UI-first data migration engine: a flow
// designer and runtime for moving large databases (MySQL → PostgreSQL,
// PostgreSQL → PostgreSQL) with GUI transforms and Python-dialect scripts.
//
//	eng, err := nifi.New(nifi.Config{
//	    DataPath: "var/nifi.db",
//	    BasePath: "/nifi",
//	    Connections: []nifi.Connection{
//	        {ID: "legacy", Driver: "mysql", Host: "10.0.0.5", User: "ro", Password: "${LEGACY_PW}", Database: "app"},
//	        {ID: "main", Driver: "postgres", Host: "localhost", User: "app", Password: "${PG_PW}", Database: "app"},
//	    },
//	})
//	if err != nil { ... }
//	defer eng.Close(context.Background())
//	http.Handle("/nifi/", eng.Handler())
//
// Everything — JSON API, live run stream and the Svelte UI — is served by the
// one handler. Management state lives in a SQLite file at DataPath.
package nifi

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/paulmanoni/nifi/internal/api"
	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/exprx"
	"github.com/paulmanoni/nifi/internal/flow"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
)

// Version of the engine.
const Version = "0.5.0"

//go:embed all:ui/dist
var uiFS embed.FS

// Connection is a database the flows may read from or write to. Connections
// are declared by the host application in Config — the UI lists, tests and
// browses them but cannot create or edit them. String fields may reference
// the environment as ${VAR}.
type Connection = dbx.Connection

// Config configures an Engine.
type Config struct {
	// DataPath is the SQLite file holding flows, runs and checkpoints.
	// Default "nifi.db".
	DataPath string
	// BasePath is the URL prefix the handler is mounted at, e.g. "/nifi".
	BasePath string
	// Title is shown in the UI header. Default "Data Flows".
	Title string
	// Connections available to flows. ID (defaulting to Name) is what flows
	// reference, so keep it stable across deploys.
	Connections []Connection
	// Authorize gates every API call and the UI (nil = allow all — only
	// acceptable when the mount is already protected by the host).
	Authorize Authorizer
	// Actor names the requesting user in run bulletins. Optional.
	Actor Actor
	// ConsolePath is the public URL path printed in console messages when
	// BasePath is empty (framework adapters that learn it per request).
	ConsolePath string
	// BasicAuth enables HTTP Basic authentication (see BasicAuth) when
	// Authorize is nil. It takes precedence over Users.
	BasicAuth *BasicAuth
	// Users enables the built-in login (signed session cookie) when
	// Authorize is nil. Leave both empty only behind a protected mount.
	Users []User
	// SessionKey signs built-in session cookies (random per process when
	// empty, which logs everyone out on restart). SessionTTL defaults to 12h.
	SessionKey string
	SessionTTL time.Duration
	// SecureCookies marks the session cookie Secure (serve over HTTPS).
	SecureCookies bool
	// SeedFlows loads flow definitions (one JSON file per flow, see
	// SeedFlow) at startup: a missing flow is created, and a flow whose file
	// version is newer than the last one applied is overwritten. Flows edited
	// in the UI keep those edits until the file's version is raised.
	SeedFlows fs.FS
	// BeforeRun runs right before a run of a flow starts executing (after
	// dependency waits and queueing). Returning an error fails the run. Hosts
	// use it to prepare targets, e.g. create tables from ORM models.
	BeforeRun func(ctx context.Context, flow FlowRef, resume bool) error
	// AfterRun runs once a flow's run has finished, whatever the outcome —
	// to record that the flow ran where the host keeps that, or to notify.
	// It is advisory: an error becomes a bulletin and does not change the run.
	AfterRun func(ctx context.Context, flow FlowRef, run RunResult) error
	// MaxParallelRuns caps how many flow runs execute at once; "Run all"
	// queues the rest as pending and starts them as slots free.
	// 0 = unlimited (every run starts immediately).
	MaxParallelRuns int
	// Functions adds the host's own functions to flow expressions (Compute,
	// Filter, Map Columns, …) — e.g. an app's parsing helpers, so a flow
	// computes values exactly as its Go code does. They appear in the
	// expression editor's function list. See Function.
	Functions []Function
	// Parameters are values node settings refer to as #{name}, so one flow
	// runs unchanged against different environments. These are fixed: the
	// Parameters page shows them but cannot change them, and more can be
	// added there.
	Parameters []Parameter
	// NoScheduler stops the engine from running flows on their schedules
	// (useful for a read-only or test instance).
	NoScheduler bool
	// Processors and Sources add host-defined nodes to the palette.
	Processors []Processor
	Sources    []Source
	// MaxErrors stops a run once this many rows were dead-lettered
	// (0 = default 10000, negative = unlimited).
	MaxErrors int64
}

// Engine is a running nifi instance.
type Engine struct {
	cfg     Config
	store   *store.Store
	runs    *flow.Manager
	api     http.Handler
	handler http.Handler
	sched   *flow.Scheduler
}

// New opens the store and prepares the handler. Runs left active by a
// previous process are marked stopped so they can be resumed.
func New(cfg Config) (*Engine, error) {
	if cfg.DataPath == "" {
		cfg.DataPath = "nifi.db"
	}
	if cfg.Title == "" {
		cfg.Title = "Data Flows"
	}
	cfg.BasePath = "/" + strings.Trim(cfg.BasePath, "/")
	if cfg.BasePath == "/" {
		cfg.BasePath = ""
	}
	switch {
	case cfg.MaxErrors == 0:
		cfg.MaxErrors = 10000
	case cfg.MaxErrors < 0:
		cfg.MaxErrors = 0
	}
	if dir := filepath.Dir(cfg.DataPath); dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
	}
	fixed := make([]dbx.Connection, 0, len(cfg.Connections))
	seen := map[string]bool{}
	for _, c := range cfg.Connections {
		if c.ID == "" {
			c.ID = c.Name
		}
		if c.Name == "" {
			c.Name = c.ID
		}
		if c.ID == "" || seen[c.ID] {
			return nil, fmt.Errorf("nifi: connection needs a unique ID or Name")
		}
		if c.Driver == "postgresql" {
			c.Driver = "postgres"
		}
		if c.Driver != "mysql" && c.Driver != "postgres" {
			return nil, fmt.Errorf("nifi: connection %s: driver must be mysql or postgres", c.ID)
		}
		seen[c.ID] = true
		fixed = append(fixed, c)
	}

	st, err := store.Open(cfg.DataPath)
	if err != nil {
		return nil, fmt.Errorf("nifi: open store: %w", err)
	}
	if err := st.MarkInterrupted(context.Background()); err != nil {
		st.Close()
		return nil, err
	}
	// What the host declared in code wins: its wiring is the application's,
	// and a stored connection must never quietly take over an id the app
	// believes it owns. Anything else is looked up in the store, which is
	// where connections added through the UI live.
	resolve := func(ctx context.Context, id string) (dbx.Connection, error) {
		for _, c := range fixed {
			if c.ID == id {
				return c, nil
			}
		}
		c, err := st.GetConnection(ctx, id)
		if err == nil {
			return c, nil
		}
		return dbx.Connection{}, fmt.Errorf("%w: connection %q is not configured", store.ErrNotFound, id)
	}
	ui, err := fs.Sub(uiFS, "ui/dist")
	if err != nil {
		return nil, err
	}
	devUI := os.Getenv("NIFI_UI_DIR")
	if devUI != "" {
		// Serve a local build from disk so UI rebuilds need no Go rebuild.
		ui = os.DirFS(devUI)
	}
	var sessions *api.Sessions
	if cfg.Authorize == nil && len(cfg.Users) > 0 {
		sessions = &api.Sessions{Users: map[string]api.User{}, TTL: cfg.SessionTTL, Secure: cfg.SecureCookies}
		if sessions.TTL <= 0 {
			sessions.TTL = 12 * time.Hour
		}
		if cfg.SessionKey != "" {
			sessions.Key = []byte(cfg.SessionKey)
		} else {
			sessions.Key = make([]byte, 32)
			rand.Read(sessions.Key)
		}
		for _, u := range cfg.Users {
			if u.Username == "" || u.Password == "" {
				st.Close()
				return nil, fmt.Errorf("nifi: users need a username and password")
			}
			sessions.Users[u.Username] = u
		}
	}
	var basic *api.Basic
	if cfg.Authorize == nil && cfg.BasicAuth != nil {
		basic, err = setupBasic(st, cfg)
		if err != nil {
			st.Close()
			return nil, err
		}
		sessions = nil
	}
	if cfg.SeedFlows != nil {
		if err := seedFlows(context.Background(), st, cfg.SeedFlows); err != nil {
			st.Close()
			return nil, err
		}
	}
	if err := registerProcessors(cfg.Processors, cfg.Sources); err != nil {
		st.Close()
		return nil, err
	}
	for _, fn := range cfg.Functions {
		if err := exprx.Register(exprx.Function{Name: fn.Name, Args: fn.Args, Help: fn.Help, Group: "app", Fn: fn.Fn}); err != nil {
			st.Close()
			return nil, err
		}
	}
	runs := flow.NewManager(st, resolve, cfg.MaxErrors)
	runs.MaxParallel = cfg.MaxParallelRuns
	if cfg.AfterRun != nil {
		hook := cfg.AfterRun
		runs.AfterRun = func(ctx context.Context, id, name string, r model.RunSummary) error {
			return hook(ctx, FlowRef{ID: id, Name: name, RunID: r.ID}, RunResult{RunID: r.ID, Status: string(r.Status),
				StartedAt: r.StartedAt, FinishedAt: r.FinishedAt, RowsRead: r.RowsRead,
				RowsWritten: r.RowsWritten, RowsFailed: r.RowsFailed, Error: r.Error, Live: r.Live})
		}
	}
	if cfg.BeforeRun != nil {
		hook := cfg.BeforeRun
		runs.BeforeRun = func(ctx context.Context, id, name, runID string, resume bool) error {
			return hook(ctx, FlowRef{ID: id, Name: name, RunID: runID}, resume)
		}
	}
	var fixedParams []model.Parameter
	for _, p := range cfg.Parameters {
		fixedParams = append(fixedParams, model.Parameter{Name: p.Name, Value: p.Value,
			Description: p.Description, Sensitive: p.Sensitive, Fixed: true})
	}
	srv := &api.Server{Store: st, Runs: runs, Conns: fixed, Resolve: resolve, UI: ui,
		Base: cfg.BasePath, Title: cfg.Title, Version: Version, DevUI: devUI != "",
		Authorize: cfg.Authorize, Actor: cfg.Actor, Sessions: sessions, Basic: basic, Fixed: fixedParams}
	if err := srv.LoadParameters(context.Background()); err != nil {
		st.Close()
		return nil, err
	}
	inner := srv.Handler()
	h := inner
	if cfg.BasePath != "" {
		h = http.StripPrefix(cfg.BasePath, inner)
	}
	e := &Engine{cfg: cfg, store: st, runs: runs, api: inner, handler: h}
	if !cfg.NoScheduler {
		e.sched = flow.NewScheduler(runs)
		e.sched.Start()
	}
	return e, nil
}

// Handler serves the API and UI. Mount it at Config.BasePath.
func (e *Engine) Handler() http.Handler { return e.handler }

// ServeAt serves a request whose mount prefix is only known per request:
// base is the prefix (e.g. "/admin/nifi") and rest the remainder of the path
// ("api/flows", "" for the UI root). Framework adapters use this.
func (e *Engine) ServeAt(w http.ResponseWriter, r *http.Request, base, rest string) {
	r2 := api.WithBase(r, strings.TrimRight(base, "/"))
	u := *r.URL
	u.Path = "/" + strings.TrimPrefix(rest, "/")
	u.RawPath = ""
	r2.URL = &u
	e.api.ServeHTTP(w, r2)
}

// BasePath returns the normalized mount prefix ("" for root).
func (e *Engine) BasePath() string { return e.cfg.BasePath }

// Close stops active runs (they stay resumable) and closes the store.
func (e *Engine) Close(ctx context.Context) error {
	if e.sched != nil {
		e.sched.Stop()
	}
	e.runs.StopAll(ctx)
	return e.store.Close()
}

// setupBasic prepares Basic auth; without configured users it creates an
// "admin" account whose generated password persists in the state file.
func setupBasic(st *store.Store, cfg Config) (*api.Basic, error) {
	b := &api.Basic{Realm: cfg.BasicAuth.Realm, Users: map[string]api.User{}}
	if b.Realm == "" {
		b.Realm = cfg.Title
	}
	for _, u := range cfg.BasicAuth.Users {
		if u.Username == "" || u.Password == "" {
			return nil, fmt.Errorf("nifi: basic auth users need a username and password")
		}
		b.Users[u.Username] = u
	}
	if len(b.Users) > 0 {
		return b, nil
	}
	ctx := context.Background()
	pw, ok := st.GetKV(ctx, "", "basic_auth_admin_password")
	if !ok || pw == "" {
		raw := make([]byte, 12)
		rand.Read(raw)
		pw = base64.RawURLEncoding.EncodeToString(raw)
		if err := st.SetKV(ctx, "", "basic_auth_admin_password", pw); err != nil {
			return nil, fmt.Errorf("nifi: store generated password: %w", err)
		}
	}
	b.Users["admin"] = api.User{Username: "admin", Password: pw}
	if !cfg.BasicAuth.Quiet {
		where := cfg.BasePath
		if where == "" {
			where = cfg.ConsolePath
		}
		if where == "" {
			where = "its mount path"
		}
		log.Printf("nifi: %s at %s — sign in with username %q, password %q (stored in %s)", cfg.Title, where, "admin", pw, cfg.DataPath)
	}
	return b, nil
}

// Parameter is a value node settings refer to as #{name}. The application's
// own parameters are fixed: the Parameters page lists them but cannot change
// them, so deployment values stay where the deployment defines them.
//
//	nifi.Config{Parameters: []nifi.Parameter{
//	    {Name: "schema", Value: os.Getenv("TARGET_SCHEMA"), Description: "target schema"},
//	}}
type Parameter struct {
	Name        string
	Value       string
	Description string
	// Sensitive keeps the value out of every API response.
	Sensitive bool
}
