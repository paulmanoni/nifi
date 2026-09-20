package script

import (
	"crypto/rand"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
	gotime "time"

	"go.starlark.net/lib/json"
	sttime "go.starlark.net/lib/time"
	"go.starlark.net/starlark"
	"go.starlark.net/starlarkstruct"
	"go.starlark.net/syntax"
)

// Python compatibility: users write Python, the interpreter is Starlark.
// translate rewrites the common Python-only constructs into Starlark while
// keeping every statement on its original line, so error lines still match
// the editor:
//
//	import json / import re as r / from hashlib import sha256
//	x is None / x is not None
//	f"{a} {b:.2f} {c!r}"
//
// Anything else Starlark lacks (classes, try/except, with) still reports a
// normal syntax error.

// Modules scripts can import; each is predeclared under this name.
var importable = map[string]bool{"json": true, "re": true, "math": true, "time": true, "hashlib": true, "uuid": true, "datetime": true}

func importableList() string {
	var n []string
	for k := range importable {
		n = append(n, k)
	}
	sort.Strings(n)
	return strings.Join(n, ", ")
}

var (
	importRe = regexp.MustCompile(`^(\s*)import\s+(.+?)\s*(#.*)?$`)
	fromRe   = regexp.MustCompile(`^(\s*)from\s+([\w.]+)\s+import\s+(.+?)\s*(#.*)?$`)
)

func translate(src string) (string, error) {
	lines := strings.Split(src, "\n")
	inTriple := ""
	for i, line := range lines {
		if inTriple == "" {
			if m := importRe.FindStringSubmatch(line); m != nil {
				out, err := importLine(m[1], m[2], i+1)
				if err != nil {
					return "", err
				}
				lines[i] = out
				continue
			}
			if m := fromRe.FindStringSubmatch(line); m != nil {
				out, err := fromLine(m[1], m[2], m[3], i+1)
				if err != nil {
					return "", err
				}
				lines[i] = out
				continue
			}
		}
		inTriple = trackTriple(line, inTriple)
	}
	return rewriteTokens(strings.Join(lines, "\n"))
}

// trackTriple follows triple-quoted strings across lines so import-looking
// text inside docstrings is left alone.
func trackTriple(line, open string) string {
	for i := 0; i < len(line); {
		if open != "" {
			if strings.HasPrefix(line[i:], open) {
				i += 3
				open = ""
				continue
			}
			i++
			continue
		}
		switch {
		case line[i] == '#':
			return open
		case strings.HasPrefix(line[i:], `"""`), strings.HasPrefix(line[i:], `'''`):
			open = line[i : i+3]
			i += 3
		case line[i] == '"' || line[i] == '\'':
			q := line[i]
			i++
			for i < len(line) && line[i] != q {
				if line[i] == '\\' {
					i++
				}
				i++
			}
			i++
		default:
			i++
		}
	}
	return open
}

func importLine(indent, spec string, line int) (string, error) {
	var stmts []string
	for _, part := range strings.Split(spec, ",") {
		f := strings.Fields(part)
		var mod, alias string
		switch {
		case len(f) == 1:
			mod, alias = f[0], f[0]
		case len(f) == 3 && f[1] == "as":
			mod, alias = f[0], f[2]
		default:
			return "", &Error{Line: line, Msg: fmt.Sprintf("cannot read import %q", strings.TrimSpace(part))}
		}
		if !importable[mod] {
			return "", &Error{Line: line, Msg: fmt.Sprintf("module %q is not available in scripts (available: %s)", mod, importableList())}
		}
		if alias != mod {
			stmts = append(stmts, alias+" = "+mod)
		}
	}
	if len(stmts) == 0 {
		return "", nil // already predeclared
	}
	return indent + strings.Join(stmts, "; "), nil
}

func fromLine(indent, mod, names string, line int) (string, error) {
	if !importable[mod] {
		return "", &Error{Line: line, Msg: fmt.Sprintf("module %q is not available in scripts (available: %s)", mod, importableList())}
	}
	names = strings.Trim(strings.TrimSpace(names), "()")
	var stmts []string
	for _, part := range strings.Split(names, ",") {
		f := strings.Fields(part)
		var name, alias string
		switch {
		case len(f) == 1:
			name, alias = f[0], f[0]
		case len(f) == 3 && f[1] == "as":
			name, alias = f[0], f[2]
		default:
			return "", &Error{Line: line, Msg: fmt.Sprintf("cannot read import %q", strings.TrimSpace(part))}
		}
		if name == "*" {
			return "", &Error{Line: line, Msg: "\"import *\" is not supported; import the names you use"}
		}
		stmts = append(stmts, fmt.Sprintf("%s = %s.%s", alias, mod, name))
	}
	return indent + strings.Join(stmts, "; "), nil
}

