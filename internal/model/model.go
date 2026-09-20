// Package model holds the persisted and wire shapes shared by the store, the
// executor and the HTTP API.
package model

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/paulmanoni/nifi/record"
)

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Node struct {
	ID          string         `json:"id"`
	Type        string         `json:"type"`
	Name        string         `json:"name"`
	Position    Position       `json:"position"`
	Config      map[string]any `json:"config"`
	Concurrency int            `json:"concurrency,omitempty"`
	Disabled    bool           `json:"disabled,omitempty"`
	Notes       string         `json:"notes,omitempty"`
}

type Edge struct {
	ID               string `json:"id"`
	From             string `json:"from"`
	FromPort         string `json:"fromPort"`
	To               string `json:"to"`
	BackPressureRows int    `json:"backPressureRows,omitempty"`
	// Tables, when set, limits this connection to those tables: other
	// tables do not travel along it (routing tables of one source to
	// different branches). Empty = every table.
	Tables []string `json:"tables,omitempty"`
	// Retries is how often a batch arriving here is tried again when the
	// destination fails on it (0 = fail the run on the first error).
	Retries int `json:"retries,omitempty"`
	// RetryBackoff is the wait before the first retry ("2s"), doubling each
	// time. Default 2s.
	RetryBackoff string `json:"retryBackoff,omitempty"`
	// OnFailure decides what happens when the retries are used up:
	// "fail" (default) stops the run, "dead_letter" keeps the run going and
	// sends the batch's rows to dead letters.
	OnFailure string `json:"onFailure,omitempty"`
}

// Carries reports whether a batch of table travels along the edge.
func (e *Edge) Carries(table string) bool {
	if len(e.Tables) == 0 {
		return true
	}
	for _, t := range e.Tables {
		if strings.EqualFold(t, table) {
			return true
		}
	}
	return false
}

type Graph struct {
	Nodes    []Node          `json:"nodes"`
	Edges    []Edge          `json:"edges"`
	Viewport json.RawMessage `json:"viewport,omitempty"`
}

// Node returns the node with id, or nil.
func (g *Graph) Node(id string) *Node {
	for i := range g.Nodes {
		if g.Nodes[i].ID == id {
			return &g.Nodes[i]
		}
	}
	return nil
}

type Flow struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Graph       *Graph `json:"graph"`
	// DependsOn lists flows that must complete before this one runs.
	DependsOn []string `json:"dependsOn"`
	// Schedule is a cron expression or shorthand ("0 2 * * *", "@every 30m");
	// it runs only while ScheduleEnabled.
	Schedule        string `json:"schedule,omitempty"`
	ScheduleEnabled bool   `json:"scheduleEnabled,omitempty"`
	// LastFire is when the scheduler last started this flow.
	LastFire *time.Time `json:"lastFire,omitempty"`
	// NextRun is when the schedule fires next (computed, not stored).
	NextRun *time.Time `json:"nextRun,omitempty"`
	// Folder groups flows in the list ("" = ungrouped); nested with "/".
	Folder string `json:"folder,omitempty"`
	// Version counts saved edits; each one is kept in the flow's history.
	Version int `json:"version,omitempty"`
	// Actor and Note describe the edit being saved (history only).
	Actor     string      `json:"actor,omitempty"`
	Note      string      `json:"note,omitempty"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	LastRun   *RunSummary `json:"lastRun,omitempty"`
}

// FlowVersion is one saved edit of a flow.
type FlowVersion struct {
	FlowID      string    `json:"flowId"`
	Version     int       `json:"version"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	DependsOn   []string  `json:"dependsOn,omitempty"`
	Graph       *Graph    `json:"graph,omitempty"`
	SavedAt     time.Time `json:"savedAt"`
	Actor       string    `json:"actor,omitempty"`
	Note        string    `json:"note,omitempty"`
}

