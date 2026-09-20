package nifi

import (
	"context"
	"fmt"

	"github.com/paulmanoni/nifi/internal/flow"
	"github.com/paulmanoni/nifi/record"
)

// Custom nodes. The host application can add its own processors, sinks and
// sources to the palette, so a flow can hand rows to code the GUI could only
// re-implement — an existing mapping function, a proprietary API, a file
// format the engine does not know.
//
//	nifi.Config{Processors: []nifi.Processor{{
//	    Type: "app.normalize", Label: "Normalize", Icon: "wand",
//	    Properties: []nifi.Property{{Key: "mode", Label: "Mode", Kind: "select",
//	        Options: []nifi.Option{{Value: "strict"}, {Value: "loose"}}}},
//	    New: func(s nifi.Settings) (nifi.Handler, error) {
//	        mode := s.String("mode")
//	        return nifi.Func(func(ctx context.Context, in *record.Batch) (*record.Batch, error) {
//	            …
//	            return in, nil
//	        }), nil
//	    },
//	}}}
//
// Everything a built-in node does is available: several output ports, row
// failures (dead letters), bulletins, start/finish hooks and preview.

// Processor is a transform or sink supplied by the host.
type Processor struct {
	// Type identifies the node in saved flows ("app.normalize"). Keep it
	// stable: it is what a stored flow refers to.
	Type        string
	Label       string
	Description string
	// Category places the node in the palette: Transform (default), Route,
	// Script or Sink. A Sink has no output ports unless Ports says otherwise.
	Category string
	// Icon is a lucide icon name (https://lucide.dev), e.g. "wand".
	Icon       string
	Properties []Property
	// Ports are the output relationships. Empty means one "success" port (none
	// for a Sink). "failure" always exists: rows sent there become dead letters.
	Ports []string
	// Concurrent lets a node run several workers; otherwise batches are
	// processed one at a time, in arrival order.
	Concurrent bool
	// Hidden keeps the node out of the palette while it still builds and
	// runs — for one that has been replaced but is still named by flows
	// somebody saved.
	Hidden bool
	// New builds the node for one run (or preview) from its settings.
	New func(s Settings) (Handler, error)
}

// Source is a node that produces rows, like the built-in Database Tables.
type Source struct {
	Type        string
	Label       string
	Description string
	Icon        string
	Properties  []Property
	// Concurrent lets the reader be built with several workers.
	Concurrent bool
	// Streaming marks a source that follows its input instead of reading it
	// once — a change feed, a queue, a replication stream. Read then blocks
	// until the context is cancelled, and the run it belongs to is live: it
	// has no natural end, nothing waits for it to finish, and it stops only
	// when it is told to. Rows it emits may carry a record.Op each
	// (record.Insert, record.Update, record.Delete) via Batch.Append, which a
	// PostgreSQL sink in "apply changes" mode honours.
	Streaming bool
	// New builds the reader for one run (or preview).
	New func(s Settings) (Reader, error)
}

// Handler processes one batch at a time. Emit to "success" (or any port the
// Processor declares) to pass rows on, and to "failure" to dead-letter them
// with a message per row in Batch.Errors. Returning an error fails the run.
type Handler interface {
	Process(ctx context.Context, in *record.Batch, out Emitter) error
}

// Reader streams a source's rows.
type Reader interface {
	// Tables lists the logical tables this source emits; the UI shows them
	// and per-table progress is keyed by them.
	Tables(ctx context.Context) ([]string, error)
	// Sample reads up to limit rows of one table for previews. It must not
	// change anything.
	Sample(ctx context.Context, table string, limit int) (*record.Batch, error)
	// Read streams every table until the context is cancelled.
	Read(ctx context.Context, out Emitter) error
}

// Emitter sends a batch out of a node on one of its ports.
type Emitter interface {
	Emit(port string, b *record.Batch)
}

// Starter runs once before any rows arrive (a Handler or Reader may
// implement it) — open files, prepare a target.
type Starter interface {
	Start(ctx context.Context) error
}

// Finisher runs once after all input has been processed — flush, commit,
// build indexes. It does not run when the run fails or is stopped.
type Finisher interface {
	Finish(ctx context.Context) error
}

// Closer releases resources at the end of every run and preview.
type Closer interface {
	Close()
}

// Previewer lets a sink show what it would write without writing anything.
// Without it, a sink shows nothing in previews.
type Previewer interface {
	Preview(ctx context.Context, in *record.Batch) (*record.Batch, error)
}

