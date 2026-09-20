package flow_test

import (
	"context"
	"fmt"
	"strings"
	"testing"

	"github.com/paulmanoni/nifi/internal/flow"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/record"
)

// The same per-row work three ways: hand-written Go, an expression, and a
// Starlark script. Each adds one derived column to a 5-column row.
//
//	full_name = upper(first_name) + " " + last_name
const benchRows = 5000

func benchBatch() *record.Batch {
	b := &record.Batch{Table: "people", Source: "people",
		Meta: &record.TableMeta{Name: "people", PrimaryKey: []string{"id"}},
		Columns: []record.Column{
			{Name: "id", Type: record.Int64},
			{Name: "first_name", Type: record.Text},
			{Name: "last_name", Type: record.Text},
			{Name: "email", Type: record.Text},
			{Name: "age", Type: record.Int64},
		}}
	for i := 0; i < benchRows; i++ {
		b.Rows = append(b.Rows, []any{
			int64(i), fmt.Sprintf("first%d", i), fmt.Sprintf("last%d", i),
			fmt.Sprintf("p%d@example.com", i), int64(20 + i%50),
		})
	}
	return b
}

type sink struct{ rows int }

func (s *sink) Emit(_ string, b *record.Batch) { s.rows += len(b.Rows) }

func benchNode(b *testing.B, n *model.Node) {
	b.Helper()
	impl, err := flow.Build(n, flow.NewPreviewRuntime(nil))
	if err != nil {
		b.Fatal(err)
	}
	p := impl.(flow.Processor)
	src := benchBatch()
	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		// each iteration gets its own copy: the transforms rewrite in place
		in := &record.Batch{Table: src.Table, Source: src.Source, Meta: src.Meta,
			Columns: append([]record.Column(nil), src.Columns...),
			Rows:    make([][]any, len(src.Rows))}
		for j, r := range src.Rows {
			in.Rows[j] = append([]any(nil), r...)
		}
		s := &sink{}
		if err := p.Process(context.Background(), in, s); err != nil {
			b.Fatal(err)
		}
		if s.rows != benchRows {
			b.Fatalf("emitted %d rows, want %d", s.rows, benchRows)
		}
	}
	b.ReportMetric(float64(b.Elapsed().Nanoseconds())/float64(b.N*benchRows), "ns/row")
}

// The floor: the same work with no engine in the way.
func BenchmarkGo(b *testing.B) {
	src := benchBatch()
	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		for _, row := range src.Rows {
			first, _ := row[1].(string)
			last, _ := row[2].(string)
			_ = strings.ToUpper(first) + " " + last
		}
	}
	b.ReportMetric(float64(b.Elapsed().Nanoseconds())/float64(b.N*benchRows), "ns/row")
}

// The harness's own cost: copying the batch so each iteration starts fresh.
// Subtract it from every node benchmark below.
func BenchmarkBatchCopy(b *testing.B) {
	src := benchBatch()
	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		in := &record.Batch{Table: src.Table, Source: src.Source, Meta: src.Meta,
			Columns: append([]record.Column(nil), src.Columns...),
			Rows:    make([][]any, len(src.Rows))}
		for j, r := range src.Rows {
			in.Rows[j] = append([]any(nil), r...)
		}
		_ = in
	}
	b.ReportMetric(float64(b.Elapsed().Nanoseconds())/float64(b.N*benchRows), "ns/row")
}

// The cheapest possible expression node: one constant condition per row.
func BenchmarkExpressionMinimal(b *testing.B) {
	benchNode(b, &model.Node{ID: "d", Type: "transform.filter", Config: map[string]any{"condition": "true"}})
}

// A script that touches nothing: all of Starlark's cost except the script.
// Every value crosses into a Starlark dict and back, which is where most of
// the difference with an expression lives.
func BenchmarkStarlarkPassthrough(b *testing.B) {
	benchNode(b, &model.Node{ID: "s", Type: "transform.script", Config: map[string]any{
		"script": "def transform(row):\n    return row\n",
	}})
}

func BenchmarkExpression(b *testing.B) {
	benchNode(b, &model.Node{ID: "c", Type: "transform.compute", Config: map[string]any{
		"columns": []any{map[string]any{"column": "full_name", "expr": `Upper(first_name) + " " + last_name`}},
	}})
}

func BenchmarkStarlarkRow(b *testing.B) {
	benchNode(b, &model.Node{ID: "s", Type: "transform.script", Config: map[string]any{
		"script": "def transform(row):\n    row[\"full_name\"] = row[\"first_name\"].upper() + \" \" + row[\"last_name\"]\n    return row\n",
	}})
}

func BenchmarkStarlarkBatch(b *testing.B) {
	benchNode(b, &model.Node{ID: "s", Type: "transform.script", Config: map[string]any{
		"script": "def transform_batch(rows):\n    for row in rows:\n        row[\"full_name\"] = row[\"first_name\"].upper() + \" \" + row[\"last_name\"]\n    return rows\n",
	}})
}
