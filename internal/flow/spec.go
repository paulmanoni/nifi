// Package flow holds the processor catalog, the graph executor, validation and
// preview.
package flow

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"sort"
	"strconv"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

// Option is a select choice.
type Option struct {
	Value string `json:"value"`
	Label string `json:"label"`
	// Description is a line about the choice, shown when there are too many
	// of them to read as a list of labels (see the "picker" kind).
	Description string `json:"description,omitempty"`
}

// ListColumn defines one column of a "list" property's row editor.
type ListColumn struct {
	Key     string   `json:"key"`
	Label   string   `json:"label"`
	Kind    string   `json:"kind"` // string | expr | select | column | type
	Options []Option `json:"options,omitempty"`
}

// Cond makes a property visible only when another has a given value.
type Cond struct {
	Key    string `json:"key"`
	Equals any    `json:"equals"`
}

// Property describes one configurable field of a processor.
type Property struct {
	Key           string       `json:"key"`
	Label         string       `json:"label"`
	Kind          string       `json:"kind"`
	Required      bool         `json:"required,omitempty"`
	Default       any          `json:"default,omitempty"`
	Help          string       `json:"help,omitempty"`
	Options       []Option     `json:"options,omitempty"`
	ConnectionKey string       `json:"connectionKey,omitempty"`
	ShowIf        *Cond        `json:"showIf,omitempty"`
	Columns       []ListColumn `json:"columns,omitempty"`
}

// Spec is a processor type as the UI sees it.
type Spec struct {
	Type                 string   `json:"type"`
	Label                string   `json:"label"`
	Category             string   `json:"category"`
	Description          string   `json:"description"`
	Icon                 string   `json:"icon"`
	Inputs               int      `json:"inputs"`
	Relationships        []string `json:"relationships"`
	DynamicRelationships string   `json:"dynamicRelationships,omitempty"`
	SupportsConcurrency  bool     `json:"supportsConcurrency"`
	// Hidden keeps a node out of the palette (used by replay).
	Hidden bool `json:"hidden,omitempty"`
	// Streaming marks a source that follows its input instead of reading it
	// once: a run containing one stays live until it is stopped.
	Streaming  bool       `json:"streaming,omitempty"`
	Properties []Property `json:"properties"`

	build  func(n *model.Node, cfg Config, rt *Runtime) (any, error)
	hosted bool
}

// Schematic is implemented by a node that can say what it emits without being
// run. A node that cannot is not wrong, only opaque: the designer has to push
// sample rows through it to find out what comes out the other side, which
// needs a live connection and gives nothing useful when the sample is empty.
//
// Declaring it costs little — a typed node knows its output from its own type
// — and it is what lets the rest of the flow reason about a node instead of
// merely running it.
type Schematic interface {
	// Columns reports what the node emits for an input of these columns.
	Columns(in []record.Column) ([]record.Column, error)
}

// Streaming reports whether the graph contains a source that follows its
// input rather than reading it once — which makes a run of it live: it has no
// natural end and stops only when it is told to.
func Streaming(g *model.Graph) bool {
	for i := range g.Nodes {
		n := &g.Nodes[i]
		if n.Disabled {
			continue
		}
		if spec, ok := SpecFor(n.Type); ok && spec.Streaming {
			return true
		}
	}
	return false
}

// Emitter sends a batch out of a node on a relationship.
type Emitter interface {
	Emit(port string, b *record.Batch)
}

// Processor transforms or consumes input batches. Process may mutate the
// input batch's rows; the executor gives each consumer its own copy.
type Processor interface {
	Process(ctx context.Context, in *record.Batch, out Emitter) error
}

// Source produces batches.
type Source interface {
	// Tables lists the logical tables the source will emit.
	Tables(ctx context.Context) ([]string, error)
	// Sample reads up to limit rows of one table without side effects.
	Sample(ctx context.Context, table string, limit int) (*record.Batch, error)
	// Run streams every table, checkpointing chunks through rt.
	Run(ctx context.Context, out Emitter) error
}

// Finisher runs once after all input has been processed (sinks: post-load).
type Finisher interface {
	Finish(ctx context.Context) error
}

// Closer releases resources at the end of a run or preview.
type Closer interface {
	Close()
}