// Schematic lets a node say what it emits without being run. Implement it and
// the node stops being opaque: the designer can show its columns with no
// connection and no sample rows, and the schema keeps flowing through it when
// the sample it is given happens to be empty. A node built with Mapper
// implements it already, from its own output type.
type Schematic interface {
	Columns(in []record.Column) ([]record.Column, error)
}

// Func adapts a plain batch function to a Handler: the returned batch goes to
// "success" (nil or empty passes nothing).
func Func(fn func(ctx context.Context, in *record.Batch) (*record.Batch, error)) Handler {
	return funcHandler(fn)
}

type funcHandler func(ctx context.Context, in *record.Batch) (*record.Batch, error)

func (f funcHandler) Process(ctx context.Context, in *record.Batch, out Emitter) error {
	b, err := f(ctx, in)
	if err != nil {
		return err
	}
	if b != nil && len(b.Rows) > 0 {
		out.Emit("success", b)
	}
	return nil
}

// ProcessFunc is the signature Func takes.
type ProcessFunc = func(ctx context.Context, in *record.Batch) (*record.Batch, error)

// Property is one setting of a custom node, rendered in the node's panel.
// Kind is one of:
//
//	string   text    int     bool    select    picker    expr    script
//	column   columns table   tables  connection
//	keyvalue list    (edited in the table dialog; list uses Columns)
//
// "picker" is "select" for a list too long to scan: it opens a searchable
// drawer showing each Option's Label and Description, rather than a dropdown
// of bare labels.
type Property struct {
	Key      string
	Label    string
	Kind     string
	Required bool
	Default  any
	Help     string
	Options  []Option
	// ConnectionKey names the connection property a table/column picker
	// browses (for Kind table/tables).
	ConnectionKey string
	// Columns describes the cells of a list (or keyvalue) property.
	Columns []Column
}

// Column is one cell of a list property. Kind is string, expr, select,
// column or type.
type Column struct {
	Key     string
	Label   string
	Kind    string
	Options []Option
}

// Option is a choice for a "select" or "picker" property; Label defaults to
// Value.
type Option struct {
	Value string
	Label string
	// Description is a line about this choice. A "select" ignores it; a
	// "picker" shows it, which is what makes a long list readable.
	Description string
}

// Settings is a node's configuration plus what it needs from the run.
type Settings struct {
	// NodeID and NodeName identify the node on the canvas.
	NodeID   string
	NodeName string
	// Config holds the raw property values.
	Config map[string]any
	// RunID is the run this node belongs to, empty in a preview or while a
	// flow is only being checked. Anything a node keeps for the length of a
	// run can be kept against it, and dropped when the run ends.
	RunID string

	rt *flow.Runtime
}

// String reads a text property (trimmed).
func (s Settings) String(key string) string { return flow.Config(s.Config).String(key) }

// Int reads a whole-number property, or def when unset.
func (s Settings) Int(key string, def int) int { return flow.Config(s.Config).Int(key, def) }

// Bool reads a true/false property, or def when unset.
func (s Settings) Bool(key string, def bool) bool { return flow.Config(s.Config).Bool(key, def) }

// Strings reads a comma-separated (or list) property.
func (s Settings) Strings(key string) []string { return flow.Config(s.Config).Strings(key) }

// Rows reads a list property: one map per row, keyed by the Column keys.
func (s Settings) Rows(key string) []map[string]any { return flow.Config(s.Config).List(key) }

// Pairs reads a keyvalue property in order.
func (s Settings) Pairs(key string) [][2]string { return flow.Config(s.Config).Pairs(key) }

// Connection returns a configured connection (Config.Connections) by id, so
// a node can open it with its own driver.
func (s Settings) Connection(ctx context.Context, id string) (Connection, error) {
	if s.rt == nil || s.rt.Conns == nil {
		return Connection{}, fmt.Errorf("nifi: no connections configured")
	}
	return s.rt.Conns(ctx, id)
}

// Remember stores a value against the flow, not the run: the next run of the
// same flow reads it back with Recall. It is where a streaming source keeps
// its position — a change feed's watermark, a replication cursor — so a
// restarted flow carries on instead of starting over.
//
// Write it when the rows it covers are safely through: hold the batch's
// record.Ticket and store the position from its completion callback.
func (s Settings) Remember(ctx context.Context, key, value string) error {
	if s.rt == nil || s.rt.Store == nil || s.rt.Preview || s.rt.FlowID == "" {
		return nil
	}
	return s.rt.Store.SetFlowKV(ctx, s.rt.FlowID, s.NodeID+":"+key, value)
}