func isIdent(c byte) bool {
	return c == '_' || c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9'
}

// rewriteTokens handles `is` / `is not` and f-strings, skipping comments and
// ordinary string literals.
func rewriteTokens(src string) (string, error) {
	var b strings.Builder
	line := 1
	for i := 0; i < len(src); {
		c := src[i]
		switch {
		case c == '\n':
			line++
			b.WriteByte(c)
			i++
		case c == '#':
			j := strings.IndexByte(src[i:], '\n')
			if j < 0 {
				j = len(src) - i
			}
			b.WriteString(src[i : i+j])
			i += j
		case c == '"' || c == '\'':
			j := stringEnd(src, i)
			line += strings.Count(src[i:j], "\n")
			b.WriteString(src[i:j])
			i = j
		case isIdent(c):
			j := i
			for j < len(src) && isIdent(src[j]) {
				j++
			}
			word := src[i:j]
			// string prefixes: f"", rf"", fr"" …
			if j < len(src) && (src[j] == '"' || src[j] == '\'') && len(word) <= 2 && strings.ContainsAny(strings.ToLower(word), "fbru") &&
				strings.Trim(strings.ToLower(word), "fbru") == "" {
				end := stringEnd(src, j)
				lit := src[j:end]
				if strings.ContainsAny(word, "fF") {
					conv, err := fString(strings.ReplaceAll(strings.ReplaceAll(word, "f", ""), "F", ""), lit, line)
					if err != nil {
						return "", err
					}
					b.WriteString(conv)
				} else {
					b.WriteString(word + lit)
				}
				line += strings.Count(lit, "\n")
				i = end
				continue
			}
			if word == "is" && (i == 0 || !isIdent(src[i-1])) {
				k := j
				for k < len(src) && (src[k] == ' ' || src[k] == '\t') {
					k++
				}
				if strings.HasPrefix(src[k:], "not") && (k+3 == len(src) || !isIdent(src[k+3])) {
					b.WriteString("!=")
					i = k + 3
					continue
				}
				b.WriteString("==")
				i = j
				continue
			}
			b.WriteString(word)
			i = j
		default:
			b.WriteByte(c)
			i++
		}
	}
	return b.String(), nil
}

// stringEnd returns the index just past the string literal starting at i.
func stringEnd(src string, i int) int {
	q := src[i]
	if strings.HasPrefix(src[i:], strings.Repeat(string(q), 3)) {
		end := strings.Index(src[i+3:], strings.Repeat(string(q), 3))
		if end < 0 {
			return len(src)
		}
		return i + 3 + end + 3
	}
	j := i + 1
	for j < len(src) && src[j] != q && src[j] != '\n' {
		if src[j] == '\\' {
			j++
		}
		j++
	}
	return min(j+1, len(src))
}

// fString turns f"a {x} b {y:.2f}" into "a {} b {}".format(x, __format(y, ".2f")).
func fString(prefix, lit string, line int) (string, error) {
	q := 1
	if len(lit) >= 6 && (strings.HasPrefix(lit, `"""`) || strings.HasPrefix(lit, `'''`)) {
		q = 3
	}
	if len(lit) < 2*q {
		return prefix + lit, nil
	}
	body := lit[q : len(lit)-q]
	var out strings.Builder
	var args []string
	for i := 0; i < len(body); {
		switch {
		case strings.HasPrefix(body[i:], "{{"), strings.HasPrefix(body[i:], "}}"):
			out.WriteString(body[i : i+2])
			i += 2
		case body[i] == '{':
			depth, j := 0, i+1
			for ; j < len(body); j++ {
				ch := body[j]
				if ch == '"' || ch == '\'' {
					k := j + 1
					for k < len(body) && body[k] != ch {
						k++
					}
					j = k
					continue
				}
				if ch == '(' || ch == '[' || ch == '{' {
					depth++
				} else if ch == ')' || ch == ']' || (ch == '}' && depth > 0) {
					depth--
				} else if ch == '}' {
					break
				}
			}
			if j >= len(body) {
				return "", &Error{Line: line, Msg: "f-string: missing }"}
			}
			expr, conv, spec := splitField(body[i+1 : j])
			if strings.TrimSpace(expr) == "" {
				return "", &Error{Line: line, Msg: "f-string: empty expression {}"}
			}
			arg := strings.TrimSpace(expr)
			switch conv {
			case "r":
				arg = "repr(" + arg + ")"
			case "s":
				arg = "str(" + arg + ")"
			}
			if spec != "" {
				arg = fmt.Sprintf("__format(%s, %q)", arg, spec)
			}
			args = append(args, arg)
			out.WriteString("{}")
			i = j + 1
		default:
			out.WriteByte(body[i])
			i++
		}
	}
	quote := lit[:q]
	s := prefix + quote + out.String() + quote
	if len(args) == 0 {
		return s, nil
	}
	return s + ".format(" + strings.Join(args, ", ") + ")", nil
}

