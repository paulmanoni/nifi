// Package record defines the unit of data that moves through a flow: a Batch of
// rows sharing one schema, tagged with the table it came from.
package record

import (
	"strings"
	"sync"
	"sync/atomic"
)

// Type is a dialect-neutral logical column type.
type Type string

const (
	Bool        Type = "bool"
	Int16       Type = "int16"
	Int32       Type = "int32"
	Int64       Type = "int64"
	Uint64      Type = "uint64"
	Float32     Type = "float32"
	Float64     Type = "float64"
	Decimal     Type = "decimal"
	String      Type = "string" // bounded (varchar(n))
	Text        Type = "text"
	Bytes       Type = "bytes"
	Date        Type = "date"
	Time        Type = "time"
	Timestamp   Type = "timestamp"
	TimestampTZ Type = "timestamptz"
	Interval    Type = "interval"
	JSON        Type = "json"
	UUID        Type = "uuid"
	Enum        Type = "enum"
	Set         Type = "set"
	Bit         Type = "bit"
	Year        Type = "year"
	Array       Type = "array"
	Other       Type = "other" // carried as the source's text literal
)

// AllTypes lists the logical types offered in the UI's type pickers.
var AllTypes = []Type{Bool, Int16, Int32, Int64, Uint64, Float32, Float64, Decimal, String, Text,
	Bytes, Date, Time, Timestamp, TimestampTZ, Interval, JSON, UUID, Enum, Set, Bit, Year, Array, Other}

// Column describes one column of a schema.
type Column struct {
	Name          string `json:"name"`
	Type          Type   `json:"type"`
	NativeType    string `json:"nativeType"`
	Nullable      bool   `json:"nullable"`
	Length        int64  `json:"length,omitempty"`
	Precision     int    `json:"precision,omitempty"`
	Scale         int    `json:"scale,omitempty"`
	Default       string `json:"default,omitempty"`
	AutoIncrement bool   `json:"autoIncrement,omitempty"`
	Generated     bool   `json:"generated,omitempty"`
	// TargetType, when set, is the exact PostgreSQL type to create the
	// column with (e.g. "varchar(120)", "numeric(12,2)", "jsonb").
	TargetType string `json:"targetType,omitempty"`
	// Values holds enum/set members when known.
	Values []string `json:"values,omitempty"`
}

// Index is a secondary (or unique) index.
type Index struct {
	Name    string   `json:"name"`
	Columns []string `json:"columns"`
	Unique  bool     `json:"unique"`
}

// ForeignKey is a table-level FK constraint.
type ForeignKey struct {
	Name       string   `json:"name"`
	Columns    []string `json:"columns"`
	RefTable   string   `json:"refTable"`
	RefColumns []string `json:"refColumns"`
	OnDelete   string   `json:"onDelete"`
	OnUpdate   string   `json:"onUpdate"`
}

// TableMeta is the introspected shape of a source table.
type TableMeta struct {
	Dialect       string       `json:"dialect"`
	Schema        string       `json:"schema"`
	Name          string       `json:"name"`
	Columns       []Column     `json:"columns"`
	PrimaryKey    []string     `json:"primaryKey"`
	Indexes       []Index      `json:"indexes"`
	ForeignKeys   []ForeignKey `json:"foreignKeys"`
	EstimatedRows int64        `json:"estimatedRows"`
}

// Clone deep-copies the metadata so a processor can rewrite names.
func (m *TableMeta) Clone() *TableMeta {
	if m == nil {
		return nil
	}
	c := *m
	c.Columns = append([]Column(nil), m.Columns...)
	c.PrimaryKey = append([]string(nil), m.PrimaryKey...)
	c.Indexes = make([]Index, len(m.Indexes))
	for i, ix := range m.Indexes {
		ix.Columns = append([]string(nil), ix.Columns...)
		c.Indexes[i] = ix
	}
	c.ForeignKeys = make([]ForeignKey, len(m.ForeignKeys))
	for i, fk := range m.ForeignKeys {
		fk.Columns = append([]string(nil), fk.Columns...)
		fk.RefColumns = append([]string(nil), fk.RefColumns...)
		c.ForeignKeys[i] = fk
	}
	return &c
}

// RenameColumns applies old→new renames to every column reference.
func (m *TableMeta) RenameColumns(ren map[string]string) {
	if m == nil || len(ren) == 0 {
		return
	}
	sub := func(names []string) {
		for i, n := range names {
			if to, ok := ren[n]; ok {
				names[i] = to
			}
		}
	}
	for i := range m.Columns {
		if to, ok := ren[m.Columns[i].Name]; ok {
			m.Columns[i].Name = to
		}
	}
	sub(m.PrimaryKey)
	for i := range m.Indexes {
		sub(m.Indexes[i].Columns)
	}
	for i := range m.ForeignKeys {
		sub(m.ForeignKeys[i].Columns)
	}
}

