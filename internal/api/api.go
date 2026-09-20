// Package api serves nifi's JSON API, the SSE run stream and the embedded UI.
package api

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/exprx"
	"github.com/paulmanoni/nifi/internal/flow"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/script"
	"github.com/paulmanoni/nifi/internal/store"
	"github.com/paulmanoni/nifi/record"
)

// Server wires the API.
type Server struct {
	Store     *store.Store
	Runs      *flow.Manager
	Conns     []dbx.Connection // declared by the host application
	Resolve   flow.ConnectionResolver
	UI        fs.FS
	Base      string
	Title     string
	Version   string
	DevUI     bool
	Authorize func(r *http.Request, a Action) error
	Actor     func(r *http.Request) string
	Sessions  *Sessions
	Basic     *Basic
	// Fixed are parameters the application declares (Config.Parameters);
	// they cannot be edited from the UI.
	Fixed []model.Parameter
	index sync.Map // base → injected index.html
}

type baseKey struct{}

// WithBase records the mount prefix of a request whose prefix is only known
// at request time (e.g. behind a framework router with a module path).
func WithBase(r *http.Request, base string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), baseKey{}, base))
}

func (s *Server) baseFor(r *http.Request) string {
	if b, ok := r.Context().Value(baseKey{}).(string); ok {
		return b
	}
	return s.Base
}

// Handler returns the mux; paths are relative to the mount prefix.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	h := func(pattern string, action Action, f func(w http.ResponseWriter, r *http.Request) (any, error)) {
		mux.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
			if err := s.allow(r, action); err != nil {
				s.challenge(w, err)
				writeErr(w, err)
				return
			}
			v, err := f(w, r)
			if err != nil {
				writeErr(w, err)
				return
			}
			if v != nil {
				writeJSON(w, http.StatusOK, v)
			}
		})
	}
	h("GET /api/meta", ActionNone, s.meta)
	h("POST /api/auth/login", ActionNone, s.login)
	h("POST /api/auth/logout", ActionNone, s.logout)
	h("GET /api/processors", ActionView, func(http.ResponseWriter, *http.Request) (any, error) { return flow.Specs(), nil })
	h("GET /api/functions", ActionView, func(http.ResponseWriter, *http.Request) (any, error) { return exprx.Catalog(), nil })
	h("GET /api/types", ActionView, func(http.ResponseWriter, *http.Request) (any, error) { return flow.TypeOptions(), nil })

	h("GET /api/connections", ActionView, s.listConnections)
	h("POST /api/connections/test", ActionData, s.testConnection)
	h("GET /api/connections/{id}/tables", ActionData, s.listTables)
	h("GET /api/connections/{id}/tables/{table}", ActionData, s.describeTable)

	h("GET /api/flows", ActionView, s.listFlows)
	h("POST /api/flows", ActionEdit, s.createFlow)
	h("POST /api/flows/validate", ActionView, s.validate)
	h("POST /api/flows/wizard", ActionEdit, s.wizard)
	h("POST /api/flows/schema", ActionData, s.schema)
	h("POST /api/flows/preview", ActionData, s.preview)
	h("POST /api/flows/sink-plan", ActionData, s.sinkPlan)
	h("GET /api/flows/{id}", ActionView, s.getFlow)
	h("PUT /api/flows/{id}", ActionEdit, s.updateFlow)
	h("DELETE /api/flows/{id}", ActionEdit, s.deleteFlow)
	h("POST /api/flows/{id}/duplicate", ActionEdit, s.duplicateFlow)
	h("POST /api/flows/{id}/runs", ActionRun, s.startRun)
	h("GET /api/flows/{id}/runs", ActionView, s.listRuns)

	h("PUT /api/flows/{id}/schedule", ActionEdit, s.setSchedule)
	h("GET /api/flows/{id}/versions", ActionView, s.listVersions)
	h("GET /api/flows/{id}/versions/{version}", ActionView, s.getVersion)
	h("POST /api/flows/{id}/versions/{version}/restore", ActionEdit, s.restoreVersion)
	h("POST /api/flows/folder", ActionEdit, s.setFolder)
	h("GET /api/parameters", ActionView, s.listParameters)
	h("PUT /api/parameters/{name}", ActionEdit, s.saveParameter)
	h("DELETE /api/parameters/{name}", ActionEdit, s.deleteParameter)
	h("POST /api/script/test", ActionEdit, s.testScript)
	h("POST /api/expr/test", ActionEdit, s.testExpr)

	h("GET /api/runs/active", ActionView, func(http.ResponseWriter, *http.Request) (any, error) { return s.Runs.ActiveRuns(), nil })
	h("POST /api/runs/all", ActionRun, s.runAll)
	h("POST /api/runs/stop-all", ActionRun, s.stopAll)
	h("GET /api/runs/{id}", ActionView, s.getRun)
	h("POST /api/runs/{id}/pause", ActionRun, s.runAction)
	h("POST /api/runs/{id}/resume", ActionRun, s.runAction)
	h("POST /api/runs/{id}/stop", ActionRun, s.runAction)
	h("GET /api/runs/{id}/bulletins", ActionView, s.bulletins)
	h("GET /api/runs/{id}/deadletters", ActionData, s.deadLetters)
	h("POST /api/runs/{id}/deadletters/replay", ActionRun, s.replayDeadLetters)
	h("GET /api/runs/{id}/queues", ActionData, s.queues)
	h("POST /api/runs/{id}/queues/{edge}/empty", ActionRun, s.emptyQueue)
	mux.HandleFunc("GET /api/runs/{id}/events", s.guard(ActionView, s.events))
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeErr(w, httpError{http.StatusNotFound, "no such endpoint"})
	})
	mux.HandleFunc("/", s.guard(ActionView, s.serveUI))
	return mux
}