// Recall reads back what Remember stored, ok=false when there is nothing.
func (s Settings) Recall(ctx context.Context, key string) (string, bool) {
	if s.rt == nil || s.rt.Store == nil || s.rt.FlowID == "" {
		return "", false
	}
	return s.rt.Store.GetFlowKV(ctx, s.rt.FlowID, s.NodeID+":"+key)
}

// LoadedFirst reports whether this flow also reads sources once, before this
// one starts. A streaming source is only started after they have all
// finished, so inside Read it means "the tables have just been loaded" —
// which is what separates a flow that loads and then follows from one that
// only follows.
func (s Settings) LoadedFirst() bool { return s.rt != nil && s.rt.LoadSources() > 0 }

// Bulletin posts a message to the run's bulletin board (and the node's
// panel). level is "info", "warn" or "error".
func (s Settings) Bulletin(level, msg string) {
	if s.rt != nil {
		s.rt.Bulletin(level, s.NodeID, "", msg)
	}
}

// Preview reports whether this instance serves a preview, not a real run —
// nothing it does may have side effects.
func (s Settings) Preview() bool { return s.rt != nil && s.rt.Preview }

// Resume reports whether the run continues an interrupted one, so committed
// work can be skipped.
func (s Settings) Resume() bool { return s.rt != nil && s.rt.Resume }

func toProps(in []Property) []flow.Property {
	var out []flow.Property
	for _, p := range in {
		fp := flow.Property{Key: p.Key, Label: p.Label, Kind: p.Kind, Required: p.Required,
			Default: p.Default, Help: p.Help, ConnectionKey: p.ConnectionKey}
		if fp.Kind == "" {
			fp.Kind = "string"
		}
		if fp.Label == "" {
			fp.Label = p.Key
		}
		fp.Options = toOptions(p.Options)
		for _, c := range p.Columns {
			lc := flow.ListColumn{Key: c.Key, Label: c.Label, Kind: c.Kind, Options: toOptions(c.Options)}
			if lc.Kind == "" {
				lc.Kind = "string"
			}
			if lc.Label == "" {
				lc.Label = c.Key
			}
			fp.Columns = append(fp.Columns, lc)
		}
		out = append(out, fp)
	}
	return out
}

func toOptions(in []Option) []flow.Option {
	var out []flow.Option
	for _, o := range in {
		l := o.Label
		if l == "" {
			l = o.Value
		}
		out = append(out, flow.Option{Value: o.Value, Label: l, Description: o.Description})
	}
	return out
}

func registerProcessors(ps []Processor, ss []Source) error {
	for _, p := range ps {
		if p.New == nil {
			return fmt.Errorf("nifi: processor %q needs New", p.Type)
		}
		spec := flow.Spec{Type: p.Type, Label: p.Label, Description: p.Description, Category: p.Category,
			Icon: p.Icon, SupportsConcurrency: p.Concurrent, Hidden: p.Hidden,
			Properties: toProps(p.Properties), Relationships: p.Ports}
		if spec.Label == "" {
			spec.Label = p.Type
		}
		if spec.Category == "" {
			spec.Category = "Transform"
		}
		if spec.Relationships == nil && spec.Category != "Sink" {
			spec.Relationships = []string{"success"}
		}
		newFn := p.New
		if err := flow.RegisterHost(spec, func(s flow.HostSettings) (any, error) {
			h, err := newFn(newSettings(s))
			if err != nil {
				return nil, err
			}
			base := hostHandler{h}
			pv, canPreview := h.(Previewer)
			sc, canDeclare := h.(Schematic)
			switch {
			case canPreview && canDeclare:
				return hostPreviewSchematic{hostPreviewer{base, pv}, sc}, nil
			case canPreview:
				return hostPreviewer{base, pv}, nil
			case canDeclare:
				return hostSchematic{base, sc}, nil
			}
			return base, nil
		}); err != nil {
			return err
		}
	}
	for _, src := range ss {
		if src.New == nil {
			return fmt.Errorf("nifi: source %q needs New", src.Type)
		}
		spec := flow.Spec{Type: src.Type, Label: src.Label, Description: src.Description, Category: "Source",
			Icon: src.Icon, Properties: toProps(src.Properties), Relationships: []string{"success"},
			SupportsConcurrency: src.Concurrent, Streaming: src.Streaming}
		if spec.Label == "" {
			spec.Label = src.Type
		}
		newFn := src.New
		if err := flow.RegisterHost(spec, func(s flow.HostSettings) (any, error) {
			r, err := newFn(newSettings(s))
			if err != nil {
				return nil, err
			}
			return hostSource{r}, nil
		}); err != nil {
			return err
		}
	}
	return nil
}