// DropColumns removes references to dropped columns; indexes/FKs that lose a
// column are dropped entirely, and a PK that loses a column is cleared.
func (m *TableMeta) DropColumns(keep func(string) bool) {
	if m == nil {
		return
	}
	cols := m.Columns[:0:0]
	for _, c := range m.Columns {
		if keep(c.Name) {
			cols = append(cols, c)
		}
	}
	m.Columns = cols
	all := func(names []string) bool {
		for _, n := range names {
			if !keep(n) {
				return false
			}
		}
		return true
	}
	if !all(m.PrimaryKey) {
		m.PrimaryKey = nil
	}
	ix := m.Indexes[:0:0]
	for _, i := range m.Indexes {
		if all(i.Columns) {
			ix = append(ix, i)
		}
	}
	m.Indexes = ix
	fks := m.ForeignKeys[:0:0]
	for _, f := range m.ForeignKeys {
		if all(f.Columns) {
			fks = append(fks, f)
		}
	}
	m.ForeignKeys = fks
}

// Ticket tracks outstanding references to one source chunk. The chunk is
// committed when every batch derived from it has been written or dropped.
type Ticket struct {
	refs   atomic.Int64
	once   sync.Once
	onDone func()
}

// NewTicket returns a ticket holding one reference.
func NewTicket(onDone func()) *Ticket {
	t := &Ticket{onDone: onDone}
	t.refs.Store(1)
	return t
}

// Add takes n more references.
func (t *Ticket) Add(n int) {
	if t != nil && n > 0 {
		t.refs.Add(int64(n))
	}
}

// Release drops one reference, firing onDone when the count reaches zero.
func (t *Ticket) Release() {
	if t == nil {
		return
	}
	if t.refs.Add(-1) == 0 && t.onDone != nil {
		t.once.Do(t.onDone)
	}
}

// Op is what a row asks the destination to do with it. A batch read from a
// table is all Insert; a batch read from a change stream carries one op per
// row.
type Op string

const (
	Insert Op = "insert"
	Update Op = "update"
	Delete Op = "delete"
)

// Batch is a set of rows from one logical table.
type Batch struct {
	// Table is the logical table name as it flows (sinks may map it further).
	Table string
	// Source is the originating source table; it never changes downstream
	// and keys per-table progress.
	Source  string
	Meta    *TableMeta
	Columns []Column
	Rows    [][]any
	// Ops, when non-nil, is aligned with Rows and says what each row is:
	// inserted, updated or deleted at the source. Nil means every row is an
	// insert, which is every batch a table read produces — so a bulk load
	// carries no per-row cost for a distinction it does not make.
	Ops []Op
	// Errors, when non-nil, is aligned with Rows and explains why each row
	// left on a failure relationship.
	Errors []string
	Ticket *Ticket
}

// Op returns row i's operation, Insert when the batch carries none.
func (b *Batch) Op(i int) Op {
	if i < len(b.Ops) {
		return b.Ops[i]
	}
	return Insert
}

// Changes reports whether the batch carries anything but inserts.
func (b *Batch) Changes() bool {
	for _, op := range b.Ops {
		if op != Insert {
			return true
		}
	}
	return false
}

// Append adds a row with the given operation, materializing Ops only once a
// row is something other than an insert.
func (b *Batch) Append(row []any, op Op) {
	b.Rows = append(b.Rows, row)
	if b.Ops == nil {
		if op == "" || op == Insert {
			return
		}
		b.Ops = make([]Op, len(b.Rows)-1)
		for j := range b.Ops {
			b.Ops[j] = Insert
		}
	}
	if op == "" {
		op = Insert
	}
	b.Ops = append(b.Ops, op)
}

// AppendRow copies row i of src, keeping its operation.
func (b *Batch) AppendRow(src *Batch, i int) {
	b.Append(src.Rows[i], src.Op(i))
}

// AppendAll copies every row of src, keeping their operations.
func (b *Batch) AppendAll(src *Batch) {
	for i := range src.Rows {
		b.AppendRow(src, i)
	}
}

// Index returns the position of the named column, or -1.
func (b *Batch) Index(name string) int {
	for i, c := range b.Columns {
		if c.Name == name {
			return i
		}
	}
	for i, c := range b.Columns {
		if strings.EqualFold(c.Name, name) {
			return i
		}
	}
	return -1
}

// Derive returns an empty batch with the same table, metadata, schema and
// ticket. The caller is responsible for ticket reference accounting.
func (b *Batch) Derive() *Batch {
	return &Batch{Table: b.Table, Source: b.Source, Meta: b.Meta, Columns: b.Columns, Ticket: b.Ticket}
}

// RowMap converts row i to a column-name keyed map.
func (b *Batch) RowMap(i int) map[string]any {
	m := make(map[string]any, len(b.Columns))
	for j, c := range b.Columns {
		if j < len(b.Rows[i]) {
			m[c.Name] = b.Rows[i][j]
		}
	}
	return m
}

// SetOnDone installs the completion callback. It must be called while the
// caller still holds a reference.
func (t *Ticket) SetOnDone(f func()) {
	if t != nil {
		t.onDone = f
	}
}