type httpError struct {
	status int
	msg    string
}

func (e httpError) Error() string { return e.msg }

func badRequest(format string, args ...any) error {
	return httpError{http.StatusBadRequest, fmt.Sprintf(format, args...)}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	var he httpError
	switch {
	case errors.As(err, &he):
		status = he.status
	case errors.Is(err, store.ErrNotFound):
		status = http.StatusNotFound
	case errors.Is(err, flow.ErrConflict):
		status = http.StatusConflict
	case errors.Is(err, ErrUnauthenticated):
		status = http.StatusUnauthorized
	case errors.Is(err, ErrForbidden):
		status = http.StatusForbidden
	}
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func decode(r *http.Request, v any) error {
	dec := json.NewDecoder(http.MaxBytesReader(nil, r.Body, 32<<20))
	dec.UseNumber()
	if err := dec.Decode(v); err != nil {
		return badRequest("invalid JSON body: %v", err)
	}
	return nil
}

// numbersToGo converts json.Number values (from UseNumber) into float64 so
// stored configs round-trip as plain JSON numbers.
func numbersToGo(v any) any {
	switch x := v.(type) {
	case json.Number:
		if i, err := x.Int64(); err == nil {
			return float64(i)
		}
		f, _ := x.Float64()
		return f
	case map[string]any:
		for k, e := range x {
			x[k] = numbersToGo(e)
		}
	case []any:
		for i, e := range x {
			x[i] = numbersToGo(e)
		}
	}
	return v
}

func normalizeGraph(g *model.Graph) {
	if g == nil {
		return
	}
	if g.Nodes == nil {
		g.Nodes = []model.Node{}
	}
	if g.Edges == nil {
		g.Edges = []model.Edge{}
	}
	for i := range g.Nodes {
		if g.Nodes[i].Config == nil {
			g.Nodes[i].Config = map[string]any{}
		}
		numbersToGo(g.Nodes[i].Config)
	}
}

func (s *Server) meta(_ http.ResponseWriter, r *http.Request) (any, error) {
	perms := map[Action]bool{}
	for _, a := range []Action{ActionView, ActionEdit, ActionRun, ActionData} {
		perms[a] = s.allow(r, a) == nil
	}
	mode := "none"
	switch {
	case s.Authorize != nil:
		mode = "host"
	case s.Basic != nil:
		mode = "basic"
	case s.Sessions != nil:
		mode = "builtin"
	}
	return map[string]any{"version": s.Version, "title": s.Title, "permissions": perms, "user": s.actor(r),
		"auth": mode, "maxParallelRuns": s.Runs.MaxParallel, "authenticated": s.allow(r, ActionView) == nil || mode == "none"}, nil
}

// ---- connections (declared in code; read-only here) ----

func (s *Server) listConnections(http.ResponseWriter, *http.Request) (any, error) {
	out := make([]dbx.Connection, len(s.Conns))
	copy(out, s.Conns)
	return out, nil
}

func (s *Server) testConnection(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		ID string `json:"id"`
	}
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	c, err := s.Resolve(r.Context(), b.ID)
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	start := time.Now()
	db, err := dbx.Open(ctx, c)
	if err != nil {
		return map[string]any{"ok": false, "error": err.Error()}, nil
	}
	defer db.Close()
	v, err := db.Version(ctx)
	if err != nil {
		return map[string]any{"ok": false, "error": err.Error()}, nil
	}
	return map[string]any{"ok": true, "serverVersion": v, "latencyMs": time.Since(start).Milliseconds()}, nil
}

