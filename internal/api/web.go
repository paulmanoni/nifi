package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/paulmanoni/nifi/internal/web"
)

// webBackend lets the UI's pages read through the API: each call runs the
// API's own handler, in-process, with the page request's context and
// headers, so it is authorized exactly as the browser's own call would be.
type webBackend struct {
	s   *Server
	api http.Handler
}

func (b webBackend) Call(r *http.Request, method, path string, body, out any) error {
	var payload *bytes.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return err
		}
		payload = bytes.NewReader(raw)
	} else {
		payload = bytes.NewReader(nil)
	}
	req, err := http.NewRequestWithContext(r.Context(), method, "/api"+path, payload)
	if err != nil {
		return err
	}
	req.Header = r.Header.Clone()
	for _, h := range []string{"Content-Length", "Accept-Encoding", "If-None-Match", "If-Modified-Since", "X-Nifi-Partial"} {
		req.Header.Del(h)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.RemoteAddr = r.RemoteAddr
	rec := &recorder{header: http.Header{}, status: http.StatusOK}
	b.api.ServeHTTP(rec, req)
	if rec.status >= 400 {
		var e struct {
			Error string `json:"error"`
		}
		if json.Unmarshal(rec.body.Bytes(), &e) != nil || e.Error == "" {
			e.Error = http.StatusText(rec.status)
		}
		return &web.APIError{Status: rec.status, Message: e.Error}
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(rec.body.Bytes(), out)
}

func (b webBackend) Allow(r *http.Request, action string) error {
	err := b.s.allow(r, Action(action))
	switch {
	case err == nil:
		return nil
	case errors.Is(err, ErrUnauthenticated):
		return web.ErrUnauthenticated
	}
	return web.ErrForbidden
}

func (b webBackend) Challenge(w http.ResponseWriter, err error) {
	if errors.Is(err, web.ErrUnauthenticated) {
		b.s.challenge(w, ErrUnauthenticated)
	}
}

func (b webBackend) Base(r *http.Request) string { return b.s.baseFor(r) }

// recorder captures an in-process API response.
type recorder struct {
	header http.Header
	status int
	body   bytes.Buffer
}

func (r *recorder) Header() http.Header         { return r.header }
func (r *recorder) Write(b []byte) (int, error) { return r.body.Write(b) }
func (r *recorder) WriteHeader(status int)      { r.status = status }
