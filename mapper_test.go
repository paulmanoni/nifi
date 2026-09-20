package nifi_test

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/paulmanoni/nifi"
	"github.com/paulmanoni/nifi/record"
)

type source struct {
	ID    int64
	Name  string
	Email string
}

type person struct {
	ID        int64      `nifi:"id"`
	FullName  string     `nifi:"full_name"`
	Email     *string    `nifi:"email"`
	CreatedAt time.Time  `nifi:"created_at"`
	Deleted   *time.Time `nifi:"deleted_at"`
	Secret    string     `nifi:"-"`
	internal  string
}

// A batch of three rows, the middle one deleted at the source.
func peopleBatch() *record.Batch {
	b := &record.Batch{Table: "people", Source: "people",
		Meta: &record.TableMeta{Name: "people", PrimaryKey: []string{"id"}},
		Columns: []record.Column{
			{Name: "id", Type: record.Int64},
			{Name: "name", Type: record.Text},
			{Name: "email", Type: record.Text},
		}}
	b.Append([]any{int64(1), "ann", "ann@example.com"}, record.Update)
	b.Append([]any{int64(2), "bo", "bo@example.com"}, record.Delete)
	b.Append([]any{int64(3), "cy", "cy@example.com"}, record.Update)
	return b
}

type collect struct{ out map[string][]*record.Batch }

func (c *collect) Emit(port string, b *record.Batch) {
	if c.out == nil {
		c.out = map[string][]*record.Batch{}
	}
	c.out[port] = append(c.out[port], b)
}

func (c *collect) one(t *testing.T, port string) *record.Batch {
	t.Helper()
	if len(c.out[port]) != 1 {
		t.Fatalf("%s got %d batches, want 1", port, len(c.out[port]))
	}
	return c.out[port][0]
}

func build(t *testing.T, p nifi.Processor) nifi.Handler {
	t.Helper()
	h, err := p.New(nifi.Settings{NodeID: "m", NodeName: "Map"})
	if err != nil {
		t.Fatal(err)
	}
	return h
}

func mapPerson(_ context.Context, in nifi.Row) (*person, error) {
	name, _ := in["name"].(string)
	id, _ := in["id"].(int64)
	email, _ := in["email"].(string)
	return &person{ID: id, FullName: strings.ToUpper(name), Email: &email}, nil
}

// The columns come from the output type, and the rows from the mapping.
func TestMapperWritesItsOutputType(t *testing.T) {
	p := nifi.Mapper[nifi.Row, person]{
		Type: "t.map", Label: "Map", PrimaryKey: []string{"id"}, Map: mapPerson,
	}.Processor()
	c := &collect{}
	if err := build(t, p).Process(context.Background(), peopleBatch(), c); err != nil {
		t.Fatal(err)
	}
	b := c.one(t, "success")
	var names []string
	for _, col := range b.Columns {
		names = append(names, col.Name)
	}
	want := "id,full_name,email,created_at,deleted_at"
	if got := strings.Join(names, ","); got != want {
		t.Fatalf("columns %s; want %s (a - tag and an unexported field are left out)", got, want)
	}
	if b.Meta.PrimaryKey[0] != "id" {
		t.Fatalf("primary key %v; want [id]", b.Meta.PrimaryKey)
	}
	if b.Rows[0][1] != "ANN" {
		t.Fatalf("row 0 is %v; want ANN in full_name", b.Rows[0])
	}
	// A nil pointer is a NULL, not a zero value.
	if b.Rows[0][4] != nil {
		t.Fatalf("deleted_at is %v; want nil", b.Rows[0][4])
	}
}