// splitField separates expr, !conversion and :spec at the top level.
func splitField(f string) (expr, conv, spec string) {
	depth := 0
	for i := 0; i < len(f); i++ {
		switch f[i] {
		case '(', '[', '{':
			depth++
		case ')', ']', '}':
			depth--
		case '"', '\'':
			q := f[i]
			for i++; i < len(f) && f[i] != q; i++ {
			}
		case '!':
			if depth == 0 && i+1 < len(f) && f[i+1] != '=' {
				expr, rest := f[:i], f[i+1:]
				if k := strings.IndexByte(rest, ':'); k >= 0 {
					return expr, rest[:k], rest[k+1:]
				}
				return expr, rest, ""
			}
		case ':':
			if depth == 0 {
				return f[:i], "", f[i+1:]
			}
		}
	}
	return f, "", ""
}

// ---- runtime helpers used by translated code and Python-style modules ----

func pyBuiltins() starlark.StringDict {
	return starlark.StringDict{
		"__format":   starlark.NewBuiltin("format", pyFormat),
		"isinstance": starlark.NewBuiltin("isinstance", pyIsInstance),
		"json":       pyJSONModule(),
		"uuid": &starlarkstruct.Module{Name: "uuid", Members: starlark.StringDict{
			"uuid4": starlark.NewBuiltin("uuid4", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
				return starlark.String(newUUID()), nil
			}),
		}},
		"datetime": pyDatetimeModule(),
		"time":     pyTimeModule(),
	}
}

func pyIsInstance(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
	if len(args) != 2 {
		return nil, fmt.Errorf("isinstance(value, type)")
	}
	want := []starlark.Value{args[1]}
	if t, ok := args[1].(starlark.Tuple); ok {
		want = t
	}
	names := map[string]string{"str": "string", "int": "int", "float": "float", "bool": "bool", "list": "list",
		"dict": "dict", "tuple": "tuple", "bytes": "bytes"}
	got := args[0].Type()
	for _, w := range want {
		b, ok := w.(*starlark.Builtin)
		if !ok {
			return nil, fmt.Errorf("isinstance: second argument must be a type like str or (int, float)")
		}
		if names[b.Name()] == got {
			return starlark.True, nil
		}
	}
	return starlark.False, nil
}

