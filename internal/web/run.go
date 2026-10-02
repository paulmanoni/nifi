package web

import (
	"errors"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
)

// runView is a run's page: ?tab=progress|bulletins|dead|history, plus each
// tab's own filters (?status=, ?level=, ?q=, ?table=, ?offset=).
type runView struct {
	ID    string
	Tab   string
	D     model.RunDetail
	Flow  *model.Flow
	Nodes map[string]string // node id → name

	Status string // progress filter
	Q      string
	Level  string // bulletins filter
	Table  string // dead letters filter
	Offset int

	Bulletins []model.Bulletin
	Dead      deadPage
	History   []model.RunSummary
	HistErr   error
}

type deadPage struct {
	Total int64              `json:"total"`
	Items []model.DeadLetter `json:"items"`
	Err   error              `json:"-"`
}

const deadPageSize = 50

func runRoute(id string) func(*ctx) (page, int) {
	return func(c *ctx) (page, int) {
		q := c.r.URL.Query()
		v := runView{ID: id, Tab: q.Get("tab"), Status: q.Get("status"), Q: strings.TrimSpace(q.Get("q")), Level: q.Get("level"), Table: q.Get("table")}
		v.Offset, _ = strconv.Atoi(q.Get("offset"))
		if v.Offset < 0 {
			v.Offset = 0
		}
		if err := c.get("/runs/"+url.PathEscape(id), &v.D); err != nil {
			status := http.StatusInternalServerError
			var ae *APIError
			if errors.As(err, &ae) {
				status = ae.Status
			}
			return page{Nav: "flows", Title: "Run not found", Body: emptyState("alert-triangle", "Run not found", err.Error(), c.href("/flows"), "Back to flows")}, status
		}
		var f model.Flow
		if c.get("/flows/"+url.PathEscape(v.D.FlowID), &f) == nil {
			v.Flow = &f
			v.Nodes = map[string]string{}
			if f.Graph != nil {
				for _, n := range f.Graph.Nodes {
					v.Nodes[n.ID] = n.Name
				}
			}
		}
		switch v.Tab {
		case "bulletins", "history":
		case "dead":
			if !c.can("data") {
				v.Tab = "progress"
			}
		default:
			v.Tab = "progress"
		}
		// Bulletins are counted on every tab (the tab shows how many).
		_ = c.get("/runs/"+url.PathEscape(id)+"/bulletins?after=0", &v.Bulletins)
		switch v.Tab {
		case "dead":
			p := "/runs/" + url.PathEscape(id) + "/deadletters?table=" + url.QueryEscape(v.Table) +
				"&offset=" + strconv.Itoa(v.Offset) + "&limit=" + strconv.Itoa(deadPageSize)
			v.Dead.Err = c.get(p, &v.Dead)
		case "history":
			v.HistErr = c.get("/flows/"+url.PathEscape(v.D.FlowID)+"/runs", &v.History)
		}
		live := ""
		if isActive(v.D.Status) {
			live = "run:" + id
		}
		return page{Nav: "flows", Title: "Run " + shortID(id), Live: live, Body: runPage(c, v)}, http.StatusOK
	}
}

func shortID(id string) string {
	if len(id) > 8 {
		return id[:8]
	}
	return id
}

// href is this run's page with some params changed ("" removes one).
func (v runView) href(c *ctx, set ...string) string {
	q := url.Values{}
	if v.Tab != "progress" {
		q.Set("tab", v.Tab)
	}
	keep := map[string]string{"status": v.Status, "q": v.Q, "level": v.Level, "table": v.Table}
	if v.Offset > 0 {
		keep["offset"] = strconv.Itoa(v.Offset)
	}
	for k, val := range keep {
		if val != "" {
			q.Set(k, val)
		}
	}
	for i := 0; i+1 < len(set); i += 2 {
		if set[i] == "tab" {
			// Filters belong to a tab: switching starts clean.
			q = url.Values{}
		}
		if set[i+1] == "" {
			q.Del(set[i])
		} else {
			q.Set(set[i], set[i+1])
		}
		if set[i] == "tab" && set[i+1] == "progress" {
			q.Del("tab")
		}
	}
	u := c.href("/runs/" + url.PathEscape(v.ID))
	if len(q) == 0 {
		return u
	}
	return u + "?" + q.Encode()
}