// Previewer lets a sink show what it would write without writing.
type Previewer interface {
	Preview(ctx context.Context, in *record.Batch) (*record.Batch, error)
}

var registry = map[string]*Spec{}

func register(s *Spec) {
	if s.Category != "Source" {
		s.Inputs = 1
	}
	if s.Relationships == nil {
		s.Relationships = []string{}
	}
	if s.Properties == nil {
		// A node with no settings still has a list of them, an empty one.
		// Sending null instead makes every reader of the catalog guard
		// against a case that should not exist.
		s.Properties = []Property{}
	}
	registry[s.Type] = s
}

// Specs returns the catalog sorted by category then label.
func Specs() []*Spec {
	order := map[string]int{"Source": 0, "Transform": 1, "Route": 2, "Script": 3, "Sink": 4}
	out := make([]*Spec, 0, len(registry))
	for _, s := range registry {
		if !s.Hidden {
			out = append(out, s)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if order[out[i].Category] != order[out[j].Category] {
			return order[out[i].Category] < order[out[j].Category]
		}
		return out[i].Label < out[j].Label
	})
	return out
}

// SpecFor returns the spec of a type.
func SpecFor(t string) (*Spec, bool) {
	s, ok := registry[t]
	return s, ok
}

// Ports lists a node's output relationships, including dynamic ones.
func Ports(s *Spec, n *model.Node) []string {
	ports := append([]string(nil), s.Relationships...)
	if s.DynamicRelationships != "" {
		for _, r := range Config(n.Config).List(s.DynamicRelationships) {
			if name := strings.TrimSpace(fmt.Sprint(r["name"])); name != "" && r["name"] != nil {
				ports = append(ports, name)
			}
		}
	}
	return ports
}

// Config is a node's property bag with typed accessors.
type Config map[string]any

func (c Config) String(k string) string {
	switch v := c[k].(type) {
	case nil:
		return ""
	case string:
		return v
	default:
		return fmt.Sprint(v)
	}
}

func (c Config) Int(k string, def int) int {
	switch v := c[k].(type) {
	case float64:
		return int(v)
	case int:
		return v
	case int64:
		return int(v)
	case string:
		if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil {
			return n
		}
	}
	return def
}

func (c Config) Bool(k string, def bool) bool {
	switch v := c[k].(type) {
	case bool:
		return v
	case string:
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return def
}

// Strings reads a string list; a comma-separated string also works.
func (c Config) Strings(k string) []string {
	var out []string
	switch v := c[k].(type) {
	case []any:
		for _, x := range v {
			if s := strings.TrimSpace(fmt.Sprint(x)); s != "" && x != nil {
				out = append(out, s)
			}
		}
	case []string:
		out = v
	case string:
		for _, s := range strings.Split(v, ",") {
			if s = strings.TrimSpace(s); s != "" {
				out = append(out, s)
			}
		}
	}
	return out
}

// Pairs reads a keyvalue property ([{key, value}] or an object).
func (c Config) Pairs(k string) [][2]string {
	var out [][2]string
	switch v := c[k].(type) {
	case []any:
		for _, x := range v {
			if m, ok := x.(map[string]any); ok {
				key := strings.TrimSpace(fmt.Sprint(m["key"]))
				if m["key"] == nil || key == "" {
					continue
				}
				val := ""
				if m["value"] != nil {
					val = fmt.Sprint(m["value"])
				}
				out = append(out, [2]string{key, val})
			}
		}
	case map[string]any:
		keys := make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			out = append(out, [2]string{k, fmt.Sprint(v[k])})
		}
	}
	return out
}

// PairMap is Pairs as a map.
func (c Config) PairMap(k string) map[string]string {
	m := map[string]string{}
	for _, p := range c.Pairs(k) {
		m[p[0]] = p[1]
	}
	return m
}

// List reads a list property.
func (c Config) List(k string) []map[string]any {
	var out []map[string]any
	if v, ok := c[k].([]any); ok {
		for _, x := range v {
			if m, ok := x.(map[string]any); ok {
				out = append(out, m)
			}
		}
	}
	return out
}

func (c Config) With(defaults []Property) Config {
	out := Config{}
	for _, p := range defaults {
		if p.Default != nil {
			out[p.Key] = p.Default
		}
	}
	for k, v := range c {
		if v != nil && !(isEmptyString(v) && out[k] != nil) {
			out[k] = v
		}
	}
	return out
}

