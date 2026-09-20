package nifi

// Mapper turns an ordinary Go function into a node.
//
// A host can always write a Handler by hand, but then the engine only knows
// how to run it — not what it emits, not what happened to a row it dropped,
// not how to keep a change's insert/update/delete attached to the row it came
// from. Mapper is the same thing declared rather than assembled: the input
// type says how to read a row, the output type says what the node emits, and
// everything between is the library's problem.
//
//	var Users = nifi.Mapper[nifi.Row, User]{
//	    Type: "app.map_users", Label: "Map users", Icon: "user",
//	    PrimaryKey: []string{"id"},
//	    Map: func(ctx context.Context, in nifi.Row) (*User, error) {
//	        name, _ := in["full_name"].(string)
//	        if name == "" {
//	            return nil, nil // drop the row
//	        }
//	        return &User{ID: in.Int("id"), Name: name}, nil
//	    },
//	}.Processor()
//
// Returning nil drops the row; returning an error sends that one row to
// "failure" with the message, leaving the rest of the batch to go through.

import (
	"context"
	"fmt"
	"reflect"

	"github.com/paulmanoni/nifi/record"
)

// Row is the untyped input a mapper can take: column name → value.
type Row = map[string]any

// MapFunc transforms one row. nil drops it; an error fails just that row.
type MapFunc[In, Out any] func(ctx context.Context, in In) (*Out, error)

// Mapper describes a node built from a mapping function. In is the shape a
// row arrives as — Row, or a struct whose fields are matched to the incoming
// columns by name. Out is a struct whose fields become the node's output
// columns.
type Mapper[In, Out any] struct {
	// Type identifies the node in saved flows ("app.map_users"). Keep it
	// stable: it is what a stored flow refers to.
	Type        string
	Label       string
	Description string
	// Icon is a lucide icon name (https://lucide.dev).
	Icon string
	// Category places the node in the palette; "Transform" by default.
	Category string
	// Properties are the node's settings, read by Open.
	Properties []Property
	// Concurrent lets several workers map batches at once. Only set it when
	// the function Open returns is safe to call concurrently.
	Concurrent bool

	// Map is the mapping, when it needs nothing but the row.
	Map MapFunc[In, Out]
	// Open builds the mapping from the node's settings, and returns it with
	// a closer to run at the end — or nil, when there is nothing to release.
	// Set either Map or Open, not both.
	//
	// It is called whenever the node is built, which includes checking a
	// flow and reading its schema, not only running one. So read settings
	// here and fail on a setting that cannot work — but do not open
	// connections, warm caches or touch a target. Anything that needs the
	// world to be up belongs behind the first row the mapping is given: a
	// sync.Once inside the returned function is enough, and it keeps the
	// promise that pressing Validate changes nothing.
	Open func(s Settings) (MapFunc[In, Out], func(), error)

	// PrimaryKey names the output columns that identify a row. A destination
	// uses it to match existing rows and to delete the ones a change feed
	// reports as deleted.
	PrimaryKey []string

	// Columns overrides the output columns derived from Out. Needed only
	// alongside Render, when what is written is not Out's own fields.
	Columns []record.Column
	// Render overrides how mapped values become rows — for a host that has to
	// match an ORM's write rules exactly, for instance. It must return one
	// row per mapped value, in order, or a row's operation would follow the
	// wrong row.
	Render func(ctx context.Context, out []Out) ([]record.Column, [][]any, error)
}

