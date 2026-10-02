package web

import (
	"net/http"
	"net/url"
	"sort"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
)

// flowsView is the flow list as the URL asks for it: ?view=cards|table|graph,
// ?sort=updated|name|status, ?q= and ?folder= (a folder path, or
// "~ungrouped"). nifi.js remembers the last view, sort and folder and
// restores them when the page is opened bare.
type flowsView struct {
	View, Sort, Q, Folder string

	In        *instance
	Shown     []model.Flow // filtered, sorted, in the folder
	InFolder  []model.Flow // in the folder, unfiltered (the graph's input)
	Tree      []*folderNode
	Ungrouped int
	Estimates map[string]int64 // active run id → estimated rows

	Running, Pending int
}

var statusRank = map[model.RunStatus]int{
	model.RunRunning: 0, model.RunPaused: 1, model.RunStopping: 1, model.RunPending: 2,
	model.RunFailed: 3, model.RunStopped: 4, model.RunCompleted: 5,
}

func flowsRoute(c *ctx) (page, int) {
	q := c.r.URL.Query()
	v := flowsView{View: q.Get("view"), Sort: q.Get("sort"), Q: strings.TrimSpace(q.Get("q")), Folder: q.Get("folder")}
	switch v.View {
	case "cards", "graph":
	default:
		v.View = "table"
	}
	switch v.Sort {
	case "name", "status":
	default:
		v.Sort = "updated"
	}
	if v.Folder != ungrouped {
		v.Folder = normalizeFolder(v.Folder)
	}
	v.In = c.instance()
	in := v.In
	for _, f := range in.Flows {
		if !inScope(f, v.Folder) {
			continue
		}
		v.InFolder = append(v.InFolder, f)
		if matches(v.Q, f.Name, f.Description) {
			v.Shown = append(v.Shown, f)
		}
	}
	rank := func(f model.Flow) int {
		if r := in.run(f.ID); r != nil {
			if n, ok := statusRank[r.Status]; ok {
				return n
			}
		}
		return 6
	}
	sort.SliceStable(v.Shown, func(i, j int) bool {
		a, b := v.Shown[i], v.Shown[j]
		switch v.Sort {
		case "name":
			return strings.ToLower(a.Name) < strings.ToLower(b.Name)
		case "status":
			if ra, rb := rank(a), rank(b); ra != rb {
				return ra < rb
			}
			return strings.ToLower(a.Name) < strings.ToLower(b.Name)
		}
		return a.UpdatedAt.After(b.UpdatedAt)
	})
	v.Tree = buildFolderTree(in.Flows)
	v.Ungrouped = countUngrouped(in.Flows)
	v.Estimates = map[string]int64{}
	for _, r := range in.Active {
		switch r.Status {
		case model.RunRunning:
			v.Running++
		case model.RunPending:
			v.Pending++
		}
		// Progress bars need the run's estimate, which only its detail has.
		if r.Status == model.RunPending || r.Live {
			continue
		}
		var d model.RunDetail
		if c.get("/runs/"+url.PathEscape(r.ID), &d) == nil {
			var est int64
			for _, t := range d.Tables {
				est += t.EstimatedRows
			}
			if est > 0 {
				v.Estimates[r.ID] = est
			}
		}
	}
	status := http.StatusOK
	body := flowsPage(c, v)
	if in.Err != nil && len(in.Flows) == 0 {
		body = emptyState("alert-triangle", "Could not load flows", in.Err.Error(), "", "")
	}
	return page{Nav: "flows", Title: "Flows", Live: "instance", Body: body}, status
}

// href is the flow list with some params changed ("" removes one).
func (v flowsView) href(c *ctx, set ...string) string {
	q := url.Values{}
	if v.View != "table" {
		q.Set("view", v.View)
	}
	if v.Sort != "updated" {
		q.Set("sort", v.Sort)
	}
	if v.Q != "" {
		q.Set("q", v.Q)
	}
	if v.Folder != "" {
		q.Set("folder", v.Folder)
	}
	for i := 0; i+1 < len(set); i += 2 {
		if set[i+1] == "" {
			q.Del(set[i])
		} else {
			q.Set(set[i], set[i+1])
		}
	}
	if len(q) == 0 {
		return c.href("/flows")
	}
	return c.href("/flows") + "?" + q.Encode()
}