func isEmptyString(v any) bool {
	s, ok := v.(string)
	return ok && strings.TrimSpace(s) == ""
}

func str(m map[string]any, k string) string {
	if m[k] == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprint(m[k]))
}

// Build instantiates the processor/source for a node.
func Build(n *model.Node, rt *Runtime) (any, error) {
	s, ok := registry[n.Type]
	if !ok {
		return nil, fmt.Errorf("unknown processor type %q", n.Type)
	}
	cfg := Config(n.Config).With(s.Properties)
	if missing := unknownParams(cfg); len(missing) > 0 {
		return nil, fmt.Errorf("%s: %w", n.Name, ParamError(missing))
	}
	if resolved, ok := resolveParams(map[string]any(cfg)).(map[string]any); ok {
		cfg = Config(resolved)
	}
	for _, p := range s.Properties {
		if p.Required && isMissing(cfg[p.Key]) && visible(p, cfg) {
			return nil, fmt.Errorf("%s: %q is required", n.Name, p.Label)
		}
	}
	return s.build(n, cfg, rt)
}

func visible(p Property, cfg Config) bool {
	if p.ShowIf == nil {
		return true
	}
	return fmt.Sprint(cfg[p.ShowIf.Key]) == fmt.Sprint(p.ShowIf.Equals)
}

func isMissing(v any) bool {
	switch x := v.(type) {
	case nil:
		return true
	case string:
		return strings.TrimSpace(x) == ""
	case []any:
		return len(x) == 0
	}
	return false
}

// typeOptions are the logical types for pickers.
func typeOptions() []Option {
	out := make([]Option, len(record.AllTypes))
	for i, t := range record.AllTypes {
		out[i] = Option{Value: string(t), Label: string(t)}
	}
	return out
}

// TypeOptions exposes the type list to the API.
func TypeOptions() []Option { return typeOptions() }

// tableFilter implements the common "only these tables" property.
type tableFilter map[string]bool

func newTableFilter(cfg Config) tableFilter {
	names := cfg.Strings("only_tables")
	if len(names) == 0 {
		return nil
	}
	f := tableFilter{}
	for _, n := range names {
		f[strings.ToLower(n)] = true
	}
	return f
}

func (f tableFilter) skip(table string) bool {
	return f != nil && !f[strings.ToLower(table)]
}

var onlyTables = Property{Key: "only_tables", Label: "Only tables", Kind: "string",
	Help: "Comma-separated table names this step applies to; other tables pass through unchanged. Empty = all tables."}

// MarshalJSON keeps the unexported builder out of API output.
func (s *Spec) MarshalJSON() ([]byte, error) {
	type alias Spec
	return json.Marshal((*alias)(s))
}

// HostSettings is what a host node's constructor receives.
type HostSettings struct {
	NodeID   string
	NodeName string
	Config   map[string]any
	Runtime  *Runtime
}

// RegisterHost adds a host-defined node to the catalog. build is called once
// per run (and preview) with the node's settings; what it returns is used
// exactly like a built-in node's implementation (Processor or Source, plus
// the optional Starter/Finisher/Closer/Previewer interfaces).
func RegisterHost(s Spec, build func(HostSettings) (any, error)) error {
	if s.Type == "" || build == nil {
		return fmt.Errorf("nifi: a host node needs a type and a constructor")
	}
	if old, ok := registry[s.Type]; ok && !old.hosted {
		return fmt.Errorf("nifi: processor type %q is built in", s.Type)
	}
	if s.Category == "" {
		s.Category = "Transform"
	}
	if s.Icon == "" {
		s.Icon = "cpu"
	}
	if s.Relationships == nil {
		s.Relationships = []string{"success"}
	}
	if !slices.Contains(s.Relationships, "failure") {
		s.Relationships = append(append([]string{}, s.Relationships...), "failure")
	}
	s.hosted = true
	s.build = func(n *model.Node, cfg Config, rt *Runtime) (any, error) {
		return build(HostSettings{NodeID: n.ID, NodeName: n.Name, Config: map[string]any(cfg), Runtime: rt})
	}
	spec := s
	register(&spec)
	return nil
}
