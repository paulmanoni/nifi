package script

import (
	"strings"
	"testing"
	"time"

	"github.com/paulmanoni/nifi/record"
)

func TestPythonCompat(t *testing.T) {
	src := `import json
import re as regex
from hashlib import sha256
from datetime import datetime
import time

def transform(row):
    created = row["created_at"]
    row["day"] = created.strftime("%Y-%m-%d")
    row["iso"] = created.isoformat()
    row["stamp"] = time.strftime("%Y", created)
    row["label"] = f"{row['name']!r} scored {row['score']:.2f} ({row['score']:>8,.1f}) {{literal}}"
    row["pct"] = f"{row['ratio']:.1%}"
    if row.get("note") is None and row["name"] is not None:
        row["note"] = "none"
    row["kind"] = "text" if isinstance(row["name"], str) else "other"
    row["meta"] = json.dumps({"a": 1})
    row["back"] = json.loads('{"b": 2}')["b"]
    row["digits"] = regex.sub("[^0-9]", "", "a1b2")
    row["hash"] = sha256("x")[:8]
    row["parsed"] = datetime.strptime("19/09/2026", "%d/%m/%Y").strftime("%Y-%m-%d")
    return row
`
	p, err := Compile(src, nil)
	if err != nil {
		t.Fatal(err)
	}
	b := &record.Batch{
		Columns: []record.Column{{Name: "name", Type: record.Text}, {Name: "score", Type: record.Float64},
			{Name: "ratio", Type: record.Float64}, {Name: "note", Type: record.Text}, {Name: "created_at", Type: record.TimestampTZ}},
		Rows: [][]any{{"Ada", 1234.5678, 0.256, nil, time.Date(2024, 3, 7, 9, 5, 0, 0, time.UTC)}},
	}
	res, err := p.Run(b, nil)
	if err != nil || len(res.Failed) > 0 {
		t.Fatalf("%v %+v", err, res.Failed)
	}
	got := map[string]any{}
	for i, c := range res.Columns {
		got[c.Name] = res.Rows[0][i]
	}
	want := map[string]any{
		"day": "2024-03-07", "iso": "2024-03-07T09:05:00", "stamp": "2024",
		"label": `"Ada" scored 1234.57 ( 1,234.6) {literal}`, "pct": "25.6%",
		"note": "none", "kind": "text", "meta": `{"a":1}`, "back": int64(2), "digits": "12",
		"hash": "2d711642", "parsed": "2026-09-19",
	}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("%s = %#v, want %#v", k, got[k], v)
		}
	}
	// the time value round-trips as a time
	if _, ok := got["created_at"].(time.Time); !ok {
		t.Errorf("created_at came back as %T", got["created_at"])
	}
}

func TestPythonCompatErrors(t *testing.T) {
	_, err := Compile("import os\ndef transform(row):\n    return row\n", nil)
	if e, ok := err.(*Error); !ok || e.Line != 1 || !strings.Contains(e.Msg, `module "os" is not available`) {
		t.Errorf("unsupported import: %v", err)
	}
	// lines stay aligned after translation
	_, err = Compile("import json\nfrom datetime import datetime\n\ndef transform(row):\n    return row[\n", nil)
	if e, ok := err.(*Error); !ok || e.Line != 5 && e.Line != 6 {
		t.Errorf("syntax error line: %v", err)
	}
	// "is" inside strings and identifiers is untouched
	p, err := Compile("def transform(row):\n    row['s'] = 'this is fine'\n    row['island'] = 1\n    return row\n", nil)
	if err != nil {
		t.Fatal(err)
	}
	res, _ := p.Run(&record.Batch{Rows: [][]any{{}}}, nil)
	if res.Rows[0][0] != "this is fine" {
		t.Errorf("string rewritten: %v", res.Rows[0])
	}
}

func TestDatetimeFromTimestamp(t *testing.T) {
	p, err := Compile(`import datetime
from datetime import timedelta
def transform(row):
    row["last_login"] = datetime.datetime.fromtimestamp(row["last_login"])
    if row["last_login"] is not None:
        row["next_day"] = (row["last_login"] + timedelta(days=1)).strftime("%Y-%m-%d")
    if str(row).find('b"') != -1:
        row["ip_address"] = None
    return row
`, nil)
	if err != nil {
		t.Fatal(err)
	}
	b := &record.Batch{
		Columns: []record.Column{{Name: "last_login", Type: record.Int64}, {Name: "ip_address", Type: record.Bytes}},
		Rows: [][]any{
			{nil, nil}, // an empty first value must not pin the column type
			{int64(1717171717), []byte("10.0.0.1")},
			{"1717171717000", nil}, // millisecond text
		},
	}
	res, err := p.Run(b, nil)
	if err != nil || len(res.Failed) > 0 {
		t.Fatalf("%v %+v", err, res.Failed)
	}
	col := map[string]int{}
	for i, c := range res.Columns {
		col[c.Name] = i
	}
	want := time.Unix(1717171717, 0).UTC()
	if got, _ := res.Rows[1][col["last_login"]].(time.Time); !got.Equal(want) {
		t.Errorf("row 1 last_login = %v", res.Rows[1][col["last_login"]])
	}
	if res.Rows[1][col["next_day"]] != "2024-06-01" || res.Rows[1][col["ip_address"]] != nil {
		t.Errorf("row 1: %v", res.Rows[1])
	}
	if res.Rows[0][col["last_login"]] != nil {
		t.Errorf("empty timestamp should stay empty: %v", res.Rows[0])
	}
	if got, _ := res.Rows[2][col["last_login"]].(time.Time); !got.Equal(want) {
		t.Errorf("millisecond text: %v", res.Rows[2][col["last_login"]])
	}
	// the column type follows the new values, so the sink creates a timestamp
	for _, c := range res.Columns {
		if c.Name == "last_login" && c.Type != record.TimestampTZ {
			t.Errorf("last_login column type = %s", c.Type)
		}
	}
}

func TestScriptOutputIsNullable(t *testing.T) {
	p, _ := Compile("def transform(row):\n    row['ip'] = None\n    return row\n", nil)
	res, err := p.Run(&record.Batch{Columns: []record.Column{{Name: "ip", Type: record.Bytes, Nullable: false}},
		Rows: [][]any{{[]byte("x")}}}, nil)
	if err != nil || len(res.Columns) != 1 || !res.Columns[0].Nullable {
		t.Fatalf("script output column should be nullable: %v %+v", err, res.Columns)
	}
}
