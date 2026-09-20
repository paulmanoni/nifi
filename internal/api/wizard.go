package api

import (
	"net/http"
	"strings"

	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
)

type wizardBody struct {
	Name               string   `json:"name"`
	SourceConnectionID string   `json:"sourceConnectionId"`
	TargetConnectionID string   `json:"targetConnectionId"`
	Tables             []string `json:"tables"`
	TargetSchema       string   `json:"targetSchema"`
	Mode               string   `json:"mode"`
	CreateTables       *bool    `json:"createTables"`
	Truncate           bool     `json:"truncate"`
}

// wizard builds a ready-to-run whole-database migration flow.
func (s *Server) wizard(_ http.ResponseWriter, r *http.Request) (any, error) {
	var b wizardBody
	if err := decode(r, &b); err != nil {
		return nil, err
	}
	if b.SourceConnectionID == "" || b.TargetConnectionID == "" {
		return nil, badRequest("source and target connections are required")
	}
	src, err := s.Resolve(r.Context(), b.SourceConnectionID)
	if err != nil {
		return nil, err
	}
	tgt, err := s.Resolve(r.Context(), b.TargetConnectionID)
	if err != nil {
		return nil, err
	}
	if tgt.Driver != "postgres" {
		return nil, badRequest("the target must be a PostgreSQL connection")
	}
	if b.Name = strings.TrimSpace(b.Name); b.Name == "" {
		b.Name = src.Name + " → " + tgt.Name
	}
	if b.TargetSchema == "" {
		b.TargetSchema = "public"
	}
	if b.Mode == "" {
		b.Mode = "merge"
	}
	create := b.CreateTables == nil || *b.CreateTables
	nameCase := "preserve"
	if src.Driver == "mysql" {
		nameCase = "lower"
	}
	truncate := "none"
	if b.Truncate {
		truncate = "truncate"
	}
	tables := make([]any, len(b.Tables))
	for i, t := range b.Tables {
		tables[i] = t
	}
	srcID, sinkID := store.NewID(), store.NewID()
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: srcID, Type: "source.tables", Name: "Read " + src.Name, Position: model.Position{X: 80, Y: 160},
				Concurrency: 4, Config: map[string]any{"connection": src.ID, "tables": tables, "chunk_rows": float64(100000), "batch_rows": float64(5000)}},
			{ID: sinkID, Type: "sink.postgres", Name: "Write " + tgt.Name, Position: model.Position{X: 560, Y: 160},
				Concurrency: 4, Config: map[string]any{"connection": tgt.ID, "schema": b.TargetSchema, "mode": b.Mode,
					"create_tables": create, "truncate": truncate, "name_case": nameCase}},
		},
		Edges: []model.Edge{{ID: store.NewID(), From: srcID, FromPort: "success", To: sinkID}},
	}
	return s.Store.SaveFlow(r.Context(), model.Flow{Name: b.Name,
		Description: "Migrates " + src.Name + " (" + src.Driver + ") into " + tgt.Name + " (PostgreSQL).", Graph: g})
}
