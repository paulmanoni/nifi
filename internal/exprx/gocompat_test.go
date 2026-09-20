package exprx

import (
	"testing"
	"time"
)

func TestGoCompat(t *testing.T) {
	env := Env(nil, "t", []string{"n", "s", "blank", "neg", "b", "d", "y", "nul", "f", "zero"},
		[]any{nil, " x\x00y ", "  ", int64(-5), []byte("yes"), time.Date(2023, 12, 31, 22, 0, 0, 0, time.UTC), "2024", "a\x00b", 3.9, int64(0)})
	for src, want := range map[string]any{
		`String(n)`:             "",
		`String(s)`:             " xy ",
		`PtrString(n)`:          nil,
		`PtrStringNil(blank)`:   nil,
		`PtrStringNil(s)`:       "xy",
		`Int(n)`:                int64(0),
		`Int("12x")`:            int64(0),
		`Int(f)`:                int64(3),
		`Uint(neg)`:             int64(0),
		`Bool(b)`:               true,
		`Bool("on")`:            false,
		`NilIfZero(zero)`:       nil,
		`NilIfZero(neg)`:        int64(-5),
		`TimePtr(n)`:            nil,
		`TimePtr("0000-00-00")`: nil,
		`YearPtr(y)`:            int64(2024),
		`YearPtr(neg)`:          nil,
		`Upper(n)`:              nil,
		`Upper(row["s"])`:       " XY ",
		`Float64(true)`:         0.0,
	} {
		p, err := Compile(src)
		if err != nil {
			t.Fatalf("%s: %v", src, err)
		}
		got, err := p.Run(env)
		if err != nil || got != want {
			t.Errorf("%s = %#v (%v), want %#v", src, got, err, want)
		}
	}
	// Time: text parses as UTC, zero dates give the zero time
	p, _ := Compile(`Time("2024-05-01 10:00:00")`)
	if got, _ := p.Run(env); !got.(time.Time).Equal(time.Date(2024, 5, 1, 10, 0, 0, 0, time.UTC)) {
		t.Errorf("Time text: %v", got)
	}
	p, _ = Compile(`Time(n)`)
	if got, _ := p.Run(env); !got.(time.Time).IsZero() {
		t.Errorf("Time(nil): %v", got)
	}
}
