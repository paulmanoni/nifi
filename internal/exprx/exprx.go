// Package exprx compiles the one-line expressions used by GUI processors
// (computed columns, filters, routes). Columns are variables by name; `row`
// holds the whole record and `table` the table name.
package exprx

import (
	"crypto/md5"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/expr-lang/expr"
	"github.com/expr-lang/expr/vm"
)

// Program is a compiled expression.
type Program struct {
	src  string
	prog *vm.Program
}

// Compile parses src. An empty expression is an error.
func Compile(src string) (*Program, error) {
	if strings.TrimSpace(src) == "" {
		return nil, fmt.Errorf("empty expression")
	}
	opts := append([]expr.Option{expr.AllowUndefinedVariables()}, functions...)
	opts = append(opts, goFunctions()...)
	hostMu.RLock()
	opts = append(opts, hostFuncs...)
	hostMu.RUnlock()
	p, err := expr.Compile(src, opts...)
	if err != nil {
		return nil, err
	}
	return &Program{src: src, prog: p}, nil
}

// Function is a host-provided expression function.
type Function struct {
	Name  string `json:"name"`
	Args  string `json:"args,omitempty"`
	Help  string `json:"help,omitempty"`
	Group string `json:"group,omitempty"`

	Fn func(args ...any) (any, error) `json:"-"`
}

var (
	hostMu    sync.RWMutex
	hostFuncs []expr.Option
	hostDocs  []Function
	hostNames = map[string]bool{}
)

var nameRe = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

// Register adds a host function to every expression compiled afterwards.
// Built-in names are refused; a repeated registration of the same name is a
// no-op (the first one wins).
func Register(f Function) error {
	if !nameRe.MatchString(f.Name) || f.Fn == nil {
		return fmt.Errorf("nifi: invalid function %q", f.Name)
	}
	if builtinNames[f.Name] {
		return fmt.Errorf("nifi: %q is a built-in function", f.Name)
	}
	hostMu.Lock()
	defer hostMu.Unlock()
	if hostNames[f.Name] {
		return nil
	}
	hostNames[f.Name] = true
	if f.Group == "" {
		f.Group = "app"
	}
	fn := f.Fn
	hostFuncs = append(hostFuncs, expr.Function(f.Name, fn))
	hostDocs = append(hostDocs, f)
	return nil
}

// Catalog lists every function an expression can call: the built-ins and
// whatever the host registered.
func Catalog() []Function {
	hostMu.RLock()
	defer hostMu.RUnlock()
	out := append([]Function{}, builtins...)
	out = append(out, hostDocs...)
	return out
}

// Run evaluates against env (column → value plus "row"/"table").
func (p *Program) Run(env map[string]any) (any, error) {
	return expr.Run(p.prog, env)
}

// Truthy evaluates as a boolean condition.
func (p *Program) Truthy(env map[string]any) (bool, error) {
	v, err := p.Run(env)
	if err != nil {
		return false, err
	}
	switch x := v.(type) {
	case bool:
		return x, nil
	case nil:
		return false, nil
	default:
		return false, fmt.Errorf("condition returned %T, want bool", v)
	}
}

// Env builds (or refills) an evaluation environment for one row.
func Env(dst map[string]any, table string, cols []string, row []any) map[string]any {
	if dst == nil {
		dst = make(map[string]any, len(cols)+2)
	}
	rm, _ := dst["row"].(map[string]any)
	if rm == nil {
		rm = make(map[string]any, len(cols))
	}
	for i, c := range cols {
		var v any
		if i < len(row) {
			v = row[i]
		}
		dst[c] = v
		rm[c] = v
	}
	dst["row"] = rm
	dst["table"] = table
	return dst
}

