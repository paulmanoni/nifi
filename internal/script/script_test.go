package script

import (
	"testing"
	"time"

	"github.com/paulmanoni/nifi/record"
)

func batch(rows ...[]any) *record.Batch {
	return &record.Batch{Columns: []record.Column{{Name: "id", Type: record.Int64}, {Name: "name", Type: record.Text}, {Name: "at", Type: record.TimestampTZ}}, Rows: rows}
}

func TestRowTransform(t *testing.T) {
	p, err := Compile(`
def transform(row):
    if row["id"] == 2:
        return None
    if row["id"] == 3:
        return [dict(row, name="a"), dict(row, name="b")]
    row["upper"] = row["name"].upper()
    row["year"] = row["at"].year
    row["meta"] = {"k": [1, 2]}
    row.pop("at")
    return row
`, nil)
	if err != nil {
		t.Fatal(err)
	}
	at := time.Date(2024, 5, 1, 0, 0, 0, 0, time.UTC)
	res, err := p.Run(batch([]any{int64(1), "ada", at}, []any{int64(2), "bob", at}, []any{int64(3), "cy", at}), nil)
	if err != nil {
		t.Fatal(err)
	}
	if res.Dropped != 1 || len(res.Rows) != 3 {
		t.Fatalf("dropped=%d rows=%d", res.Dropped, len(res.Rows))
	}
	cols := map[string]record.Type{}
	for _, c := range res.Columns {
		cols[c.Name] = c.Type
	}
	if cols["upper"] != record.Text || cols["year"] != record.Int64 || cols["meta"] != record.JSON || cols["id"] != record.Int64 {
		t.Fatalf("columns: %+v", res.Columns)
	}
	for i, c := range res.Columns {
		if c.Name == "at" && res.Rows[0][i] != nil {
			t.Fatalf("popped value still present in row 0")
		}
	}
	if res.Rows[0][2] != "ADA" {
		t.Fatalf("row0: %v", res.Rows[0])
	}
}

func TestErrorsCarryLines(t *testing.T) {
	if _, err := Compile("def transform(row):\n  return row[\n", nil); err == nil {
		t.Fatal("expected syntax error")
	} else if e, ok := err.(*Error); !ok || e.Line == 0 {
		t.Fatalf("syntax error without line: %v", err)
	}
	p, _ := Compile("def transform(row):\n    x = 1\n    return row['nope']\n", nil)
	res, err := p.Run(batch([]any{int64(1), "a", nil}), nil)
	if err != nil || len(res.Failed) != 1 {
		t.Fatalf("want one failed row, got %v %+v", err, res)
	}
	if e, ok := res.Failed[0].Err.(*Error); !ok || e.Line != 3 {
		t.Fatalf("line: %v", res.Failed[0].Err)
	}
}

func TestInfiniteLoopIsBounded(t *testing.T) {
	if testing.Short() {
		t.Skip()
	}
	p, _ := Compile("def transform(row):\n    while True:\n        pass\n", nil)
	done := make(chan struct{})
	go func() {
		p.Run(batch([]any{int64(1), "a", nil}), nil)
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Minute):
		t.Fatal("runaway script was not stopped")
	}
}

func TestHelpers(t *testing.T) {
	var logs []string
	p, err := Compile(`
def transform(row):
    log("seen", row["id"])
    row["h"] = hashlib.sha256("x")
    row["m"] = re.sub("[0-9]+", "#", "a1b22")
    row["j"] = json.decode('{"a": 1}')["a"]
    return row
`, func(s string) { logs = append(logs, s) })
	if err != nil {
		t.Fatal(err)
	}
	res, err := p.Run(batch([]any{int64(7), "a", nil}), func(s string) { logs = append(logs, s) })
	if err != nil || len(res.Failed) > 0 {
		t.Fatalf("%v %+v", err, res.Failed)
	}
	row := res.Rows[0]
	if row[3] != "2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881" || row[4] != "a#b#" || row[5] != int64(1) {
		t.Fatalf("row: %v", row)
	}
	if len(logs) != 1 || logs[0] != "seen 7" {
		t.Fatalf("logs: %v", logs)
	}
}

func TestHeavyRowsAreNotLimitedByBatchSize(t *testing.T) {
	p, _ := Compile("def transform(row):\n    x = 0\n    for i in range(120000):\n        x += i\n    return row\n", nil)
	rows := make([][]any, 600)
	for i := range rows {
		rows[i] = []any{int64(i), "a", nil}
	}
	res, err := p.Run(batch(rows...), nil)
	if err != nil || len(res.Failed) > 0 {
		t.Fatalf("heavy rows failed: %v %d", err, len(res.Failed))
	}
}
