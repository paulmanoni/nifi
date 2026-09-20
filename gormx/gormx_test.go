package gormx_test

import (
	"context"
	"database/sql/driver"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/paulmanoni/nifi"
	"github.com/paulmanoni/nifi/gormx"
	"github.com/paulmanoni/nifi/record"
)

type tags []string

func (t tags) Value() (driver.Value, error) { return strings.Join(t, ","), nil }

// Base is embedded by post. Its type is exported, which is what decides
// whether GORM promotes its fields — see TestUnexportedEmbeddingIsInvisible.
type Base struct {
	ID int64 `gorm:"primaryKey"`
}

type post struct {
	Base
	Title     string
	Slug      string `gorm:"column:url_slug"`
	Views     int64  `gorm:"default:0"`       // a default this side knows
	Rank      int64  `gorm:"default:(now())"` // a default the database owns
	Draft     bool   `gorm:"default:true"`
	Author    *string
	Tags      tags
	CreatedAt time.Time
	UpdatedAt time.Time
	Ignored   string `gorm:"-"`
}

var clock = time.Date(2024, 1, 2, 3, 4, 5, 0, time.UTC)

func describe(t *testing.T, opts ...gormx.Option) *gormx.Model {
	t.Helper()
	m, err := gormx.Describe(post{}, append(opts, gormx.Now(func() time.Time { return clock }))...)
	if err != nil {
		t.Fatal(err)
	}
	return m
}

func names(cols []record.Column) string {
	var out []string
	for _, c := range cols {
		out = append(out, c.Name)
	}
	return strings.Join(out, ",")
}

// The columns are the model's, named as GORM names them, with an embedded
// struct flattened and a skipped field left out.
func TestColumnsFollowTheModel(t *testing.T) {
	m := describe(t)
	want := "id,title,url_slug,views,rank,draft,author,tags,created_at,updated_at"
	if got := names(m.Columns()); got != want {
		t.Fatalf("columns %s\n    want %s", got, want)
	}
	if pk := m.PrimaryKey(); len(pk) != 1 || pk[0] != "id" {
		t.Fatalf("primary key %v", pk)
	}
	if m.Table() != "posts" {
		t.Fatalf("table %q; want posts", m.Table())
	}
}

// A zero field takes its default tag, a zero timestamp becomes now, and a
// nil pointer stays NULL.
func TestZeroValuesTakeTheirDefaults(t *testing.T) {
	m := describe(t)
	cols, rows, err := m.Render([]post{{}})
	if err != nil {
		t.Fatal(err)
	}
	row := map[string]any{}
	for i, c := range cols {
		row[c.Name] = rows[0][i]
	}
	if row["views"] != int64(0) {
		t.Errorf("views = %#v; want the default 0", row["views"])
	}
	if row["draft"] != true {
		t.Errorf("draft = %#v; want the default true", row["draft"])
	}
	if row["created_at"] != clock || row["updated_at"] != clock {
		t.Errorf("timestamps %v/%v; want the clock", row["created_at"], row["updated_at"])
	}
	if row["author"] != nil {
		t.Errorf("author = %#v; want NULL", row["author"])
	}
}

// A column whose default lives in the database is left out while every row
// leaves it zero — writing a zero there would override it — and appears as
// soon as one row sets it.
func TestDatabaseSideDefaultIsLeftOut(t *testing.T) {
	m := describe(t)
	cols, _, err := m.Render([]post{{}, {Title: "a"}})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(names(cols), "rank") {
		t.Fatalf("rank was written although no row sets it: %s", names(cols))
	}
	cols, rows, err := m.Render([]post{{}, {Rank: 7}})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(names(cols), "rank") {
		t.Fatalf("rank was left out although a row sets it: %s", names(cols))
	}
	for i, c := range cols {
		if c.Name == "rank" && rows[0][i] != int64(0) {
			t.Fatalf("the row that does not set rank wrote %#v", rows[0][i])
		}
	}
}