var (
	reCache   sync.Map
	functions = []expr.Option{
		expr.Function("coalesce", func(args ...any) (any, error) {
			for _, a := range args {
				if a != nil {
					if s, ok := a.(string); ok && s == "" {
						continue
					}
					return a, nil
				}
			}
			return nil, nil
		}),
		expr.Function("nullif", func(args ...any) (any, error) {
			if len(args) != 2 {
				return nil, fmt.Errorf("nullif(value, match)")
			}
			if fmt.Sprint(args[0]) == fmt.Sprint(args[1]) {
				return nil, nil
			}
			return args[0], nil
		}),
		expr.Function("concat", func(args ...any) (any, error) {
			var b strings.Builder
			for _, a := range args {
				if a != nil {
					b.WriteString(str(a))
				}
			}
			return b.String(), nil
		}),
		expr.Function("str", func(args ...any) (any, error) {
			if len(args) != 1 || args[0] == nil {
				return nil, nil
			}
			return str(args[0]), nil
		}),
		expr.Function("substr", func(args ...any) (any, error) {
			if len(args) < 2 || args[0] == nil {
				return nil, nil
			}
			r := []rune(str(args[0]))
			start := toInt(args[1])
			if start < 0 {
				start = max(len(r)+start, 0)
			}
			if start > len(r) {
				return "", nil
			}
			end := len(r)
			if len(args) > 2 {
				end = min(start+toInt(args[2]), len(r))
			}
			return string(r[start:end]), nil
		}),
		expr.Function("regexReplace", func(args ...any) (any, error) {
			if len(args) != 3 || args[0] == nil {
				return nil, nil
			}
			re, err := compileRe(str(args[1]))
			if err != nil {
				return nil, err
			}
			return re.ReplaceAllString(str(args[0]), str(args[2])), nil
		}),
		expr.Function("regexMatch", func(args ...any) (any, error) {
			if len(args) != 2 || args[0] == nil {
				return false, nil
			}
			re, err := compileRe(str(args[1]))
			if err != nil {
				return nil, err
			}
			return re.MatchString(str(args[0])), nil
		}),
		expr.Function("snake", func(args ...any) (any, error) {
			if len(args) != 1 || args[0] == nil {
				return nil, nil
			}
			return Snake(str(args[0])), nil
		}),
		expr.Function("sha256", func(args ...any) (any, error) {
			if len(args) != 1 || args[0] == nil {
				return nil, nil
			}
			h := sha256.Sum256([]byte(str(args[0])))
			return hex.EncodeToString(h[:]), nil
		}),
		expr.Function("md5", func(args ...any) (any, error) {
			if len(args) != 1 || args[0] == nil {
				return nil, nil
			}
			h := md5.Sum([]byte(str(args[0])))
			return hex.EncodeToString(h[:]), nil
		}),
		expr.Function("uuid", func(args ...any) (any, error) {
			b := make([]byte, 16)
			rand.Read(b)
			b[6] = b[6]&0x0f | 0x40
			b[8] = b[8]&0x3f | 0x80
			return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:]), nil
		}),
		expr.Function("parseTime", func(args ...any) (any, error) {
			if len(args) < 1 || args[0] == nil {
				return nil, nil
			}
			if t, ok := args[0].(time.Time); ok {
				return t, nil
			}
			s := str(args[0])
			layouts := []string{time.RFC3339Nano, "2006-01-02 15:04:05.999999999", "2006-01-02", "02/01/2006", "01/02/2006"}
			if len(args) > 1 {
				layouts = []string{goLayout(str(args[1]))}
			}
			for _, l := range layouts {
				if t, err := time.ParseInLocation(l, s, time.UTC); err == nil {
					return t, nil
				}
			}
			return nil, fmt.Errorf("parseTime: cannot parse %q", s)
		}),
		expr.Function("formatTime", func(args ...any) (any, error) {
			if len(args) != 2 || args[0] == nil {
				return nil, nil
			}
			t, ok := args[0].(time.Time)
			if !ok {
				return nil, fmt.Errorf("formatTime: %T is not a time", args[0])
			}
			return t.Format(goLayout(str(args[1]))), nil
		}),
		expr.Function("isNull", func(args ...any) (any, error) {
			return len(args) == 1 && args[0] == nil, nil
		}),
		expr.Function("isBlank", func(args ...any) (any, error) {
			return len(args) == 1 && (args[0] == nil || strings.TrimSpace(str(args[0])) == ""), nil
		}),
	}
)

func compileRe(p string) (*regexp.Regexp, error) {
	if v, ok := reCache.Load(p); ok {
		return v.(*regexp.Regexp), nil
	}
	re, err := regexp.Compile(p)
	if err != nil {
		return nil, err
	}
	reCache.Store(p, re)
	return re, nil
}

func str(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case []byte:
		return string(x)
	case time.Time:
		return x.Format(time.RFC3339Nano)
	default:
		return fmt.Sprint(x)
	}
}

func toInt(v any) int {
	switch x := v.(type) {
	case int:
		return x
	case int64:
		return int(x)
	case float64:
		return int(x)
	}
	return 0
}

// goLayout accepts either a Go layout or a strftime-ish one (YYYY-MM-DD HH:mm:ss).
func goLayout(l string) string {
	if strings.Contains(l, "2006") {
		return l
	}
	r := strings.NewReplacer("YYYY", "2006", "YY", "06", "MM", "01", "DD", "02", "HH", "15", "mm", "04", "ss", "05", "SSS", "000")
	return r.Replace(l)
}

// Snake converts CamelCase / mixed names to snake_case.
func Snake(s string) string {
	var b strings.Builder
	rs := []rune(s)
	for i, r := range rs {
		switch {
		case unicode.IsUpper(r):
			if i > 0 && (unicode.IsLower(rs[i-1]) || unicode.IsDigit(rs[i-1]) ||
				(i+1 < len(rs) && unicode.IsLower(rs[i+1]) && unicode.IsUpper(rs[i-1]))) {
				b.WriteByte('_')
			}
			b.WriteRune(unicode.ToLower(r))
		case r == ' ' || r == '-' || r == '.':
			b.WriteByte('_')
		default:
			b.WriteRune(r)
		}
	}
	return strings.Trim(strings.ReplaceAll(b.String(), "__", "_"), "_")
}
