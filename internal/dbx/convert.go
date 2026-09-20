package dbx

import (
	"encoding/hex"
	"strconv"
	"strings"
	"time"

	"github.com/paulmanoni/nifi/record"
)

// Converter turns a raw text-protocol value into the canonical Go value for a
// logical type:
//
//	bool → bool; ints/year → int64; uint64 → uint64; floats → float64;
//	date/timestamp/timestamptz → time.Time (UTC); bytes → []byte;
//	bit → "0101…"; everything else → string (the source's text literal).
//
// Values that fail to parse are kept as their text so the target database can
// judge them, rather than being silently changed.
type Converter func(raw []byte) any

// ConverterFor returns the converter for a column read from dialect. loc is
// the zone naive date/time values are interpreted in (nil = UTC).
func ConverterFor(dialect string, loc *time.Location, c record.Column) Converter {
	return ConverterForOpts(dialect, loc, c, false)
}

// ConverterForOpts is ConverterFor with zeroTime: MySQL zero dates become the
// zero time.Time instead of NULL — what the Go driver (parseTime) returns.
func ConverterForOpts(dialect string, loc *time.Location, c record.Column, zeroTime bool) Converter {
	if loc == nil {
		loc = time.UTC
	}
	mysql := dialect == "mysql"
	switch c.Type {
	case record.Bool:
		if mysql && c.NativeType == "bit(1)" {
			return func(b []byte) any { return len(b) > 0 && b[len(b)-1] != 0 }
		}
		return func(b []byte) any {
			switch string(b) {
			case "t", "true", "1", "y", "yes", "on":
				return true
			case "f", "false", "0", "n", "no", "off":
				return false
			}
			if n, err := strconv.ParseInt(string(b), 10, 64); err == nil {
				return n != 0
			}
			return string(b)
		}
	case record.Int16, record.Int32, record.Int64, record.Year:
		return func(b []byte) any {
			if n, err := strconv.ParseInt(string(b), 10, 64); err == nil {
				return n
			}
			return string(b)
		}
	case record.Uint64:
		return func(b []byte) any {
			if n, err := strconv.ParseUint(string(b), 10, 64); err == nil {
				return n
			}
			return string(b)
		}
	case record.Float32, record.Float64:
		return func(b []byte) any {
			if f, err := strconv.ParseFloat(string(b), 64); err == nil {
				return f
			}
			return string(b)
		}
	case record.Bytes:
		if mysql {
			return func(b []byte) any { return append([]byte(nil), b...) }
		}
		return func(b []byte) any {
			if len(b) >= 2 && b[0] == '\\' && b[1] == 'x' {
				out := make([]byte, hex.DecodedLen(len(b)-2))
				if _, err := hex.Decode(out, b[2:]); err == nil {
					return out
				}
			}
			return append([]byte(nil), b...)
		}
	case record.Bit:
		if mysql {
			return func(b []byte) any { return bitString(b, int(c.Length)) }
		}
		return func(b []byte) any { return string(b) }
	case record.Date:
		return timeConv(mysql, zeroTime, loc, "2006-01-02")
	case record.Timestamp:
		return timeConv(mysql, zeroTime, loc, "2006-01-02 15:04:05.999999999")
	case record.TimestampTZ:
		if mysql {
			return timeConv(true, zeroTime, loc, "2006-01-02 15:04:05.999999999")
		}
		return timeConv(false, false, time.UTC, "2006-01-02 15:04:05.999999999-07", "2006-01-02 15:04:05.999999999-07:00", "2006-01-02 15:04:05.999999999-07:00:00")
	default:
		return func(b []byte) any { return string(b) }
	}
}

func timeConv(mysql, zeroTime bool, loc *time.Location, layouts ...string) Converter {
	return func(b []byte) any {
		s := string(b)
		if mysql && (strings.HasPrefix(s, "0000-00-00") || strings.HasPrefix(s, "0000-")) {
			if zeroTime {
				return time.Time{}
			}
			return nil
		}
		for _, l := range layouts {
			if t, err := time.ParseInLocation(l, s, loc); err == nil {
				return t.UTC()
			}
		}
		// infinity, BC dates and other out-of-range literals pass through.
		return s
	}
}

// bitString renders MySQL's raw big-endian bit bytes as a 0/1 string of n bits.
func bitString(b []byte, n int) string {
	var sb strings.Builder
	for _, x := range b {
		for i := 7; i >= 0; i-- {
			if x&(1<<i) != 0 {
				sb.WriteByte('1')
			} else {
				sb.WriteByte('0')
			}
		}
	}
	s := sb.String()
	if n > 0 && len(s) > n {
		s = s[len(s)-n:]
	}
	return s
}
