package web

import (
	"sort"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
)

// instance is the state every page's status bar and the flow list read:
// the flows (each with its last run) and the runs that are active now.
type instance struct {
	Flows  []model.Flow
	Active []model.RunSummary
	Err    error

	runs map[string]*model.RunSummary // latest run per flow
	byID map[string]*model.Flow
}

// instance loads the flows and active runs once per request.
func (c *ctx) instance() *instance {
	if c.inst != nil {
		return c.inst
	}
	in := &instance{}
	if err := c.get("/flows", &in.Flows); err != nil {
		in.Err = err
	}
	if err := c.get("/runs/active", &in.Active); err != nil && in.Err == nil {
		in.Err = err
	}
	in.byID = map[string]*model.Flow{}
	for i := range in.Flows {
		in.byID[in.Flows[i].ID] = &in.Flows[i]
	}
	in.runs = latestRuns(in.Flows, in.Active)
	c.inst = in
	return in
}

func (in *instance) run(flowID string) *model.RunSummary { return in.runs[flowID] }

func (in *instance) flow(id string) *model.Flow { return in.byID[id] }

// latestRuns is each flow's newest run: an active one when it started no
// earlier than the flow's recorded last run, else that last run.
func latestRuns(flows []model.Flow, active []model.RunSummary) map[string]*model.RunSummary {
	out := map[string]*model.RunSummary{}
	for i := range flows {
		if flows[i].LastRun != nil {
			out[flows[i].ID] = flows[i].LastRun
		}
	}
	for i := range active {
		r := &active[i]
		if cur, ok := out[r.FlowID]; !ok || !r.StartedAt.Before(cur.StartedAt) {
			out[r.FlowID] = r
		}
	}
	return out
}

func isActive(s model.RunStatus) bool {
	switch s {
	case model.RunPending, model.RunRunning, model.RunPaused, model.RunStopping:
		return true
	}
	return false
}

// waitingFor names a flow's prerequisites whose latest run isn't complete.
func (in *instance) waitingFor(f *model.Flow) []string {
	var out []string
	for _, d := range f.DependsOn {
		if r := in.runs[d]; r != nil && r.Status == model.RunCompleted {
			continue
		}
		name := d
		if dep := in.byID[d]; dep != nil {
			name = dep.Name
		}
		out = append(out, name)
	}
	return out
}

// dependents are the flows that list id among their prerequisites.
func (in *instance) dependents(id string) []string {
	var out []string
	for _, f := range in.Flows {
		for _, d := range f.DependsOn {
			if d == id {
				out = append(out, f.Name)
			}
		}
	}
	return out
}

// tally is the status bar: how the instance's flows stand.
type tally struct {
	Flows, Running, Live, Completed, Failed, Stopped, NeverRun int
	RowsWritten, RowsFailed                                    int64
}

func (in *instance) tally() tally {
	t := tally{Flows: len(in.Flows)}
	activeBy := map[string]*model.RunSummary{}
	for i := range in.Active {
		activeBy[in.Active[i].FlowID] = &in.Active[i]
	}
	for _, f := range in.Flows {
		r := activeBy[f.ID]
		if r == nil {
			r = f.LastRun
		}
		if r == nil {
			t.NeverRun++
			continue
		}
		t.RowsWritten += r.RowsWritten
		t.RowsFailed += r.RowsFailed
		switch r.Status {
		case model.RunRunning, model.RunPaused, model.RunStopping, model.RunPending:
			t.Running++
			if r.Live {
				t.Live++
			}
		case model.RunCompleted:
			t.Completed++
		case model.RunFailed:
			t.Failed++
		default:
			t.Stopped++
		}
	}
	return t
}

// ---- folders ----
//
// A folder is only the "/"-separated path a flow carries; the tree is
// derived from those strings, so there is nothing to create or delete.

// ungrouped is the scope of flows filed in no folder.
const ungrouped = "~ungrouped"

func normalizeFolder(s string) string {
	var parts []string
	for _, p := range strings.Split(s, "/") {
		if p = strings.TrimSpace(p); p != "" {
			parts = append(parts, p)
		}
	}
	return strings.Join(parts, "/")
}

type folderNode struct {
	Name, Path string
	Total      int // flows here and below
	Children   []*folderNode
}

func buildFolderTree(flows []model.Flow) []*folderNode {
	root := &folderNode{}
	index := map[string]*folderNode{"": root}
	for _, f := range flows {
		path := normalizeFolder(f.Folder)
		if path == "" {
			continue
		}
		parent := root
		parts := strings.Split(path, "/")
		for i := range parts {
			p := strings.Join(parts[:i+1], "/")
			n := index[p]
			if n == nil {
				n = &folderNode{Name: parts[i], Path: p}
				index[p] = n
				parent.Children = append(parent.Children, n)
			}
			n.Total++
			parent = n
		}
	}
	var sortTree func([]*folderNode)
	sortTree = func(ns []*folderNode) {
		sort.Slice(ns, func(i, j int) bool { return strings.ToLower(ns[i].Name) < strings.ToLower(ns[j].Name) })
		for _, n := range ns {
			sortTree(n.Children)
		}
	}
	sortTree(root.Children)
	return root.Children
}

// folderPaths is every folder and its ancestors, sorted.
func folderPaths(flows []model.Flow) []string {
	seen := map[string]bool{}
	for _, f := range flows {
		parts := strings.Split(normalizeFolder(f.Folder), "/")
		for i := range parts {
			if p := strings.Join(parts[:i+1], "/"); p != "" {
				seen[p] = true
			}
		}
	}
	out := make([]string, 0, len(seen))
	for p := range seen {
		out = append(out, p)
	}
	sort.Strings(out)
	return out
}

func countUngrouped(flows []model.Flow) int {
	n := 0
	for _, f := range flows {
		if normalizeFolder(f.Folder) == "" {
			n++
		}
	}
	return n
}

func inScope(f model.Flow, scope string) bool {
	path := normalizeFolder(f.Folder)
	switch scope {
	case "":
		return true
	case ungrouped:
		return path == ""
	}
	return path == scope || strings.HasPrefix(path, scope+"/")
}

type crumb struct{ Name, Path string }

func breadcrumb(scope string) []crumb {
	if scope == "" || scope == ungrouped {
		return nil
	}
	var out []crumb
	parts := strings.Split(scope, "/")
	for i, p := range parts {
		out = append(out, crumb{Name: p, Path: strings.Join(parts[:i+1], "/")})
	}
	return out
}

// within reports whether path is scope or a folder under it.
func within(scope, path string) bool {
	return scope != "" && scope != ungrouped && (scope == path || strings.HasPrefix(scope, path+"/"))
}
