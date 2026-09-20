// Package gormx writes a GORM model the way GORM itself would.
//
// A flow that maps rows to a Go struct has to decide what actually reaches
// the database, and "every field, as it stands" is not the same thing GORM
// does on Create. It applies rules:
//
//   - a zero field with a `default` tag is written as that default, not as
//     the zero value;
//   - a zero CreatedAt/UpdatedAt becomes the current time;
//   - a column whose default lives in the database is left out of the
//     statement entirely while every row leaves it zero, so the database
//     applies it per row — writing a zero there instead would override it.
//
// Migrating onto a schema an ORM already owns means matching those rules
// exactly, or the migrated rows differ from the ones the application writes.
// That is what this package is for: hand it the model, and it reports the
// columns and values a Create would have produced.
//
//	nifi.Config{Processors: []nifi.Processor{
//	    gormx.Mapper(nifi.Mapper[nifi.Row, User]{
//	        Type: "app.map_users", Label: "Map users",
//	        Map:  mapUser,
//	    }).Processor(),
//	}}
//
// gormx.Mapper fills in the node's columns, primary key and rendering from
// the model's own schema. Nothing here needs a database connection: the
// naming strategy is enough, and it is the one thing you may have to pass if
// your app configures its own.
package gormx

import (
	"context"
	"database/sql/driver"
	"fmt"
	"reflect"
	"sync"
	"time"

	"github.com/paulmanoni/nifi"
	"github.com/paulmanoni/nifi/record"

	"gorm.io/gorm/schema"
)

// Option tunes how a model is written.
type Option func(*options)

type options struct {
	namer schema.Namer
	copy  bool
	now   func() time.Time
}

// Naming sets the naming strategy that turns field names into column names.
// Pass your app's when it configures one; the default is GORM's.
func Naming(n schema.Namer) Option { return func(o *options) { o.namer = n } }

// Copy writes the struct as it stands, skipping GORM's create rules. It is
// what a bulk COPY that ignores conflicts does: no defaults are filled in, no
// timestamps are set, and every column is written.
func Copy() Option { return func(o *options) { o.copy = true } }

// Now replaces the clock used for CreatedAt/UpdatedAt. For tests.
func Now(fn func() time.Time) Option { return func(o *options) { o.now = fn } }

// Model is a struct read the way GORM would write it.
type Model struct {
	sch  *schema.Schema
	opts options
	// fields are the schema's writable fields, in order.
	fields []*schema.Field
	pk     []string
}

// cache holds parsed schemas, which depend on the model type and the naming
// strategy and on nothing else. The options are carried on the Model itself,
// never cached: a clock or a Copy setting belonging to whoever described the
// model first would otherwise be handed to everyone after them.
var cache sync.Map // schemaKey → *schema.Schema

type schemaKey struct {
	model reflect.Type
	namer any
}

// Describe reads a model. Pass a value or a pointer to one; only its type
// matters.
func Describe(model any, opts ...Option) (*Model, error) {
	o := options{namer: schema.NamingStrategy{}, now: time.Now}
	for _, fn := range opts {
		fn(&o)
	}
	t := reflect.TypeOf(model)
	for t != nil && t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	if t == nil || t.Kind() != reflect.Struct {
		return nil, fmt.Errorf("gormx: %T is not a struct", model)
	}
	// A naming strategy that cannot be compared cannot be a cache key, so a
	// model described with one is parsed each time rather than risking
	// another strategy's answer.
	key, cacheable := schemaKey{model: t}, reflect.TypeOf(o.namer).Comparable()
	if cacheable {
		key.namer = o.namer
	}
	var sch *schema.Schema
	if v, ok := cache.Load(key); ok && cacheable {
		sch = v.(*schema.Schema)
	} else {
		parsed, err := schema.Parse(reflect.New(t).Interface(), &sync.Map{}, o.namer)
		if err != nil {
			return nil, fmt.Errorf("gormx: read %s: %w", t, err)
		}
		sch = parsed
		if cacheable {
			cache.Store(key, sch)
		}
	}
	m := &Model{sch: sch, opts: o}
	for _, f := range sch.Fields {
		if f.DBName != "" {
			m.fields = append(m.fields, f)
		}
	}
	for _, f := range sch.PrimaryFields {
		m.pk = append(m.pk, f.DBName)
	}
	return m, nil
}

// Table is the table name GORM would write to.
func (m *Model) Table() string { return m.sch.Table }

// PrimaryKey names the columns that identify a row.
func (m *Model) PrimaryKey() []string { return append([]string(nil), m.pk...) }

// Columns are every column the model can write. A particular batch may write
// fewer — see Render — but this is what the node declares, and what a
// destination should be prepared to receive.
func (m *Model) Columns() []record.Column {
	out := make([]record.Column, len(m.fields))
	for i, f := range m.fields {
		out[i] = m.column(f)
	}
	return out
}

func (m *Model) column(f *schema.Field) record.Column {
	return record.Column{Name: f.DBName, Type: typeOf(f.FieldType), Nullable: true}
}

