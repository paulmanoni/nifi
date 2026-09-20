package flow

import (
	"fmt"
	"strings"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/exprx"
	"github.com/paulmanoni/nifi/internal/script"
	"github.com/paulmanoni/nifi/record"
)

// Per-column settings of the PostgreSQL sink, kept in column_map entries
// next to the rename:
//
//	{table, from, to, cast: "int64", type: "numeric(12,2)"}
//
// cast converts the incoming values (the incoming type); type is the
// PostgreSQL type of the target column — used when the column is created,
// and applied with ALTER COLUMN … TYPE when an existing column differs.
// "expressions" adds computed columns from the incoming row.

type sinkExpr struct {
	table  string // lower-case; "" = every table
	column string
	src    string
	prog   *exprx.Program
	typ    string // PostgreSQL type, optional
}

type colSetting struct {
	cast record.Type
	typ  string
}

func (s *pgSink) parsePrep(cfg Config) error {
	s.colSet = map[string]map[string]colSetting{}
	for _, m := range cfg.List("column_map") {
		t, from := strings.ToLower(str(m, "table")), str(m, "from")
		cast, typ := record.Type(str(m, "cast")), str(m, "type")
		if t == "" || from == "" || (cast == "" && typ == "") {
			continue
		}
		if typ != "" && !dbx.ValidPGType(typ) {
			return fmt.Errorf("column %s.%s: %q is not a PostgreSQL type", t, from, typ)
		}
		if s.colSet[t] == nil {
			s.colSet[t] = map[string]colSetting{}
		}
		s.colSet[t][from] = colSetting{cast: cast, typ: typ}
	}
	for i, m := range cfg.List("expressions") {
		col, src := str(m, "column"), str(m, "expr")
		if col == "" {
			continue
		}
		if src == "" {
			return fmt.Errorf("computed column %s: add an expression", col)
		}
		prog, err := exprx.Compile(src)
		if err != nil {
			return fmt.Errorf("computed column %d (%s): %w", i+1, col, err)
		}
		typ := str(m, "type")
		if typ != "" && !dbx.ValidPGType(typ) {
			return fmt.Errorf("computed column %s: %q is not a PostgreSQL type", col, typ)
		}
		s.exprs = append(s.exprs, sinkExpr{table: strings.ToLower(str(m, "table")), column: col, src: src, prog: prog, typ: typ})
	}
	return nil
}

// exprFor returns the computed-column expression of a table's column.
func (s *pgSink) exprFor(table, col string) string {
	for _, e := range s.exprs {
		if (e.table == "" || e.table == strings.ToLower(table)) && e.column == col {
			return e.src
		}
	}
	return ""
}

// prepare applies casts, target types and computed columns to an incoming
// batch. Rows whose cast or expression fails come back in fail.
func (s *pgSink) prepare(b *record.Batch) (out, fail *record.Batch) {
	set := s.colSet[strings.ToLower(b.Table)]
	var exprs []sinkExpr
	for _, e := range s.exprs {
		if e.table == "" || e.table == strings.ToLower(b.Table) {
			exprs = append(exprs, e)
		}
	}
	if len(set) == 0 && len(exprs) == 0 {
		return b, nil
	}
	o := b.Derive()
	o.Columns = append([]record.Column(nil), b.Columns...)
	var casts []int
	for i, c := range o.Columns {
		cs, ok := set[c.Name]
		if !ok {
			continue
		}
		if cs.cast != "" && cs.cast != c.Type {
			o.Columns[i].Type, o.Columns[i].NativeType = cs.cast, ""
			casts = append(casts, i)
		}
		o.Columns[i].TargetType = cs.typ
	}
	// computed columns: overwrite an incoming one of the same name, else append
	pos := make([]int, len(exprs))
	for k, e := range exprs {
		pos[k] = -1
		for i, c := range o.Columns {
			if c.Name == e.column {
				pos[k] = i
			}
		}
		if pos[k] < 0 {
			pos[k] = len(o.Columns)
			o.Columns = append(o.Columns, record.Column{Name: e.column, Type: record.Text, Nullable: true})
		}
		o.Columns[pos[k]].TargetType = e.typ
		o.Columns[pos[k]].Nullable = true
		o.Columns[pos[k]].AutoIncrement = false
	}
	names := colNames(b.Columns)
	var fl rowFailer
	var env map[string]any
	typed := make([]bool, len(exprs))
	o.Rows = make([][]any, 0, len(b.Rows))
rows:
	for ri, row := range b.Rows {
		nr := make([]any, len(o.Columns))
		copy(nr, row)
		for _, i := range casts {
			v, err := castValue(nr[i], o.Columns[i].Type, "")
			if err != nil {
				fl.add(b, ri, row, fmt.Errorf("%s: %w", o.Columns[i].Name, err))
				continue rows
			}
			nr[i] = v
		}
		if len(exprs) > 0 {
			env = exprx.Env(env, b.Table, names, nr[:len(b.Columns)])
			for k, e := range exprs {
				v, err := e.prog.Run(env)
				if err != nil {
					fl.add(b, ri, row, fmt.Errorf("%s: %w", e.column, err))
					continue rows
				}
				v = normalize(v)
				nr[pos[k]] = v
				if v != nil && !typed[k] {
					typed[k] = true
					c := script.InferColumn(e.column, v)
					o.Columns[pos[k]].Type, o.Columns[pos[k]].NativeType = c.Type, ""
				}
			}
		}
		o.Append(nr, b.Op(ri))
	}
	if o.Meta != nil && len(exprs) > 0 {
		m := o.Meta.Clone()
		have := map[string]bool{}
		for _, c := range m.Columns {
			have[c.Name] = true
		}
		for _, p := range pos {
			if !have[o.Columns[p].Name] {
				m.Columns = append(m.Columns, o.Columns[p])
			}
		}
		o.Meta = m
	}
	return o, fl.fail
}
