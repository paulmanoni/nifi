package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

// The instance-wide event stream behind GET /api/live.
//
// The run stream (GET /api/runs/{id}/events) covers one run for whoever has it
// open. Everything outside a run page — the flow list, the status bar — used to
// ask for the same two endpoints on a timer, from two independent pollers, and
// listing flows costs a query per flow. This pushes that state instead, and
// only gathers it while somebody is connected, so an unwatched instance pays
// nothing.
//
// Two event types, split by how often they change:
//
//	runs   the active run summaries — cheap, sent whenever they differ
//	flows  the flow list as GET /api/flows returns it — expensive, sent on
//	       connect, when a flow changes, and when a run starts or ends
//	       (which is what moves a flow's "last run")
type liveEvent struct {
	name string
	data []byte
}

type liveHub struct {
	mu     sync.Mutex
	subs   map[chan liveEvent]struct{}
	stop   chan struct{}
	dirty  atomic.Bool // a flow changed; re-send the list on the next sweep
	sweep  func(stop chan struct{})
	closed bool
}

func (s *Server) hub() *liveHub {
	s.liveOnce.Do(func() {
		s.live = &liveHub{subs: map[chan liveEvent]struct{}{}}
		s.live.sweep = s.sweepLive
	})
	return s.live
}

// Changed marks instance state as stale so watchers get it on the next sweep.
// Mutations call it; it is a no-op when nobody is listening.
func (s *Server) Changed() { s.hub().dirty.Store(true) }

// subscribe joins the stream, starting the sweeper for the first watcher.
func (h *liveHub) subscribe() (chan liveEvent, func()) {
	ch := make(chan liveEvent, 16)
	h.mu.Lock()
	h.subs[ch] = struct{}{}
	if len(h.subs) == 1 {
		h.stop = make(chan struct{})
		go h.sweep(h.stop)
	}
	h.mu.Unlock()
	return ch, func() {
		h.mu.Lock()
		if _, ok := h.subs[ch]; ok {
			delete(h.subs, ch)
			close(ch)
		}
		if len(h.subs) == 0 && h.stop != nil {
			close(h.stop)
			h.stop = nil
		}
		h.mu.Unlock()
	}
}

func (h *liveHub) publish(name string, data []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for ch := range h.subs {
		select {
		case ch <- liveEvent{name, data}:
		default: // slow client: drop, the next sweep supersedes it
		}
	}
}

func (h *liveHub) watching() bool {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.subs) > 0
}

// sweepLive is the one place instance state is gathered. It runs only while
// the hub has a subscriber.
func (s *Server) sweepLive(stop chan struct{}) {
	t := time.NewTicker(time.Second)
	defer t.Stop()
	var lastRuns, lastShape string
	push := func(first bool) {
		runs := s.Runs.ActiveRuns()
		b, err := json.Marshal(runs)
		if err != nil {
			return
		}
		if first || string(b) != lastRuns {
			lastRuns = string(b)
			s.hub().publish("runs", b)
		}
		// A run appearing or finishing changes what the flow list says about
		// it, so the shape of the run set — not its row counters — is what
		// makes the list stale.
		shape := ""
		for _, r := range runs {
			shape += r.ID + ":" + string(r.Status) + ";"
		}
		if first || shape != lastShape || s.hub().dirty.Swap(false) {
			lastShape = shape
			if fb, err := s.flowsJSON(context.Background()); err == nil {
				s.hub().publish("flows", fb)
			}
		}
	}
	push(true)
	for {
		select {
		case <-stop:
			return
		case <-t.C:
			push(false)
		}
	}
}

func (s *Server) flowsJSON(ctx context.Context) ([]byte, error) {
	flows, err := s.flowList(ctx)
	if err != nil {
		return nil, err
	}
	return json.Marshal(flows)
}

func (s *Server) liveStream(w http.ResponseWriter, r *http.Request) {
	fl, ok := w.(http.Flusher)
	if !ok {
		writeErr(w, errors.New("streaming unsupported"))
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	ch, cancel := s.hub().subscribe()
	defer cancel()

	keep := time.NewTicker(15 * time.Second)
	defer keep.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case <-keep.C:
			fmt.Fprint(w, ": keepalive\n\n")
			fl.Flush()
		case e, ok := <-ch:
			if !ok {
				return
			}
			fmt.Fprintf(w, "event: %s\ndata: %s\n\n", e.name, e.data)
			fl.Flush()
		}
	}
}