// The mapping drops rows, so position is not identity. Whatever a row carried
// has to follow its own row — a deletion written back as an update would
// resurrect it.
func TestMapperKeepsOperationsWithTheirRows(t *testing.T) {
	p := nifi.Mapper[nifi.Row, person]{
		Type: "t.map", Label: "Map",
		Map: func(_ context.Context, in nifi.Row) (*person, error) {
			if name, _ := in["name"].(string); name == "ann" {
				return nil, nil // dropped: everything after it shifts up
			}
			id, _ := in["id"].(int64)
			return &person{ID: id}, nil
		},
	}.Processor()
	c := &collect{}
	if err := build(t, p).Process(context.Background(), peopleBatch(), c); err != nil {
		t.Fatal(err)
	}
	b := c.one(t, "success")
	if len(b.Rows) != 2 {
		t.Fatalf("kept %d rows; want 2", len(b.Rows))
	}
	if b.Rows[0][0] != int64(2) || b.Op(0) != record.Delete {
		t.Fatalf("row 0 is id %v op %q; want id 2 deleted", b.Rows[0][0], b.Op(0))
	}
	if b.Rows[1][0] != int64(3) || b.Op(1) != record.Update {
		t.Fatalf("row 1 is id %v op %q; want id 3 updated", b.Rows[1][0], b.Op(1))
	}
}

// One bad row is one bad row: it goes to failure with its reason, and the
// rest of the batch goes on.
func TestMapperFailsOneRowNotTheBatch(t *testing.T) {
	p := nifi.Mapper[nifi.Row, person]{
		Type: "t.map", Label: "Map",
		Map: func(_ context.Context, in nifi.Row) (*person, error) {
			if name, _ := in["name"].(string); name == "bo" {
				return nil, errors.New("no surname")
			}
			id, _ := in["id"].(int64)
			return &person{ID: id}, nil
		},
	}.Processor()
	c := &collect{}
	if err := build(t, p).Process(context.Background(), peopleBatch(), c); err != nil {
		t.Fatal(err)
	}
	if got := len(c.one(t, "success").Rows); got != 2 {
		t.Fatalf("%d rows went on; want 2", got)
	}
	f := c.one(t, "failure")
	if len(f.Rows) != 1 || f.Errors[0] != "no surname" {
		t.Fatalf("failure carried %d rows %v; want the one bad row with its reason", len(f.Rows), f.Errors)
	}
	if f.Op(0) != record.Delete {
		t.Fatalf("the failed row lost its operation (%q)", f.Op(0))
	}
}

// A struct input is filled from the incoming columns by name.
func TestMapperTakesAStructInput(t *testing.T) {
	p := nifi.Mapper[source, person]{
		Type: "t.map", Label: "Map",
		Map: func(_ context.Context, in source) (*person, error) {
			return &person{ID: in.ID, FullName: in.Name + " <" + in.Email + ">"}, nil
		},
	}.Processor()
	c := &collect{}
	if err := build(t, p).Process(context.Background(), peopleBatch(), c); err != nil {
		t.Fatal(err)
	}
	b := c.one(t, "success")
	if b.Rows[0][1] != "ann <ann@example.com>" {
		t.Fatalf("row 0 is %v", b.Rows[0])
	}
}

// Open builds the mapping once per run and is closed at the end of it.
func TestMapperOpensAndClosesOnce(t *testing.T) {
	opened, closed := 0, 0
	p := nifi.Mapper[nifi.Row, person]{
		Type: "t.map", Label: "Map",
		Properties: []nifi.Property{{Key: "prefix", Label: "Prefix", Kind: "string"}},
		Open: func(s nifi.Settings) (nifi.MapFunc[nifi.Row, person], func(), error) {
			opened++
			prefix := s.String("prefix")
			return func(_ context.Context, in nifi.Row) (*person, error) {
				name, _ := in["name"].(string)
				return &person{FullName: prefix + name}, nil
			}, func() { closed++ }, nil
		},
	}.Processor()

	h, err := p.New(nifi.Settings{NodeID: "m", Config: map[string]any{"prefix": "Ms "}})
	if err != nil {
		t.Fatal(err)
	}
	c := &collect{}
	for i := 0; i < 3; i++ { // three batches, one open
		if err := h.Process(context.Background(), peopleBatch(), c); err != nil {
			t.Fatal(err)
		}
	}
	h.(nifi.Closer).Close()
	if opened != 1 || closed != 1 {
		t.Fatalf("opened %d, closed %d; want 1 and 1", opened, closed)
	}
	if got := c.out["success"][0].Rows[0][1]; got != "Ms ann" {
		t.Fatalf("the setting did not reach the mapping: %v", got)
	}
}

