// Package dbx is the database layer: connection profiles, introspection,
// chunked text-protocol reads, and the PostgreSQL bulk writer.
package dbx

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/paulmanoni/nifi/record"
)

// Connection is a database declared by the host application. String fields
// may reference the environment as ${VAR}; they are expanded at open time.
type Connection struct {
	ID       string            `json:"id"`
	Name     string            `json:"name"`
	Driver   string            `json:"driver"` // mysql | postgres
	Host     string            `json:"host"`
	Port     int               `json:"port"`
	User     string            `json:"user"`
	Password string            `json:"-"`
	Database string            `json:"database"`
	Params   map[string]string `json:"-"`
	// MaxConns caps the pool shared by every run using this connection
	// (default 32 for PostgreSQL, 64 for MySQL). Size it to what the server
	// allows: all concurrently running flows draw from the same pool.
	MaxConns int `json:"-"`
	// Description is shown in the UI (e.g. "legacy portal, read replica").
	Description string `json:"description,omitempty"`
}

// TableSummary is one row of a table listing.
type TableSummary struct {
	Schema        string `json:"schema"`
	Name          string `json:"name"`
	EstimatedRows int64  `json:"estimatedRows"`
	SizeBytes     int64  `json:"sizeBytes"`
	HasPrimaryKey bool   `json:"hasPrimaryKey"`
}

// DB is an open source or target database.
type DB interface {
	Driver() string
	Version(ctx context.Context) (string, error)
	ListTables(ctx context.Context) ([]TableSummary, error)
	Describe(ctx context.Context, table string) (*record.TableMeta, error)
	// MinMax returns the integer bounds of col, ok=false for an empty table.
	MinMax(ctx context.Context, meta *record.TableMeta, col string) (lo, hi int64, ok bool, err error)
	// Scan streams raw text-protocol values; nil means SQL NULL. The row slice
	// and its byte slices are only valid for the duration of fn.
	Scan(ctx context.Context, query string, args []any, fn func(row [][]byte) error) error
	// QueryColumns describes the result columns of an arbitrary SELECT.
	QueryColumns(ctx context.Context, query string) ([]record.Column, error)
	// Location is the zone naive DATETIME/DATE values are interpreted in.
	Location() *time.Location
	// Quote quotes an identifier in this dialect.
	Quote(ident string) string
	// QualifiedName renders a table reference for queries.
	QualifiedName(meta *record.TableMeta) string
	Close()
}

// Open connects using the profile.
func Open(ctx context.Context, c Connection) (DB, error) {
	c = c.Expanded()
	switch c.Driver {
	case "mysql":
		return openMySQL(ctx, c)
	case "postgres", "postgresql":
		return openPostgres(ctx, c)
	default:
		return nil, fmt.Errorf("unsupported driver %q", c.Driver)
	}
}

// Expanded returns a copy with ${VAR} references resolved.
func (c Connection) Expanded() Connection {
	c.Host = os.ExpandEnv(c.Host)
	c.User = os.ExpandEnv(c.User)
	c.Password = os.ExpandEnv(c.Password)
	c.Database = os.ExpandEnv(c.Database)
	p := make(map[string]string, len(c.Params))
	for k, v := range c.Params {
		p[k] = os.ExpandEnv(v)
	}
	c.Params = p
	return c
}

func (c Connection) port(def int) int {
	if c.Port > 0 {
		return c.Port
	}
	return def
}

func (c Connection) postgresURL() string {
	u := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.User, c.Password),
		Host:   c.Host + ":" + strconv.Itoa(c.port(5432)),
		Path:   "/" + c.Database,
	}
	q := url.Values{}
	for k, v := range c.Params {
		q.Set(k, v)
	}
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "prefer")
	}
	u.RawQuery = q.Encode()
	return u.String()
}

// Location resolves the connection's "timezone" param: an IANA name such as
// "Africa/Dar_es_Salaam", "Local" (the server running nifi), or empty for UTC.
// MySQL DATETIME/DATE values carry no zone; this is the zone they are read in
// (like the Go driver's loc=Local).
func (c Connection) Location() (*time.Location, error) {
	switch tz := c.Params["timezone"]; tz {
	case "", "UTC", "utc":
		return time.UTC, nil
	case "Local", "local":
		return time.Local, nil
	default:
		return time.LoadLocation(tz)
	}
}

// SplitTable splits "schema.table" into its parts; schema is empty when absent.
func SplitTable(name string) (schema, table string) {
	if i := strings.IndexByte(name, '.'); i > 0 {
		return name[:i], name[i+1:]
	}
	return "", name
}
