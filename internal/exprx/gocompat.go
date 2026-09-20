package exprx

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/expr-lang/expr"
)

// Go-compatible coercions. Flows converted from hand-written Go migrations
// call these with the same names and exact semantics as the Go helpers
// (dbmigrations/coerce.go, ptr.go), so a converted mapping writes the same
// values:
//
//	String(v)  NULL → "", NUL bytes stripped      PtrString(v)  NULL stays NULL
//	Int(v)     NULL/unparseable → 0, floats cut    PtrInt(v)
//	Uint(v)    negatives → 0                       PtrUint(v)
//	Float64(v) NULL/unparseable → 0                PtrFloat64(v)
//	Bool(v)    1/true/t/y/yes (case variants)      PtrBool(v)
//	Time(v)    NULL/zero date → 0001-01-01         TimePtr(v)  zero → NULL
//	YearPtr(v) the year, NULL when ≤ 0             PtrStringNil(v) blank → NULL
//	NilIfZero(v) 0/""/false/zero time → NULL       Upper(v)   NULL-preserving
func goFunctions() []expr.Option {
	one := func(name string, f func(any) any) expr.Option {
		return expr.Function(name, func(args ...any) (any, error) {
			if len(args) != 1 {
				return nil, fmt.Errorf("%s takes one argument", name)
			}
			return f(args[0]), nil
		})
	}
	ptr := func(f func(any) any) func(any) any {
		return func(v any) any {
			if v == nil {
				return nil
			}
			return f(v)
		}
	}
	return []expr.Option{
		one("String", func(v any) any { return GoString(v) }),
		one("Int", func(v any) any { return GoInt64(v) }),
		one("Int64", func(v any) any { return GoInt64(v) }),
		one("Int32", func(v any) any { return int64(int32(GoInt64(v))) }),
		one("Uint", func(v any) any { return GoUint(v) }),
		one("Float64", func(v any) any { return GoFloat64(v) }),
		one("Bool", func(v any) any { return GoBool(v) }),
		one("Time", func(v any) any { return GoTime(v) }),
		one("TimePtr", func(v any) any {
			if v == nil {
				return nil
			}
			if t := GoTime(v); !t.IsZero() {
				return t
			}
			return nil
		}),
		one("YearPtr", func(v any) any { return GoYearPtr(v) }),
		one("PtrString", ptr(func(v any) any { return GoString(v) })),
		one("PtrInt", ptr(func(v any) any { return GoInt64(v) })),
		one("PtrInt64", ptr(func(v any) any { return GoInt64(v) })),
		one("PtrUint", ptr(func(v any) any { return GoUint(v) })),
		one("PtrFloat64", ptr(func(v any) any { return GoFloat64(v) })),
		one("PtrBool", ptr(func(v any) any { return GoBool(v) })),
		one("PtrStringNil", func(v any) any {
			if v == nil {
				return nil
			}
			if s := strings.TrimSpace(GoString(v)); s != "" {
				return s
			}
			return nil
		}),
		one("NilIfZero", func(v any) any {
			switch x := v.(type) {
			case nil:
				return nil
			case int64:
				if x == 0 {
					return nil
				}
			case int:
				if x == 0 {
					return nil
				}
			case uint64:
				if x == 0 {
					return nil
				}
			case float64:
				if x == 0 {
					return nil
				}
			case string:
				if x == "" {
					return nil
				}
			case bool:
				if !x {
					return nil
				}
			case time.Time:
				if x.IsZero() {
					return nil
				}
			}
			return v
		}),
		one("Upper", func(v any) any {
			if v == nil {
				return nil
			}
			return strings.ToUpper(GoString(v))
		}),
		one("Ptr", func(v any) any { return v }),
		// Bytes is []byte(String(v)).
		one("Bytes", func(v any) any { return []byte(GoString(v)) }),
		// OrNow fills a NULL or zero time with the current time, as GORM does
		// for CreatedAt/UpdatedAt.
		one("OrNow", func(v any) any {
			if t, ok := v.(time.Time); v == nil || ok && t.IsZero() {
				return time.Now().UTC()
			}
			return v
		}),
	}
}

