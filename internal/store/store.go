// Package store persists nifi's management state in SQLite: flows, runs,
// chunk checkpoints, bulletins and dead-lettered rows.
package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/model"
)

// ErrNotFound is returned for missing rows.
var ErrNotFound = errors.New("not found")

type Store struct {
	db *sql.DB
}

const schema = `
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, graph TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY, flow_id TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT, finished_at TEXT,
  rows_read INTEGER DEFAULT 0, rows_written INTEGER DEFAULT 0, rows_failed INTEGER DEFAULT 0,
  error TEXT, graph TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS runs_flow ON runs(flow_id, started_at);
CREATE TABLE IF NOT EXISTS chunks (
  run_id TEXT, node_id TEXT, tbl TEXT, seq INTEGER, data TEXT, status TEXT DEFAULT '', rows INTEGER DEFAULT 0,
  PRIMARY KEY (run_id, node_id, tbl, seq));
CREATE TABLE IF NOT EXISTS run_kv (run_id TEXT, key TEXT, value TEXT, PRIMARY KEY (run_id, key));
CREATE TABLE IF NOT EXISTS flow_kv (flow_id TEXT, key TEXT, value TEXT, PRIMARY KEY (flow_id, key));
CREATE TABLE IF NOT EXISTS connections (
	id TEXT PRIMARY KEY, name TEXT, driver TEXT, host TEXT, port INTEGER,
	username TEXT, password TEXT, dbname TEXT, params TEXT, description TEXT,
	max_conns INTEGER, updated_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS bulletins (
  run_id TEXT, seq INTEGER, time TEXT, level TEXT, node_id TEXT, tbl TEXT, message TEXT, PRIMARY KEY (run_id, seq));
CREATE TABLE IF NOT EXISTS deadletters (
  id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT, node_id TEXT, tbl TEXT, error TEXT, row TEXT, time TEXT);
CREATE INDEX IF NOT EXISTS deadletters_run ON deadletters(run_id, tbl);
CREATE TABLE IF NOT EXISTS flow_versions (
  flow_id TEXT, version INTEGER, name TEXT, description TEXT, graph TEXT, depends TEXT,
  saved_at TEXT, actor TEXT, note TEXT, PRIMARY KEY (flow_id, version));
CREATE TABLE IF NOT EXISTS parameters (
  name TEXT PRIMARY KEY, value TEXT, description TEXT, sensitive INTEGER DEFAULT 0, updated_at TEXT);
`

