package cron_test

import (
	"testing"
	"time"

	"github.com/paulmanoni/nifi/internal/cron"
)

func TestNext(t *testing.T) {
	base := time.Date(2026, 3, 10, 14, 37, 30, 0, time.Local) // a Tuesday
	cases := []struct{ spec, want string }{
		{"*/15 * * * *", "2026-03-10 14:45"},
		{"0 2 * * *", "2026-03-11 02:00"},
		{"0 6 * * mon-fri", "2026-03-11 06:00"},
		{"0 6 * * sat,sun", "2026-03-14 06:00"},
		{"@hourly", "2026-03-10 15:00"},
		{"@daily", "2026-03-11 00:00"},
		{"30 8 1 * *", "2026-04-01 08:30"},
		{"0 0 1 jan *", "2027-01-01 00:00"},
		{"0 12 13 * fri", "2026-03-13 12:00"}, // either day field matches
		{"5/10 * * * *", "2026-03-10 14:45"},
	}
	for _, c := range cases {
		s, err := cron.Parse(c.spec)
		if err != nil {
			t.Fatalf("%s: %v", c.spec, err)
		}
		got := s.Next(base).Format("2006-01-02 15:04")
		if got != c.want {
			t.Errorf("%s: next %s, want %s", c.spec, got, c.want)
		}
	}
	s, _ := cron.Parse("@every 45m")
	if got := s.Next(base); !got.Equal(base.Add(45 * time.Minute)) {
		t.Errorf("@every: %s", got)
	}
}

func TestParseErrors(t *testing.T) {
	for _, spec := range []string{"", "* * * *", "60 * * * *", "@every 10s", "@nope", "a * * * *", "*/0 * * * *"} {
		if _, err := cron.Parse(spec); err == nil {
			t.Errorf("%q: expected an error", spec)
		}
	}
}

func TestDescribe(t *testing.T) {
	for spec, want := range map[string]string{
		"*/15 * * * *":    "every 15 minutes every day",
		"0 2 * * *":       "at 02:00 every day",
		"0 6 * * mon-fri": "at 06:00 on mon-fri",
		"@every 30m":      "every 30m",
	} {
		if got := cron.Describe(spec); got != want {
			t.Errorf("%s: %q, want %q", spec, got, want)
		}
	}
}