// The node says what it emits without being run — no rows, no connection.
func TestMapperDeclaresItsColumns(t *testing.T) {
	p := nifi.Mapper[nifi.Row, person]{Type: "t.map", Label: "Map", Map: mapPerson}.Processor()
	h := build(t, p)
	sc, ok := h.(nifi.Schematic)
	if !ok {
		t.Fatal("a mapper should declare its schema")
	}
	cols, err := sc.Columns(nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(cols) != 5 || cols[1].Name != "full_name" || cols[3].Type != record.Timestamp {
		t.Fatalf("declared %v", cols)
	}
}

// Field names become column names the way a database would spell them.
func TestColumnNamesFromFieldNames(t *testing.T) {
	type odd struct {
		ID       int64
		UserID   int64
		HTTPCode int64
		FullName string
		Tagged   string `db:"renamed"`
	}
	p := nifi.Mapper[nifi.Row, odd]{Type: "t.map", Label: "Map",
		Map: func(context.Context, nifi.Row) (*odd, error) { return &odd{}, nil }}.Processor()
	cols, _ := build(t, p).(nifi.Schematic).Columns(nil)
	var got []string
	for _, c := range cols {
		got = append(got, c.Name)
	}
	want := "id,user_id,http_code,full_name,renamed"
	if strings.Join(got, ",") != want {
		t.Fatalf("columns %s; want %s", strings.Join(got, ","), want)
	}
}

// Render lets a host write the rows itself — for an ORM's own rules — while
// the library keeps everything else, including which row each one came from.
func TestMapperRenderOverride(t *testing.T) {
	cols := []record.Column{{Name: "id", Type: record.Int64}, {Name: "label", Type: record.Text}}
	p := nifi.Mapper[nifi.Row, person]{
		Type: "t.map", Label: "Map", Columns: cols,
		Map: func(_ context.Context, in nifi.Row) (*person, error) {
			id, _ := in["id"].(int64)
			if id == 1 {
				return nil, nil
			}
			return &person{ID: id}, nil
		},
		Render: func(_ context.Context, out []person) ([]record.Column, [][]any, error) {
			rows := make([][]any, len(out))
			for i, o := range out {
				rows[i] = []any{o.ID, fmt.Sprintf("#%d", o.ID)}
			}
			return cols, rows, nil
		},
	}.Processor()
	c := &collect{}
	if err := build(t, p).Process(context.Background(), peopleBatch(), c); err != nil {
		t.Fatal(err)
	}
	b := c.one(t, "success")
	if len(b.Rows) != 2 || b.Rows[0][1] != "#2" || b.Op(0) != record.Delete {
		t.Fatalf("rendered %v with ops %q", b.Rows, b.Op(0))
	}
}

// A Render that loses track of which row is which is refused rather than
// silently pairing operations with the wrong rows.
func TestMapperRejectsAMiscountingRender(t *testing.T) {
	cols := []record.Column{{Name: "id", Type: record.Int64}}
	p := nifi.Mapper[nifi.Row, person]{
		Type: "t.map", Label: "Map", Columns: cols,
		Map: func(context.Context, nifi.Row) (*person, error) { return &person{}, nil },
		Render: func(context.Context, []person) ([]record.Column, [][]any, error) {
			return cols, [][]any{{int64(1)}}, nil // one row for three values
		},
	}.Processor()
	err := build(t, p).Process(context.Background(), peopleBatch(), &collect{})
	if err == nil || !strings.Contains(err.Error(), "one row per value") {
		t.Fatalf("err = %v; want a complaint about the row count", err)
	}
}
