// Package cron parses the schedules flows run on: a five-field cron
// expression, or one of the plain-language shorthands.
//
//	*/15 * * * *      every 15 minutes
//	0 2 * * *         at 02:00 every day
//	0 6 * * mon-fri   at 06:00 on weekdays
//	@every 30m        every 30 minutes from when it was enabled
//	@hourly @daily @weekly @monthly
//
// Fields are minute, hour, day of month, month and day of week (0 or 7 is
// Sunday). Each accepts *, a number, a-b, a list of either, and a /step.
// Times are the server's local time.
package cron

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Schedule answers when a flow should next run.
type Schedule struct {
	every time.Duration // "@every"; zero for a cron expression
	min   uint64
	hour  uint64
	dom   uint64
	mon   uint64
	dow   uint64
	// domStar and dowStar record which of the two day fields was "*": cron
	// treats "day of month" and "day of week" as alternatives when both are
	// restricted.
	domStar, dowStar bool
	spec             string
}

// String returns the schedule as it was written.
func (s Schedule) String() string { return s.spec }

// Every reports the interval of an "@every" schedule (zero for cron).
func (s Schedule) Every() time.Duration { return s.every }

var shorthands = map[string]string{
	"@hourly":   "0 * * * *",
	"@daily":    "0 0 * * *",
	"@midnight": "0 0 * * *",
	"@weekly":   "0 0 * * 0",
	"@monthly":  "0 0 1 * *",
	"@yearly":   "0 0 1 1 *",
	"@annually": "0 0 1 1 *",
}

var months = map[string]int{"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
	"jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}

var days = map[string]int{"sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6}

// Parse reads a schedule. An empty expression is an error.
func Parse(spec string) (Schedule, error) {
	raw := strings.TrimSpace(spec)
	if raw == "" {
		return Schedule{}, fmt.Errorf("empty schedule")
	}
	lower := strings.ToLower(raw)
	if v, ok := shorthands[lower]; ok {
		s, err := parseCron(v)
		s.spec = raw
		return s, err
	}
	if rest, ok := strings.CutPrefix(lower, "@every "); ok {
		d, err := time.ParseDuration(strings.TrimSpace(rest))
		if err != nil {
			return Schedule{}, fmt.Errorf("@every: %w", err)
		}
		if d < time.Minute {
			return Schedule{}, fmt.Errorf("@every: %s is too short (one minute is the smallest)", d)
		}
		return Schedule{every: d, spec: raw}, nil
	}
	if strings.HasPrefix(lower, "@") {
		return Schedule{}, fmt.Errorf("unknown shorthand %q", raw)
	}
	s, err := parseCron(lower)
	s.spec = raw
	return s, err
}

func parseCron(spec string) (Schedule, error) {
	f := strings.Fields(spec)
	if len(f) != 5 {
		return Schedule{}, fmt.Errorf("a cron schedule has 5 fields (minute hour day month weekday), got %d", len(f))
	}
	var s Schedule
	var err error
	if s.min, err = field(f[0], 0, 59, nil); err != nil {
		return s, fmt.Errorf("minute: %w", err)
	}
	if s.hour, err = field(f[1], 0, 23, nil); err != nil {
		return s, fmt.Errorf("hour: %w", err)
	}
	if s.dom, err = field(f[2], 1, 31, nil); err != nil {
		return s, fmt.Errorf("day of month: %w", err)
	}
	if s.mon, err = field(f[3], 1, 12, months); err != nil {
		return s, fmt.Errorf("month: %w", err)
	}
	if s.dow, err = field(f[4], 0, 6, days); err != nil {
		return s, fmt.Errorf("weekday: %w", err)
	}
	s.domStar, s.dowStar = f[2] == "*", f[4] == "*"
	return s, nil
}

func field(v string, lo, hi int, names map[string]int) (uint64, error) {
	var bits uint64
	for _, part := range strings.Split(v, ",") {
		step := 1
		if base, st, ok := strings.Cut(part, "/"); ok {
			n, err := strconv.Atoi(st)
			if err != nil || n <= 0 {
				return 0, fmt.Errorf("bad step %q", st)
			}
			step, part = n, base
		}
		from, to := lo, hi
		switch {
		case part == "*" || part == "?":
		default:
			a, b, isRange := strings.Cut(part, "-")
			n, err := num(a, names)
			if err != nil {
				return 0, err
			}
			from, to = n, n
			if isRange {
				if to, err = num(b, names); err != nil {
					return 0, err
				}
			} else if step > 1 {
				to = hi // "5/10" means "from 5, every 10"
			}
		}
		if from < lo || to > hi || from > to {
			return 0, fmt.Errorf("%q is outside %d-%d", part, lo, hi)
		}
		for i := from; i <= to; i += step {
			bits |= 1 << uint(i)
		}
	}
	if bits == 0 {
		return 0, fmt.Errorf("matches nothing")
	}
	return bits, nil
}

func num(v string, names map[string]int) (int, error) {
	v = strings.TrimSpace(v)
	if names != nil {
		if n, ok := names[v]; ok {
			return n, nil
		}
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("%q is not a number", v)
	}
	if len(names) == 7 && n == 7 {
		return 0, nil // Sunday is 0 or 7
	}
	return n, nil
}

// Next returns the first time strictly after t at which the schedule fires,
// or the zero time when it never fires (more than five years out).
func (s Schedule) Next(t time.Time) time.Time {
	if s.every > 0 {
		return t.Add(s.every)
	}
	// start at the next whole minute
	t = t.Truncate(time.Minute).Add(time.Minute)
	limit := t.AddDate(5, 0, 0)
	for t.Before(limit) {
		if !bit(s.mon, int(t.Month())) {
			t = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location()).AddDate(0, 1, 0)
			continue
		}
		if !s.dayMatches(t) {
			t = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location()).AddDate(0, 0, 1)
			continue
		}
		if !bit(s.hour, t.Hour()) {
			t = time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), 0, 0, 0, t.Location()).Add(time.Hour)
			continue
		}
		if !bit(s.min, t.Minute()) {
			t = t.Add(time.Minute)
			continue
		}
		return t
	}
	return time.Time{}
}

