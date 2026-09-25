package nifi_test

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/paulmanoni/nifi"
)

// The instance stream replaces the polling the flow list and the status bar
// used to do: a client gets the current state as soon as it connects, and gets
// the flow list again when a flow changes — without asking for either.
func TestLiveStreamPushesInstanceState(t *testing.T) {
	e, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db")})
	if err != nil {
		t.Fatal(err)
	}
	defer e.Close(t.Context())
	h := e.Handler()

	srv := httptest.NewServer(h)
	defer srv.Close()

	req, _ := http.NewRequestWithContext(t.Context(), "GET", srv.URL+"/api/live", nil)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if ct := res.Header.Get("Content-Type"); ct != "text/event-stream" {
		t.Fatalf("content-type = %q", ct)
	}

	events := make(chan string, 32)
	go func() {
		sc := bufio.NewScanner(res.Body)
		for sc.Scan() {
			if name, ok := strings.CutPrefix(sc.Text(), "event: "); ok {
				events <- name
			}
		}
	}()

	want := func(name string) {
		t.Helper()
		deadline := time.After(10 * time.Second)
		for {
			select {
			case got := <-events:
				if got == name {
					return
				}
			case <-deadline:
				t.Fatalf("no %q event", name)
			}
		}
	}

	// On connect, without being asked: both halves of the state.
	want("runs")
	want("flows")

	// Creating a flow makes the list stale, so it is pushed again.
	body := strings.NewReader(`{"name":"demo","graph":{"nodes":[],"edges":[]}}`)
	cr, _ := http.NewRequestWithContext(t.Context(), "POST", srv.URL+"/api/flows", body)
	cr.Header.Set("Content-Type", "application/json")
	cres, err := http.DefaultClient.Do(cr)
	if err != nil {
		t.Fatal(err)
	}
	cres.Body.Close()
	if cres.StatusCode != 200 {
		t.Fatalf("create flow: %d", cres.StatusCode)
	}
	want("flows")
}

// A client that connects while another is already watching must still get the
// current state at once. The sweeper only starts for the first watcher, so a
// snapshot sent from there alone would leave every later client hanging until
// something happened to change.
func TestLiveStreamGreetsEveryClient(t *testing.T) {
	e, err := nifi.New(nifi.Config{DataPath: filepath.Join(t.TempDir(), "n.db")})
	if err != nil {
		t.Fatal(err)
	}
	defer e.Close(t.Context())
	srv := httptest.NewServer(e.Handler())
	defer srv.Close()
	// Close the streams before the server: httptest.Server.Close waits for
	// connections, and an SSE response never ends on its own.
	ctx, disconnect := context.WithCancel(t.Context())
	defer disconnect()

	connect := func() <-chan string {
		req, _ := http.NewRequestWithContext(ctx, "GET", srv.URL+"/api/live", nil)
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		out := make(chan string, 32)
		go func() {
			sc := bufio.NewScanner(res.Body)
			for sc.Scan() {
				if name, ok := strings.CutPrefix(sc.Text(), "event: "); ok {
					out <- name
				}
			}
		}()
		return out
	}

	first := connect()
	awaitEvent(t, first, "flows") // the first watcher starts the sweeper

	second := connect()
	awaitEvent(t, second, "runs")
	awaitEvent(t, second, "flows")
}

func awaitEvent(t *testing.T, events <-chan string, name string) {
	t.Helper()
	deadline := time.After(5 * time.Second)
	for {
		select {
		case got := <-events:
			if got == name {
				return
			}
		case <-deadline:
			t.Fatalf("no %q event", name)
		}
	}
}
