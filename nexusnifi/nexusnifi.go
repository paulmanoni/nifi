// Package nexusnifi mounts the nifi flow designer inside a nexus app.
//
//	var Module = nexusnifi.Module(nexusnifi.Config{
//	    Path:      "/migrations/flows",
//	    Databases: []string{"legacy", "main"},   // [databases.*] blocks in nexus.toml
//	    Engine:    nifi.Config{DataPath: "var/nifi.db"},
//	    Options:   []nexus.RestOption{auth.Required()},
//	    Permissions: map[nifi.Action]string{
//	        nifi.ActionEdit: "change_migration", nifi.ActionRun: "run_migration",
//	        nifi.ActionData: "view_migration_data",
//	    },
//	})
//
// The UI, JSON API and live run stream are served under Path (after any
// enclosing nexus.Path prefix); Options gate every route. The *nifi.Engine is
// provided to the DI graph and closed on shutdown, which stops active runs so
// they can be resumed on the next boot.
package nexusnifi

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/paulmanoni/nexus"
	"github.com/paulmanoni/nexus/extension/auth"
	"github.com/paulmanoni/nexus/httpx"

	"github.com/paulmanoni/nifi"
)

// Config configures the module.
type Config struct {
	// Path is the mount path, default "/nifi".
	Path string
	// Databases names [databases.<name>] blocks from nexus.toml to expose as
	// connections (id = name). Inline values and key_prefix (config server)
	// resolve exactly as db.BindFromConfig does. They are added to
	// Engine.Connections, which can also declare connections directly.
	Databases []string
	// Engine configures the nifi engine. BasePath is ignored: it is derived
	// from each request, so enclosing module prefixes just work.
	Engine nifi.Config
	// Prefix is the enclosing module's path (e.g. nexus.Path("/admin")), used
	// only to print the full URL in console messages.
	Prefix string
	// Options are applied to every route (auth gates, rate limits, …).
	Options []nexus.RestOption
	// Permissions maps nifi actions to nexus auth permissions, checked with
	// auth.Can (so the app's PermissionFn / Backend.Authorize decide). With a
	// map set, every call needs an authenticated identity; an action missing
	// from the map needs nothing more. The identity's ID is recorded as the
	// actor in run bulletins. Ignored when Engine.Authorize is set.
	Permissions map[nifi.Action]string
}

// Module returns a standalone nexus module ("nifi") serving the designer.
func Module(cfg Config) nexus.Option {
	return nexus.Module("nifi", Routes(cfg)...)
}

// Routes returns the module's options without the module wrapper. Spread
// them into an existing module so its nexus.Path prefix and dashboard
// grouping apply (nexus stamps prefixes on a module's direct children only):
//
//	nexus.Module("migrations", append([]nexus.Option{nexus.Path("/admin"), ...},
//	    nexusnifi.Routes(cfg)...)...)
func Routes(cfg Config) []nexus.Option {
	path := "/" + strings.Trim(cfg.Path, "/")
	if path == "/" {
		path = "/nifi"
	}
	cfg.Engine.BasePath = ""

	serve := func(e *nifi.Engine) httpx.HandlerFunc {
		return func(c *httpx.Ctx) {
			rest := strings.TrimPrefix(c.Param("rest"), "/")
			p := c.Request.URL.Path
			base := strings.TrimSuffix(strings.TrimSuffix(p, rest), "/")
			e.ServeAt(c.Writer, c.Request, base, rest)
		}
	}
	redirect := func() httpx.HandlerFunc {
		return func(c *httpx.Ctx) {
			c.Redirect(http.StatusFound, c.Request.URL.Path+"/")
		}
	}

	opts := []nexus.Option{
		nexus.Provide(func(lc nexus.Lifecycle) (*nifi.Engine, error) {
			ec := cfg.Engine
			if ec.ConsolePath == "" {
				ec.ConsolePath = strings.TrimRight(cfg.Prefix, "/") + path + "/"
			}
			for _, name := range cfg.Databases {
				c, err := fromSpec(name)
				if err != nil {
					return nil, err
				}
				ec.Connections = append(ec.Connections, c)
			}
			if ec.Authorize == nil && cfg.Permissions != nil {
				ec.Authorize = authorizer(cfg.Permissions)
			}
			if ec.Actor == nil {
				ec.Actor = func(r *http.Request) string {
					if id, ok := auth.IdentityFrom(r.Context()); ok {
						return id.ID
					}
					return ""
				}
			}
			e, err := nifi.New(ec)
			if err != nil {
				return nil, err
			}
			lc.Append(nexus.Hook{OnStop: func(ctx context.Context) error { return e.Close(ctx) }})
			return e, nil
		}),
	}
	with := func(extra ...nexus.RestOption) []nexus.RestOption {
		return append(append([]nexus.RestOption{}, cfg.Options...), extra...)
	}
	opts = append(opts, nexus.AsRestHandler("GET", path, redirect, with(nexus.Describe("Data flows UI"))...))
	for _, m := range []string{"GET", "POST", "PUT", "DELETE"} {
		opts = append(opts, nexus.AsRestHandler(m, path+"/*rest", serve,
			with(nexus.Describe("Data flows — UI, API and live run stream"), nexus.WithIcon("workflow"))...))
	}
	return opts
}

// Connection builds the nifi connection for a nexus.toml [databases.<name>]
// block, as the module does for Config.Databases.
func Connection(name string) (nifi.Connection, error) { return fromSpec(name) }

// fromSpec builds a connection from a nexus.toml [databases.<name>] block.
func fromSpec(name string) (nifi.Connection, error) {
	spec, ok := nexus.DatabaseSpecFor(name)
	if !ok {
		return nifi.Connection{}, fmt.Errorf("nexusnifi: no [databases.%s] block in nexus.toml", name)
	}
	field := func(inline, suffix string) string {
		if inline != "" {
			return inline
		}
		if spec.KeyPrefix != "" {
			return nexus.Get[string](spec.KeyPrefix + suffix)
		}
		return ""
	}
	port, _ := strconv.Atoi(field(spec.Port, ".port"))
	c := nifi.Connection{ID: name, Name: name, Driver: spec.Driver, Host: field(spec.Host, ".hostname"), Port: port,
		User: field(spec.User, ".username"), Password: field(spec.Password, ".password"), Database: field(spec.Name, ".name"),
		Params: map[string]string{}}
	if spec.SSLMode != "" && spec.Driver != "mysql" {
		c.Params["sslmode"] = spec.SSLMode
	}
	if spec.Driver == "mysql" {
		// nexus opens MySQL with loc=Local: DATETIME values are local time.
		c.Params["timezone"] = "Local"
	}
	return c, nil
}

func authorizer(perms map[nifi.Action]string) nifi.Authorizer {
	return func(r *http.Request, a nifi.Action) error {
		if _, ok := auth.IdentityFrom(r.Context()); !ok {
			return nifi.ErrUnauthenticated
		}
		if p := perms[a]; p != "" && !auth.Can(r.Context(), p) {
			return nifi.ErrForbidden
		}
		return nil
	}
}