// Render lays out values — a slice of the model type — as the columns and
// rows a Create would have written.
//
// The columns can be narrower than Columns() reports: a column whose default
// lives in the database is left out while every value leaves it zero, which
// is how the database gets to apply it.
func (m *Model) Render(vals any) ([]record.Column, [][]any, error) {
	rv := reflect.ValueOf(vals)
	if rv.Kind() != reflect.Slice {
		return nil, nil, fmt.Errorf("gormx: %T is not a slice of %s", vals, m.sch.ModelType)
	}
	ctx := context.Background()
	now := m.opts.now()

	fields := m.fields
	if !m.opts.copy {
		fields = fields[:0:0]
		for _, f := range m.fields {
			if f.HasDefaultValue && f.DefaultValueInterface == nil && !anySet(ctx, f, rv) {
				// Left out, so the database applies its own default per row.
				continue
			}
			fields = append(fields, f)
		}
	}

	cols := make([]record.Column, len(fields))
	for i, f := range fields {
		cols[i] = m.column(f)
	}
	rows := make([][]any, rv.Len())
	for i := 0; i < rv.Len(); i++ {
		ev := rv.Index(i)
		if ev.Kind() == reflect.Pointer {
			if ev.IsNil() {
				return nil, nil, fmt.Errorf("gormx: value %d is nil", i)
			}
			ev = ev.Elem()
		}
		row := make([]any, len(fields))
		for j, f := range fields {
			v, zero := f.ValueOf(ctx, ev)
			if zero && !m.opts.copy {
				switch {
				case f.DefaultValueInterface != nil:
					v = f.DefaultValueInterface
				case f.AutoCreateTime > 0 || f.AutoUpdateTime > 0:
					v = now
				}
			}
			out, err := Value(v)
			if err != nil {
				return nil, nil, fmt.Errorf("gormx: %s: %w", f.DBName, err)
			}
			row[j] = out
		}
		rows[i] = row
	}
	return cols, rows, nil
}

// anySet reports whether any value sets this field, which decides whether the
// column is written at all.
func anySet(ctx context.Context, f *schema.Field, rv reflect.Value) bool {
	for i := 0; i < rv.Len(); i++ {
		ev := rv.Index(i)
		if ev.Kind() == reflect.Pointer {
			if ev.IsNil() {
				continue
			}
			ev = ev.Elem()
		}
		if _, zero := f.ValueOf(ctx, ev); !zero {
			return true
		}
	}
	return false
}

// Mapper fills in a node's columns, primary key and rendering from its output
// model, so a mapping onto a GORM struct writes what GORM would.
func Mapper[In, Out any](m nifi.Mapper[In, Out], opts ...Option) nifi.Mapper[In, Out] {
	var zero Out
	model, err := Describe(zero, opts...)
	if err != nil {
		panic(err.Error())
	}
	m.Columns = model.Columns()
	if m.PrimaryKey == nil {
		m.PrimaryKey = model.PrimaryKey()
	}
	m.Render = func(_ context.Context, out []Out) ([]record.Column, [][]any, error) {
		return model.Render(out)
	}
	return m
}

var (
	timeType   = reflect.TypeOf(time.Time{})
	valuerType = reflect.TypeOf((*driver.Valuer)(nil)).Elem()
)

func typeOf(t reflect.Type) record.Type {
	for t.Kind() == reflect.Pointer {
		t = t.Elem()
	}
	switch {
	case t == timeType:
		return record.Timestamp
	case t.Implements(valuerType):
		return record.JSON
	}
	switch t.Kind() {
	case reflect.Bool:
		return record.Bool
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return record.Int64
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return record.Uint64
	case reflect.Float32, reflect.Float64:
		return record.Float64
	case reflect.Slice:
		if t.Elem().Kind() == reflect.Uint8 {
			return record.Bytes
		}
	}
	return record.Text
}

// Value renders one Go value the way it reaches the database: a pointer is
// dereferenced (nil is NULL), a driver.Valuer is asked what it is worth (and
// its bytes read as text), and a named scalar is reduced to the type
// underneath it, so a `type Status string` arrives as a string rather than as
// itself.
//
// It is what Render does to every field, exported because a host computing a
// value some other way — in an expression function, say — has to answer the
// same question, and two answers that agree by coincidence do not stay
// agreeing.
//
// A value of a kind that cannot be written is an error naming its type,
// rather than something the database will refuse later with less to say.
func Value(v any) (any, error) {
	if v == nil {
		return nil, nil
	}
	if vr, ok := v.(driver.Valuer); ok {
		rv := reflect.ValueOf(v)
		if rv.Kind() == reflect.Pointer && rv.IsNil() {
			return nil, nil
		}
		out, err := vr.Value()
		if b, isBytes := out.([]byte); isBytes {
			out = string(b)
		}
		return out, err
	}
	rv := reflect.ValueOf(v)
	switch rv.Kind() {
	case reflect.Pointer:
		if rv.IsNil() {
			return nil, nil
		}
		return Value(rv.Elem().Interface())
	case reflect.Bool:
		return rv.Bool(), nil
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return rv.Int(), nil
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return int64(rv.Uint()), nil
	case reflect.Float32, reflect.Float64:
		return rv.Float(), nil
	case reflect.String:
		return rv.String(), nil
	case reflect.Slice:
		if rv.Type().Elem().Kind() == reflect.Uint8 {
			if rv.IsNil() {
				return nil, nil
			}
			return rv.Bytes(), nil
		}
	}
	if t, ok := v.(time.Time); ok {
		return t, nil
	}
	return nil, fmt.Errorf("unsupported value %T", v)
}
