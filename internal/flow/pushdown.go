package flow

import (
	"encoding/json"
	"regexp"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
)

// Projection pushdown: columns every destination of a table ignores (the
// PostgreSQL sink's column mapping skips them, or the branch is discarded)
// are not read from the source at all. It is conservative — a column stays
// in the query when any step on the way might read it:
//
//   - scripts that touch the whole row (str(row), row.items(), for … in row, …)
//     keep every column; otherwise a column is kept when its name appears in
//     the script;
//   - expression/config based steps keep the columns their settings mention;
//   - column renames and unknown steps disable pushdown for that path.
//
// Primary keys are always read (chunking and merge need them). Previews do
// not use this, so ignored columns remain visible and can be re-included.

// skipSpec describes skippable source columns: every column (all) or the
// listed ones, except any column whose name appears in keep (the text of
// scripts, expressions and configs of steps that might read it).
type skipSpec struct {
	all  bool
	cols map[string]bool
	keep []string
}

func (s skipSpec) with(keep []string) skipSpec {
	s.keep = append(append([]string{}, s.keep...), keep...)
	return s
}

func intersect(a, b skipSpec) skipSpec {
	keep := append(append([]string{}, a.keep...), b.keep...)
	switch {
	case a.all && b.all:
		return skipSpec{all: true, keep: keep}
	case a.all:
		return skipSpec{cols: b.cols, keep: keep}
	case b.all:
		return skipSpec{cols: a.cols, keep: keep}
	}
	cols := map[string]bool{}
	for k := range a.cols {
		if b.cols[k] {
			cols[k] = true
		}
	}
	return skipSpec{cols: cols, keep: keep}
}

var nothing = skipSpec{cols: map[string]bool{}}

var wholeRowRe = regexp.MustCompile(`str\(\s*row\s*\)|repr\(\s*row\s*\)|row\s*\.\s*(items|keys|values|copy|update)\s*\(|in\s+row\b|dict\(\s*row|len\(\s*row|json\.(dumps|encode)\(\s*row|\*\*\s*row|rows\b`)

// pushdownFor returns, for a source node, the extra columns to skip for one
// of its tables, given the table's column names.
func pushdownFor(g *model.Graph, sourceID string, sinks map[string]*pgSink) func(table string, columns []string) map[string]bool {
	out := map[string][]model.Edge{}
	for _, e := range g.Edges {
		out[e.From] = append(out[e.From], e)
	}
	return func(table string, columns []string) map[string]bool {
		spec, ok := walk(g, out, sinks, sourceID, table, nil, map[string]bool{})
		if !ok {
			return nil
		}
		skip := map[string]bool{}
		for _, c := range columns {
			lc := strings.ToLower(c)
			if !spec.all && !spec.cols[lc] {
				continue
			}
			mentioned := false
			for _, t := range spec.keep {
				if containsWord(t, lc) {
					mentioned = true
					break
				}
			}
			if !mentioned {
				skip[lc] = true
			}
		}
		return skip
	}
}

// walk returns what is skippable on every path from node id onward, given
// the texts of steps upstream that may read columns. ok=false disables
// pushdown entirely.
func walk(g *model.Graph, out map[string][]model.Edge, sinks map[string]*pgSink, id, table string, used []string, seen map[string]bool) (skipSpec, bool) {
	n := g.Node(id)
	if n == nil || n.Disabled {
		return skipSpec{all: true}, true
	}
	if seen[id+"|"+table] {
		return nothing, false
	}
	seen[id+"|"+table] = true
	defer delete(seen, id+"|"+table)

	next := table
	cfgText := func() string {
		raw, _ := json.Marshal(n.Config)
		return strings.ToLower(string(raw))
	}
	switch n.Type {
	case "source.tables":
	case "sink.postgres":
		s := sinks[id]
		if s == nil {
			return nothing, false
		}
		skip := map[string]bool{}
		for c, to := range s.colMap[strings.ToLower(table)] {
			if to == "" {
				skip[strings.ToLower(c)] = true
			}
		}
		for _, e := range s.exprs {
			used = append(used, strings.ToLower(e.src))
		}
		return skipSpec{cols: skip}.with(used), true
	case "sink.discard":
		return skipSpec{all: true}.with(used), true
	case "transform.project":
		// Builds its output only from what its expressions mention.
		return skipSpec{all: true}.with(append(used, cfgText())), true
	case "transform.tables":
		if b, _ := Build(n, NewPreviewRuntime(nil)); b != nil {
			if tr, ok := b.(*tableRename); ok {
				next = tr.Rename(table)
			}
		}
	case "transform.script":
		src := Config(n.Config).String("script")
		if wholeRowRe.MatchString(src) {
			return nothing, true
		}
		used = append(used, strings.ToLower(src))
	case "transform.lookup", "transform.compute", "transform.filter", "transform.route",
		"transform.cast", "transform.valuemap", "transform.select":
		used = append(used, cfgText())
	default:
		return nothing, true
	}

	var result skipSpec
	first := true
	for _, e := range out[id] {
		if !e.Carries(next) {
			continue
		}
		spec, ok := walk(g, out, sinks, e.To, next, used, seen)
		if !ok {
			return nothing, false
		}
		if first {
			result, first = spec, false
			continue
		}
		result = intersect(result, spec)
	}
	if first {
		return nothing, true
	}
	return result, true
}

func containsWord(text, word string) bool {
	for i := 0; ; {
		j := strings.Index(text[i:], word)
		if j < 0 {
			return false
		}
		j += i
		before := j == 0 || !isIdent(text[j-1])
		after := j+len(word) >= len(text) || !isIdent(text[j+len(word)])
		if before && after {
			return true
		}
		i = j + 1
	}
}

func isIdent(c byte) bool {
	return c == '_' || c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9'
}
