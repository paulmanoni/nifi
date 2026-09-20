package dbx

import (
	"fmt"
	"strings"

	"github.com/paulmanoni/nifi/record"
)

// ReadSpec selects columns from one table with an optional filter.
type ReadSpec struct {
	Meta    *record.TableMeta
	Columns []record.Column
	Where   string
}

func (s ReadSpec) selectList(db DB) string {
	cols := make([]string, len(s.Columns))
	for i, c := range s.Columns {
		cols[i] = db.Quote(c.Name)
	}
	return strings.Join(cols, ", ")
}

func (s ReadSpec) where(db DB, extra string) string {
	var parts []string
	if strings.TrimSpace(s.Where) != "" {
		parts = append(parts, "("+s.Where+")")
	}
	if extra != "" {
		parts = append(parts, extra)
	}
	if len(parts) == 0 {
		return ""
	}
	return " WHERE " + strings.Join(parts, " AND ")
}

func placeholder(db DB, n int) string {
	if db.Driver() == "postgres" {
		return fmt.Sprintf("$%d", n)
	}
	return "?"
}

// RangeQuery reads rows whose integer key is in [lo, hi).
func RangeQuery(db DB, s ReadSpec, key string, lo, hi int64) (string, []any) {
	k := db.Quote(key)
	cond := fmt.Sprintf("%s >= %s AND %s < %s", k, placeholder(db, 1), k, placeholder(db, 2))
	q := fmt.Sprintf("SELECT %s FROM %s%s ORDER BY %s", s.selectList(db), db.QualifiedName(s.Meta), s.where(db, cond), k)
	return q, []any{lo, hi}
}

// KeysetQuery reads the next page after the given key tuple (nil = start).
func KeysetQuery(db DB, s ReadSpec, key []string, after []string, limit int) (string, []any) {
	quoted := make([]string, len(key))
	for i, k := range key {
		quoted[i] = db.Quote(k)
	}
	order := strings.Join(quoted, ", ")
	var cond string
	var args []any
	if after != nil {
		ph := make([]string, len(key))
		for i := range key {
			ph[i] = placeholder(db, i+1)
			if db.Driver() == "postgres" {
				ph[i] = fmt.Sprintf("CAST(%s::text AS %s)", ph[i], nativeTypeOf(s.Meta, key[i]))
			}
			args = append(args, after[i])
		}
		if len(key) == 1 {
			cond = quoted[0] + " > " + ph[0]
		} else {
			cond = "(" + order + ") > (" + strings.Join(ph, ", ") + ")"
		}
	}
	q := fmt.Sprintf("SELECT %s FROM %s%s ORDER BY %s LIMIT %d", s.selectList(db), db.QualifiedName(s.Meta), s.where(db, cond), order, limit)
	return q, args
}

// FullQuery reads the whole table (tables without a usable key).
func FullQuery(db DB, s ReadSpec) string {
	return fmt.Sprintf("SELECT %s FROM %s%s", s.selectList(db), db.QualifiedName(s.Meta), s.where(db, ""))
}

// SampleQuery reads the first n rows, in key order when a key exists.
func SampleQuery(db DB, s ReadSpec, n int) string {
	order := ""
	if len(s.Meta.PrimaryKey) > 0 {
		q := make([]string, len(s.Meta.PrimaryKey))
		for i, k := range s.Meta.PrimaryKey {
			q[i] = db.Quote(k)
		}
		order = " ORDER BY " + strings.Join(q, ", ")
	}
	return fmt.Sprintf("SELECT %s FROM %s%s%s LIMIT %d", s.selectList(db), db.QualifiedName(s.Meta), s.where(db, ""), order, n)
}

func nativeTypeOf(m *record.TableMeta, col string) string {
	for _, c := range m.Columns {
		if c.Name == col && c.NativeType != "" {
			return c.NativeType
		}
	}
	return "text"
}

// IntegerKey reports the single integer primary-key column usable for range
// chunking, or "".
func IntegerKey(m *record.TableMeta) string {
	if len(m.PrimaryKey) != 1 {
		return ""
	}
	for _, c := range m.Columns {
		if c.Name == m.PrimaryKey[0] {
			switch c.Type {
			case record.Int16, record.Int32, record.Int64, record.Uint64:
				return c.Name
			}
		}
	}
	return ""
}