func (s *Server) open(r *http.Request) (dbx.DB, error) {
	c, err := s.Resolve(r.Context(), r.PathValue("id"))
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	return dbx.Open(ctx, c)
}

func (s *Server) listTables(_ http.ResponseWriter, r *http.Request) (any, error) {
	db, err := s.open(r)
	if err != nil {
		return nil, err
	}
	defer db.Close()
	out, err := db.ListTables(r.Context())
	if out == nil {
		out = []dbx.TableSummary{}
	}
	if db.Driver() == "postgres" {
		for i := range out {
			out[i].Name = dbx.TableName(out[i].Schema, out[i].Name)
		}
	}
	return out, err
}

func (s *Server) describeTable(_ http.ResponseWriter, r *http.Request) (any, error) {
	db, err := s.open(r)
	if err != nil {
		return nil, err
	}
	defer db.Close()
	return db.Describe(r.Context(), r.PathValue("table"))
}

// ---- flows ----

func (s *Server) listFlows(_ http.ResponseWriter, r *http.Request) (any, error) {
	flows, err := s.Store.ListFlows(r.Context())
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	for i := range flows {
		flows[i].NextRun = flow.NextRun(flows[i], now)
		if runs, err := s.Store.ListRuns(r.Context(), flows[i].ID, 1); err == nil && len(runs) > 0 {
			run := runs[0]
			if d, err := s.Runs.Detail(r.Context(), run.ID); err == nil {
				run = d.RunSummary
			}
			flows[i].LastRun = &run
		}
	}
	return flows, nil
}

type flowBody struct {
	Name        *string      `json:"name"`
	Description *string      `json:"description"`
	Graph       *model.Graph `json:"graph"`
	DependsOn   *[]string    `json:"dependsOn"`
	Folder      *string      `json:"folder"`
	// Note describes this edit in the flow's history.
	Note *string `json:"note"`
}

// checkDependencies validates a flow's dependsOn against all flows.
func (s *Server) checkDependencies(r *http.Request, f *model.Flow) error {
	flows, err := s.Store.ListFlows(r.Context())
	if err != nil {
		return err
	}
	byID := map[string]bool{}
	for _, x := range flows {
		byID[x.ID] = true
	}
	seen := map[string]bool{}
	clean := []string{}
	for _, d := range f.DependsOn {
		switch {
		case d == f.ID:
			return badRequest("a flow cannot depend on itself")
		case !byID[d]:
			return badRequest("dependency %q does not exist", d)
		case !seen[d]:
			seen[d] = true
			clean = append(clean, d)
		}
	}
	f.DependsOn = clean
	replaced := false
	for i := range flows {
		if flows[i].ID == f.ID {
			flows[i].DependsOn, replaced = clean, true
		}
	}
	if !replaced {
		flows = append(flows, model.Flow{ID: "(new)", Name: f.Name, DependsOn: clean})
	}
	if _, err := flow.DependencyOrder(flows, nil); err != nil {
		return badRequest("%v", err)
	}
	return nil
}

func (s *Server) createFlow(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b flowBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	f := model.Flow{Graph: b.Graph}
	if b.Name != nil {
		f.Name = strings.TrimSpace(*b.Name)
	}
	if f.Name == "" {
		f.Name = "Untitled flow"
	}
	if b.Description != nil {
		f.Description = *b.Description
	}
	if b.DependsOn != nil {
		f.DependsOn = *b.DependsOn
		if err := s.checkDependencies(r, &f); err != nil {
			return nil, err
		}
	}
	normalizeGraph(f.Graph)
	return s.Store.SaveFlow(r.Context(), f)
}

func (s *Server) getFlow(_ http.ResponseWriter, r *http.Request) (any, error) {
	f, err := s.Store.GetFlow(r.Context(), r.PathValue("id"))
	if err != nil {
		return nil, err
	}
	if runs, err := s.Store.ListRuns(r.Context(), f.ID, 1); err == nil && len(runs) > 0 {
		f.LastRun = &runs[0]
	}
	return f, nil
}

func (s *Server) updateFlow(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b flowBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	f, err := s.Store.GetFlow(r.Context(), r.PathValue("id"))
	if err != nil {
		return nil, err
	}
	if b.Name != nil {
		f.Name = strings.TrimSpace(*b.Name)
	}
	if b.Description != nil {
		f.Description = *b.Description
	}
	if b.Graph != nil {
		normalizeGraph(b.Graph)
		f.Graph = b.Graph
	}
	if b.DependsOn != nil {
		f.DependsOn = *b.DependsOn
		if err := s.checkDependencies(r, &f); err != nil {
			return nil, err
		}
	}
	if b.Folder != nil {
		f.Folder = strings.Trim(strings.TrimSpace(*b.Folder), "/")
	}
	f.Actor = s.actor(r)
	if b.Note != nil {
		f.Note = *b.Note
	}
	return s.Store.SaveFlow(r.Context(), f)
}