// hostHandler adapts a Handler to the engine's processor interface; the
// lifecycle hooks pass through when the handler implements them.
type hostHandler struct{ h Handler }

func (w hostHandler) Process(ctx context.Context, in *record.Batch, out flow.Emitter) error {
	return w.h.Process(ctx, in, out)
}

func (w hostHandler) Start(ctx context.Context) error {
	if s, ok := w.h.(Starter); ok {
		return s.Start(ctx)
	}
	return nil
}

func (w hostHandler) Finish(ctx context.Context) error {
	if f, ok := w.h.(Finisher); ok {
		return f.Finish(ctx)
	}
	return nil
}

func (w hostHandler) Close() {
	if c, ok := w.h.(Closer); ok {
		c.Close()
	}
}

// hostPreviewer is a hostHandler whose handler can also preview.
type hostPreviewer struct {
	hostHandler
	pv Previewer
}

func (w hostPreviewer) Preview(ctx context.Context, in *record.Batch) (*record.Batch, error) {
	return w.pv.Preview(ctx, in)
}

// newSettings is what a host node is handed: its own configuration, and the
// little of the run it is allowed to know.
func newSettings(s flow.HostSettings) Settings {
	out := Settings{NodeID: s.NodeID, NodeName: s.NodeName, Config: s.Config, rt: s.Runtime}
	if s.Runtime != nil {
		out.RunID = s.Runtime.RunID
	}
	return out
}

// hostSchematic is a hostHandler whose handler can also say what it emits.
// The wrappers are picked apart like this so that a node which does not
// declare its schema does not appear to declare an empty one.
type hostSchematic struct {
	hostHandler
	sc Schematic
}

func (w hostSchematic) Columns(in []record.Column) ([]record.Column, error) {
	return w.sc.Columns(in)
}

type hostPreviewSchematic struct {
	hostPreviewer
	sc Schematic
}

func (w hostPreviewSchematic) Columns(in []record.Column) ([]record.Column, error) {
	return w.sc.Columns(in)
}

// hostSource adapts a Reader to the engine's source interface.
type hostSource struct{ r Reader }

func (h hostSource) Tables(ctx context.Context) ([]string, error) { return h.r.Tables(ctx) }

func (h hostSource) Sample(ctx context.Context, table string, limit int) (*record.Batch, error) {
	return h.r.Sample(ctx, table, limit)
}

func (h hostSource) Run(ctx context.Context, out flow.Emitter) error { return h.r.Read(ctx, out) }

func (h hostSource) Start(ctx context.Context) error {
	if s, ok := h.r.(Starter); ok {
		return s.Start(ctx)
	}
	return nil
}

func (h hostSource) Finish(ctx context.Context) error {
	if f, ok := h.r.(Finisher); ok {
		return f.Finish(ctx)
	}
	return nil
}

func (h hostSource) Close() {
	if c, ok := h.r.(Closer); ok {
		c.Close()
	}
}

// Function is a host expression function, callable from every expression in
// a flow (Compute Columns, Filter Rows, Map Columns, the sink's computed
// columns …) and listed in the expression editor.
//
//	nifi.Config{Functions: []nifi.Function{{
//	    Name: "normalizePhone", Args: "value", Help: "+255 form of a local number",
//	    Fn: func(a ...any) (any, error) { return phone.Normalize(fmt.Sprint(a[0])), nil },
//	}}}
//
// Arguments arrive as row values (nil, string, int64, float64, bool,
// time.Time, []byte, …); return one of those, or nil for NULL. An error
// fails the row, which becomes a dead letter with the message. Names are
// global to the process and cannot replace a built-in function.
type Function struct {
	// Name is how the function is called; letters, digits and _ only.
	Name string
	// Args documents the parameters, e.g. "value, format".
	Args string
	// Help is one line shown in the function list.
	Help string
	Fn   func(args ...any) (any, error)
}
