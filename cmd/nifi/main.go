// Command nifi runs the flow designer standalone. Connections come from a
// JSON file (the UI cannot create them):
//
//	{"connections": [
//	  {"id": "legacy", "driver": "mysql", "host": "10.0.0.5", "port": 3306,
//	   "user": "ro", "password": "${LEGACY_PW}", "database": "app"},
//	  {"id": "main", "driver": "postgres", "host": "localhost", "user": "app",
//	   "password": "${PG_PW}", "database": "app", "params": {"sslmode": "disable"}}
//	]}
package main

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/paulmanoni/nifi"
)

type fileConn struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Driver      string            `json:"driver"`
	Host        string            `json:"host"`
	Port        int               `json:"port"`
	User        string            `json:"user"`
	Password    string            `json:"password"`
	Database    string            `json:"database"`
	Params      map[string]string `json:"params"`
	Description string            `json:"description"`
}

func loadConnections(path string) []nifi.Connection {
	if path == "" {
		return nil
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("read %s: %v", path, err)
	}
	var f struct {
		Connections []fileConn `json:"connections"`
	}
	if err := json.Unmarshal(raw, &f); err != nil {
		log.Fatalf("parse %s: %v", path, err)
	}
	out := make([]nifi.Connection, len(f.Connections))
	for i, c := range f.Connections {
		out[i] = nifi.Connection{ID: c.ID, Name: c.Name, Driver: c.Driver, Host: c.Host, Port: c.Port, User: c.User,
			Password: c.Password, Database: c.Database, Params: c.Params, Description: c.Description}
	}
	return out
}

func main() {
	addr := flag.String("addr", ":8090", "listen address")
	data := flag.String("data", "nifi.db", "SQLite state file")
	base := flag.String("base", "", "URL prefix to mount under, e.g. /nifi")
	conf := flag.String("config", "connections.json", "JSON file declaring the database connections")
	flag.Parse()
	if _, err := os.Stat(*conf); err != nil && *conf == "connections.json" {
		*conf = ""
	}

	eng, err := nifi.New(nifi.Config{DataPath: *data, BasePath: *base, Connections: loadConnections(*conf)})
	if err != nil {
		log.Fatal(err)
	}
	mux := http.NewServeMux()
	if eng.BasePath() == "" {
		mux.Handle("/", eng.Handler())
	} else {
		mux.Handle(eng.BasePath()+"/", eng.Handler())
		mux.Handle("/", http.RedirectHandler(eng.BasePath()+"/", http.StatusFound))
	}
	srv := &http.Server{Addr: *addr, Handler: mux, ReadHeaderTimeout: 10 * time.Second}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		host := *addr
		if strings.HasPrefix(host, ":") {
			host = "localhost" + host
		}
		log.Printf("nifi listening on http://%s%s/", host, eng.BasePath())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()
	<-ctx.Done()
	sctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	srv.Shutdown(sctx)
	eng.Close(sctx)
}