func (s *Server) deleteFlow(_ http.ResponseWriter, r *http.Request) (any, error) {
	for _, run := range s.Runs.ActiveRuns() {
		if run.FlowID == r.PathValue("id") {
			return nil, fmt.Errorf("%w: stop the active run first", flow.ErrConflict)
		}
	}
	flows, err := s.Store.ListFlows(r.Context())
	if err != nil {
		return nil, err
	}
	for _, f := range flows {
		for _, d := range f.DependsOn {
			if d == r.PathValue("id") {
				return nil, fmt.Errorf("%w: flow %q depends on this flow; remove that dependency first", flow.ErrConflict, f.Name)
			}
		}
	}
	return map[string]bool{"ok": true}, s.Store.DeleteFlow(r.Context(), r.PathValue("id"))
}

func (s *Server) duplicateFlow(_ http.ResponseWriter, r *http.Request) (any, error) {
	f, err := s.Store.GetFlow(r.Context(), r.PathValue("id"))
	if err != nil {
		return nil, err
	}
	f.ID, f.Name, f.DependsOn = "", f.Name+" (copy)", append([]string{}, f.DependsOn...)
	return s.Store.SaveFlow(r.Context(), f)
}

type graphBody struct {
	Graph  *model.Graph `json:"graph"`
	NodeID string       `json:"nodeId"`
	Table  string       `json:"table"`
	Limit  int          `json:"limit"`
}

func (s *Server) validate(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b graphBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	normalizeGraph(b.Graph)
	return flow.Validate(b.Graph), nil
}

func (s *Server) schema(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b graphBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	if b.Graph == nil {
		return nil, badRequest("graph is required")
	}
	normalizeGraph(b.Graph)
	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()
	tables, err := flow.InputSchema(ctx, s.Resolve, b.Graph, b.NodeID, 25)
	if tables == nil {
		tables = []model.TableSchema{}
	}
	resp := map[string]any{"tables": tables}
	if err != nil {
		resp["error"] = err.Error()
	}
	return resp, nil
}

func (s *Server) sinkPlan(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b graphBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	if b.Graph == nil {
		return nil, badRequest("graph is required")
	}
	normalizeGraph(b.Graph)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	plan, err := flow.SinkPlan(ctx, s.Resolve, b.Graph, b.NodeID, 500)
	if err != nil {
		return nil, badRequest("%v", err)
	}
	return plan, nil
}

type stageOut struct {
	NodeID  string          `json:"nodeId"`
	Name    string          `json:"name"`
	Type    string          `json:"type"`
	Port    string          `json:"port"`
	Table   string          `json:"table"`
	Columns []record.Column `json:"columns"`
	Rows    [][]any         `json:"rows"`
	Errors  []flow.RowErr   `json:"errors"`
}

func (s *Server) preview(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b graphBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	if b.Graph == nil {
		return nil, badRequest("graph is required")
	}
	normalizeGraph(b.Graph)
	if b.Limit <= 0 {
		b.Limit = 20
	}
	b.Limit = min(b.Limit, 500)
	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()
	sm, err := flow.NewSimulator(ctx, s.Resolve, b.Graph, b.NodeID)
	if err != nil {
		return nil, badRequest("%v", err)
	}
	defer sm.Close()
	sim, err := sm.Run(ctx, b.Table, b.Limit)
	if err != nil {
		return nil, badRequest("%v", err)
	}
	// Tables can be routed along different connections: when no table was
	// asked for and the first one never reaches this node, show one that does.
	isSource := false
	if n := b.Graph.Node(b.NodeID); n != nil {
		if spec, ok := flow.SpecFor(n.Type); ok && spec.Inputs == 0 {
			isSource = true
		}
	}
	if b.Table == "" && !isSource && len(sim.Inputs) == 0 {
		for i, t := range sm.Tables() {
			if i >= 50 || ctx.Err() != nil {
				break
			}
			if t == sim.Table {
				continue
			}
			alt, err := sm.Run(ctx, t, b.Limit)
			if err == nil && len(alt.Inputs) > 0 {
				sim = alt
				break
			}
		}
	}
	// The rows arriving at the node (merged when several connections feed it).
	var input *stageOut
	if len(sim.Inputs) > 0 {
		in := sim.Inputs[0]
		cols := in.Columns
		var rows [][]any
		same := func(a, b []record.Column) bool {
			if len(a) != len(b) {
				return false
			}
			for i := range a {
				if a[i].Name != b[i].Name {
					return false
				}
			}
			return true
		}
		for _, x := range sim.Inputs {
			if x.Table == in.Table && same(x.Columns, cols) {
				rows = append(rows, x.Rows...)
			}
		}
		if cols == nil {
			cols = []record.Column{}
		}
		input = &stageOut{NodeID: b.NodeID, Port: "input", Table: in.Table, Columns: cols, Rows: displayRows(rows), Errors: []flow.RowErr{}}
	}
	stages := []stageOut{}
	for _, st := range sim.Stages {
		so := stageOut{NodeID: st.NodeID, Name: st.Name, Type: st.Type, Port: st.Port, Table: st.Batch.Table,
			Columns: st.Batch.Columns, Rows: displayRows(st.Batch.Rows), Errors: st.RowErrs}
		if so.Columns == nil {
			so.Columns = []record.Column{}
		}
		if so.Errors == nil {
			so.Errors = []flow.RowErr{}
		}
		stages = append(stages, so)
	}
	tables := sim.Tables
	if tables == nil {
		tables = []string{}
	}
	return map[string]any{"table": sim.Table, "tables": tables, "stages": stages, "input": input,
		"reaches": isSource || len(sim.Inputs) > 0}, nil
}