// dayMatches applies cron's day rule: when both day fields are restricted a
// day matching either one fires.
func (s Schedule) dayMatches(t time.Time) bool {
	dom, dow := bit(s.dom, t.Day()), bit(s.dow, int(t.Weekday()))
	switch {
	case s.domStar && s.dowStar:
		return true
	case s.domStar:
		return dow
	case s.dowStar:
		return dom
	}
	return dom || dow
}

func bit(field uint64, i int) bool { return field&(1<<uint(i)) != 0 }

// Describe renders a schedule in plain words for the UI.
func Describe(spec string) string {
	s, err := Parse(spec)
	if err != nil {
		return ""
	}
	if s.every > 0 {
		return "every " + strings.TrimSuffix(s.every.String(), "0s")
	}
	lower := strings.ToLower(strings.TrimSpace(spec))
	if v, ok := shorthands[lower]; ok {
		spec = v
	}
	f := strings.Fields(strings.ToLower(spec))
	min, hour, dom, mon, dow := f[0], f[1], f[2], f[3], f[4]
	when := ""
	switch {
	case min == "*" && hour == "*":
		when = "every minute"
	case strings.HasPrefix(min, "*/") && hour == "*":
		when = "every " + strings.TrimPrefix(min, "*/") + " minutes"
	case hour == "*":
		when = "every hour at :" + pad(min)
	case !strings.ContainsAny(hour, "*,-/") && !strings.ContainsAny(min, "*,-/"):
		when = "at " + pad(hour) + ":" + pad(min)
	default:
		when = "at minute " + min + " of hour " + hour
	}
	var on []string
	if dow != "*" {
		on = append(on, "on "+dow)
	}
	if dom != "*" {
		on = append(on, "on day "+dom+" of the month")
	}
	if mon != "*" {
		on = append(on, "in month "+mon)
	}
	if len(on) == 0 {
		return when + " every day"
	}
	return when + " " + strings.Join(on, ", ")
}

func pad(v string) string {
	if len(v) == 1 {
		return "0" + v
	}
	return v
}