// pyFormat implements Python's format(value, spec) for the common
// mini-language: [[fill]align][sign][,][width][.precision][type].
func pyFormat(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
	if len(args) != 2 {
		return nil, fmt.Errorf("format(value, spec)")
	}
	spec, _ := starlark.AsString(args[1])
	m := specRe.FindStringSubmatch(spec)
	if m == nil {
		return nil, fmt.Errorf("unsupported format spec %q", spec)
	}
	fill, align, sign, comma, width, prec, typ := m[1], m[2], m[3], m[6] != "", m[4]+m[5], m[7], m[8]
	if fill == "" {
		fill = " "
	}
	var s string
	num := func() (float64, bool) {
		switch x := args[0].(type) {
		case starlark.Int:
			f, _ := starlark.AsFloat(x)
			return f, true
		case starlark.Float:
			return float64(x), true
		}
		return 0, false
	}
	switch typ {
	case "f", "F", "e", "E", "%", "g", "G":
		f, ok := num()
		if !ok {
			return nil, fmt.Errorf("format %q needs a number, got %s", spec, args[0].Type())
		}
		p := 6
		if prec != "" {
			fmt.Sscan(prec, &p)
		}
		if typ == "%" {
			f *= 100
		}
		verb := map[string]byte{"f": 'f', "F": 'f', "e": 'e', "E": 'E', "%": 'f', "g": 'g', "G": 'G'}[typ]
		s = strconv.FormatFloat(f, verb, p, 64)
		if comma {
			s = groupThousands(s)
		}
		if typ == "%" {
			s += "%"
		}
	case "d", "x", "X", "b", "o":
		i, ok := args[0].(starlark.Int)
		if !ok {
			return nil, fmt.Errorf("format %q needs an int, got %s", spec, args[0].Type())
		}
		n, _ := i.Int64()
		base := map[string]int{"d": 10, "x": 16, "X": 16, "b": 2, "o": 8}[typ]
		s = strconv.FormatInt(n, base)
		if typ == "X" {
			s = strings.ToUpper(s)
		}
		if comma {
			s = groupThousands(s)
		}
	default:
		if str, ok := starlark.AsString(args[0]); ok {
			s = str
		} else if f, ok := num(); ok && prec != "" {
			p := 0
			fmt.Sscan(prec, &p)
			s = strconv.FormatFloat(f, 'f', p, 64)
		} else {
			s = args[0].String()
		}
		if prec != "" && typ == "s" {
			p := 0
			fmt.Sscan(prec, &p)
			if r := []rune(s); len(r) > p {
				s = string(r[:p])
			}
		}
	}
	if sign == "+" && !strings.HasPrefix(s, "-") {
		if _, ok := num(); ok {
			s = "+" + s
		}
	}
	w := 0
	if width != "" {
		fmt.Sscan(strings.TrimLeft(width, "0"), &w)
		if strings.HasPrefix(width, "0") && align == "" {
			fill, align = "0", "="
		}
	}
	if pad := w - len([]rune(s)); pad > 0 {
		p := strings.Repeat(fill, pad)
		switch align {
		case "<":
			s += p
		case "^":
			s = p[:pad/2*len(fill)] + s + p[pad/2*len(fill):]
		case "=":
			if strings.HasPrefix(s, "-") || strings.HasPrefix(s, "+") {
				s = s[:1] + p + s[1:]
			} else {
				s = p + s
			}
		case ">":
			s = p + s
		default:
			if _, ok := num(); ok {
				s = p + s
			} else {
				s += p
			}
		}
	}
	return starlark.String(s), nil
}

// [[fill]align][sign][0][width][,][.precision][type] — Python's order.
var specRe = regexp.MustCompile(`^(?:(.)?([<>=^]))?([+\- ]?)(0?)(\d*)(,?)(?:\.(\d+))?([sdfFeEgGxXbo%]?)$`)