// displayRows makes values JSON-friendly for the grid.
func displayRows(rows [][]any) [][]any {
	out := make([][]any, len(rows))
	for i, row := range rows {
		o := make([]any, len(row))
		for j, v := range row {
			o[j] = displayValue(v)
		}
		out[i] = o
	}
	return out
}

func displayValue(v any) any {
	switch x := v.(type) {
	case []byte:
		if len(x) > 64 {
			return fmt.Sprintf("\\x%s… (%d bytes)", hex.EncodeToString(x[:64]), len(x))
		}
		return "\\x" + hex.EncodeToString(x)
	case time.Time:
		return x.Format("2006-01-02 15:04:05.999999Z07:00")
	case uint64:
		return strconv.FormatUint(x, 10)
	}
	return v
}

func (s *Server) testScript(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		Script  string          `json:"script"`
		Mode    string          `json:"mode"`
		Columns []record.Column `json:"columns"`
		Rows    [][]any         `json:"rows"`
	}
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	var logs []string
	logf := func(m string) {
		if len(logs) < 500 {
			logs = append(logs, m)
		}
	}
	resp := map[string]any{"columns": []record.Column{}, "rows": [][]any{}, "dropped": 0, "logs": &logs}
	prog, err := script.Compile(b.Script, logf)
	if err != nil {
		setScriptErr(resp, err)
		return resp, nil
	}
	rows := make([][]any, len(b.Rows))
	for i, row := range b.Rows {
		rows[i] = make([]any, len(row))
		for j, v := range row {
			var c record.Column
			if j < len(b.Columns) {
				c = b.Columns[j]
			}
			rows[i][j] = fromJSON(numbersToGo(v), c)
		}
	}
	batch := &record.Batch{Table: "test", Columns: b.Columns, Rows: rows}
	res, err := prog.Run(batch, logf)
	if err != nil {
		setScriptErr(resp, err)
		return resp, nil
	}
	resp["columns"], resp["rows"], resp["dropped"] = res.Columns, displayRows(res.Rows), res.Dropped
	if len(res.Failed) > 0 {
		setScriptErr(resp, fmt.Errorf("row %d: %w", res.Failed[0].Row+1, res.Failed[0].Err))
		var se *script.Error
		if errors.As(res.Failed[0].Err, &se) {
			resp["line"] = se.Line
		}
	}
	return resp, nil
}

// setScriptErr reports the message and, separately, its line (the editor
// shows "Line N:" itself, so the message must not repeat it).
func setScriptErr(resp map[string]any, err error) {
	resp["error"] = err.Error()
	var se *script.Error
	if errors.As(err, &se) && se.Line > 0 {
		resp["line"] = se.Line
		resp["error"] = strings.Replace(err.Error(), fmt.Sprintf("line %d: ", se.Line), "", 1)
	}
}

// fromJSON restores canonical values from the UI's JSON rows.
func fromJSON(v any, c record.Column) any {
	f, ok := v.(float64)
	if ok {
		switch c.Type {
		case record.Int16, record.Int32, record.Int64, record.Year, record.Uint64:
			return int64(f)
		}
		if f == float64(int64(f)) && c.Type == "" {
			return int64(f)
		}
		return f
	}
	if s, ok := v.(string); ok {
		switch c.Type {
		case record.Date, record.Timestamp, record.TimestampTZ:
			for _, l := range []string{"2006-01-02 15:04:05.999999Z07:00", time.RFC3339Nano, "2006-01-02 15:04:05.999999", "2006-01-02"} {
				if t, err := time.Parse(l, s); err == nil {
					return t
				}
			}
		case record.Bytes:
			if strings.HasPrefix(s, "\\x") {
				if b, err := hex.DecodeString(s[2:]); err == nil {
					return b
				}
			}
		}
	}
	return v
}