// Copy writes the struct as it stands: no defaults, no timestamps, every
// column — what a bulk COPY that ignores conflicts does.
func TestCopyWritesTheStructAsItStands(t *testing.T) {
	cols, rows, err := describe(t, gormx.Copy()).Render([]post{{}})
	if err != nil {
		t.Fatal(err)
	}
	row := map[string]any{}
	for i, c := range cols {
		row[c.Name] = rows[0][i]
	}
	if !strings.Contains(names(cols), "rank") {
		t.Errorf("a COPY writes every column: %s", names(cols))
	}
	if row["draft"] != false {
		t.Errorf("draft = %#v; a COPY does not apply defaults", row["draft"])
	}
	if ct, _ := row["created_at"].(time.Time); !ct.IsZero() {
		t.Errorf("created_at = %v; a COPY does not stamp times", row["created_at"])
	}
}

// A driver.Valuer is rendered through its own Value method.
func TestValuerIsRendered(t *testing.T) {
	m := describe(t)
	cols, rows, err := m.Render([]post{{Tags: tags{"go", "sql"}}})
	if err != nil {
		t.Fatal(err)
	}
	for i, c := range cols {
		if c.Name == "tags" {
			if rows[0][i] != "go,sql" {
				t.Fatalf("tags = %#v; want the Valuer's own rendering", rows[0][i])
			}
			if c.Type != record.JSON {
				t.Fatalf("tags type %s", c.Type)
			}
		}
	}
}

// GORM promotes an embedded struct's fields only when its TYPE is exported.
// Embed an unexported one and its columns quietly disappear — including the
// primary key. Since the point of this package is to write what GORM writes,
// it disappears here too, and this pins that so nobody has to rediscover it
// from a table with a missing column.
//
// (nifi.Mapper's own reflection flattens any anonymous struct; that is nifi's
// convention. Choosing gormx means choosing GORM's.)
func TestUnexportedEmbeddingIsInvisible(t *testing.T) {
	type hidden struct {
		ID int64 `gorm:"primaryKey"`
	}
	type plain struct {
		hidden
		Title string
	}
	m, err := gormx.Describe(plain{})
	if err != nil {
		t.Fatal(err)
	}
	if got := names(m.Columns()); got != "title" {
		t.Fatalf("columns %s; GORM does not see an unexported embedded type, so this should not either", got)
	}
	if len(m.PrimaryKey()) != 0 {
		t.Fatalf("primary key %v; the embedded key is not promoted either", m.PrimaryKey())
	}
}

// A mapping onto a GORM struct writes what GORM would, and the node says so
// without being run.
func TestMapperUsesTheModel(t *testing.T) {
	p := gormx.Mapper(nifi.Mapper[nifi.Row, post]{
		Type: "t.posts", Label: "Posts",
		Map: func(_ context.Context, in nifi.Row) (*post, error) {
			title, _ := in["title"].(string)
			if title == "" {
				return nil, nil
			}
			return &post{Base: Base{ID: 1}, Title: title}, nil
		},
	}, gormx.Now(func() time.Time { return clock })).Processor()

	h, err := p.New(nifi.Settings{NodeID: "m"})
	if err != nil {
		t.Fatal(err)
	}
	cols, err := h.(nifi.Schematic).Columns(nil)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(names(cols), "url_slug") {
		t.Fatalf("the node declares %s", names(cols))
	}

	in := &record.Batch{Table: "posts", Source: "posts",
		Columns: []record.Column{{Name: "title", Type: record.Text}}}
	in.Append([]any{""}, record.Update) // dropped by the mapping
	in.Append([]any{"hello"}, record.Delete)
	c := &collect{}
	if err := h.Process(context.Background(), in, c); err != nil {
		t.Fatal(err)
	}
	out := c.batches["success"][0]
	if len(out.Rows) != 1 || out.Op(0) != record.Delete {
		t.Fatalf("wrote %d rows with op %q; want the second row, still a deletion", len(out.Rows), out.Op(0))
	}
	if out.Meta.PrimaryKey[0] != "id" {
		t.Fatalf("primary key %v; want the model's", out.Meta.PrimaryKey)
	}
}