// Parameter is a named value node settings refer to as #{name}.
type Parameter struct {
	Name        string `json:"name"`
	Value       string `json:"value"`
	Description string `json:"description,omitempty"`
	// Sensitive keeps the value out of every API response.
	Sensitive bool      `json:"sensitive,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
	// Fixed marks a parameter that comes from the application's own
	// configuration and cannot be edited here.
	Fixed bool `json:"fixed,omitempty"`
}

type RunStatus string

const (
	RunPending   RunStatus = "pending"
	RunRunning   RunStatus = "running"
	RunPaused    RunStatus = "paused"
	RunStopping  RunStatus = "stopping"
	RunStopped   RunStatus = "stopped"
	RunCompleted RunStatus = "completed"
	RunFailed    RunStatus = "failed"
)

// Finished reports a terminal status.
func (s RunStatus) Finished() bool {
	return s == RunStopped || s == RunCompleted || s == RunFailed
}

type RunSummary struct {
	ID          string     `json:"id"`
	FlowID      string     `json:"flowId"`
	Status      RunStatus  `json:"status"`
	StartedAt   time.Time  `json:"startedAt"`
	FinishedAt  *time.Time `json:"finishedAt,omitempty"`
	RowsRead    int64      `json:"rowsRead"`
	RowsWritten int64      `json:"rowsWritten"`
	RowsFailed  int64      `json:"rowsFailed"`
	Error       string     `json:"error,omitempty"`
	// Live marks a run that follows its source instead of reading it once: it
	// keeps going, and ends only when it is stopped.
	Live bool `json:"live,omitempty"`
}

type NodeStats struct {
	NodeID     string  `json:"nodeId"`
	RowsIn     int64   `json:"rowsIn"`
	RowsOut    int64   `json:"rowsOut"`
	BatchesIn  int64   `json:"batchesIn"`
	Errors     int64   `json:"errors"`
	RowsPerSec float64 `json:"rowsPerSec"`
	Active     int64   `json:"active"`
}

type EdgeStats struct {
	EdgeID       string `json:"edgeId"`
	QueuedRows   int64  `json:"queuedRows"`
	CapacityRows int64  `json:"capacityRows"`
	RowsPassed   int64  `json:"rowsPassed"`
	// RowsDropped counts rows discarded by emptying the queue.
	RowsDropped int64 `json:"rowsDropped,omitempty"`
	// Retried counts batches the destination was given another try.
	Retried int64 `json:"retried,omitempty"`
}

// QueueInfo is what one connection holds right now, with a peek at the rows
// waiting in it.
type QueueInfo struct {
	EdgeID       string `json:"edgeId"`
	From         string `json:"from"`
	FromName     string `json:"fromName"`
	FromPort     string `json:"fromPort"`
	To           string `json:"to"`
	ToName       string `json:"toName"`
	QueuedRows   int64  `json:"queuedRows"`
	CapacityRows int64  `json:"capacityRows"`
	RowsPassed   int64  `json:"rowsPassed"`
	RowsDropped  int64  `json:"rowsDropped,omitempty"`
	Retried      int64  `json:"retried,omitempty"`
	Retries      int    `json:"retries,omitempty"`
	OnFailure    string `json:"onFailure,omitempty"`
	// Table, Columns and Rows are a peek at the most recent batch to travel
	// this connection (up to 20 rows).
	Table   string          `json:"table,omitempty"`
	Columns []record.Column `json:"columns,omitempty"`
	Rows    [][]any         `json:"rows,omitempty"`
	SeenAt  *time.Time      `json:"seenAt,omitempty"`
}

type TableProgress struct {
	Table         string `json:"table"`
	Status        string `json:"status"`
	EstimatedRows int64  `json:"estimatedRows"`
	RowsRead      int64  `json:"rowsRead"`
	RowsWritten   int64  `json:"rowsWritten"`
	RowsDeleted   int64  `json:"rowsDeleted,omitempty"`
	RowsFailed    int64  `json:"rowsFailed"`
	ChunksDone    int64  `json:"chunksDone"`
	ChunksTotal   int64  `json:"chunksTotal"`
}

type RunDetail struct {
	RunSummary
	Phase  string          `json:"phase"`
	Nodes  []NodeStats     `json:"nodes"`
	Edges  []EdgeStats     `json:"edges"`
	Tables []TableProgress `json:"tables"`
}

type Bulletin struct {
	Seq     int64     `json:"seq"`
	Time    time.Time `json:"time"`
	Level   string    `json:"level"`
	NodeID  string    `json:"nodeId,omitempty"`
	Table   string    `json:"table,omitempty"`
	Message string    `json:"message"`
}

type DeadLetter struct {
	ID     int64          `json:"id"`
	NodeID string         `json:"nodeId"`
	Table  string         `json:"table"`
	Error  string         `json:"error"`
	Row    map[string]any `json:"row"`
	Time   time.Time      `json:"time"`
}

// Chunk is one planned unit of source reading.
type Chunk struct {
	Seq    int      `json:"seq"`
	Kind   string   `json:"kind"` // range | keyset | full
	Lo     int64    `json:"lo"`
	Hi     int64    `json:"hi"`
	After  []string `json:"after,omitempty"`  // keyset: exclusive start
	Last   []string `json:"last,omitempty"`   // keyset: last key of the page
	Status string   `json:"status,omitempty"` // "" | done
	Rows   int64    `json:"rows"`
}

// Issue is a validation finding.
type Issue struct {
	NodeID  string `json:"nodeId,omitempty"`
	EdgeID  string `json:"edgeId,omitempty"`
	Level   string `json:"level"`
	Message string `json:"message"`
}

// TableSchema is the schema of one table at a point in the flow.
type TableSchema struct {
	Table   string          `json:"table"`
	Columns []record.Column `json:"columns"`
}