func (s *Server) testExpr(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		Expr    string          `json:"expr"`
		Columns []record.Column `json:"columns"`
		Row     []any           `json:"row"`
		Table   string          `json:"table"`
	}
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	p, err := exprx.Compile(b.Expr)
	if err != nil {
		return map[string]any{"value": nil, "type": "", "error": err.Error()}, nil
	}
	names := make([]string, len(b.Columns))
	row := make([]any, len(b.Columns))
	for i, c := range b.Columns {
		names[i] = c.Name
		if i < len(b.Row) {
			row[i] = fromJSON(numbersToGo(b.Row[i]), c)
		}
	}
	v, err := p.Run(exprx.Env(nil, b.Table, names, row))
	if err != nil {
		return map[string]any{"value": nil, "type": "", "error": err.Error()}, nil
	}
	t := "null"
	if v != nil {
		t = fmt.Sprintf("%T", v)
		if c := script.InferColumn("", v); c.Type != "" {
			t = string(c.Type)
		}
	}
	return map[string]any{"value": displayValue(v), "type": t}, nil
}

// ---- runs ----

func (s *Server) startRun(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		Resume bool `json:"resume"`
		// WithDependencies (default true) first runs prerequisites whose
		// latest run is not completed.
		WithDependencies *bool `json:"withDependencies"`
	}
	if r.ContentLength != 0 {
		if err := decode(r, &b); err != nil {
			return nil, err
		}
	}
	var run model.RunSummary
	var err error
	if b.WithDependencies == nil || *b.WithDependencies {
		run, _, err = s.Runs.StartWithDependencies(r.Context(), r.PathValue("id"), b.Resume, s.actor(r))
	} else {
		run, err = s.Runs.Start(r.Context(), r.PathValue("id"), b.Resume, s.actor(r))
	}
	if err != nil && !errors.Is(err, store.ErrNotFound) && !errors.Is(err, flow.ErrConflict) {
		return nil, badRequest("%v", err)
	}
	return run, err
}

func (s *Server) runAll(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		FlowIDs []string `json:"flowIds"`
		Resume  bool     `json:"resume"`
	}
	if r.ContentLength != 0 {
		if err := decode(r, &b); err != nil {
			return nil, err
		}
	}
	return s.Runs.RunAll(r.Context(), b.FlowIDs, b.Resume, s.actor(r))
}

func (s *Server) stopAll(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b struct {
		FlowIDs []string `json:"flowIds"`
	}
	if r.ContentLength != 0 {
		if err := decode(r, &b); err != nil {
			return nil, err
		}
	}
	return map[string]any{"stopped": s.Runs.StopRuns(b.FlowIDs, s.actor(r))}, nil
}

func (s *Server) listRuns(_ http.ResponseWriter, r *http.Request) (any, error) {
	runs, err := s.Store.ListRuns(r.Context(), r.PathValue("id"), 50)
	if err != nil {
		return nil, err
	}
	for i := range runs {
		if ex, ok := s.Runs.Active(runs[i].ID); ok {
			runs[i] = ex.Summary()
		}
	}
	return runs, nil
}

func (s *Server) getRun(_ http.ResponseWriter, r *http.Request) (any, error) {
	return s.Runs.Detail(r.Context(), r.PathValue("id"))
}

func (s *Server) runAction(_ http.ResponseWriter, r *http.Request) (any, error) {
	ex, ok := s.Runs.Active(r.PathValue("id"))
	if !ok {
		return nil, fmt.Errorf("%w: run is not active", flow.ErrConflict)
	}
	who := s.actor(r)
	switch path.Base(r.URL.Path) {
	case "pause":
		ex.Pause(who)
	case "resume":
		ex.Resume(who)
	case "stop":
		ex.Stop(who)
	}
	return ex.Summary(), nil
}

func (s *Server) bulletins(_ http.ResponseWriter, r *http.Request) (any, error) {
	after, _ := strconv.ParseInt(r.URL.Query().Get("after"), 10, 64)
	return s.Store.ListBulletins(r.Context(), r.PathValue("id"), after, 1000)
}

