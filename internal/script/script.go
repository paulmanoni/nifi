// Package script runs user transforms written in Starlark, a Python dialect
// interpreted in pure Go. A script defines either
//
//	def transform(row):        # dict in; dict, list of dicts, or None out
//	def transform_batch(rows): # list of dicts in; list of dicts out
//
// Predeclared: json, time, math, re, hashlib, uuid4(), log(...).
package script

import (
	"crypto/md5"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strings"
	"sync"
	"time"

	"go.starlark.net/lib/json"
	stmath "go.starlark.net/lib/math"
	sttime "go.starlark.net/lib/time"
	"go.starlark.net/starlark"
	"go.starlark.net/starlarkstruct"
	"go.starlark.net/syntax"

	"github.com/paulmanoni/nifi/record"
)

// RowSteps bounds the work of one transform(row) call and BatchSteps one
// transform_batch call, so a runaway loop fails instead of hanging while
// legitimately heavy rows are unaffected by batch size.
const (
	RowSteps   = 20_000_000
	BatchSteps = 2_000_000_000
)

// Program is a compiled, frozen script safe for concurrent use.
type Program struct {
	rowFn   *starlark.Function
	batchFn *starlark.Function
}

// Error carries the script line of a failure.
type Error struct {
	Line int
	Msg  string
}

func (e *Error) Error() string {
	if e.Line > 0 {
		return fmt.Sprintf("line %d: %s", e.Line, e.Msg)
	}
	return e.Msg
}

var fileOpts = &syntax.FileOptions{While: true, Set: true, TopLevelControl: true, GlobalReassign: true, Recursion: true}

// Compile executes the script's top level once and extracts its entry point.
func Compile(src string, logf func(string)) (*Program, error) {
	th := newThread(logf)
	code, err := translate(src)
	if err != nil {
		return nil, err
	}
	globals, err := starlark.ExecFileOptions(fileOpts, th, "script.py", code, predeclared())
	if err != nil {
		return nil, wrap(err)
	}
	globals.Freeze()
	p := &Program{}
	if f, ok := globals["transform"].(*starlark.Function); ok {
		p.rowFn = f
	}
	if f, ok := globals["transform_batch"].(*starlark.Function); ok {
		p.batchFn = f
	}
	if p.rowFn == nil && p.batchFn == nil {
		return nil, &Error{Msg: "script must define transform(row) or transform_batch(rows)"}
	}
	return p, nil
}

func newThread(logf func(string)) *starlark.Thread {
	th := &starlark.Thread{Name: "nifi"}
	th.Print = func(_ *starlark.Thread, msg string) {
		if logf != nil {
			logf(msg)
		}
	}
	th.SetMaxExecutionSteps(BatchSteps)
	return th
}

// RowError is a failure on one input row.
type RowError struct {
	Row int
	Err error
}

// Result of transforming a batch.
type Result struct {
	Columns []record.Column
	Rows    [][]any
	Dropped int
	Failed  []RowError
}

// Run transforms one batch. Row-mode failures are reported per row; a
// batch-mode failure fails every row.
func (p *Program) Run(b *record.Batch, logf func(string)) (*Result, error) {
	th := newThread(logf)
	names := make([]string, len(b.Columns))
	for i, c := range b.Columns {
		names[i] = c.Name
	}
	toDict := func(row []any) (*starlark.Dict, error) {
		d := starlark.NewDict(len(names))
		for i, n := range names {
			var v any
			if i < len(row) {
				v = row[i]
			}
			sv, err := ToStarlark(v)
			if err != nil {
				return nil, err
			}
			d.SetKey(starlark.String(n), sv)
		}
		return d, nil
	}
	out := &outBuilder{in: b.Columns, index: map[string]int{}}
	res := &Result{}

	if p.rowFn != nil {
		for i, row := range b.Rows {
			d, err := toDict(row)
			if err != nil {
				res.Failed = append(res.Failed, RowError{i, err})
				continue
			}
			th.SetMaxExecutionSteps(th.ExecutionSteps() + RowSteps)
			v, err := starlark.Call(th, p.rowFn, starlark.Tuple{d}, nil)
			if err != nil {
				res.Failed = append(res.Failed, RowError{i, wrap(err)})
				if isStepLimit(err) {
					th = newThread(logf)
				}
				continue
			}
			n, err := out.add(v)
			if err != nil {
				res.Failed = append(res.Failed, RowError{i, err})
				continue
			}
			if n == 0 {
				res.Dropped++
			}
		}
	} else {
		list := starlark.NewList(nil)
		for _, row := range b.Rows {
			d, err := toDict(row)
			if err != nil {
				return nil, err
			}
			list.Append(d)
		}
		v, err := starlark.Call(th, p.batchFn, starlark.Tuple{list}, nil)
		if err != nil {
			return nil, wrap(err)
		}
		if _, err := out.add(v); err != nil {
			return nil, err
		}
	}
	res.Columns, res.Rows = out.columns(), out.rows
	if len(b.Rows) == 0 {
		res.Columns = b.Columns
	}
	return res, nil
}