type collect struct{ batches map[string][]*record.Batch }

func (c *collect) Emit(port string, b *record.Batch) {
	if c.batches == nil {
		c.batches = map[string][]*record.Batch{}
	}
	c.batches[port] = append(c.batches[port], b)
}

// Describing a model twice with different options gives two models, not one
// carrying whichever options came first. The clock is the one that bites:
// a fixed one asked for by a test would otherwise be handed the real clock
// that some earlier caller settled for.
func TestOptionsAreNotShared(t *testing.T) {
	fixed := time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)

	live, err := gormx.Describe(post{}) // the real clock, cached first
	if err != nil {
		t.Fatal(err)
	}
	if cols, rows, err := live.Render([]post{{}}); err != nil {
		t.Fatal(err)
	} else if ts, _ := valueOf(cols, rows[0], "created_at").(time.Time); ts.Equal(fixed) {
		t.Fatal("the real clock produced the fixed time")
	}

	pinned, err := gormx.Describe(post{}, gormx.Now(func() time.Time { return fixed }))
	if err != nil {
		t.Fatal(err)
	}
	cols, rows, err := pinned.Render([]post{{}})
	if err != nil {
		t.Fatal(err)
	}
	if got := valueOf(cols, rows[0], "created_at"); got != fixed {
		t.Fatalf("created_at = %v; want the clock this caller asked for", got)
	}
	// And Copy likewise: it decides which columns are written at all.
	plain, _ := gormx.Describe(post{})
	copied, _ := gormx.Describe(post{}, gormx.Copy())
	if names(plain.Columns()) == "" || len(copied.Columns()) <= 0 {
		t.Fatal("both describes should work")
	}
	if _, _, err := copied.Render([]post{{}}); err != nil {
		t.Fatal(err)
	}
	if c1, _, _ := plain.Render([]post{{}}); strings.Contains(names(c1), "rank") {
		t.Fatal("the plain model took the copied model's column set")
	}
}

func valueOf(cols []record.Column, row []any, name string) any {
	for i, c := range cols {
		if c.Name == name {
			return row[i]
		}
	}
	return nil
}

// Value is what a host reaches for when it computes a value some other way —
// an expression function, say — and needs it to look like a field.
func TestValueRendersLikeAField(t *testing.T) {
	type status string
	s := "x"
	for _, c := range []struct {
		in   any
		want any
	}{
		{nil, nil},
		{(*string)(nil), nil},          // a nil pointer is NULL
		{&s, "x"},                      // and a set one is its value
		{status("live"), "live"},       // a named scalar is its base type
		{tags{"a", "b"}, "a,b"},        // a Valuer is worth what it says
		{int32(7), int64(7)},           // every integer widens
		{uint8(3), int64(3)},           //
		{[]byte("raw"), []byte("raw")}, // bytes stay bytes
		{clock, clock},                 // a time is itself
	} {
		got, err := gormx.Value(c.in)
		if err != nil {
			t.Errorf("Value(%#v): %v", c.in, err)
			continue
		}
		if fmt.Sprintf("%#v", got) != fmt.Sprintf("%#v", c.want) {
			t.Errorf("Value(%#v) = %#v; want %#v", c.in, got, c.want)
		}
	}
}

// A value no column can hold is an error naming its type, rather than one the
// database refuses later with less to say.
func TestValueRefusesWhatCannotBeWritten(t *testing.T) {
	_, err := gormx.Value([]string{"not", "a", "column"})
	if err == nil || !strings.Contains(err.Error(), "[]string") {
		t.Fatalf("err = %v; want a complaint naming the type", err)
	}
}
