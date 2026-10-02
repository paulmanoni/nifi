package web

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"math"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/a-h/templ"
)

var (
	hashMu sync.Mutex
	hashes = map[string]string{}
)

// assetHash is a short content hash of an embedded asset, for cache-busting
// URLs that can then be cached forever.
func assetHash(name string) string {
	hashMu.Lock()
	defer hashMu.Unlock()
	if h, ok := hashes[name]; ok {
		return h
	}
	b, err := fs.ReadFile(assets, "assets/"+name)
	if err != nil {
		return "0"
	}
	sum := sha256.Sum256(b)
	h := hex.EncodeToString(sum[:6])
	hashes[name] = h
	return h
}

// fmtNum groups thousands: 1234567 → "1,234,567".
func fmtNum(n int64) string {
	s := strconv.FormatInt(n, 10)
	neg := strings.HasPrefix(s, "-")
	if neg {
		s = s[1:]
	}
	var b strings.Builder
	for i, r := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(r)
	}
	if neg {
		return "-" + b.String()
	}
	return b.String()
}

// fmtCompact shortens a count: 1234 → "1.2k", 15000 → "15k", 2500000 → "2.5M".
func fmtCompact(n int64) string {
	f := float64(n)
	a := math.Abs(f)
	scaled := func(div, zeroDecimalsFrom float64, unit string) string {
		if a >= zeroDecimalsFrom {
			return strconv.FormatFloat(f/div, 'f', 0, 64) + unit
		}
		return strconv.FormatFloat(f/div, 'f', 1, 64) + unit
	}
	switch {
	case a >= 1e9:
		return scaled(1e9, 1e10, "B")
	case a >= 1e6:
		return scaled(1e6, 1e7, "M")
	case a >= 1e4:
		return strconv.FormatFloat(f/1e3, 'f', 0, 64) + "k"
	case a >= 1e3:
		return strconv.FormatFloat(f/1e3, 'f', 1, 64) + "k"
	}
	return strconv.FormatInt(n, 10)
}

// fmtBytes is a size in binary units: "512 B", "3.4 MB", "120 GB".
func fmtBytes(b int64) string {
	units := []string{"B", "KB", "MB", "GB", "TB"}
	v := float64(b)
	u := 0
	for v >= 1024 && u < len(units)-1 {
		v /= 1024
		u++
	}
	if v >= 100 || u == 0 {
		return strconv.FormatFloat(math.Round(v), 'f', 0, 64) + " " + units[u]
	}
	return strconv.FormatFloat(v, 'f', 1, 64) + " " + units[u]
}

// fmtDuration is how long from start to end (now when nil): "1h 4m", "3m 12s", "9s".
func fmtDuration(start time.Time, end *time.Time) string {
	if start.IsZero() {
		return "—"
	}
	stop := time.Now()
	if end != nil && !end.IsZero() {
		stop = *end
	}
	d := stop.Sub(start)
	if d < 0 {
		d = 0
	}
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	switch {
	case h > 0:
		return fmt.Sprintf("%dh %dm", h, m)
	case m > 0:
		return fmt.Sprintf("%dm %ds", m, s)
	}
	return fmt.Sprintf("%ds", s)
}

// pct is a/b as a percentage, clamped to 0–100; with no total, all or nothing.
func pct(a, b int64) float64 {
	if b <= 0 {
		if a > 0 {
			return 100
		}
		return 0
	}
	return math.Max(0, math.Min(100, float64(a)*100/float64(b)))
}

func pctStyle(v float64) string { return "width: " + strconv.FormatFloat(v, 'f', 1, 64) + "%" }

// rfc3339 is a moment for a <time datetime> the browser formats.
func rfc3339(t time.Time) string { return t.UTC().Format(time.RFC3339Nano) }

// stamp is a moment as readable text, the fallback before the browser
// formats it.
func stamp(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Local().Format("2006-01-02 15:04:05")
}

func stampPtr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return stamp(*t)
}

// cellText is a row value as a grid shows it.
func cellText(v any) string {
	switch x := v.(type) {
	case nil:
		return "NULL"
	case string:
		return x
	case bool, float64, int, int64, json.Number:
		return fmt.Sprint(x)
	}
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprint(v)
	}
	return string(b)
}

func prettyJSON(v any) string {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprint(v)
	}
	return string(b)
}

func plural(n int, one, many string) string {
	if n == 1 {
		return "1 " + one
	}
	return strconv.Itoa(n) + " " + many
}

func itoa(n int) string     { return strconv.Itoa(n) }
func i64(n int64) string    { return strconv.FormatInt(n, 10) }
func lower(s string) string { return strings.ToLower(s) }

// matches reports whether every word of q appears in the text.
func matches(q string, parts ...string) bool {
	q = strings.TrimSpace(strings.ToLower(q))
	if q == "" {
		return true
	}
	text := strings.ToLower(strings.Join(parts, " "))
	for _, w := range strings.Fields(q) {
		if !strings.Contains(text, w) {
			return false
		}
	}
	return true
}

func boolAttr(b bool) string { return strconv.FormatBool(b) }

// attrPair is a single "name=value" (or bare "name") as attributes.
func attrPair(kv string) templ.Attributes {
	if kv == "" {
		return nil
	}
	k, v, _ := strings.Cut(kv, "=")
	return templ.Attributes{k: v}
}
