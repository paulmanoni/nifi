package api

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Action is a permission class for API calls.
type Action string

const (
	ActionNone Action = ""
	ActionView Action = "view"
	ActionEdit Action = "edit"
	ActionRun  Action = "run"
	ActionData Action = "data"
)

var (
	ErrUnauthenticated = errors.New("authentication required")
	ErrForbidden       = errors.New("not allowed")
)

func (s *Server) allow(r *http.Request, a Action) error {
	if a == ActionNone {
		return nil
	}
	authorize := s.Authorize
	if authorize == nil && s.Basic != nil {
		authorize = s.Basic.Authorize
	}
	if authorize == nil && s.Sessions != nil {
		authorize = s.Sessions.Authorize
	}
	if authorize == nil {
		return nil
	}
	err := authorize(r, a)
	if err == nil || errors.Is(err, ErrUnauthenticated) || errors.Is(err, ErrForbidden) {
		return err
	}
	return errors.Join(ErrForbidden, err)
}

func (s *Server) guard(a Action, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := s.allow(r, a); err != nil {
			s.challenge(w, err)
			if a == ActionView && !isAPI(r) {
				// With built-in login the SPA renders its own sign-in form.
				if s.Sessions != nil && s.Authorize == nil && errors.Is(err, ErrUnauthenticated) {
					next(w, r)
					return
				}
				http.Error(w, err.Error(), statusOf(err))
				return
			}
			writeErr(w, err)
			return
		}
		next(w, r)
	}
}

func isAPI(r *http.Request) bool { return len(r.URL.Path) >= 5 && r.URL.Path[:5] == "/api/" }

func statusOf(err error) int {
	if errors.Is(err, ErrUnauthenticated) {
		return http.StatusUnauthorized
	}
	return http.StatusForbidden
}

func (s *Server) actor(r *http.Request) string {
	if s.Actor != nil {
		if a := s.Actor(r); a != "" {
			return a
		}
	}
	if s.Basic != nil && s.Authorize == nil {
		if u, ok := s.Basic.user(r); ok {
			return u.Username
		}
	}
	if s.Sessions != nil && s.Authorize == nil {
		if u, ok := s.Sessions.User(r); ok {
			return u.Username
		}
	}
	return ""
}

// User is a built-in account, used when the host app does not provide its
// own Authorize hook.
type User struct {
	Username string
	// Password is a bcrypt hash ("$2a$…"/"$2b$…"), plain text for
	// development, or "${VAR}" to read either from the environment.
	Password string
	// Actions granted; empty grants everything.
	Actions []Action
}

// Sessions implements cookie login for built-in users.
type Sessions struct {
	Users  map[string]User
	Key    []byte
	TTL    time.Duration
	Secure bool
}

const cookieName = "nifi_session"

func (s *Sessions) sign(user string, exp int64) string {
	m := hmac.New(sha256.New, s.Key)
	fmt.Fprintf(m, "%s|%d", user, exp)
	return base64.RawURLEncoding.EncodeToString([]byte(fmt.Sprintf("%s|%d|", user, exp))) + "." +
		base64.RawURLEncoding.EncodeToString(m.Sum(nil))
}

func (s *Sessions) verify(tok string) (string, bool) {
	payload, sig, ok := strings.Cut(tok, ".")
	if !ok {
		return "", false
	}
	raw, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return "", false
	}
	parts := strings.SplitN(string(raw), "|", 3)
	if len(parts) != 3 {
		return "", false
	}
	exp, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil || time.Now().Unix() > exp {
		return "", false
	}
	want := s.sign(parts[0], exp)
	if !hmac.Equal([]byte(want), []byte(payload+"."+sig)) {
		return "", false
	}
	if _, ok := s.Users[parts[0]]; !ok {
		return "", false
	}
	return parts[0], true
}

// User returns the signed-in username.
func (s *Sessions) User(r *http.Request) (User, bool) {
	c, err := r.Cookie(cookieName)
	if err != nil {
		return User{}, false
	}
	name, ok := s.verify(c.Value)
	if !ok {
		return User{}, false
	}
	return s.Users[name], true
}

// Authorize checks the session user's actions.
func (s *Sessions) Authorize(r *http.Request, a Action) error {
	u, ok := s.User(r)
	if !ok {
		return ErrUnauthenticated
	}
	if len(u.Actions) == 0 {
		return nil
	}
	for _, x := range u.Actions {
		if x == a {
			return nil
		}
	}
	return ErrForbidden
}

func checkPassword(stored, given string) bool {
	if strings.HasPrefix(stored, "${") && strings.HasSuffix(stored, "}") {
		stored = os.Getenv(stored[2 : len(stored)-1])
	}
	if stored == "" {
		return false
	}
	if strings.HasPrefix(stored, "$2a$") || strings.HasPrefix(stored, "$2b$") || strings.HasPrefix(stored, "$2y$") {
		return bcrypt.CompareHashAndPassword([]byte(stored), []byte(given)) == nil
	}
	return subtle.ConstantTimeCompare([]byte(stored), []byte(given)) == 1
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) (any, error) {
	if s.Sessions == nil {
		return nil, httpError{http.StatusNotFound, "built-in login is not enabled"}
	}
	var b struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	u, ok := s.Sessions.Users[b.Username]
	if !ok || !checkPassword(u.Password, b.Password) {
		time.Sleep(300 * time.Millisecond)
		return nil, httpError{http.StatusUnauthorized, "invalid username or password"}
	}
	exp := time.Now().Add(s.Sessions.TTL)
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: s.Sessions.sign(u.Username, exp.Unix()), Path: s.cookiePath(r),
		Expires: exp, HttpOnly: true, Secure: s.Sessions.Secure, SameSite: http.SameSiteLaxMode})
	return map[string]any{"ok": true, "user": u.Username}, nil
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) (any, error) {
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: "", Path: s.cookiePath(r), MaxAge: -1, HttpOnly: true})
	return map[string]any{"ok": true}, nil
}

func (s *Server) cookiePath(r *http.Request) string {
	if b := s.baseFor(r); b != "" {
		return b + "/"
	}
	return "/"
}

// Basic protects the mount with HTTP Basic authentication: the browser's own
// sign-in prompt, no login page or cookie.
type Basic struct {
	Realm string
	Users map[string]User
}

func (b *Basic) user(r *http.Request) (User, bool) {
	name, pass, ok := r.BasicAuth()
	if !ok {
		return User{}, false
	}
	u, known := b.Users[name]
	// compare even for unknown users so timing doesn't reveal usernames
	stored := u.Password
	if !known {
		stored = "\x00unknown"
	}
	if !checkPassword(stored, pass) || !known {
		return User{}, false
	}
	return u, true
}

// Authorize checks the Basic credentials and the user's actions.
func (b *Basic) Authorize(r *http.Request, a Action) error {
	u, ok := b.user(r)
	if !ok {
		return ErrUnauthenticated
	}
	if len(u.Actions) == 0 {
		return nil
	}
	for _, x := range u.Actions {
		if x == a {
			return nil
		}
	}
	return ErrForbidden
}

// challenge asks the browser for Basic credentials on a 401.
func (s *Server) challenge(w http.ResponseWriter, err error) {
	if s.Basic != nil && s.Authorize == nil && errors.Is(err, ErrUnauthenticated) {
		w.Header().Set("WWW-Authenticate", fmt.Sprintf(`Basic realm=%q, charset="UTF-8"`, s.Basic.Realm))
	}
}