func isStepLimit(err error) bool {
	return strings.Contains(err.Error(), "too many steps")
}

type outBuilder struct {
	in    []record.Column
	cols  []record.Column
	index map[string]int
	rows  [][]any
	// typed marks columns whose type was settled by a non-empty value; until
	// then an empty first value must not pin the column to its input type.
	typed map[int]bool
}

func (o *outBuilder) add(v starlark.Value) (int, error) {
	switch x := v.(type) {
	case starlark.NoneType:
		return 0, nil
	case *starlark.Dict:
		return 1, o.addDict(x)
	case *starlark.List:
		for i := 0; i < x.Len(); i++ {
			d, ok := x.Index(i).(*starlark.Dict)
			if !ok {
				if _, none := x.Index(i).(starlark.NoneType); none {
					continue
				}
				return 0, fmt.Errorf("list item %d is %s, want dict", i, x.Index(i).Type())
			}
			if err := o.addDict(d); err != nil {
				return 0, err
			}
		}
		return x.Len(), nil
	default:
		return 0, fmt.Errorf("transform returned %s, want dict, list or None", v.Type())
	}
}

func (o *outBuilder) addDict(d *starlark.Dict) error {
	row := make([]any, len(o.cols), len(o.cols)+2)
	for _, item := range d.Items() {
		k, ok := starlark.AsString(item[0])
		if !ok {
			return fmt.Errorf("row keys must be strings, got %s", item[0].Type())
		}
		v, err := FromStarlark(item[1])
		if err != nil {
			return fmt.Errorf("column %q: %w", k, err)
		}
		i, ok := o.index[k]
		if !ok {
			i = len(o.cols)
			o.index[k] = i
			o.cols = append(o.cols, o.columnFor(k, v))
			for j := range o.rows {
				o.rows[j] = append(o.rows[j], nil)
			}
			row = append(row, nil)
		} else if v != nil && !o.typed[i] {
			o.cols[i] = o.columnFor(k, v)
		}
		if v != nil {
			if o.typed == nil {
				o.typed = map[int]bool{}
			}
			o.typed[i] = true
		}
		row[i] = v
	}
	o.rows = append(o.rows, row)
	return nil
}

func (o *outBuilder) columnFor(name string, v any) record.Column {
	for _, c := range o.in {
		if c.Name == name && (v == nil || compatible(c.Type, v)) {
			return c
		}
	}
	return InferColumn(name, v)
}

// columns finalizes the output schema. A script may set any column to None,
// so no output column keeps a NOT NULL from its input (the sink still keeps
// primary keys NOT NULL).
func (o *outBuilder) columns() []record.Column {
	for i := range o.cols {
		if o.cols[i].Type == "" {
			o.cols[i].Type = record.Text
		}
		o.cols[i].Nullable = true
	}
	return o.cols
}

func compatible(t record.Type, v any) bool {
	switch v.(type) {
	case int64, uint64:
		switch t {
		case record.Int16, record.Int32, record.Int64, record.Uint64, record.Year, record.Decimal, record.Float32, record.Float64, record.Bool:
			return true
		}
		return false
	case float64:
		return t == record.Float32 || t == record.Float64 || t == record.Decimal
	case bool:
		return t == record.Bool
	case time.Time:
		return t == record.Date || t == record.Timestamp || t == record.TimestampTZ
	case []byte:
		return t == record.Bytes
	case map[string]any, []any:
		return t == record.JSON
	}
	return true
}

