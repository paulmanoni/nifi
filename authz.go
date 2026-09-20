package nifi

import (
	"context"
	"net/http"

	"github.com/paulmanoni/nifi/internal/api"
)

// Action is a permission checked before an API call.
type Action = api.Action

const (
	// ActionView: see flows, runs, progress and bulletins.
	ActionView = api.ActionView
	// ActionEdit: create, change, duplicate and delete flows.
	ActionEdit = api.ActionEdit
	// ActionRun: start, pause, resume and stop runs.
	ActionRun = api.ActionRun
	// ActionData: read database contents — table browsing, previews,
	// connection tests and dead-lettered rows.
	ActionData = api.ActionData
)

// Errors an Authorizer returns; anything else is treated as forbidden.
var (
	ErrUnauthenticated = api.ErrUnauthenticated // → 401
	ErrForbidden       = api.ErrForbidden       // → 403
)

// Authorizer decides whether the request may perform action. Return nil to
// allow, ErrUnauthenticated (401) or ErrForbidden (403) to deny.
type Authorizer func(r *http.Request, action Action) error

// User is a built-in account for apps without their own auth, or for
// dedicated migration operators:
//
//	Users: []nifi.User{
//	    {Username: "admin", Password: "$2a$10$…"},                      // everything
//	    {Username: "viewer", Password: "${VIEWER_PW}", Actions: []nifi.Action{nifi.ActionView}},
//	}
//
// Users are ignored when Config.Authorize is set.
type User = api.User

// Actor names the user behind a request for the audit trail (run bulletins
// record who started, stopped or resumed a run). Optional.
type Actor func(r *http.Request) string

// Permissions builds an Authorizer from a check function and the permission
// each action needs; actions left out of the map are allowed for anyone the
// check lets through with an empty permission.
//
//	nifi.Permissions(func(ctx context.Context, perm string) bool {
//	    return auth.Can(ctx, perm)
//	}, map[nifi.Action]string{
//	    nifi.ActionView: "view_migrations",
//	    nifi.ActionEdit: "change_migrations",
//	    nifi.ActionRun:  "run_migrations",
//	    nifi.ActionData: "view_migration_data",
//	})
func Permissions(can func(ctx context.Context, permission string) bool, perms map[Action]string) Authorizer {
	return func(r *http.Request, a Action) error {
		p, ok := perms[a]
		if !ok {
			p = ""
		}
		if can(r.Context(), p) {
			return nil
		}
		return ErrForbidden
	}
}

// BasicAuth protects the whole mount with HTTP Basic authentication — the
// browser's own sign-in prompt, independent of the host app's login. Used
// when Config.Authorize is nil.
//
// With no Users, a single "admin" account is created. Its password is
// generated on first start, kept in the SQLite state file (so it survives
// restarts) and printed to the console at every startup.
type BasicAuth struct {
	// Realm shown in the browser prompt (default: Config.Title).
	Realm string
	// Users allowed in; Password as for User (bcrypt, plain or "${ENV}").
	Users []User
	// Quiet stops printing the generated admin password at startup.
	Quiet bool
}