// pick toggles a folder: choosing the current one goes back to all flows.
func (v flowsView) pick(c *ctx, folder string) string {
	if v.Folder == folder {
		return v.href(c, "folder", "")
	}
	return v.href(c, "folder", folder)
}

func (v flowsView) anyActive() bool {
	for _, r := range v.In.Active {
		if isActive(r.Status) {
			return true
		}
	}
	return false
}

// runSub is the line beside a flow's latest-run pill.
type runSub struct {
	Text, Title string
	Err         bool
}

func (v flowsView) runSub(f *model.Flow, r *model.RunSummary) runSub {
	if r == nil {
		return runSub{}
	}
	switch {
	case r.Status == model.RunPending:
		if w := v.In.waitingFor(f); len(w) > 0 {
			return runSub{Text: "waiting for " + strings.Join(w, ", "), Title: "Waiting for " + strings.Join(w, ", ")}
		}
		return runSub{Text: "queued", Title: "Queued for a free run slot"}
	case isActive(r.Status):
		s := fmtCompact(r.RowsWritten)
		if est := v.Estimates[r.ID]; est > 0 && !r.Live {
			s += " / ~" + fmtCompact(est)
		}
		return runSub{Text: s + " rows"}
	case r.Error != "":
		return runSub{Text: r.Error, Title: r.Error, Err: true}
	}
	return runSub{}
}

// runAllBody is POST /api/runs/all for some flows ("" = every flow).
func runAllBody(resume bool, ids ...string) string {
	if ids == nil {
		ids = []string{}
	}
	return jsonAttr(map[string]any{"flowIds": ids, "resume": resume})
}

func deleteBlockedMessage(f model.Flow, deps []string) string {
	quoted := make([]string, len(deps))
	for i, d := range deps {
		quoted[i] = "“" + d + "”"
	}
	verb := "depend"
	if len(deps) == 1 {
		verb = "depends"
	}
	return "Can't delete “" + f.Name + "”: " + strings.Join(quoted, ", ") + " " + verb + " on it. Remove the dependency first."
}

func statusBorder(r *model.RunSummary) string {
	if r == nil {
		return "border-l-border"
	}
	switch r.Status {
	case model.RunRunning, model.RunPaused, model.RunStopping:
		return "border-l-primary"
	case model.RunPending:
		return "border-l-warn"
	case model.RunCompleted:
		return "border-l-ok"
	case model.RunFailed:
		return "border-l-err"
	}
	return "border-l-secondary-foreground"
}

func chipTone(r *model.RunSummary) string {
	if r == nil {
		return "border-border"
	}
	switch r.Status {
	case model.RunRunning, model.RunPaused, model.RunStopping:
		return "border-primary/60"
	case model.RunPending:
		return "border-warn/60"
	case model.RunCompleted:
		return "border-ok/60"
	case model.RunFailed:
		return "border-err/60"
	}
	return "border-border-strong"
}

func runStatusText(r *model.RunSummary) string {
	if r == nil {
		return "never run"
	}
	return string(r.Status)
}

// graphFlows is what the dependency-graph island draws.
type graphFlow struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Folder    string            `json:"folder,omitempty"`
	DependsOn []string          `json:"dependsOn,omitempty"`
	Run       *model.RunSummary `json:"run,omitempty"`
	Waiting   []string          `json:"waiting,omitempty"`
}

func (v flowsView) graphProps(c *ctx) map[string]any {
	flows := make([]graphFlow, 0, len(v.InFolder))
	for i := range v.InFolder {
		f := &v.InFolder[i]
		flows = append(flows, graphFlow{ID: f.ID, Name: f.Name, Folder: f.Folder, DependsOn: f.DependsOn, Run: v.In.run(f.ID), Waiting: v.In.waitingFor(f)})
	}
	scope := v.Folder
	if scope == ungrouped {
		scope = ""
	}
	return map[string]any{"flows": flows, "scope": scope, "highlight": v.Q}
}