// Open opens (creating if needed) the SQLite file at path.
func Open(path string) (*Store, error) {
	dsn := "file:" + path + "?_pragma=journal_mode(WAL)&_pragma=busy_timeout(10000)&_pragma=synchronous(NORMAL)&_pragma=foreign_keys(ON)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	// One connection serializes writers; the management workload is small.
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("init sqlite schema: %w", err)
	}
	// Additive migrations for stores created by earlier versions.
	for _, q := range []string{
		`ALTER TABLE flows ADD COLUMN depends TEXT`,
		`ALTER TABLE flows ADD COLUMN schedule TEXT`,
		`ALTER TABLE flows ADD COLUMN schedule_on INTEGER DEFAULT 0`,
		`ALTER TABLE flows ADD COLUMN last_fire TEXT`,
		`ALTER TABLE flows ADD COLUMN folder TEXT`,
		`ALTER TABLE flows ADD COLUMN version INTEGER DEFAULT 0`,
	} {
		if _, err := db.Exec(q); err != nil && !strings.Contains(err.Error(), "duplicate column") {
			db.Close()
			return nil, fmt.Errorf("migrate sqlite schema: %w", err)
		}
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

// NewID returns a random 16-hex-char identifier.
func NewID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func ts(t time.Time) string { return t.UTC().Format(time.RFC3339Nano) }

// optTS is parseTS for a column that may hold no time at all.
func optTS(s sql.NullString) *time.Time {
	if t := parseTS(s); !t.IsZero() {
		return &t
	}
	return nil
}

func parseTS(s sql.NullString) time.Time {
	if !s.Valid {
		return time.Time{}
	}
	t, _ := time.Parse(time.RFC3339Nano, s.String)
	return t
}

// ---- flows ----

func (s *Store) ListFlows(ctx context.Context) ([]model.Flow, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, description, depends, schedule, schedule_on, last_fire, folder, version, created_at, updated_at FROM flows ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []model.Flow{}
	for rows.Next() {
		var f model.Flow
		var desc, deps, sched, fire, folder, ca, ua sql.NullString
		var on sql.NullBool
		var ver sql.NullInt64
		if err := rows.Scan(&f.ID, &f.Name, &desc, &deps, &sched, &on, &fire, &folder, &ver, &ca, &ua); err != nil {
			return nil, err
		}
		f.Folder, f.Version = folder.String, int(ver.Int64)
		f.Description, f.CreatedAt, f.UpdatedAt = desc.String, parseTS(ca), parseTS(ua)
		f.Schedule, f.ScheduleEnabled, f.LastFire = sched.String, on.Bool, optTS(fire)
		f.DependsOn = decodeDeps(deps)
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *Store) GetFlow(ctx context.Context, id string) (model.Flow, error) {
	var f model.Flow
	var desc, graph, deps, sched, fire, folder, ca, ua sql.NullString
	var on sql.NullBool
	var ver sql.NullInt64
	err := s.db.QueryRowContext(ctx, `SELECT id, name, description, graph, depends, schedule, schedule_on, last_fire, folder, version, created_at, updated_at FROM flows WHERE id=?`, id).
		Scan(&f.ID, &f.Name, &desc, &graph, &deps, &sched, &on, &fire, &folder, &ver, &ca, &ua)
	if errors.Is(err, sql.ErrNoRows) {
		return f, ErrNotFound
	}
	if err != nil {
		return f, err
	}
	f.Description, f.CreatedAt, f.UpdatedAt = desc.String, parseTS(ca), parseTS(ua)
	f.Schedule, f.ScheduleEnabled, f.LastFire = sched.String, on.Bool, optTS(fire)
	f.Folder, f.Version = folder.String, int(ver.Int64)
	f.DependsOn = decodeDeps(deps)
	f.Graph = &model.Graph{Nodes: []model.Node{}, Edges: []model.Edge{}}
	if graph.String != "" {
		if err := json.Unmarshal([]byte(graph.String), f.Graph); err != nil {
			return f, fmt.Errorf("decode flow graph: %w", err)
		}
	}
	return f, nil
}

func (s *Store) SaveFlow(ctx context.Context, f model.Flow) (model.Flow, error) {
	now := time.Now().UTC()
	if f.Graph == nil {
		f.Graph = &model.Graph{Nodes: []model.Node{}, Edges: []model.Edge{}}
	}
	g, err := json.Marshal(f.Graph)
	if err != nil {
		return f, err
	}
	f.UpdatedAt = now
	if f.DependsOn == nil {
		f.DependsOn = []string{}
	}
	deps, _ := json.Marshal(f.DependsOn)
	if f.ID == "" {
		f.ID = NewID()
		f.CreatedAt = now
		f.Version = 1
		_, err = s.db.ExecContext(ctx, `INSERT INTO flows (id, name, description, graph, depends, folder, version, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
			f.ID, f.Name, f.Description, string(g), string(deps), f.Folder, f.Version, ts(now), ts(now))
		if err == nil {
			s.addVersion(ctx, f, string(g), string(deps), now)
		}
		return f, err
	}
	f.Version++
	res, err := s.db.ExecContext(ctx, `UPDATE flows SET name=?, description=?, graph=?, depends=?, folder=?, version=?, updated_at=? WHERE id=?`,
		f.Name, f.Description, string(g), string(deps), f.Folder, f.Version, ts(now), f.ID)
	if err != nil {
		return f, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return f, ErrNotFound
	}
	s.addVersion(ctx, f, string(g), string(deps), now)
	return f, nil
}

// addVersion keeps the last historyKeep edits of a flow so they can be
// compared and restored.
const historyKeep = 50

func (s *Store) addVersion(ctx context.Context, f model.Flow, graph, deps string, at time.Time) {
	s.db.ExecContext(ctx, `INSERT OR REPLACE INTO flow_versions (flow_id, version, name, description, graph, depends, saved_at, actor, note)
		VALUES (?,?,?,?,?,?,?,?,?)`, f.ID, f.Version, f.Name, f.Description, graph, deps, ts(at), f.Actor, f.Note)
	s.db.ExecContext(ctx, `DELETE FROM flow_versions WHERE flow_id=? AND version <= ?`, f.ID, f.Version-historyKeep)
}

// ListVersions returns a flow's saved edits, newest first (without graphs).
func (s *Store) ListVersions(ctx context.Context, flowID string) ([]model.FlowVersion, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT version, name, description, saved_at, actor, note,
		(SELECT COUNT(*) FROM flow_versions v2 WHERE v2.flow_id=v.flow_id) FROM flow_versions v WHERE flow_id=? ORDER BY version DESC`, flowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []model.FlowVersion{}
	for rows.Next() {
		var v model.FlowVersion
		var desc, actor, note, at sql.NullString
		var total int
		if err := rows.Scan(&v.Version, &v.Name, &desc, &at, &actor, &note, &total); err != nil {
			return nil, err
		}
		v.FlowID, v.Description, v.SavedAt, v.Actor, v.Note = flowID, desc.String, parseTS(at), actor.String, note.String
		out = append(out, v)
	}
	return out, rows.Err()
}

// GetVersion returns one saved edit, graph included.
func (s *Store) GetVersion(ctx context.Context, flowID string, version int) (model.FlowVersion, error) {
	var v model.FlowVersion
	var desc, graph, deps, actor, note, at sql.NullString
	err := s.db.QueryRowContext(ctx, `SELECT version, name, description, graph, depends, saved_at, actor, note
		FROM flow_versions WHERE flow_id=? AND version=?`, flowID, version).
		Scan(&v.Version, &v.Name, &desc, &graph, &deps, &at, &actor, &note)
	if errors.Is(err, sql.ErrNoRows) {
		return v, ErrNotFound
	}
	if err != nil {
		return v, err
	}
	v.FlowID, v.Description, v.SavedAt, v.Actor, v.Note = flowID, desc.String, parseTS(at), actor.String, note.String
	v.DependsOn = decodeDeps(deps)
	v.Graph = &model.Graph{Nodes: []model.Node{}, Edges: []model.Edge{}}
	if graph.String != "" {
		if err := json.Unmarshal([]byte(graph.String), v.Graph); err != nil {
			return v, fmt.Errorf("decode version graph: %w", err)
		}
	}
	return v, nil
}

// SetFolder moves flows into a folder ("" = none).
func (s *Store) SetFolder(ctx context.Context, ids []string, folder string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, id := range ids {
		if _, err := tx.ExecContext(ctx, `UPDATE flows SET folder=? WHERE id=?`, folder, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// CreateFlowWithID inserts a flow under a caller-chosen id (seeded flows keep
// stable ids across machines).
func (s *Store) CreateFlowWithID(ctx context.Context, f model.Flow) (model.Flow, error) {
	now := time.Now().UTC()
	if f.Graph == nil {
		f.Graph = &model.Graph{Nodes: []model.Node{}, Edges: []model.Edge{}}
	}
	if f.DependsOn == nil {
		f.DependsOn = []string{}
	}
	g, err := json.Marshal(f.Graph)
	if err != nil {
		return f, err
	}
	deps, _ := json.Marshal(f.DependsOn)
	f.CreatedAt, f.UpdatedAt = now, now
	f.Version = 1
	_, err = s.db.ExecContext(ctx, `INSERT INTO flows (id, name, description, graph, depends, folder, version, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
		f.ID, f.Name, f.Description, string(g), string(deps), f.Folder, f.Version, ts(now), ts(now))
	if err == nil {
		s.addVersion(ctx, f, string(g), string(deps), now)
	}
	return f, err
}

func (s *Store) DeleteFlow(ctx context.Context, id string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, q := range []string{
		`DELETE FROM chunks WHERE run_id IN (SELECT id FROM runs WHERE flow_id=?)`,
		`DELETE FROM run_kv WHERE run_id IN (SELECT id FROM runs WHERE flow_id=?)`,
		`DELETE FROM bulletins WHERE run_id IN (SELECT id FROM runs WHERE flow_id=?)`,
		`DELETE FROM deadletters WHERE run_id IN (SELECT id FROM runs WHERE flow_id=?)`,
		`DELETE FROM runs WHERE flow_id=?`,
		`DELETE FROM flow_versions WHERE flow_id=?`,
		`DELETE FROM flow_kv WHERE flow_id=?`,
		`DELETE FROM flows WHERE id=?`,
	} {
		if _, err := tx.ExecContext(ctx, q, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func decodeDeps(s sql.NullString) []string {
	out := []string{}
	if s.String != "" {
		json.Unmarshal([]byte(s.String), &out)
	}
	return out
}

// ---- runs ----

const runCols = `id, flow_id, status, started_at, finished_at, rows_read, rows_written, rows_failed, error`

func scanRun(sc interface{ Scan(...any) error }) (model.RunSummary, error) {
	var r model.RunSummary
	var sa, fa, e sql.NullString
	if err := sc.Scan(&r.ID, &r.FlowID, &r.Status, &sa, &fa, &r.RowsRead, &r.RowsWritten, &r.RowsFailed, &e); err != nil {
		return r, err
	}
	r.StartedAt, r.Error = parseTS(sa), e.String
	if fa.Valid && fa.String != "" {
		t := parseTS(fa)
		r.FinishedAt = &t
	}
	return r, nil
}

func (s *Store) CreateRun(ctx context.Context, flowID string, g *model.Graph) (model.RunSummary, error) {
	r := model.RunSummary{ID: NewID(), FlowID: flowID, Status: model.RunPending, StartedAt: time.Now().UTC()}
	gj, _ := json.Marshal(g)
	_, err := s.db.ExecContext(ctx, `INSERT INTO runs (id, flow_id, status, started_at, graph) VALUES (?,?,?,?,?)`,
		r.ID, r.FlowID, r.Status, ts(r.StartedAt), string(gj))
	return r, err
}

func (s *Store) RunGraph(ctx context.Context, id string) (*model.Graph, error) {
	var gj sql.NullString
	if err := s.db.QueryRowContext(ctx, `SELECT graph FROM runs WHERE id=?`, id).Scan(&gj); err != nil {
		return nil, err
	}
	g := &model.Graph{}
	return g, json.Unmarshal([]byte(gj.String), g)
}

// UpdateRun persists status, counters and the latest detail snapshot.
func (s *Store) UpdateRun(ctx context.Context, r model.RunSummary, detail *model.RunDetail) error {
	var fa any
	if r.FinishedAt != nil {
		fa = ts(*r.FinishedAt)
	}
	var dj any
	if detail != nil {
		b, _ := json.Marshal(detail)
		dj = string(b)
	}
	_, err := s.db.ExecContext(ctx, `UPDATE runs SET status=?, started_at=?, finished_at=?, rows_read=?, rows_written=?, rows_failed=?, error=?,
		detail=COALESCE(?, detail) WHERE id=?`,
		r.Status, ts(r.StartedAt), fa, r.RowsRead, r.RowsWritten, r.RowsFailed, r.Error, dj, r.ID)
	return err
}

func (s *Store) GetRun(ctx context.Context, id string) (model.RunSummary, error) {
	r, err := scanRun(s.db.QueryRowContext(ctx, `SELECT `+runCols+` FROM runs WHERE id=?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return r, ErrNotFound
	}
	return r, err
}

// RunDetail returns the last persisted detail snapshot.
func (s *Store) RunDetail(ctx context.Context, id string) (*model.RunDetail, error) {
	var dj sql.NullString
	if err := s.db.QueryRowContext(ctx, `SELECT detail FROM runs WHERE id=?`, id).Scan(&dj); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	d := &model.RunDetail{}
	if dj.String != "" {
		json.Unmarshal([]byte(dj.String), d)
	}
	return d, nil
}

func (s *Store) ListRuns(ctx context.Context, flowID string, limit int) ([]model.RunSummary, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT `+runCols+` FROM runs WHERE flow_id=? ORDER BY started_at DESC LIMIT ?`, flowID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []model.RunSummary{}
	for rows.Next() {
		r, err := scanRun(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// MarkInterrupted flips runs left running by a crashed process to stopped so
// they can be resumed.
func (s *Store) MarkInterrupted(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `UPDATE runs SET status='stopped', error='interrupted: process exited during the run', finished_at=?
		WHERE status IN ('pending','running','paused','stopping')`, ts(time.Now()))
	return err
}

// ---- chunks ----

// SaveChunks persists a chunk plan (idempotent on seq).
func (s *Store) SaveChunks(ctx context.Context, runID, nodeID, table string, chunks []model.Chunk) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	st, err := tx.PrepareContext(ctx, `INSERT OR IGNORE INTO chunks (run_id, node_id, tbl, seq, data, status, rows) VALUES (?,?,?,?,?,?,?)`)
	if err != nil {
		return err
	}
	defer st.Close()
	for _, c := range chunks {
		d, _ := json.Marshal(c)
		if _, err := st.ExecContext(ctx, runID, nodeID, table, c.Seq, string(d), c.Status, c.Rows); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) LoadChunks(ctx context.Context, runID, nodeID, table string) ([]model.Chunk, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT data, status, rows FROM chunks WHERE run_id=? AND node_id=? AND tbl=? ORDER BY seq`, runID, nodeID, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []model.Chunk
	for rows.Next() {
		var d, st string
		var n int64
		if err := rows.Scan(&d, &st, &n); err != nil {
			return nil, err
		}
		var c model.Chunk
		json.Unmarshal([]byte(d), &c)
		c.Status, c.Rows = st, n
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) ChunkDone(ctx context.Context, runID, nodeID, table string, c model.Chunk) error {
	d, _ := json.Marshal(c)
	_, err := s.db.ExecContext(ctx, `INSERT INTO chunks (run_id, node_id, tbl, seq, data, status, rows) VALUES (?,?,?,?,?,'done',?)
		ON CONFLICT (run_id, node_id, tbl, seq) DO UPDATE SET data=excluded.data, status='done', rows=excluded.rows`,
		runID, nodeID, table, c.Seq, string(d), c.Rows)
	return err
}

// ---- key/value run state ----

func (s *Store) SetKV(ctx context.Context, runID, key, value string) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO run_kv (run_id, key, value) VALUES (?,?,?)
		ON CONFLICT (run_id, key) DO UPDATE SET value=excluded.value`, runID, key, value)
	return err
}

func (s *Store) GetKV(ctx context.Context, runID, key string) (string, bool) {
	var v string
	err := s.db.QueryRowContext(ctx, `SELECT value FROM run_kv WHERE run_id=? AND key=?`, runID, key).Scan(&v)
	return v, err == nil
}

// SetFlowKV remembers a value for a flow. Unlike run_kv this outlives the run
// that wrote it, which is what a change feed's position needs: the next run of
// the flow carries on where the last one stopped.
func (s *Store) SetFlowKV(ctx context.Context, flowID, key, value string) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO flow_kv (flow_id, key, value) VALUES (?,?,?)
		ON CONFLICT (flow_id, key) DO UPDATE SET value=excluded.value`, flowID, key, value)
	return err
}

func (s *Store) GetFlowKV(ctx context.Context, flowID, key string) (string, bool) {
	var v string
	err := s.db.QueryRowContext(ctx, `SELECT value FROM flow_kv WHERE flow_id=? AND key=?`, flowID, key).Scan(&v)
	return v, err == nil
}

// ClearFlowKV forgets every value a flow remembered (used when a flow is
// deleted, and to make a change feed start over).
func (s *Store) ClearFlowKV(ctx context.Context, flowID string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM flow_kv WHERE flow_id=?`, flowID)
	return err
}

// ---- connections ----
//
// A connection the host declared in code is authoritative and lives nowhere
// but its Config. These are the ones somebody added here instead, kept so the
// tool can be pointed at a database without a redeploy. The password is
// written but never read back out of the API — dbx.Connection keeps it out of
// JSON, and nothing here puts it in.

// ListConnections returns the stored connections, ordered by name.
func (s *Store) ListConnections(ctx context.Context) ([]dbx.Connection, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, driver, host, port, username, password,
		dbname, params, description, max_conns FROM connections ORDER BY name, id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []dbx.Connection
	for rows.Next() {
		c, err := scanConnection(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// GetConnection returns one stored connection, ErrNotFound when there is none.
func (s *Store) GetConnection(ctx context.Context, id string) (dbx.Connection, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, name, driver, host, port, username, password,
		dbname, params, description, max_conns FROM connections WHERE id=?`, id)
	c, err := scanConnection(row)
	if errors.Is(err, sql.ErrNoRows) {
		return dbx.Connection{}, fmt.Errorf("%w: connection %q", ErrNotFound, id)
	}
	return c, err
}

type scanner interface{ Scan(...any) error }

func scanConnection(r scanner) (dbx.Connection, error) {
	var c dbx.Connection
	var params, name, host, user, pw, dbname, desc sql.NullString
	var port, maxConns sql.NullInt64
	if err := r.Scan(&c.ID, &name, &c.Driver, &host, &port, &user, &pw, &dbname, &params, &desc, &maxConns); err != nil {
		return dbx.Connection{}, err
	}
	c.Name, c.Host, c.User, c.Password = name.String, host.String, user.String, pw.String
	c.Database, c.Description = dbname.String, desc.String
	c.Port, c.MaxConns = int(port.Int64), int(maxConns.Int64)
	if params.String != "" {
		_ = json.Unmarshal([]byte(params.String), &c.Params)
	}
	return c, nil
}

// SaveConnection creates or replaces a stored connection. An empty password
// on an existing one keeps the password already stored, so an edit that does
// not mean to change it cannot blank it by omission.
func (s *Store) SaveConnection(ctx context.Context, c dbx.Connection) error {
	if c.Password == "" {
		if old, err := s.GetConnection(ctx, c.ID); err == nil {
			c.Password = old.Password
		}
	}
	params := ""
	if len(c.Params) > 0 {
		b, err := json.Marshal(c.Params)
		if err != nil {
			return err
		}
		params = string(b)
	}
	_, err := s.db.ExecContext(ctx, `INSERT INTO connections
		(id, name, driver, host, port, username, password, dbname, params, description, max_conns, updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
		ON CONFLICT (id) DO UPDATE SET name=excluded.name, driver=excluded.driver, host=excluded.host,
			port=excluded.port, username=excluded.username, password=excluded.password, dbname=excluded.dbname,
			params=excluded.params, description=excluded.description, max_conns=excluded.max_conns,
			updated_at=excluded.updated_at`,
		c.ID, c.Name, c.Driver, c.Host, c.Port, c.User, c.Password, c.Database, params, c.Description,
		c.MaxConns, time.Now().UTC())
	return err
}

func (s *Store) DeleteConnection(ctx context.Context, id string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM connections WHERE id=?`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("%w: connection %q", ErrNotFound, id)
	}
	return nil
}

// ---- bulletins ----

func (s *Store) AddBulletin(ctx context.Context, runID string, b model.Bulletin) error {
	_, err := s.db.ExecContext(ctx, `INSERT OR REPLACE INTO bulletins (run_id, seq, time, level, node_id, tbl, message) VALUES (?,?,?,?,?,?,?)`,
		runID, b.Seq, ts(b.Time), b.Level, b.NodeID, b.Table, b.Message)
	return err
}

func (s *Store) MaxBulletinSeq(ctx context.Context, runID string) int64 {
	var n sql.NullInt64
	s.db.QueryRowContext(ctx, `SELECT MAX(seq) FROM bulletins WHERE run_id=?`, runID).Scan(&n)
	return n.Int64
}

func (s *Store) ListBulletins(ctx context.Context, runID string, after int64, limit int) ([]model.Bulletin, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT seq, time, level, node_id, tbl, message FROM bulletins WHERE run_id=? AND seq>? ORDER BY seq LIMIT ?`,
		runID, after, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []model.Bulletin{}
	for rows.Next() {
		var b model.Bulletin
		var t, n, tb sql.NullString
		if err := rows.Scan(&b.Seq, &t, &b.Level, &n, &tb, &b.Message); err != nil {
			return nil, err
		}
		b.Time, b.NodeID, b.Table = parseTS(t), n.String, tb.String
		out = append(out, b)
	}
	return out, rows.Err()
}

// ---- dead letters ----

func (s *Store) AddDeadLetters(ctx context.Context, runID string, items []model.DeadLetter) error {
	if len(items) == 0 {
		return nil
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	st, err := tx.PrepareContext(ctx, `INSERT INTO deadletters (run_id, node_id, tbl, error, row, time) VALUES (?,?,?,?,?,?)`)
	if err != nil {
		return err
	}
	defer st.Close()
	for _, d := range items {
		row, err := json.Marshal(d.Row)
		if err != nil {
			row, _ = json.Marshal(map[string]string{"_unserializable": fmt.Sprint(d.Row)})
		}
		if _, err := st.ExecContext(ctx, runID, d.NodeID, d.Table, d.Error, string(row), ts(d.Time)); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) ListDeadLetters(ctx context.Context, runID, table string, offset, limit int) (int64, []model.DeadLetter, error) {
	where := `run_id=?`
	args := []any{runID}
	if table != "" {
		where += ` AND tbl=?`
		args = append(args, table)
	}
	var total int64
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM deadletters WHERE `+where, args...).Scan(&total); err != nil {
		return 0, nil, err
	}
	rows, err := s.db.QueryContext(ctx, `SELECT id, node_id, tbl, error, row, time FROM deadletters WHERE `+where+` ORDER BY id LIMIT ? OFFSET ?`,
		append(args, limit, offset)...)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	out := []model.DeadLetter{}
	for rows.Next() {
		var d model.DeadLetter
		var row, t sql.NullString
		if err := rows.Scan(&d.ID, &d.NodeID, &d.Table, &d.Error, &row, &t); err != nil {
			return 0, nil, err
		}
		json.Unmarshal([]byte(row.String), &d.Row)
		d.Time = parseTS(t)
		out = append(out, d)
	}
	return total, out, rows.Err()
}

// ---- schedules & parameters ----

// SetSchedule stores a flow's schedule. An empty expression clears it.
// Switching a schedule on counts as a fire, so the first run is the next
// time after now rather than the first one missed since the flow was saved.
func (s *Store) SetSchedule(ctx context.Context, id, spec string, enabled bool) error {
	q, args := `UPDATE flows SET schedule=?, schedule_on=? WHERE id=?`, []any{spec, enabled, id}
	if enabled {
		q = `UPDATE flows SET schedule=?, schedule_on=?, last_fire=? WHERE id=?`
		args = []any{spec, enabled, ts(time.Now()), id}
	}
	res, err := s.db.ExecContext(ctx, q, args...)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// MarkFired records that the scheduler started a run for this flow.
func (s *Store) MarkFired(ctx context.Context, id string, at time.Time) error {
	_, err := s.db.ExecContext(ctx, `UPDATE flows SET last_fire=? WHERE id=?`, ts(at), id)
	return err
}

// ListParameters returns every stored parameter, sorted by name.
func (s *Store) ListParameters(ctx context.Context) ([]model.Parameter, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT name, value, description, sensitive, updated_at FROM parameters ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []model.Parameter{}
	for rows.Next() {
		var p model.Parameter
		var desc, ua sql.NullString
		if err := rows.Scan(&p.Name, &p.Value, &desc, &p.Sensitive, &ua); err != nil {
			return nil, err
		}
		p.Description, p.UpdatedAt = desc.String, parseTS(ua)
		out = append(out, p)
	}
	return out, rows.Err()
}

// SaveParameter inserts or updates one parameter.
func (s *Store) SaveParameter(ctx context.Context, p model.Parameter) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO parameters (name, value, description, sensitive, updated_at) VALUES (?,?,?,?,?)
		 ON CONFLICT(name) DO UPDATE SET value=excluded.value, description=excluded.description,
		   sensitive=excluded.sensitive, updated_at=excluded.updated_at`,
		p.Name, p.Value, p.Description, p.Sensitive, ts(time.Now()))
	return err
}

// DeleteParameter removes one parameter.
func (s *Store) DeleteParameter(ctx context.Context, name string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM parameters WHERE name=?`, name)
	return err
}