func (s *Server) deadLetters(_ http.ResponseWriter, r *http.Request) (any, error) {
	q := r.URL.Query()
	off, _ := strconv.Atoi(q.Get("offset"))
	lim, _ := strconv.Atoi(q.Get("limit"))
	if lim <= 0 || lim > 500 {
		lim = 50
	}
	total, items, err := s.Store.ListDeadLetters(r.Context(), r.PathValue("id"), q.Get("table"), off, lim)
	if err != nil {
		return nil, err
	}
	return map[string]any{"total": total, "items": items}, nil
}

func (s *Server) events(w http.ResponseWriter, r *http.Request) {
	fl, ok := w.(http.Flusher)
	if !ok {
		writeErr(w, errors.New("streaming unsupported"))
		return
	}
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	send := func(event string, v any) {
		b, _ := json.Marshal(v)
		fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, b)
		fl.Flush()
	}
	ex, live := s.Runs.Active(id)
	if !live {
		d, err := s.Runs.Detail(r.Context(), id)
		if err != nil {
			send("error", map[string]string{"error": err.Error()})
			return
		}
		send("detail", d)
		send("end", d.RunSummary)
		return
	}
	ch, cancel := ex.Subscribe()
	defer cancel()
	send("detail", ex.Detail())
	keep := time.NewTicker(15 * time.Second)
	defer keep.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case <-keep.C:
			fmt.Fprint(w, ": keepalive\n\n")
			fl.Flush()
		case e, ok := <-ch:
			if !ok {
				send("end", ex.Summary())
				return
			}
			send(e.Type, e.Data)
			if e.Type == "end" {
				return
			}
		}
	}
}

// ---- UI ----

