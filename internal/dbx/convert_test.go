package dbx

import (
	"bytes"
	"testing"
	"time"

	"github.com/paulmanoni/nifi/record"
)

func TestMySQLConverters(t *testing.T) {
	cases := []struct {
		col  record.Column
		raw  string
		want any
	}{
		{record.Column{Type: record.Bool, NativeType: "tinyint(1)"}, "1", true},
		{record.Column{Type: record.Bool, NativeType: "bit(1)"}, "\x01", true},
		{record.Column{Type: record.Bit, Length: 8}, "\x05", "00000101"},
		{record.Column{Type: record.Uint64}, "18446744073709551615", uint64(18446744073709551615)},
		{record.Column{Type: record.Date}, "0000-00-00", nil},
		{record.Column{Type: record.Timestamp}, "0000-00-00 00:00:00", nil},
		{record.Column{Type: record.Timestamp}, "2024-02-03 04:05:06.5", time.Date(2024, 2, 3, 4, 5, 6, 5e8, time.UTC)},
		{record.Column{Type: record.Decimal}, "12.50", "12.50"},
	}
	for _, c := range cases {
		got := ConverterFor("mysql", nil, c.col)([]byte(c.raw))
		if tm, ok := c.want.(time.Time); ok {
			if g, ok := got.(time.Time); !ok || !g.Equal(tm) {
				t.Errorf("%v %q = %v", c.col.Type, c.raw, got)
			}
			continue
		}
		if got != c.want {
			t.Errorf("%v %q = %#v, want %#v", c.col.Type, c.raw, got, c.want)
		}
	}
}

func TestPostgresConverters(t *testing.T) {
	if got := ConverterFor("postgres", nil, record.Column{Type: record.Bytes})([]byte(`\x0102`)); !bytes.Equal(got.([]byte), []byte{1, 2}) {
		t.Errorf("bytea = %v", got)
	}
	got := ConverterFor("postgres", nil, record.Column{Type: record.TimestampTZ})([]byte("2024-01-02 03:04:05.123+00"))
	if tm, ok := got.(time.Time); !ok || tm.Nanosecond() != 123e6 {
		t.Errorf("timestamptz = %v", got)
	}
	if got := ConverterFor("postgres", nil, record.Column{Type: record.TimestampTZ})([]byte("infinity")); got != "infinity" {
		t.Errorf("infinity = %v", got)
	}
}

func TestCopyEncoding(t *testing.T) {
	var b bytes.Buffer
	encoderFor(record.Column{Type: record.Text}, true)(&b, "a\tb\nc\\d\x00e\xff")
	if got := b.String(); got != `a\tb\nc\\de`+"�" {
		t.Errorf("text = %q", got)
	}
	b.Reset()
	encoderFor(record.Column{Type: record.Bytes}, true)(&b, []byte{0xde, 0xad})
	if b.String() != `\\xdead` {
		t.Errorf("bytea = %q", b.String())
	}
	b.Reset()
	encoderFor(record.Column{Type: record.Int16}, true)(&b, true)
	if b.String() != "1" {
		t.Errorf("bool→int = %q", b.String())
	}
}

func TestIdent63(t *testing.T) {
	long := "a_very_long_table_name_that_goes_on_and_on_and_on_idx_something_else"
	if n := Ident63(long); len(n) > 63 || n == Ident63(long+"2") {
		t.Errorf("Ident63 = %q", n)
	}
}

func TestMySQLLocalDatetime(t *testing.T) {
	eat, _ := time.LoadLocation("Africa/Dar_es_Salaam")
	got := ConverterFor("mysql", eat, record.Column{Type: record.Timestamp})([]byte("2024-01-01 10:00:00"))
	if tm, ok := got.(time.Time); !ok || !tm.Equal(time.Date(2024, 1, 1, 7, 0, 0, 0, time.UTC)) {
		t.Errorf("EAT datetime = %v", got)
	}
}
