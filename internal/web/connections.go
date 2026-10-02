package web

import (
	"errors"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"github.com/paulmanoni/nifi/record"
)

// conn is a connection as GET /api/connections lists it. Managed ones were
// added through the API and may be edited here; the rest are declared by
// the host application in code.
type conn struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Driver      string `json:"driver"`
	Host        string `json:"host"`
	Port        int    `json:"port"`
	User        string `json:"user"`
	Database    string `json:"database"`
	Description string `json:"description"`
	Managed     bool   `json:"managed"`
}

func (c conn) label() string {
	if c.Name != "" {
		return c.Name
	}
	return c.ID
}

// endpoint is user@host:port/database.
func (c conn) endpoint() string {
	var b strings.Builder
	if c.User != "" {
		b.WriteString(c.User + "@")
	}
	b.WriteString(c.Host)
	if c.Port != 0 {
		b.WriteString(":" + strconv.Itoa(c.Port))
	}
	b.WriteString("/" + c.Database)
	return b.String()
}

func defaultPort(driver string) int {
	if driver == "mysql" {
		return 3306
	}
	return 5432
}

func connectionsRoute(c *ctx) (page, int) {
	var conns []conn
	err := c.get("/connections", &conns)
	return page{Nav: "connections", Title: "Connections", Live: "instance", Body: connectionsPage(c, conns, err)}, http.StatusOK
}

// tableSummary is a table in a connection's listing.
type tableSummary struct {
	Schema        string `json:"schema"`
	Name          string `json:"name"`
	EstimatedRows int64  `json:"estimatedRows"`
	SizeBytes     int64  `json:"sizeBytes"`
	HasPrimaryKey bool   `json:"hasPrimaryKey"`
}

// tableRef is how a table is named to the API and in lists: bare for MySQL
// and PostgreSQL's public schema, schema.name otherwise.
func tableRef(t tableSummary, driver string) string {
	if driver == "mysql" || t.Schema == "" || t.Schema == "public" {
		return t.Name
	}
	return t.Schema + "." + t.Name
}

type tablesView struct {
	Conn     conn
	Q, Table string
	Tables   []tableSummary
	Shown    []tableSummary
	ListErr  error
	Meta     *record.TableMeta
	MetaErr  error
	Rows     int64
	Bytes    int64
}

func tablesRoute(id string) func(*ctx) (page, int) {
	return func(c *ctx) (page, int) {
		if !c.can("data") {
			return page{Nav: "connections", Title: "Tables", Body: emptyState("shield-x", "No access", "Browsing tables needs the data permission.", c.href("/connections"), "Back to connections")}, http.StatusForbidden
		}
		var conns []conn
		_ = c.get("/connections", &conns)
		v := tablesView{Q: strings.TrimSpace(c.r.URL.Query().Get("q")), Table: c.r.URL.Query().Get("table")}
		found := false
		for _, cn := range conns {
			if cn.ID == id {
				v.Conn, found = cn, true
			}
		}
		if !found {
			return page{Nav: "connections", Title: "Not found", Body: emptyState("alert-triangle", "No such connection", "“"+id+"” is not configured.", c.href("/connections"), "Back to connections")}, http.StatusNotFound
		}
		v.ListErr = c.get("/connections/"+url.PathEscape(id)+"/tables", &v.Tables)
		sort.Slice(v.Tables, func(i, j int) bool {
			return tableRef(v.Tables[i], v.Conn.Driver) < tableRef(v.Tables[j], v.Conn.Driver)
		})
		for _, t := range v.Tables {
			v.Rows += t.EstimatedRows
			v.Bytes += t.SizeBytes
			if matches(v.Q, t.Schema+"."+t.Name) {
				v.Shown = append(v.Shown, t)
			}
		}
		if v.Table != "" {
			var m record.TableMeta
			if err := c.get("/connections/"+url.PathEscape(id)+"/tables/"+url.PathEscape(v.Table), &m); err != nil {
				v.MetaErr = err
			} else {
				v.Meta = &m
			}
		}
		status := http.StatusOK
		var ae *APIError
		if errors.As(v.ListErr, &ae) && ae.Status == http.StatusForbidden {
			status = http.StatusForbidden
		}
		return page{Nav: "connections", Title: v.Conn.label() + " · tables", Body: tablesPage(c, v)}, status
	}
}

func (v tablesView) href(c *ctx, table string) string {
	q := url.Values{}
	if v.Q != "" {
		q.Set("q", v.Q)
	}
	if table != "" {
		q.Set("table", table)
	}
	u := c.href("/connections/" + url.PathEscape(v.Conn.ID) + "/tables")
	if len(q) == 0 {
		return u
	}
	return u + "?" + q.Encode()
}

func columnType(col record.Column) string {
	s := string(col.Type)
	switch {
	case col.Length > 0:
		s += "(" + strconv.FormatInt(col.Length, 10) + ")"
	case col.Precision > 0 && col.Scale > 0:
		s += "(" + strconv.Itoa(col.Precision) + "," + strconv.Itoa(col.Scale) + ")"
	case col.Precision > 0:
		s += "(" + strconv.Itoa(col.Precision) + ")"
	}
	return s
}

func inKey(name string, key []string) bool {
	for _, k := range key {
		if k == name {
			return true
		}
	}
	return false
}

const connSnippet = `nifi.New(nifi.Config{
    DataPath: "var/nifi.db",
    Connections: []nifi.Connection{
        {ID: "legacy", Driver: "mysql", Host: "10.0.0.5", User: "ro",
         Password: os.Getenv("LEGACY_PW"), Database: "app"},
        {ID: "main", Driver: "postgres", Host: "localhost", User: "app",
         Password: os.Getenv("PG_PW"), Database: "app",
         Description: "primary Postgres"},
    },
})`

func qualified(schema, name string) string {
	if schema == "" {
		return name
	}
	return schema + "." + name
}