// InferColumn picks a logical type for a value produced by code.
func InferColumn(name string, v any) record.Column {
	c := record.Column{Name: name, Nullable: true}
	switch v.(type) {
	case nil:
		c.Type = ""
	case bool:
		c.Type = record.Bool
	case int64:
		c.Type = record.Int64
	case uint64:
		c.Type = record.Uint64
	case float64:
		c.Type = record.Float64
	case time.Time:
		c.Type = record.TimestampTZ
	case []byte:
		c.Type = record.Bytes
	case map[string]any, []any:
		c.Type = record.JSON
	default:
		c.Type = record.Text
	}
	return c
}

func wrap(err error) error {
	var ee *starlark.EvalError
	if errors.As(err, &ee) {
		line := 0
		for i := len(ee.CallStack) - 1; i >= 0; i-- {
			if ee.CallStack[i].Pos.Filename() == "script.py" {
				line = int(ee.CallStack[i].Pos.Line)
				break
			}
		}
		return &Error{Line: line, Msg: ee.Msg}
	}
	var se syntax.Error
	if errors.As(err, &se) {
		return &Error{Line: int(se.Pos.Line), Msg: se.Msg}
	}
	return &Error{Msg: err.Error()}
}

// ToStarlark converts a canonical row value.
func ToStarlark(v any) (starlark.Value, error) {
	switch x := v.(type) {
	case nil:
		return starlark.None, nil
	case bool:
		return starlark.Bool(x), nil
	case int64:
		return starlark.MakeInt64(x), nil
	case int:
		return starlark.MakeInt(x), nil
	case uint64:
		return starlark.MakeUint64(x), nil
	case float64:
		return starlark.Float(x), nil
	case string:
		return starlark.String(x), nil
	case []byte:
		return starlark.Bytes(x), nil
	case time.Time:
		return PyTime{sttime.Time(x)}, nil
	case map[string]any:
		d := starlark.NewDict(len(x))
		for k, e := range x {
			sv, err := ToStarlark(e)
			if err != nil {
				return nil, err
			}
			d.SetKey(starlark.String(k), sv)
		}
		return d, nil
	case []any:
		l := make([]starlark.Value, len(x))
		for i, e := range x {
			sv, err := ToStarlark(e)
			if err != nil {
				return nil, err
			}
			l[i] = sv
		}
		return starlark.NewList(l), nil
	default:
		return starlark.String(fmt.Sprint(x)), nil
	}
}

// FromStarlark converts back to a canonical row value.
func FromStarlark(v starlark.Value) (any, error) {
	switch x := v.(type) {
	case starlark.NoneType:
		return nil, nil
	case starlark.Bool:
		return bool(x), nil
	case starlark.Int:
		if n, ok := x.Int64(); ok {
			return n, nil
		}
		if n, ok := x.Uint64(); ok {
			return n, nil
		}
		return x.BigInt().String(), nil
	case starlark.Float:
		return float64(x), nil
	case starlark.String:
		return string(x), nil
	case starlark.Bytes:
		return []byte(x), nil
	case sttime.Time:
		return time.Time(x).UTC(), nil
	case PyTime:
		return time.Time(x.Time).UTC(), nil
	case *starlark.Dict:
		m := make(map[string]any, x.Len())
		for _, it := range x.Items() {
			k, ok := starlark.AsString(it[0])
			if !ok {
				k = it[0].String()
			}
			e, err := FromStarlark(it[1])
			if err != nil {
				return nil, err
			}
			m[k] = e
		}
		return m, nil
	case starlark.Indexable:
		out := make([]any, x.Len())
		for i := range out {
			e, err := FromStarlark(x.Index(i))
			if err != nil {
				return nil, err
			}
			out[i] = e
		}
		return out, nil
	default:
		return nil, fmt.Errorf("unsupported value type %s", v.Type())
	}
}

var (
	predeclOnce sync.Once
	predecl     starlark.StringDict
)