// GoString mirrors dbmigrations.String.
func GoString(v any) string {
	var s string
	switch x := v.(type) {
	case nil:
		return ""
	case string:
		s = x
	case []byte:
		s = string(x)
	case time.Time:
		s = x.In(time.Local).String()
	case float64:
		s = strconv.FormatFloat(x, 'g', -1, 64)
	default:
		s = fmt.Sprintf("%v", v)
	}
	if strings.IndexByte(s, 0) >= 0 {
		s = strings.ReplaceAll(s, "\x00", "")
	}
	return s
}

// GoInt64 mirrors dbmigrations.Int64.
func GoInt64(v any) int64 {
	switch x := v.(type) {
	case nil:
		return 0
	case int:
		return int64(x)
	case int32:
		return int64(x)
	case int64:
		return x
	case uint64:
		return int64(x)
	case float32:
		return int64(x)
	case float64:
		return int64(x)
	case bool:
		if x {
			return 1
		}
		return 0
	case string:
		n, _ := strconv.ParseInt(x, 10, 64)
		return n
	case []byte:
		n, _ := strconv.ParseInt(string(x), 10, 64)
		return n
	}
	return 0
}

// GoUint mirrors dbmigrations.Uint (negatives become 0).
func GoUint(v any) int64 {
	if n := GoInt64(v); n > 0 {
		return n
	}
	return 0
}

// GoFloat64 mirrors dbmigrations.Float64 (bools are not numbers there).
func GoFloat64(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case float32:
		return float64(x)
	case int, int32, int64, uint64:
		return float64(GoInt64(x))
	case string:
		f, _ := strconv.ParseFloat(x, 64)
		return f
	case []byte:
		f, _ := strconv.ParseFloat(string(x), 64)
		return f
	}
	return 0
}

// GoBool mirrors dbmigrations.Bool.
func GoBool(v any) bool {
	switch x := v.(type) {
	case bool:
		return x
	case int, int32, int64, uint64:
		return GoInt64(x) != 0
	case float32, float64:
		return GoFloat64(x) != 0
	case string:
		return goBoolStr(x)
	case []byte:
		return goBoolStr(string(x))
	}
	return false
}

func goBoolStr(s string) bool {
	switch s {
	case "1", "true", "TRUE", "True", "t", "T", "y", "Y", "yes", "YES":
		return true
	}
	return false
}

var goTimeLayouts = []string{
	time.RFC3339Nano, time.RFC3339, "2006-01-02 15:04:05.999999", "2006-01-02 15:04:05",
	"2006-01-02T15:04:05Z", "2006-01-02T15:04:05.999999", "2006-01-02T15:04:05", "2006-01-02",
}

// GoTime mirrors dbmigrations.Time: text parses as UTC, integers are Unix
// seconds, anything else is the zero time.
func GoTime(v any) time.Time {
	switch x := v.(type) {
	case time.Time:
		return x
	case int, int32, int64, uint64:
		return time.Unix(GoInt64(x), 0).UTC()
	case string:
		return goParseTime(x)
	case []byte:
		return goParseTime(string(x))
	}
	return time.Time{}
}

func goParseTime(s string) time.Time {
	if s == "" || s == "0000-00-00 00:00:00" || s == "0000-00-00" {
		return time.Time{}
	}
	for _, l := range goTimeLayouts {
		if t, err := time.Parse(l, s); err == nil {
			return t
		}
	}
	return time.Time{}
}

// GoYearPtr mirrors dbmigrations.YearPtr. Times are read in the local zone,
// as the Go driver (loc=Local) delivers them.
func GoYearPtr(v any) any {
	if v == nil {
		return nil
	}
	var y int64
	switch x := v.(type) {
	case time.Time:
		y = int64(x.In(time.Local).Year())
	case []byte:
		y = GoInt64(string(x))
	default:
		y = GoInt64(x)
	}
	if y <= 0 {
		return nil
	}
	return y
}
