package flow

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/paulmanoni/nifi/internal/cron"
	"github.com/paulmanoni/nifi/internal/model"
)

// Scheduling. A flow can carry a cron expression; while it is enabled the
// scheduler starts it at those times, exactly as pressing Run would. A flow
// that is still running when its next time comes round is skipped (with a
// bulletin on the run that is already going), so a slow flow never piles up.
//
// The last fire time is stored, so an instance that was down at the moment a
// flow was due starts it once when it comes back rather than replaying every
// missed slot.

// Scheduler starts flows on their schedules.
type Scheduler struct {
	m    *Manager
	tick time.Duration

	mu     sync.Mutex
	stop   chan struct{}
	logger func(format string, args ...any)
}

// NewScheduler returns a scheduler for the manager's flows.
func NewScheduler(m *Manager) *Scheduler {
	return &Scheduler{m: m, tick: 30 * time.Second, logger: log.Printf}
}

// Start runs the scheduler until Stop.
func (s *Scheduler) Start() {
	s.mu.Lock()
	if s.stop != nil {
		s.mu.Unlock()
		return
	}
	stop := make(chan struct{})
	s.stop = stop
	s.mu.Unlock()
	go func() {
		t := time.NewTicker(s.tick)
		defer t.Stop()
		for {
			select {
			case <-stop:
				return
			case <-t.C:
				s.check(context.Background(), time.Now())
			}
		}
	}()
}

// Stop ends the scheduler; runs it started keep going.
func (s *Scheduler) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.stop != nil {
		close(s.stop)
		s.stop = nil
	}
}

// check starts every flow that is due at now.
func (s *Scheduler) check(ctx context.Context, now time.Time) {
	if s.m == nil || s.m.Store == nil {
		return
	}
	flows, err := s.m.Store.ListFlows(ctx)
	if err != nil {
		return
	}
	for _, f := range flows {
		if !f.ScheduleEnabled || f.Schedule == "" {
			continue
		}
		sc, err := cron.Parse(f.Schedule)
		if err != nil {
			continue // a bad expression is reported when it is saved
		}
		from := f.UpdatedAt
		if f.LastFire != nil {
			from = *f.LastFire
		}
		next := sc.Next(from.Local())
		if next.IsZero() || next.After(now) {
			continue
		}
		// Record the fire first: a failure to start must not make the flow
		// retry every tick.
		if err := s.m.Store.MarkFired(ctx, f.ID, now); err != nil {
			continue
		}
		if run := s.m.RunningFor(f.ID); run != "" {
			s.m.bulletinf(run, "warn", "%s was due at %s but its previous run is still going — skipped",
				f.Name, next.Format("15:04"))
			continue
		}
		if _, err := s.m.Start(ctx, f.ID, false, "schedule"); err != nil && s.logger != nil {
			s.logger("nifi: scheduled run of %s failed to start: %v", f.Name, err)
		}
	}
}

// NextRun returns when a flow's schedule fires next, or nil when it has
// none or is disabled.
func NextRun(f model.Flow, now time.Time) *time.Time {
	if !f.ScheduleEnabled || f.Schedule == "" {
		return nil
	}
	sc, err := cron.Parse(f.Schedule)
	if err != nil {
		return nil
	}
	from := f.UpdatedAt
	if f.LastFire != nil {
		from = *f.LastFire
	}
	if from.After(now) || from.IsZero() {
		from = now
	}
	next := sc.Next(from.Local())
	if next.IsZero() {
		return nil
	}
	if next.Before(now) {
		next = now // overdue: the next tick starts it
	}
	n := next.UTC()
	return &n
}

// DescribeSchedule renders a schedule in plain words ("" when unparseable).
func DescribeSchedule(spec string) string { return cron.Describe(spec) }

// ValidateSchedule checks an expression, returning the parse error.
func ValidateSchedule(spec string) error {
	_, err := cron.Parse(spec)
	return err
}

// RunningFor returns the id of this flow's active run, if any.
func (m *Manager) RunningFor(flowID string) string {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, ex := range m.active {
		if ex.run.FlowID == flowID {
			return id
		}
	}
	return ""
}

func (m *Manager) bulletinf(runID, level, format string, args ...any) {
	if m.Store == nil {
		return
	}
	seq := m.Store.MaxBulletinSeq(context.Background(), runID) + 1
	m.Store.AddBulletin(context.Background(), runID, model.Bulletin{
		Seq: seq, Time: time.Now().UTC(), Level: level, Message: fmt.Sprintf(format, args...),
	})
}