func groupThousands(s string) string {
	neg := strings.HasPrefix(s, "-")
	s = strings.TrimPrefix(s, "-")
	intPart, frac := s, ""
	if i := strings.IndexByte(s, '.'); i >= 0 {
		intPart, frac = s[:i], s[i:]
	}
	var b strings.Builder
	for i, c := range intPart {
		if i > 0 && (len(intPart)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(c)
	}
	out := b.String() + frac
	if neg {
		out = "-" + out
	}
	return out
}

func pyJSONModule() *starlarkstruct.Module {
	members := starlark.StringDict{}
	for k, v := range json.Module.Members {
		members[k] = v
	}
	members["loads"] = json.Module.Members["decode"]
	members["dumps"] = starlark.NewBuiltin("dumps", func(th *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
		if len(args) != 1 {
			return nil, fmt.Errorf("json.dumps(value, indent=None)")
		}
		for _, kv := range kwargs {
			if k, _ := starlark.AsString(kv[0]); k == "indent" && kv[1] != starlark.None {
				n, _ := starlark.AsInt32(kv[1])
				return starlark.Call(th, json.Module.Members["encode_indent"], starlark.Tuple{args[0]},
					[]starlark.Tuple{{starlark.String("indent"), starlark.String(strings.Repeat(" ", n))}})
			}
		}
		return starlark.Call(th, json.Module.Members["encode"], args, nil)
	})
	return &starlarkstruct.Module{Name: "json", Members: members}
}

// pyDatetimeModule offers the handful of datetime calls scripts use; values
// are Starlark time values (fields: year, month, day, hour, …).
func pyDatetimeModule() *starlarkstruct.Module {
	now := starlark.NewBuiltin("now", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
		return PyTime{sttime.Time(gotime.Now().UTC())}, nil
	})
	strptime := starlark.NewBuiltin("strptime", func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
		if len(args) != 2 {
			return nil, fmt.Errorf("strptime(text, format)")
		}
		s, _ := starlark.AsString(args[0])
		f, _ := starlark.AsString(args[1])
		t, err := gotime.ParseInLocation(pyToGoLayout(f), s, gotime.UTC)
		if err != nil {
			return nil, fmt.Errorf("strptime: %v", err)
		}
		return PyTime{sttime.Time(t)}, nil
	})
	fromiso := starlark.NewBuiltin("fromisoformat", func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
		if len(args) != 1 {
			return nil, fmt.Errorf("fromisoformat(text)")
		}
		s, _ := starlark.AsString(args[0])
		for _, l := range []string{gotime.RFC3339Nano, "2006-01-02T15:04:05.999999999", "2006-01-02 15:04:05.999999999", "2006-01-02"} {
			if t, err := gotime.ParseInLocation(l, s, gotime.UTC); err == nil {
				return PyTime{sttime.Time(t)}, nil
			}
		}
		return nil, fmt.Errorf("fromisoformat: cannot parse %q", s)
	})
	strftime := starlark.NewBuiltin("strftime", func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
		if len(args) != 2 {
			return nil, fmt.Errorf("strftime(time, format)")
		}
		var t gotime.Time
		switch x := args[0].(type) {
		case PyTime:
			t = gotime.Time(x.Time)
		case sttime.Time:
			t = gotime.Time(x)
		default:
			return nil, fmt.Errorf("strftime: first argument must be a time")
		}
		f, _ := starlark.AsString(args[1])
		return starlark.String(t.Format(pyToGoLayout(f))), nil
	})
	// fromtimestamp(ts): seconds since the epoch (int, float or numeric
	// text) → UTC datetime. Lenient where migration data needs it: an empty
	// value gives None and a value that is already a datetime is returned.
	fromts := starlark.NewBuiltin("fromtimestamp", func(_ *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
		if len(args) < 1 {
			return nil, fmt.Errorf("%s(timestamp)", b.Name())
		}
		var secs float64
		switch x := args[0].(type) {
		case starlark.NoneType:
			return starlark.None, nil
		case PyTime:
			return x, nil
		case sttime.Time:
			return PyTime{x}, nil
		case starlark.Int, starlark.Float:
			secs, _ = starlark.AsFloat(x)
		case starlark.String:
			txt := strings.TrimSpace(string(x))
			if txt == "" {
				return starlark.None, nil
			}
			f, err := strconv.ParseFloat(txt, 64)
			if err != nil {
				return nil, fmt.Errorf("%s: %q is not a number of seconds", b.Name(), txt)
			}
			secs = f
		default:
			return nil, fmt.Errorf("%s: expected seconds since 1970, got %s", b.Name(), args[0].Type())
		}
		// Millisecond timestamps (13 digits) are common in legacy data.
		if secs > 1e11 || secs < -1e11 {
			secs /= 1000
		}
		whole := int64(secs)
		t := gotime.Unix(whole, int64((secs-float64(whole))*1e9)).UTC()
		return PyTime{sttime.Time(t)}, nil
	})
	today := starlark.NewBuiltin("today", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
		y, m, d := gotime.Now().UTC().Date()
		return PyTime{sttime.Time(gotime.Date(y, m, d, 0, 0, 0, 0, gotime.UTC))}, nil
	})
	cls := &starlarkstruct.Module{Name: "datetime", Members: starlark.StringDict{
		"now": now, "utcnow": now, "today": today, "strptime": strptime, "fromisoformat": fromiso, "strftime": strftime,
		"fromtimestamp": fromts, "utcfromtimestamp": fromts,
	}}
	// timedelta(days=0, seconds=0, microseconds=0, milliseconds=0, minutes=0,
	// hours=0, weeks=0) → a duration usable with + and - on datetimes.
	timedelta := starlark.NewBuiltin("timedelta", func(_ *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
		names := []string{"days", "seconds", "microseconds", "milliseconds", "minutes", "hours", "weeks"}
		unit := map[string]gotime.Duration{"days": 24 * gotime.Hour, "seconds": gotime.Second, "microseconds": gotime.Microsecond,
			"milliseconds": gotime.Millisecond, "minutes": gotime.Minute, "hours": gotime.Hour, "weeks": 7 * 24 * gotime.Hour}
		var total float64
		add := func(name string, v starlark.Value) error {
			f, ok := starlark.AsFloat(v)
			if !ok {
				return fmt.Errorf("timedelta: %s must be a number", name)
			}
			total += f * float64(unit[name])
			return nil
		}
		for i, a := range args {
			if i >= len(names) {
				return nil, fmt.Errorf("timedelta: too many arguments")
			}
			if err := add(names[i], a); err != nil {
				return nil, err
			}
		}
		for _, kv := range kwargs {
			k, _ := starlark.AsString(kv[0])
			if _, ok := unit[k]; !ok {
				return nil, fmt.Errorf("timedelta: unexpected argument %q", k)
			}
			if err := add(k, kv[1]); err != nil {
				return nil, err
			}
		}
		return sttime.Duration(gotime.Duration(total)), nil
	})
	members := starlark.StringDict{"datetime": cls, "timedelta": timedelta}
	for k, v := range cls.Members {
		members[k] = v
	}
	return &starlarkstruct.Module{Name: "datetime", Members: members}
}