func (s *Server) serveUI(w http.ResponseWriter, r *http.Request) {
	p := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
	if p != "" && p != "index.html" {
		if f, err := s.UI.Open(p); err == nil {
			st, _ := f.Stat()
			f.Close()
			if st != nil && !st.IsDir() {
				if strings.HasPrefix(p, "assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				}
				http.ServeFileFS(w, r, s.UI, p)
				return
			}
		}
	}
	base := s.baseFor(r)
	html, ok := s.index.Load(base)
	if !ok || s.DevUI {
		raw, err := fs.ReadFile(s.UI, "index.html")
		if err != nil {
			raw = []byte("<!doctype html><p>UI bundle missing</p>")
		}
		cfg, _ := json.Marshal(map[string]string{"base": base, "title": s.Title})
		inject := "<script>window.__NIFI__=" + string(cfg) + "</script>"
		page := string(raw)
		if i := strings.Index(page, "</head>"); i >= 0 {
			page = page[:i] + inject + page[i:]
		} else {
			page = inject + page
		}
		html = []byte(page)
		s.index.Store(base, html)
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(html.([]byte))
}

// ---- schedules & parameters ----

type scheduleBody struct {
	Schedule *string `json:"schedule"`
	Enabled  *bool   `json:"enabled"`
}

func (s *Server) setSchedule(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b scheduleBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	f, err := s.Store.GetFlow(r.Context(), r.PathValue("id"))
	if err != nil {
		return nil, err
	}
	if b.Schedule != nil {
		f.Schedule = strings.TrimSpace(*b.Schedule)
	}
	if b.Enabled != nil {
		f.ScheduleEnabled = *b.Enabled
	}
	if f.Schedule == "" {
		f.ScheduleEnabled = false
	} else if err := flow.ValidateSchedule(f.Schedule); err != nil {
		return nil, badRequest("%s", err.Error())
	}
	if err := s.Store.SetSchedule(r.Context(), f.ID, f.Schedule, f.ScheduleEnabled); err != nil {
		return nil, err
	}
	f.NextRun = flow.NextRun(f, time.Now().UTC())
	return f, nil
}

func (s *Server) listParameters(_ http.ResponseWriter, r *http.Request) (any, error) {
	out, err := s.parameters(r.Context())
	if err != nil {
		return nil, err
	}
	for i := range out {
		if out[i].Sensitive {
			out[i].Value = ""
		}
	}
	return out, nil
}

// parameters merges the application's fixed parameters with the stored ones.
func (s *Server) parameters(ctx context.Context) ([]model.Parameter, error) {
	stored, err := s.Store.ListParameters(ctx)
	if err != nil {
		return nil, err
	}
	out := append([]model.Parameter{}, s.Fixed...)
	for i := range out {
		out[i].Fixed = true
	}
	have := map[string]bool{}
	for _, p := range out {
		have[p.Name] = true
	}
	for _, p := range stored {
		if !have[p.Name] {
			out = append(out, p)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}

var paramName = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_.\-]*$`)

func (s *Server) saveParameter(_ http.ResponseWriter, r *http.Request) (any, error) {
	var p model.Parameter
	if err := decode(r, &p); err != nil {
		return nil, err
	}
	p.Name = strings.TrimSpace(r.PathValue("name"))
	if !paramName.MatchString(p.Name) {
		return nil, badRequest("a parameter name starts with a letter and holds letters, digits, _, . or -")
	}
	for _, f := range s.Fixed {
		if f.Name == p.Name {
			return nil, badRequest("#{%s} is set by the application and cannot be changed here", p.Name)
		}
	}
	if err := s.Store.SaveParameter(r.Context(), p); err != nil {
		return nil, err
	}
	return p, s.refreshParameters(r.Context())
}

func (s *Server) deleteParameter(_ http.ResponseWriter, r *http.Request) (any, error) {
	name := r.PathValue("name")
	for _, f := range s.Fixed {
		if f.Name == name {
			return nil, badRequest("#{%s} is set by the application and cannot be removed here", name)
		}
	}
	if err := s.Store.DeleteParameter(r.Context(), name); err != nil {
		return nil, err
	}
	return map[string]any{"ok": true}, s.refreshParameters(r.Context())
}

// LoadParameters publishes the parameter set at startup.
func (s *Server) LoadParameters(ctx context.Context) error { return s.refreshParameters(ctx) }

// refreshParameters republishes the parameter set the engine resolves with.
func (s *Server) refreshParameters(ctx context.Context) error {
	all, err := s.parameters(ctx)
	if err != nil {
		return err
	}
	m := map[string]string{}
	for _, p := range all {
		m[p.Name] = p.Value
	}
	flow.SetParameters(m)
	return nil
}

// ---- folders, history, queues and replay ----

func (s *Server) listVersions(_ http.ResponseWriter, r *http.Request) (any, error) {
	return s.Store.ListVersions(r.Context(), r.PathValue("id"))
}

func (s *Server) getVersion(_ http.ResponseWriter, r *http.Request) (any, error) {
	v, err := strconv.Atoi(r.PathValue("version"))
	if err != nil {
		return nil, badRequest("version must be a number")
	}
	return s.Store.GetVersion(r.Context(), r.PathValue("id"), v)
}

// restoreVersion saves an earlier graph as a new edit, so the history keeps
// both what was restored and what it replaced.
func (s *Server) restoreVersion(_ http.ResponseWriter, r *http.Request) (any, error) {
	n, err := strconv.Atoi(r.PathValue("version"))
	if err != nil {
		return nil, badRequest("version must be a number")
	}
	id := r.PathValue("id")
	v, err := s.Store.GetVersion(r.Context(), id, n)
	if err != nil {
		return nil, err
	}
	f, err := s.Store.GetFlow(r.Context(), id)
	if err != nil {
		return nil, err
	}
	f.Name, f.Description, f.Graph, f.DependsOn = v.Name, v.Description, v.Graph, v.DependsOn
	f.Actor, f.Note = s.actor(r), fmt.Sprintf("restored version %d", n)
	return s.Store.SaveFlow(r.Context(), f)
}

type folderBody struct {
	IDs    []string `json:"ids"`
	Folder string   `json:"folder"`
}

func (s *Server) setFolder(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b folderBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	if len(b.IDs) == 0 {
		return nil, badRequest("no flows given")
	}
	folder := strings.Trim(strings.TrimSpace(b.Folder), "/")
	if err := s.Store.SetFolder(r.Context(), b.IDs, folder); err != nil {
		return nil, err
	}
	return map[string]any{"ok": true, "moved": len(b.IDs), "folder": folder}, nil
}

func (s *Server) queues(_ http.ResponseWriter, r *http.Request) (any, error) {
	ex, ok := s.Runs.Active(r.PathValue("id"))
	if !ok {
		return []model.QueueInfo{}, nil // a finished run holds nothing
	}
	return ex.Queues(), nil
}

func (s *Server) emptyQueue(_ http.ResponseWriter, r *http.Request) (any, error) {
	ex, ok := s.Runs.Active(r.PathValue("id"))
	if !ok {
		return nil, badRequest("that run is not going any more")
	}
	dropped, err := ex.EmptyQueue(r.PathValue("edge"))
	if err != nil {
		return nil, badRequest("%s", err.Error())
	}
	return map[string]any{"ok": true, "droppedRows": dropped}, nil
}

type replayBody struct {
	NodeID string   `json:"nodeId"`
	IDs    []string `json:"ids"`
}

func (s *Server) replayDeadLetters(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b replayBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	if b.NodeID == "" {
		return nil, badRequest("nodeId is required")
	}
	return s.Runs.ReplayDeadLetters(r.Context(), r.PathValue("id"), b.NodeID, b.IDs, s.actor(r))
}
