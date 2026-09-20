package nifi

// Reading a row into the mapping's input type, and writing its output type
// back out as columns. Both are worked out once, when the node is described,
// so a batch costs a field copy per value and nothing more.

import (
	"fmt"
	"reflect"
	"strings"
	"time"

	"github.com/paulmanoni/nifi/record"
)

// decoderFor builds the reader for a mapping's input type: a plain Row, or a
// struct whose fields are matched to the incoming columns by name.
func decoderFor[In any]() (func(cols []record.Column, row []any) (In, error), error) {
	var zero In
	t := reflect.TypeOf(&zero).Elem()
	if t.Kind() == reflect.Map && t.Key().Kind() == reflect.String && t.Elem().Kind() == reflect.Interface {
		return func(cols []record.Column, row []any) (In, error) {
			m := make(map[string]any, len(cols))
			for i, c := range cols {
				if i < len(row) {
					m[c.Name] = row[i]
				}
			}
			return reflect.ValueOf(m).Convert(t).Interface().(In), nil
		}, nil
	}
	if t.Kind() != reflect.Struct {
		return nil, fmt.Errorf("the input type must be nifi.Row or a struct, not %s", t)
	}
	fields, err := structFields(t)
	if err != nil {
		return nil, err
	}
	byName := make(map[string][]int, len(fields))
	for _, f := range fields {
		byName[strings.ToLower(f.column)] = f.index
	}
	// The column order is fixed for a batch, so the lookup is done once per
	// batch rather than once per row.
	var lastCols []record.Column
	var plan [][]int
	return func(cols []record.Column, row []any) (In, error) {
		if !sameColumns(lastCols, cols) {
			plan = make([][]int, len(cols))
			for i, c := range cols {
				plan[i] = byName[strings.ToLower(c.Name)]
			}
			lastCols = cols
		}
		out := reflect.New(t).Elem()
		for i, idx := range plan {
			if idx == nil || i >= len(row) || row[i] == nil {
				continue
			}
			if err := assign(out.FieldByIndex(idx), row[i]); err != nil {
				return zero, fmt.Errorf("%s: %w", cols[i].Name, err)
			}
		}
		return out.Interface().(In), nil
	}, nil
}

func sameColumns(a, b []record.Column) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Name != b[i].Name {
			return false
		}
	}
	return true
}

type mapField struct {
	index  []int
	column string
	typ    record.Type
}

// structFields flattens a struct into its written fields. An embedded struct
// contributes its own fields, as it does in every ORM.
func structFields(t reflect.Type) ([]mapField, error) {
	var out []mapField
	var walk func(t reflect.Type, prefix []int) error
	walk = func(t reflect.Type, prefix []int) error {
		for i := 0; i < t.NumField(); i++ {
			f := t.Field(i)
			idx := append(append([]int(nil), prefix...), i)
			ft := f.Type
			for ft.Kind() == reflect.Pointer {
				ft = ft.Elem()
			}
			if f.Anonymous && ft.Kind() == reflect.Struct && !isTime(ft) {
				if err := walk(ft, idx); err != nil {
					return err
				}
				continue
			}
			if !f.IsExported() {
				continue
			}
			name := columnName(f)
			if name == "" {
				continue
			}
			out = append(out, mapField{index: idx, column: name, typ: typeOf(ft)})
		}
		return nil
	}
	if err := walk(t, nil); err != nil {
		return nil, err
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("%s has no exported fields to write", t)
	}
	return out, nil
}

func outFields[Out any]() ([]mapField, error) {
	var zero Out
	t := reflect.TypeOf(&zero).Elem()
	if t.Kind() != reflect.Struct {
		return nil, fmt.Errorf("the output type must be a struct, not %s", t)
	}
	return structFields(t)
}

func columnsOf(fields []mapField) []record.Column {
	cols := make([]record.Column, len(fields))
	for i, f := range fields {
		cols[i] = record.Column{Name: f.column, Type: f.typ, Nullable: true}
	}
	return cols
}

func encodeRow(fields []mapField, rv reflect.Value) []any {
	row := make([]any, len(fields))
	for i, f := range fields {
		v := rv.FieldByIndex(f.index)
		for v.Kind() == reflect.Pointer {
			if v.IsNil() {
				v = reflect.Value{}
				break
			}
			v = v.Elem()
		}
		if v.IsValid() {
			row[i] = v.Interface()
		}
	}
	return row
}

// columnName is the column a field is written to: the nifi tag, else a db or
// json tag, else the field name in snake_case. "-" leaves the field out.
func columnName(f reflect.StructField) string {
	for _, tag := range []string{"nifi", "db", "json"} {
		v, ok := f.Tag.Lookup(tag)
		if !ok {
			continue
		}
		name, _, _ := strings.Cut(v, ",")
		if name == "-" {
			return ""
		}
		if name != "" {
			return name
		}
	}
	return snake(f.Name)
}

func snake(s string) string {
	var b strings.Builder
	for i, r := range s {
		if r >= 'A' && r <= 'Z' {
			// ID → id, UserID → user_id, HTTPCode → http_code
			if i > 0 && (s[i-1] < 'A' || s[i-1] > 'Z') {
				b.WriteByte('_')
			} else if i > 0 && i+1 < len(s) && s[i+1] >= 'a' && s[i+1] <= 'z' {
				b.WriteByte('_')
			}
			b.WriteRune(r + 32)
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

var timeType = reflect.TypeOf(time.Time{})

func isTime(t reflect.Type) bool { return t == timeType }

func typeOf(t reflect.Type) record.Type {
	if isTime(t) {
		return record.Timestamp
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
		return record.JSON
	case reflect.Map, reflect.Struct:
		return record.JSON
	default:
		return record.Text
	}
}

// assign writes a row value into a struct field, converting where Go will.
// A value that cannot go in the field is an error on that row, not a panic.
func assign(dst reflect.Value, v any) error {
	if dst.Kind() == reflect.Pointer {
		if dst.IsNil() {
			dst.Set(reflect.New(dst.Type().Elem()))
		}
		dst = dst.Elem()
	}
	sv := reflect.ValueOf(v)
	switch {
	case sv.Type() == dst.Type():
		dst.Set(sv)
	case sv.Type().ConvertibleTo(dst.Type()) && !(sv.Kind() == reflect.String && isNumeric(dst.Kind())):
		dst.Set(sv.Convert(dst.Type()))
	default:
		return fmt.Errorf("a %T does not fit a %s", v, dst.Type())
	}
	return nil
}

func isNumeric(k reflect.Kind) bool {
	switch k {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64:
		return true
	}
	return false
}