// Processor turns the description into a node the engine can register.
// It panics on a description that cannot work — a missing mapping, an input
// type that is neither Row nor a struct — because that is a mistake in the
// program, not in a flow.
func (m Mapper[In, Out]) Processor() Processor {
	if m.Map == nil && m.Open == nil {
		panic("nifi: mapper " + m.Type + " needs Map or Open")
	}
	if m.Map != nil && m.Open != nil {
		panic("nifi: mapper " + m.Type + " sets both Map and Open")
	}
	decode, err := decoderFor[In]()
	if err != nil {
		panic("nifi: mapper " + m.Type + ": " + err.Error())
	}
	cols, encode := m.Columns, m.Render
	if encode == nil {
		fields, err := outFields[Out]()
		if err != nil {
			panic("nifi: mapper " + m.Type + ": " + err.Error())
		}
		cols = columnsOf(fields)
		encode = func(_ context.Context, outs []Out) ([]record.Column, [][]any, error) {
			rows := make([][]any, len(outs))
			for i := range outs {
				rows[i] = encodeRow(fields, reflect.ValueOf(&outs[i]).Elem())
			}
			return cols, rows, nil
		}
	}
	if len(cols) == 0 {
		panic("nifi: mapper " + m.Type + ": Render needs Columns, since the output is not " + reflect.TypeOf(*new(Out)).String())
	}

	category := m.Category
	if category == "" {
		category = "Transform"
	}
	mm := m
	return Processor{
		Type: m.Type, Label: m.Label, Description: m.Description, Icon: m.Icon,
		Category: category, Properties: m.Properties, Concurrent: m.Concurrent,
		Ports: []string{"success", "failure"},
		New: func(s Settings) (Handler, error) {
			fn, closer := mm.Map, func() {}
			if mm.Open != nil {
				f, c, err := mm.Open(s)
				if err != nil {
					return nil, err
				}
				if f == nil {
					return nil, fmt.Errorf("%s: no mapping was opened", mm.Type)
				}
				fn = f
				if c != nil {
					closer = c
				}
			}
			return &mapperHandler[In, Out]{
				fn: fn, closer: closer, decode: decode, encode: encode,
				cols: cols, pk: mm.PrimaryKey,
			}, nil
		},
	}
}

type mapperHandler[In, Out any] struct {
	fn     MapFunc[In, Out]
	closer func()
	decode func(cols []record.Column, row []any) (In, error)
	encode func(ctx context.Context, out []Out) ([]record.Column, [][]any, error)
	cols   []record.Column
	pk     []string
}

// Columns implements the engine's Schematic: the node says what it emits
// without being run, so the designer can show it and the rest of the flow can
// be checked against it with no connection and no data.
func (h *mapperHandler[In, Out]) Columns([]record.Column) ([]record.Column, error) {
	return h.cols, nil
}

func (h *mapperHandler[In, Out]) Close() { h.closer() }

func (h *mapperHandler[In, Out]) Process(ctx context.Context, in *record.Batch, out Emitter) error {
	var fail *record.Batch
	failRow := func(i int, err error) {
		if fail == nil {
			fail = in.Derive()
		}
		fail.AppendRow(in, i)
		fail.Errors = append(fail.Errors, err.Error())
	}

	outs := make([]Out, 0, len(in.Rows))
	// from[i] is the input row that produced outs[i]: the mapping drops rows,
	// so position is not identity, and anything held per input row — a
	// change's insert, update or delete — has to follow its own row.
	from := make([]int, 0, len(in.Rows))
	for i, row := range in.Rows {
		v, err := h.decode(in.Columns, row)
		if err != nil {
			failRow(i, err)
			continue
		}
		o, err := h.fn(ctx, v)
		if err != nil {
			failRow(i, err)
			continue
		}
		if o == nil {
			continue // the mapping dropped this row
		}
		outs = append(outs, *o)
		from = append(from, i)
	}

	cols, rows, err := h.encode(ctx, outs)
	if err != nil {
		return err
	}
	if len(rows) != len(from) {
		return fmt.Errorf("the mapping rendered %d rows for %d mapped values: it must return one row per value, in order",
			len(rows), len(from))
	}
	o := in.Derive()
	o.Columns = cols
	o.Meta = &record.TableMeta{Name: in.Table, Columns: cols, PrimaryKey: h.pk}
	if in.Meta != nil {
		o.Meta.Dialect, o.Meta.Schema = in.Meta.Dialect, in.Meta.Schema
	}
	for i, r := range rows {
		o.Append(r, in.Op(from[i]))
	}
	out.Emit("success", o)
	if fail != nil {
		out.Emit("failure", fail)
	}
	return nil
}