func predeclared() starlark.StringDict {
	predeclOnce.Do(func() {
		predecl = starlark.StringDict{
			// placeholder; Python-compatible modules/helpers are merged below
			"json":    json.Module,
			"time":    sttime.Module,
			"math":    stmath.Module,
			"re":      reModule(),
			"hashlib": hashModule(),
			"uuid4": starlark.NewBuiltin("uuid4", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
				b := make([]byte, 16)
				rand.Read(b)
				b[6] = b[6]&0x0f | 0x40
				b[8] = b[8]&0x3f | 0x80
				return starlark.String(fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])), nil
			}),
			"log": starlark.NewBuiltin("log", func(th *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
				parts := make([]string, len(args))
				for i, a := range args {
					if s, ok := starlark.AsString(a); ok {
						parts[i] = s
					} else {
						parts[i] = a.String()
					}
				}
				th.Print(th, strings.Join(parts, " "))
				return starlark.None, nil
			}),
			"decimal": starlark.NewBuiltin("decimal", func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
				if len(args) != 1 {
					return nil, fmt.Errorf("decimal(value)")
				}
				s, _ := starlark.AsString(args[0])
				if s == "" {
					s = args[0].String()
				}
				r, ok := new(big.Rat).SetString(s)
				if !ok {
					return nil, fmt.Errorf("decimal: invalid number %q", s)
				}
				f, _ := r.Float64()
				return starlark.Float(f), nil
			}),
		}
		for k, v := range pyBuiltins() {
			predecl[k] = v
		}
	})
	return predecl
}

var reCache sync.Map

func getRe(p string) (*regexp.Regexp, error) {
	if v, ok := reCache.Load(p); ok {
		return v.(*regexp.Regexp), nil
	}
	re, err := regexp.Compile(p)
	if err != nil {
		return nil, err
	}
	reCache.Store(p, re)
	return re, nil
}

func reModule() *starlarkstruct.Module {
	fn := func(name string, f func(re *regexp.Regexp, s string, rest starlark.Tuple) (starlark.Value, error), extra int) *starlark.Builtin {
		return starlark.NewBuiltin(name, func(_ *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
			if len(args) != 2+extra {
				return nil, fmt.Errorf("re.%s: want %d arguments", name, 2+extra)
			}
			p, _ := starlark.AsString(args[0])
			s, _ := starlark.AsString(args[1+extra])
			re, err := getRe(p)
			if err != nil {
				return nil, err
			}
			return f(re, s, args[1:1+extra])
		})
	}
	strs := func(xs []string) starlark.Value {
		if xs == nil {
			return starlark.None
		}
		l := make([]starlark.Value, len(xs))
		for i, x := range xs {
			l[i] = starlark.String(x)
		}
		return starlark.NewList(l)
	}
	return &starlarkstruct.Module{Name: "re", Members: starlark.StringDict{
		// re.search(pattern, s) → list of [match, group1, …] or None
		"search": fn("search", func(re *regexp.Regexp, s string, _ starlark.Tuple) (starlark.Value, error) {
			return strs(re.FindStringSubmatch(s)), nil
		}, 0),
		"match": fn("match", func(re *regexp.Regexp, s string, _ starlark.Tuple) (starlark.Value, error) {
			return starlark.Bool(re.MatchString(s)), nil
		}, 0),
		"findall": fn("findall", func(re *regexp.Regexp, s string, _ starlark.Tuple) (starlark.Value, error) {
			return strs(re.FindAllString(s, -1)), nil
		}, 0),
		// re.sub(pattern, repl, s) — repl uses $1 for groups
		"sub": fn("sub", func(re *regexp.Regexp, s string, rest starlark.Tuple) (starlark.Value, error) {
			r, _ := starlark.AsString(rest[0])
			return starlark.String(re.ReplaceAllString(s, r)), nil
		}, 1),
		"split": fn("split", func(re *regexp.Regexp, s string, _ starlark.Tuple) (starlark.Value, error) {
			return strs(re.Split(s, -1)), nil
		}, 0),
	}}
}

func hashModule() *starlarkstruct.Module {
	mk := func(name string, f func([]byte) []byte) *starlark.Builtin {
		return starlark.NewBuiltin(name, func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
			if len(args) != 1 {
				return nil, fmt.Errorf("hashlib.%s(value)", name)
			}
			var b []byte
			switch x := args[0].(type) {
			case starlark.String:
				b = []byte(x)
			case starlark.Bytes:
				b = []byte(x)
			default:
				b = []byte(x.String())
			}
			return starlark.String(hex.EncodeToString(f(b))), nil
		})
	}
	return &starlarkstruct.Module{Name: "hashlib", Members: starlark.StringDict{
		"sha256": mk("sha256", func(b []byte) []byte { h := sha256.Sum256(b); return h[:] }),
		"sha1":   mk("sha1", func(b []byte) []byte { h := sha1.Sum(b); return h[:] }),
		"md5":    mk("md5", func(b []byte) []byte { h := md5.Sum(b); return h[:] }),
	}}
}