func pyToGoLayout(f string) string {
	return strings.NewReplacer("%Y", "2006", "%y", "06", "%m", "01", "%d", "02", "%H", "15", "%I", "03", "%M", "04",
		"%S", "05", "%f", "000000", "%p", "PM", "%b", "Jan", "%B", "January", "%a", "Mon", "%A", "Monday",
		"%z", "-0700", "%Z", "MST", "%j", "002", "%%", "%").Replace(f)
}

func newUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = b[6]&0x0f | 0x40
	b[8] = b[8]&0x3f | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// PyTime is a Starlark time value with Python datetime methods:
// strftime, isoformat, timestamp, date/time parts, replace-free arithmetic
// delegated to the underlying time value.
type PyTime struct{ sttime.Time }

func (t PyTime) Type() string { return "datetime" }

func (t PyTime) Attr(name string) (starlark.Value, error) {
	gt := gotime.Time(t.Time)
	switch name {
	case "strftime":
		return starlark.NewBuiltin("strftime", func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
			if len(args) != 1 {
				return nil, fmt.Errorf("strftime(format)")
			}
			f, _ := starlark.AsString(args[0])
			return starlark.String(gt.Format(pyToGoLayout(f))), nil
		}), nil
	case "isoformat":
		return starlark.NewBuiltin("isoformat", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
			return starlark.String(gt.Format("2006-01-02T15:04:05.999999")), nil
		}), nil
	case "timestamp":
		return starlark.NewBuiltin("timestamp", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
			return starlark.Float(float64(gt.UnixNano()) / 1e9), nil
		}), nil
	case "weekday":
		return starlark.NewBuiltin("weekday", func(*starlark.Thread, *starlark.Builtin, starlark.Tuple, []starlark.Tuple) (starlark.Value, error) {
			return starlark.MakeInt((int(gt.Weekday()) + 6) % 7), nil
		}), nil
	case "microsecond":
		return starlark.MakeInt(gt.Nanosecond() / 1000), nil
	}
	return t.Time.Attr(name)
}

func (t PyTime) AttrNames() []string {
	return append(t.Time.AttrNames(), "strftime", "isoformat", "timestamp", "weekday", "microsecond")
}

func (t PyTime) Binary(op syntax.Token, y starlark.Value, side starlark.Side) (starlark.Value, error) {
	if o, ok := y.(PyTime); ok {
		y = o.Time
	}
	v, err := t.Time.Binary(op, y, side)
	if tv, ok := v.(sttime.Time); ok {
		return PyTime{tv}, err
	}
	return v, err
}

func (t PyTime) Cmp(y starlark.Value, depth int) (int, error) {
	if o, ok := y.(PyTime); ok {
		y = o.Time
	}
	return t.Time.Cmp(y, depth)
}

func pyTimeModule() *starlarkstruct.Module {
	members := starlark.StringDict{}
	for k, v := range sttime.Module.Members {
		members[k] = v
	}
	// Python: time.strftime(format[, t]) — t defaults to now.
	members["strftime"] = starlark.NewBuiltin("strftime", func(_ *starlark.Thread, _ *starlark.Builtin, args starlark.Tuple, _ []starlark.Tuple) (starlark.Value, error) {
		if len(args) < 1 || len(args) > 2 {
			return nil, fmt.Errorf("time.strftime(format, t=now)")
		}
		f, _ := starlark.AsString(args[0])
		t := gotime.Now().UTC()
		if len(args) == 2 {
			switch x := args[1].(type) {
			case PyTime:
				t = gotime.Time(x.Time)
			case sttime.Time:
				t = gotime.Time(x)
			default:
				return nil, fmt.Errorf("time.strftime: second argument must be a time")
			}
		}
		return starlark.String(t.Format(pyToGoLayout(f))), nil
	})
	return &starlarkstruct.Module{Name: "time", Members: members}
}