func (v runView) nodeName(id string) string {
	if n := v.Nodes[id]; n != "" {
		return n
	}
	return id
}

// ---- progress ----

type totals struct {
	Est, Deleted, ChunksDone, ChunksTotal int64
	Done, All                             int
	PerSec                                float64
}

func (v runView) totals() totals {
	var t totals
	t.All = len(v.D.Tables)
	for _, tb := range v.D.Tables {
		t.Est += tb.EstimatedRows
		t.Deleted += tb.RowsDeleted
		t.ChunksDone += tb.ChunksDone
		t.ChunksTotal += tb.ChunksTotal
		if tb.Status == "done" {
			t.Done++
		}
	}
	for _, n := range v.D.Nodes {
		if n.RowsPerSec > t.PerSec {
			t.PerSec = n.RowsPerSec
		}
	}
	return t
}

var tableOrder = map[string]int{"reading": 0, "failed": 1, "pending": 2, "done": 3}

func (v runView) tables() []model.TableProgress {
	var out []model.TableProgress
	for _, t := range v.D.Tables {
		if v.Status != "" && v.Status != "all" && t.Status != v.Status {
			continue
		}
		if !matches(v.Q, t.Table) {
			continue
		}
		out = append(out, t)
	}
	sort.SliceStable(out, func(i, j int) bool {
		a, b := tableOrder[out[i].Status], tableOrder[out[j].Status]
		if a != b {
			return a < b
		}
		return out[i].Table < out[j].Table
	})
	return out
}

func (v runView) statusCount(s string) int {
	if s == "all" {
		return len(v.D.Tables)
	}
	n := 0
	for _, t := range v.D.Tables {
		if t.Status == s {
			n++
		}
	}
	return n
}

// phases are the load's steps, in order.
var phases = []struct{ Key, Label string }{
	{"loading", "Load data"}, {"indexes", "Indexes"}, {"constraints", "Constraints"}, {"sequences", "Sequences"},
}

// phaseIndex is how far the load got: 4 when complete, -1 before it starts.
func (v runView) phaseIndex() int {
	if v.D.Status == model.RunCompleted {
		return len(phases)
	}
	p := v.D.Phase
	if p == "" && v.D.Status == model.RunRunning {
		p = "loading"
	}
	for i, ph := range phases {
		if ph.Key == p {
			return i
		}
	}
	return -1
}

func (v runView) overall() float64 {
	if v.D.Status == model.RunCompleted {
		return 100
	}
	return pct(v.D.RowsWritten, v.totals().Est)
}

// ---- bulletins ----

func (v runView) bulletins() []model.Bulletin {
	var out []model.Bulletin
	for _, b := range v.Bulletins {
		switch v.Level {
		case "warn":
			if b.Level != "warn" && b.Level != "error" {
				continue
			}
		case "error":
			if b.Level != "error" {
				continue
			}
		}
		if !matches(v.Q, b.Message, b.Table) {
			continue
		}
		out = append(out, b)
	}
	return out
}

func (v runView) levelCount(level string) int {
	n := 0
	for _, b := range v.Bulletins {
		switch level {
		case "warn":
			if b.Level == "warn" || b.Level == "error" {
				n++
			}
		case "error":
			if b.Level == "error" {
				n++
			}
		default:
			n++
		}
	}
	return n
}

// ---- dead letters ----

func (v runView) deadNodes() []string {
	seen := map[string]bool{}
	var out []string
	for _, d := range v.Dead.Items {
		if !seen[d.NodeID] {
			seen[d.NodeID] = true
			out = append(out, d.NodeID)
		}
	}
	return out
}

func (v runView) deadRange() string {
	if v.Dead.Total == 0 {
		return "0 rows"
	}
	end := int64(v.Offset + deadPageSize)
	if end > v.Dead.Total {
		end = v.Dead.Total
	}
	return strconv.Itoa(v.Offset+1) + "–" + strconv.FormatInt(end, 10) + " of " + fmtNum(v.Dead.Total)
}

func deadEmpty(table string) string {
	if table != "" {
		return "No dead-lettered rows for " + table + ". 🎉"
	}
	return "No dead-lettered rows. 🎉"
}
