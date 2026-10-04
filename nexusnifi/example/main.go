// Example: nifi mounted inside a nexus app under a module prefix.
package main

import (
	"os"

	"github.com/paulmanoni/nexus/v2"
	"github.com/paulmanoni/nexus/v2/config"

	"github.com/paulmanoni/nifi"
	"github.com/paulmanoni/nifi/nexusnifi"
)

func main() {
	nexus.Run(config.Runtime{Server: config.Server{Addr: ":8091"}},
		nexus.Module("admin", append([]nexus.Option{nexus.Path("/admin")},
			nexusnifi.Routes(nexusnifi.Config{
				Path: "/flows",
				Engine: nifi.Config{DataPath: "nifi-example.db", Connections: []nifi.Connection{
					{ID: "main", Driver: "postgres", Host: "localhost", User: "postgres", Password: os.Getenv("PG_PASSWORD"), Database: "postgres"},
				}},
			})...)...,
		),
	)
}
