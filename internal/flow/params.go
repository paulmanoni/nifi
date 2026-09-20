package flow

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
)

// Parameters are named values a node's settings refer to as #{name}, so one
// flow runs unchanged against different environments:
//
//	target schema   →  #{schema}
//	row filter      →  created_at >= '#{since}'
//
// They are resolved when a node is built — for a run, a preview and
// validation alike — and are engine-wide (Config.Parameters plus whatever
// the Parameters page holds).

var (
	paramMu sync.RWMutex
	params  = map[string]string{}
)

// SetParameters replaces the parameter set.
func SetParameters(m map[string]string) {
	paramMu.Lock()
	defer paramMu.Unlock()
	params = map[string]string{}
	for k, v := range m {
		params[k] = v
	}
}

// ParameterNames lists the known parameters, sorted.
func ParameterNames() []string {
	paramMu.RLock()
	defer paramMu.RUnlock()
	out := make([]string, 0, len(params))
	for k := range params {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

var paramRe = regexp.MustCompile(`#\{([A-Za-z_][A-Za-z0-9_.\-]*)\}`)

// resolveParams returns v with every #{name} replaced, recursing into the
// maps and lists a list property holds. Unknown names are left as they are;
// Validate reports them.
func resolveParams(v any) any {
	paramMu.RLock()
	defer paramMu.RUnlock()
	return substitute(v)
}

func substitute(v any) any {
	switch x := v.(type) {
	case string:
		if !strings.Contains(x, "#{") {
			return x
		}
		return paramRe.ReplaceAllStringFunc(x, func(m string) string {
			if val, ok := params[paramRe.FindStringSubmatch(m)[1]]; ok {
				return val
			}
			return m
		})
	case map[string]any:
		out := make(map[string]any, len(x))
		for k, val := range x {
			out[k] = substitute(val)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, val := range x {
			out[i] = substitute(val)
		}
		return out
	case []map[string]any:
		out := make([]map[string]any, len(x))
		for i, val := range x {
			out[i], _ = substitute(val).(map[string]any)
		}
		return out
	}
	return v
}

// unknownParams lists the #{name} references in a node's config that no
// parameter defines.
func unknownParams(cfg map[string]any) []string {
	paramMu.RLock()
	defer paramMu.RUnlock()
	seen := map[string]bool{}
	var out []string
	var walk func(any)
	walk = func(v any) {
		switch x := v.(type) {
		case string:
			for _, m := range paramRe.FindAllStringSubmatch(x, -1) {
				if _, ok := params[m[1]]; !ok && !seen[m[1]] {
					seen[m[1]] = true
					out = append(out, m[1])
				}
			}
		case map[string]any:
			for _, val := range x {
				walk(val)
			}
		case []any:
			for _, val := range x {
				walk(val)
			}
		case []map[string]any:
			for _, val := range x {
				walk(val)
			}
		}
	}
	walk(cfg)
	sort.Strings(out)
	return out
}

// ParamError reports settings that name parameters nobody defined.
func ParamError(names []string) error {
	if len(names) == 1 {
		return fmt.Errorf("parameter #{%s} is not defined", names[0])
	}
	return fmt.Errorf("parameters %s are not defined", "#{"+strings.Join(names, "}, #{")+"}")
}
