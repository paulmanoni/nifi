package flow_test

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/paulmanoni/nifi/internal/dbx"
	"github.com/paulmanoni/nifi/internal/flow"
	"github.com/paulmanoni/nifi/internal/model"
	"github.com/paulmanoni/nifi/internal/store"
	"github.com/paulmanoni/nifi/record"
)

// Requires NIFI_TEST_PG=1 and a local postgres with databases nifi_src
// (seeded) and nifi_tgt; see testdata/seed_pg.sql.
func setup(t *testing.T) (*store.Store, *flow.Manager, *pgxpool.Pool) {
	if os.Getenv("NIFI_TEST_PG") == "" {
		t.Skip("set NIFI_TEST_PG=1 to run database integration tests")
	}
	ctx := context.Background()
	st, err := store.Open(filepath.Join(t.TempDir(), "nifi.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { st.Close() })
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	if addr := os.Getenv("NIFI_TEST_MYSQL"); addr != "" {
		host, port, _ := strings.Cut(addr, ":")
		p, _ := strconv.Atoi(port)
		conns["legacy"] = dbx.Connection{ID: "legacy", Driver: "mysql", Host: host, Port: p, User: "root", Database: "legacy"}
	}
	resolve := func(ctx context.Context, id string) (dbx.Connection, error) {
		if c, ok := conns[id]; ok {
			return c, nil
		}
		return dbx.Connection{}, store.ErrNotFound
	}
	pool, err := pgxpool.New(ctx, "postgres://postgres@localhost/nifi_tgt?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	if _, err := pool.Exec(ctx, `DROP SCHEMA public CASCADE; CREATE SCHEMA public;
		CREATE TABLE logs (msg varchar(3), at timestamptz)`); err != nil {
		t.Fatal(err)
	}
	return st, flow.NewManager(st, resolve, 100000), pool
}

func graph() *model.Graph {
	return &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Source", Concurrency: 4,
				Config: map[string]any{"connection": "src", "chunk_rows": float64(20000), "batch_rows": float64(2000)}},
			{ID: "cmp", Type: "transform.compute", Name: "Domain", Concurrency: 2,
				Config: map[string]any{"only_tables": "users", "columns": []any{
					map[string]any{"column": "email_domain", "expr": `split(email, "@")[1]`, "type": "text"},
				}}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Concurrency: 4,
				Config: map[string]any{"connection": "tgt", "mode": "merge"}},
		},
		Edges: []model.Edge{
			{ID: "e1", From: "src", FromPort: "success", To: "cmp"},
			{ID: "e2", From: "cmp", FromPort: "success", To: "dst"},
		},
	}
}

func wait(t *testing.T, m *flow.Manager, id string) model.RunDetail {
	t.Helper()
	deadline := time.Now().Add(3 * time.Minute)
	for time.Now().Before(deadline) {
		d, err := m.Detail(context.Background(), id)
		if err != nil {
			t.Fatal(err)
		}
		if d.Status.Finished() {
			return d
		}
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatal("run did not finish")
	return model.RunDetail{}
}

func count(t *testing.T, pool *pgxpool.Pool, q string) int64 {
	t.Helper()
	var n int64
	if err := pool.QueryRow(context.Background(), q).Scan(&n); err != nil {
		t.Fatalf("%s: %v", q, err)
	}
	return n
}

func TestPostgresToPostgres(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	f, err := st.SaveFlow(ctx, model.Flow{Name: "pg", Graph: graph()})
	if err != nil {
		t.Fatal(err)
	}
	if issues := flow.Validate(f.Graph); len(issues) > 0 {
		t.Fatalf("issues: %+v", issues)
	}
	start := time.Now()
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	d := wait(t, m, run.ID)
	t.Logf("run %s in %s: read=%d written=%d failed=%d", d.Status, time.Since(start), d.RowsRead, d.RowsWritten, d.RowsFailed)
	if d.Status != model.RunCompleted {
		bs, _ := st.ListBulletins(ctx, run.ID, 0, 50)
		t.Fatalf("status %s: %s %+v", d.Status, d.Error, bs)
	}
	for q, want := range map[string]int64{
		"SELECT count(*) FROM users":                                            200000,
		"SELECT count(*) FROM users WHERE email_domain = 'x.io'":                200000,
		"SELECT count(*) FROM orders":                                           50000,
		"SELECT count(*) FROM tags":                                             6000,
		"SELECT count(*) FROM logs":                                             99,
		"SELECT count(*) FROM users WHERE name LIKE E'%\\t%\\n%'":               180000,
		"SELECT count(*) FROM users WHERE avatar = decode(md5(id::text),'hex')": 200000,
		"SELECT count(*) FROM users WHERE prefs->>'s' = 'v\"q'":                 200000,
		"SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('users_email_uq','users_created','orders_user')": 3,
		"SELECT count(*) FROM pg_constraint WHERE contype='f' AND convalidated AND connamespace='public'::regnamespace":               1,
		"SELECT count(*) FROM users WHERE tags[1] = 'a' || id":                                                                        200000,
	} {
		if got := count(t, pool, q); got != want {
			t.Errorf("%s = %d, want %d", q, got, want)
		}
	}
	if n := count(t, pool, "SELECT nextval(pg_get_serial_sequence('users','id'))"); n <= 200000 {
		t.Errorf("users sequence not reset: nextval=%d", n)
	}
	total, items, _ := st.ListDeadLetters(ctx, run.ID, "logs", 0, 1)
	if total != 901 || len(items) == 0 || items[0].Row["msg"] == nil {
		t.Errorf("dead letters = %d %+v, want 901 logs rows", total, items)
	}

	// Re-run is idempotent under merge.
	run2, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run2.ID); d.Status != model.RunCompleted {
		t.Fatalf("rerun: %s %s", d.Status, d.Error)
	}
	if got := count(t, pool, "SELECT count(*) FROM users"); got != 200000 {
		t.Errorf("after rerun users = %d", got)
	}
}

func TestStopAndResume(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	g := graph()
	g.Nodes[2].Config["mode"] = "copy"
	g.Nodes[0].Config["tables"] = []any{"users"}
	g.Nodes[0].Concurrency = 1
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "resume", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	for {
		d, _ := m.Detail(ctx, run.ID)
		if d.RowsWritten >= 40000 {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	ex, _ := m.Active(run.ID)
	ex.Stop("test")
	d := wait(t, m, run.ID)
	partial := count(t, pool, "SELECT count(*) FROM users")
	t.Logf("stopped: %s written=%d target=%d", d.Status, d.RowsWritten, partial)
	if d.Status != model.RunStopped || partial >= 200000 {
		t.Fatalf("expected a partial stopped run, got %s with %d rows", d.Status, partial)
	}
	res, err := m.Start(ctx, f.ID, true, "")
	if err != nil {
		t.Fatal(err)
	}
	if res.ID != run.ID {
		t.Fatalf("resume created a new run")
	}
	d = wait(t, m, run.ID)
	if d.Status != model.RunCompleted {
		t.Fatalf("resume: %s %s", d.Status, d.Error)
	}
	if got := count(t, pool, "SELECT count(*) FROM users"); got != 200000 {
		t.Errorf("after resume users = %d, want 200000", got)
	}
	if got := count(t, pool, "SELECT count(DISTINCT id) FROM users"); got != 200000 {
		t.Errorf("duplicate ids after resume")
	}
}

// Requires NIFI_TEST_MYSQL=host:port with testdata/seed_mysql.sql applied
// (root, no password) plus the postgres target used above.
func TestMySQLToPostgres(t *testing.T) {
	addr := os.Getenv("NIFI_TEST_MYSQL")
	if addr == "" {
		t.Skip("set NIFI_TEST_MYSQL=127.0.0.1:3407 to run")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "MySQL", Concurrency: 4,
				Config: map[string]any{"connection": "legacy", "chunk_rows": float64(10000)}},
			{ID: "dst", Type: "sink.postgres", Name: "PG", Concurrency: 4,
				Config: map[string]any{"connection": "tgt", "schema": "legacy_app", "name_case": "snake", "mode": "copy"}},
		},
		Edges: []model.Edge{{ID: "e", From: "src", FromPort: "success", To: "dst"}},
	}
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "mysql", Graph: g})
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS legacy_app CASCADE")
	start := time.Now()
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	d := wait(t, m, run.ID)
	bs, _ := st.ListBulletins(ctx, run.ID, 0, 100)
	for _, b := range bs {
		t.Logf("[%s] %s %s", b.Level, b.Table, b.Message)
	}
	t.Logf("run %s in %s: read=%d written=%d failed=%d", d.Status, time.Since(start), d.RowsRead, d.RowsWritten, d.RowsFailed)
	if d.Status != model.RunCompleted {
		t.Fatalf("status %s: %s", d.Status, d.Error)
	}
	for q, want := range map[string]int64{
		"SELECT count(*) FROM legacy_app.employees":                                                                                                        100001,
		"SELECT count(*) FROM legacy_app.departments":                                                                                                      3,
		"SELECT count(*) FROM legacy_app.translations":                                                                                                     10000,
		"SELECT count(*) FROM legacy_app.audit_log WHERE at IS NULL":                                                                                       1,
		"SELECT count(*) FROM legacy_app.employees WHERE hired IS NULL":                                                                                    2001,
		"SELECT count(*) FROM legacy_app.employees WHERE is_active":                                                                                        50001,
		"SELECT count(*) FROM legacy_app.employees WHERE deleted":                                                                                          14285,
		"SELECT count(*) FROM legacy_app.employees WHERE big = 18446744073709551614":                                                                       1,
		"SELECT count(*) FROM legacy_app.employees WHERE bio = 'biowith nul'":                                                                              100,
		"SELECT count(*) FROM legacy_app.employees WHERE (meta->>'n')::int = id":                                                                           100000,
		"SELECT count(*) FROM legacy_app.employees WHERE photo = decode(md5(id::text),'hex')":                                                              100000,
		"SELECT count(*) FROM legacy_app.employees WHERE flags = (id % 256)::bit(8)::varbit":                                                               100000,
		"SELECT count(*) FROM legacy_app.employees WHERE shift = make_interval(secs => id % 86400)::time":                                                  100000,
		"SELECT count(*) FROM legacy_app.employees WHERE status = 'on leave'":                                                                              33334,
		"SELECT count(*) FROM pg_indexes WHERE schemaname='legacy_app' AND indexname IN ('employees_idx_dept','employees_idx_name','departments_uq_name')": 3,
		"SELECT count(*) FROM pg_constraint WHERE conname='fk_emp_dept' AND NOT convalidated AND connamespace='legacy_app'::regnamespace":                  1,
	} {
		if got := count(t, pool, q); got != want {
			t.Errorf("%s = %d, want %d", q, got, want)
		}
	}
	if n := count(t, pool, "SELECT nextval(pg_get_serial_sequence('legacy_app.departments','dept_id'))"); n != 4 {
		t.Errorf("departments sequence nextval = %d, want 4", n)
	}
	var typ string
	pool.QueryRow(ctx, `SELECT format_type(atttypid, atttypmod) FROM pg_attribute WHERE attrelid='legacy_app.employees'::regclass AND attname='is_active'`).Scan(&typ)
	if typ != "boolean" {
		t.Errorf("is_active type %s", typ)
	}
}

func TestScale(t *testing.T) {
	if os.Getenv("NIFI_TEST_SCALE") == "" {
		t.Skip("set NIFI_TEST_SCALE=1 (needs nifi_src.events)")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	for _, mode := range []string{"copy", "merge"} {
		pool.Exec(ctx, "DROP TABLE IF EXISTS events")
		g := graph()
		g.Nodes = []model.Node{g.Nodes[0], g.Nodes[2]}
		g.Edges = []model.Edge{{ID: "e", From: "src", FromPort: "success", To: "dst"}}
		g.Nodes[0].Config["tables"] = []any{"events"}
		g.Nodes[0].Config["chunk_rows"] = float64(250000)
		g.Nodes[0].Config["batch_rows"] = float64(10000)
		g.Nodes[0].Concurrency = 6
		g.Nodes[1].Concurrency = 6
		g.Nodes[1].Config["mode"] = mode
		f, _ := st.SaveFlow(ctx, model.Flow{Name: "scale", Graph: g})
		var peak uint64
		stop := make(chan struct{})
		go func() {
			var ms runtime.MemStats
			for {
				select {
				case <-stop:
					return
				case <-time.After(100 * time.Millisecond):
					runtime.ReadMemStats(&ms)
					if ms.HeapInuse > peak {
						peak = ms.HeapInuse
					}
				}
			}
		}()
		start := time.Now()
		run, err := m.Start(ctx, f.ID, false, "")
		if err != nil {
			t.Fatal(err)
		}
		d := wait(t, m, run.ID)
		close(stop)
		el := time.Since(start)
		t.Logf("%s: %s %d rows in %s = %.0f rows/s, peak heap %d MB", mode, d.Status, d.RowsWritten, el.Round(time.Millisecond),
			float64(d.RowsWritten)/el.Seconds(), peak>>20)
		if d.RowsWritten != 5000000 || count(t, pool, "SELECT count(*) FROM events") != 5000000 {
			t.Fatalf("incomplete: %+v", d.RunSummary)
		}
	}
}

func TestPauseHoldsWritesAndSchemaRace(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS race CASCADE")
	g := graph()
	g.Nodes[2].Config["schema"] = "race"
	g.Nodes[2].Concurrency = 8
	g.Nodes[0].Config["batch_rows"] = float64(500)
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "pause", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	for {
		d, _ := m.Detail(ctx, run.ID)
		if d.RowsWritten >= 20000 || d.Status.Finished() {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	ex, ok := m.Active(run.ID)
	if !ok {
		t.Fatal("run finished before it could be paused")
	}
	ex.Pause("t")
	time.Sleep(700 * time.Millisecond) // let in-flight batches settle
	// Tables are created on their first rows, so count only those that exist.
	rows := func() int64 {
		var n int64
		for _, tb := range []string{"race.users", "race.orders", "race.tags", "race.logs"} {
			var exists bool
			pool.QueryRow(ctx, "SELECT to_regclass($1) IS NOT NULL", tb).Scan(&exists)
			if exists {
				n += count(t, pool, "SELECT count(*) FROM "+tb)
			}
		}
		return n
	}
	a := rows()
	time.Sleep(time.Second)
	b := rows()
	if a != b {
		t.Errorf("rows kept landing while paused: %d → %d", a, b)
	}
	if d, _ := m.Detail(ctx, run.ID); d.Status != model.RunPaused {
		t.Errorf("status while paused: %s", d.Status)
	}
	ex.Resume("t")
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
		t.Fatalf("after resume: %s %s", d.Status, d.Error)
	}
	if got := count(t, pool, "SELECT count(*) FROM race.users"); got != 200000 {
		t.Errorf("users = %d", got)
	}
}

func TestSinkPlan(t *testing.T) {
	_, _, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, `CREATE TABLE public.tags_t (code varchar(40), lang text, extra int NOT NULL, PRIMARY KEY (code, lang))`)
	g := graph()
	g.Nodes = []model.Node{g.Nodes[0], g.Nodes[2]}
	g.Edges = []model.Edge{{ID: "e", From: "src", FromPort: "success", To: "dst"}}
	g.Nodes[0].Config["tables"] = []any{"users", "logs", "tags"}
	g.Nodes[1].Config["table_map"] = []any{
		map[string]any{"key": "users", "value": "plan_new.users"},
		map[string]any{"key": "tags", "value": "public.tags_t"},
	}
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	plan, err := flow.SinkPlan(ctx, func(_ context.Context, id string) (dbx.Connection, error) { return conns[id], nil }, g, "dst", 50)
	if err != nil {
		t.Fatal(err)
	}
	by := map[string]flow.TablePlan{}
	for _, p := range plan.Tables {
		by[p.Source] = p
	}
	u := by["users"]
	if u.Action != "create" || u.Schema != "plan_new" || !strings.Contains(u.DDL, `CREATE TABLE IF NOT EXISTS "plan_new"."users"`) ||
		len(u.Indexes) != 2 || len(u.ConflictKey) != 1 {
		t.Errorf("users plan: %+v", u)
	}
	l := by["logs"]
	if l.Action != "load" || !l.Exists {
		t.Errorf("logs plan: %+v", l)
	}
	st := map[string]string{}
	for _, c := range l.Columns {
		st[c.Name] = c.Status
	}
	if st["msg"] != "type_differs" || st["at"] != "match" {
		t.Errorf("logs columns: %+v", l.Columns)
	}
	tg := by["tags"]
	st = map[string]string{}
	for _, c := range tg.Columns {
		st[c.Name] = c.Status
	}
	if st["code"] != "type_differs" || st["lang"] != "match" || st["label"] != "add" || st["extra"] != "target_only" || len(tg.Warnings) == 0 {
		t.Errorf("tags plan: %+v", tg)
	}
}

func TestColumnMappingAndScriptColumns(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS cmap CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS cmap CASCADE")
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Source", Config: map[string]any{"connection": "src", "tables": []any{"logs", "tags"}}},
			{ID: "py", Type: "transform.script", Name: "Enrich", Config: map[string]any{
				"script": "def transform(row):\n    row['msg_len'] = len(row.get('msg') or row.get('label') or '')\n    return row\n"}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Config: map[string]any{"connection": "tgt", "schema": "cmap",
				"column_map": []any{
					map[string]any{"table": "logs", "from": "msg", "to": "message"},
					map[string]any{"table": "tags", "from": "label", "to": ""},
				}}},
		},
		Edges: []model.Edge{
			{ID: "e1", From: "src", FromPort: "success", To: "py"},
			{ID: "e2", From: "py", FromPort: "success", To: "dst"},
		},
	}
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	plan, err := flow.SinkPlan(ctx, func(_ context.Context, id string) (dbx.Connection, error) { return conns[id], nil }, g, "dst", 50)
	if err != nil {
		t.Fatal(err)
	}
	cols := map[string]map[string]flow.ColumnPlan{}
	for _, p := range plan.Tables {
		cols[p.Source] = map[string]flow.ColumnPlan{}
		for _, c := range p.Columns {
			cols[p.Source][c.Source] = c
		}
	}
	if c := cols["logs"]["msg_len"]; c.IntroducedBy != "Enrich" || c.Status != "create" || c.SourceType != "bigint" {
		t.Errorf("script column not detected: %+v", c)
	}
	if c := cols["logs"]["msg"]; c.Name != "message" || !c.Mapped {
		t.Errorf("mapped column: %+v", c)
	}
	if c := cols["tags"]["label"]; c.Status != "skipped" {
		t.Errorf("skipped column: %+v", c)
	}

	f, _ := st.SaveFlow(ctx, model.Flow{Name: "cmap", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
		t.Fatalf("%s %s", d.Status, d.Error)
	}
	if n := count(t, pool, "SELECT count(*) FROM cmap.logs WHERE message LIKE 'm%' AND msg_len = length(message)"); n != 1000 {
		t.Errorf("mapped/script columns written: %d", n)
	}
	var hasLabel bool
	pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='cmap' AND table_name='tags' AND column_name='label')`).Scan(&hasLabel)
	if hasLabel {
		t.Error("skipped column was created")
	}
}

func TestFanInAndScriptRouting(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS fanin CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS fanin CASCADE")
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	resolve := func(_ context.Context, id string) (dbx.Connection, error) { return conns[id], nil }
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Source", Config: map[string]any{"connection": "src", "tables": []any{"fanin_a", "fanin_b", "logs"}}},
			{ID: "py", Type: "transform.script", Name: "Split", Config: map[string]any{
				"script": "def transform(row):\n    if row.get('msg') and int(row['msg'][1:]) % 2 == 0:\n        row['_table'] = 'logs_even'\n    return row\n"}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Config: map[string]any{"connection": "tgt", "schema": "fanin", "mode": "merge",
				"table_map": []any{
					map[string]any{"key": "fanin_a", "value": "fanin.people"},
					map[string]any{"key": "fanin_b", "value": "fanin.people"},
				}}},
		},
		Edges: []model.Edge{{ID: "e1", From: "src", FromPort: "success", To: "py"}, {ID: "e2", From: "py", FromPort: "success", To: "dst"}},
	}

	plan, err := flow.SinkPlan(ctx, resolve, g, "dst", 50)
	if err != nil {
		t.Fatal(err)
	}
	var sawEven bool
	for _, p := range plan.Tables {
		switch p.Source {
		case "fanin_a", "fanin_b":
			if p.Table != "people" || len(p.SharedWith) != 1 || !strings.Contains(p.DDL, `"a_only" text,`) ||
				!strings.Contains(p.DDL, `"b_only" integer,`) {
				t.Errorf("shared plan %s: shared=%v ddl=%s", p.Source, p.SharedWith, p.DDL)
			}
		case "logs_even":
			sawEven = true
		}
	}
	if !sawEven {
		t.Error("script-routed table logs_even missing from plan")
	}

	f, _ := st.SaveFlow(ctx, model.Flow{Name: "fanin", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	d := wait(t, m, run.ID)
	if d.Status != model.RunCompleted || d.RowsFailed != 0 {
		bs, _ := st.ListBulletins(ctx, run.ID, 0, 50)
		t.Fatalf("%s failed=%d %s %+v", d.Status, d.RowsFailed, d.Error, bs)
	}
	for q, want := range map[string]int64{
		"SELECT count(*) FROM fanin.people":                                                                              200,
		"SELECT count(*) FROM fanin.people WHERE a_only IS NULL":                                                         100,
		"SELECT count(*) FROM fanin.people WHERE b_only IS NOT NULL":                                                     100,
		"SELECT count(*) FROM pg_indexes WHERE schemaname='fanin' AND tablename='people' AND indexname <> 'people_pkey'": 2,
		"SELECT count(*) FROM fanin.logs":                                                                                500,
		"SELECT count(*) FROM fanin.logs_even":                                                                           500,
		"SELECT count(*) FROM information_schema.columns WHERE table_schema='fanin' AND column_name='_table'":            0,
	} {
		if got := count(t, pool, q); got != want {
			t.Errorf("%s = %d, want %d", q, got, want)
		}
	}
}

// users → +applicant names → +employer_users names (fill only empty) → users.
func TestEnrichUsersFromTwoTables(t *testing.T) {
	if os.Getenv("NIFI_TEST_MYSQL") == "" {
		t.Skip("set NIFI_TEST_MYSQL")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS enrich CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS enrich CASCADE")
	names := func() []any {
		return []any{
			map[string]any{"key": "first_name", "value": "first_name"},
			map[string]any{"key": "last_name", "value": "last_name"},
		}
	}
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Users", Config: map[string]any{"connection": "legacy", "tables": []any{"user"}}},
			{ID: "app", Type: "transform.lookup", Name: "Names from applicant", Config: map[string]any{
				"connection": "legacy", "table": "applicant", "key": "user_id", "match": "id", "fields": names()}},
			{ID: "emp", Type: "transform.lookup", Name: "Names from employer_users", Config: map[string]any{
				"connection": "legacy", "table": "employer_users", "key": "user_id", "match": "id", "existing": "fill",
				"where":  "deleted = 0",
				"fields": append(names(), map[string]any{"key": "phone", "value": "phone"})}},
			{ID: "dst", Type: "sink.postgres", Name: "Portal", Config: map[string]any{"connection": "tgt", "schema": "enrich",
				"table_map": []any{map[string]any{"key": "user", "value": "enrich.users"}}}},
		},
		Edges: []model.Edge{
			{ID: "e1", From: "src", FromPort: "success", To: "app"},
			{ID: "e2", From: "app", FromPort: "success", To: "emp"},
			{ID: "e3", From: "emp", FromPort: "success", To: "dst"},
		},
	}
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "enrich", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted || d.RowsWritten != 300 {
		t.Fatalf("%s written=%d %s", d.Status, d.RowsWritten, d.Error)
	}
	for q, want := range map[string]int64{
		"SELECT count(*) FROM enrich.users":                                                                                                300,
		"SELECT count(*) FROM enrich.users WHERE id <= 150 AND first_name = 'AppFirst' || id":                                              150,
		"SELECT count(*) FROM enrich.users WHERE id BETWEEN 151 AND 249 AND first_name = 'EmpFirst' || id AND last_name = 'EmpLast' || id": 99,
		"SELECT count(*) FROM enrich.users WHERE id >= 250 AND first_name IS NULL AND last_name IS NULL":                                   51,
		"SELECT count(*) FROM enrich.users WHERE phone IS NOT NULL":                                                                        99,
	} {
		if got := count(t, pool, q); got != want {
			t.Errorf("%s = %d, want %d", q, got, want)
		}
	}
}

// The source sends user and applicant; the lookup is scoped with "user.id"
// and applicant rows must pass through untouched to their own table.
func TestLookupScopedToOneTable(t *testing.T) {
	if os.Getenv("NIFI_TEST_MYSQL") == "" {
		t.Skip("set NIFI_TEST_MYSQL")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS scoped CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS scoped CASCADE")
	for _, match := range []string{"user.id", "id"} {
		pool.Exec(ctx, "DROP SCHEMA IF EXISTS scoped CASCADE")
		g := &model.Graph{
			Nodes: []model.Node{
				{ID: "src", Type: "source.tables", Name: "Legacy", Config: map[string]any{"connection": "legacy", "tables": []any{"user", "applicant"}}},
				{ID: "app", Type: "transform.lookup", Name: "Names from applicant", Config: map[string]any{
					"connection": "legacy", "table": "applicant", "key": "user_id", "match": match,
					"fields": []any{map[string]any{"key": "first_name", "value": "first_name"}, map[string]any{"key": "", "value": ""}}}},
				{ID: "dst", Type: "sink.postgres", Name: "PG", Config: map[string]any{"connection": "tgt", "schema": "scoped"}},
			},
			Edges: []model.Edge{{ID: "e1", From: "src", FromPort: "success", To: "app"}, {ID: "e2", From: "app", FromPort: "success", To: "dst"}},
		}
		f, _ := st.SaveFlow(ctx, model.Flow{Name: "scoped " + match, Graph: g})
		run, err := m.Start(ctx, f.ID, false, "")
		if err != nil {
			t.Fatal(err)
		}
		if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
			t.Fatalf("match %q: %s %s", match, d.Status, d.Error)
		}
		if n := count(t, pool, "SELECT count(*) FROM scoped.\"user\" WHERE first_name = 'AppFirst' || id"); n != 150 {
			t.Errorf("match %q: enriched users = %d", match, n)
		}
		// applicant passed through untouched (its own first_name column, 160 rows)
		if n := count(t, pool, "SELECT count(*) FROM scoped.applicant"); n != 160 {
			t.Errorf("match %q: applicant rows = %d", match, n)
		}
	}
}

// One Lookup node with two lookup tables applied in order.
func TestOneLookupNodeManyTables(t *testing.T) {
	if os.Getenv("NIFI_TEST_MYSQL") == "" {
		t.Skip("set NIFI_TEST_MYSQL")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS multi CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS multi CASCADE")
	f2 := func(cols ...string) []any {
		var out []any
		for _, c := range cols {
			out = append(out, map[string]any{"key": c, "value": c})
		}
		return out
	}
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Legacy", Config: map[string]any{"connection": "legacy", "tables": []any{"user", "applicant"}}},
			{ID: "lk", Type: "transform.lookup", Name: "User names", Config: map[string]any{"lookups": []any{
				map[string]any{"connection": "legacy", "table": "applicant", "key": "user_id", "match": "user.id", "fields": f2("first_name", "last_name")},
				map[string]any{"connection": "legacy", "table": "employer_users", "key": "user_id", "match": "user.id", "existing": "fill",
					"where": "deleted = 0", "fields": f2("first_name", "last_name", "phone")},
			}}},
			{ID: "dst", Type: "sink.postgres", Name: "PG", Config: map[string]any{"connection": "tgt", "schema": "multi"}},
		},
		Edges: []model.Edge{{ID: "e1", From: "src", FromPort: "success", To: "lk"}, {ID: "e2", From: "lk", FromPort: "success", To: "dst"}},
	}
	if issues := flow.Validate(g); len(issues) > 0 {
		t.Fatalf("issues: %+v", issues)
	}
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "multi", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
		t.Fatalf("%s %s", d.Status, d.Error)
	}
	for q, want := range map[string]int64{
		`SELECT count(*) FROM multi."user" WHERE id <= 150 AND first_name = 'AppFirst' || id`:                                           150,
		`SELECT count(*) FROM multi."user" WHERE id BETWEEN 151 AND 249 AND first_name = 'EmpFirst' || id`:                              99,
		`SELECT count(*) FROM multi."user" WHERE id >= 250 AND first_name IS NULL`:                                                      51,
		`SELECT count(*) FROM multi.applicant`:                                                                                          160,
		`SELECT count(*) FROM information_schema.columns WHERE table_schema='multi' AND table_name='applicant' AND column_name='phone'`: 0,
	} {
		if got := count(t, pool, q); got != want {
			t.Errorf("%s = %d, want %d", q, got, want)
		}
	}
	// Invalid entries are reported with their position.
	bad := &model.Graph{Nodes: []model.Node{g.Nodes[0], {ID: "lk", Type: "transform.lookup", Name: "x",
		Config: map[string]any{"lookups": []any{map[string]any{"connection": "legacy", "table": "applicant"}}}}}}
	if issues := flow.Validate(bad); !strings.Contains(fmt.Sprint(issues), "lookup 1 (applicant): choose the columns to match on") {
		t.Errorf("validation: %+v", issues)
	}
}

// Source reads user + applicant + employer_users; connections route user
// through a lookup and the other two straight to the sink.
func TestEdgeTableRouting(t *testing.T) {
	if os.Getenv("NIFI_TEST_MYSQL") == "" {
		t.Skip("set NIFI_TEST_MYSQL")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS routed CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS routed CASCADE")
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Legacy", Config: map[string]any{"connection": "legacy", "tables": []any{"user", "applicant", "employer_users"}}},
			{ID: "lk", Type: "transform.lookup", Name: "Names", Config: map[string]any{"lookups": []any{
				map[string]any{"connection": "legacy", "table": "applicant", "key": "user_id", "match": "id",
					"fields": []any{map[string]any{"key": "first_name", "value": "first_name"}}},
			}}},
			{ID: "py", Type: "transform.script", Name: "Tag", Config: map[string]any{"script": "def transform(row):\n    row['via_script'] = True\n    return row\n"}},
			{ID: "dst", Type: "sink.postgres", Name: "PG", Config: map[string]any{"connection": "tgt", "schema": "routed"}},
		},
		Edges: []model.Edge{
			{ID: "e1", From: "src", FromPort: "success", To: "lk", Tables: []string{"user"}},
			{ID: "e2", From: "lk", FromPort: "success", To: "dst"},
			{ID: "e3", From: "src", FromPort: "success", To: "py", Tables: []string{"employer_users"}},
			{ID: "e4", From: "py", FromPort: "success", To: "dst"},
			{ID: "e5", From: "src", FromPort: "success", To: "dst", Tables: []string{"applicant"}},
		},
	}
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "routed", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
		t.Fatalf("%s %s", d.Status, d.Error)
	}
	for q, want := range map[string]int64{
		`SELECT count(*) FROM routed."user" WHERE first_name LIKE 'AppFirst%'`:                                                                150, // enriched (user has no first_name of its own)
		`SELECT count(*) FROM routed.applicant`:                                                                                               160, // straight through, exactly once
		`SELECT count(*) FROM routed.employer_users WHERE via_script`:                                                                         101, // via the script only
		`SELECT count(*) FROM information_schema.columns WHERE table_schema='routed' AND table_name='applicant' AND column_name='via_script'`: 0,
	} {
		if got := count(t, pool, q); got != want {
			t.Errorf("%s = %d, want %d", q, got, want)
		}
	}
	// Preview follows the same routing: applicant never reaches the lookup.
	sim, err := flow.Simulate(ctx, func(_ context.Context, id string) (dbx.Connection, error) {
		return map[string]dbx.Connection{
			"legacy": {ID: "legacy", Driver: "mysql", Host: "127.0.0.1", Port: 3407, User: "root", Database: "legacy"},
			"tgt":    {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
		}[id], nil
	}, g, "lk", "applicant", 3)
	if err != nil {
		t.Fatal(err)
	}
	if len(sim.Inputs) != 0 {
		t.Errorf("applicant reached the lookup in preview: %d batches", len(sim.Inputs))
	}
}

// A script that changes a column's type (unix seconds → datetime): the
// target column must be created from the script's output, not the source's.
func TestScriptTypeChangeCreatesRightColumn(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS tchange CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS tchange CASCADE")
	pool.Exec(ctx, "DROP TABLE IF EXISTS public.empty_src")
	src, _ := pgxpool.New(ctx, "postgres://postgres@localhost/nifi_src?sslmode=disable")
	defer src.Close()
	src.Exec(ctx, `DROP TABLE IF EXISTS logins; CREATE TABLE logins (id int PRIMARY KEY, last_login bigint);
		INSERT INTO logins VALUES (1, NULL), (2, 1717171717), (3, 1717171717000);
		DROP TABLE IF EXISTS empty_src; CREATE TABLE empty_src (id int PRIMARY KEY, v text)`)
	defer src.Exec(ctx, "DROP TABLE IF EXISTS logins, empty_src")
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Source", Config: map[string]any{"connection": "src", "tables": []any{"logins", "empty_src"}}},
			{ID: "py", Type: "transform.script", Name: "Dates", Config: map[string]any{"script": "import datetime\ndef transform(row):\n    if row.get(\"last_login\"):\n        row[\"last_login\"] = datetime.datetime.fromtimestamp(row[\"last_login\"])\n    return row\n"}},
			{ID: "dst", Type: "sink.postgres", Name: "PG", Config: map[string]any{"connection": "tgt", "schema": "tchange"}},
		},
		Edges: []model.Edge{{ID: "e1", From: "src", FromPort: "success", To: "py"}, {ID: "e2", From: "py", FromPort: "success", To: "dst"}},
	}
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "tchange", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted || d.RowsFailed != 0 {
		t.Fatalf("%s failed=%d %s", d.Status, d.RowsFailed, d.Error)
	}
	var typ string
	pool.QueryRow(ctx, `SELECT data_type FROM information_schema.columns WHERE table_schema='tchange' AND table_name='logins' AND column_name='last_login'`).Scan(&typ)
	if typ != "timestamp with time zone" {
		t.Errorf("last_login created as %q", typ)
	}
	if n := count(t, pool, "SELECT count(*) FROM tchange.logins WHERE last_login = to_timestamp(1717171717)"); n != 2 {
		t.Errorf("converted rows = %d", n)
	}
	if n := count(t, pool, "SELECT count(*) FROM tchange.empty_src"); n != 0 {
		t.Errorf("empty table: %d", n)
	}
}

// Merge rewrites only changed rows, but must still fix rows that differ.
func TestMergeSkipsUnchangedButFixesChanged(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS skipu CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS skipu CASCADE")
	g := graph()
	g.Nodes = []model.Node{g.Nodes[0], g.Nodes[2]}
	g.Edges = []model.Edge{{ID: "e", From: "src", FromPort: "success", To: "dst"}}
	g.Nodes[0].Config["tables"] = []any{"orders"}
	g.Nodes[1].Config["schema"] = "skipu"
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "skip", Graph: g})
	for i := 0; i < 2; i++ {
		if i == 1 {
			pool.Exec(ctx, "UPDATE skipu.orders SET note = 'tampered' WHERE id <= 100")
			pool.Exec(ctx, "SELECT pg_stat_clear_snapshot()")
		}
		var before int64
		pool.QueryRow(ctx, "SELECT COALESCE(n_tup_upd,0) FROM pg_stat_user_tables WHERE schemaname='skipu' AND relname='orders'").Scan(&before)
		run, err := m.Start(ctx, f.ID, false, "")
		if err != nil {
			t.Fatal(err)
		}
		if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
			t.Fatalf("%s %s", d.Status, d.Error)
		}
		if i == 1 {
			if n := count(t, pool, "SELECT count(*) FROM skipu.orders WHERE note = 'tampered'"); n != 0 {
				t.Errorf("changed rows not repaired: %d", n)
			}
			time.Sleep(700 * time.Millisecond) // stats collector
			var after int64
			pool.QueryRow(ctx, "SELECT n_tup_upd FROM pg_stat_user_tables WHERE schemaname='skipu' AND relname='orders'").Scan(&after)
			if upd := after - before; upd > 1000 {
				t.Errorf("re-run rewrote %d rows; only the 100 changed ones should be updated", upd)
			}
		}
	}
}

func TestIgnoredColumnsNotRead(t *testing.T) {
	if os.Getenv("NIFI_TEST_MYSQL") == "" {
		t.Skip("set NIFI_TEST_MYSQL")
	}
	st, m, pool := setup(t)
	ctx := context.Background()
	pool.Exec(ctx, "DROP SCHEMA IF EXISTS pushd CASCADE")
	defer pool.Exec(ctx, "DROP SCHEMA IF EXISTS pushd CASCADE")
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Legacy", Config: map[string]any{"connection": "legacy", "tables": []any{"user"}}},
			{ID: "py", Type: "transform.script", Name: "Py", Config: map[string]any{"script": "def transform(row):\n    row['handle'] = row['username'].upper()\n    return row\n"}},
			{ID: "dst", Type: "sink.postgres", Name: "PG", Config: map[string]any{"connection": "tgt", "schema": "pushd", "column_map": []any{
				map[string]any{"table": "user", "from": "email", "to": ""},
				map[string]any{"table": "user", "from": "is_active", "to": ""},
				map[string]any{"table": "user", "from": "username", "to": ""}, // used by the script: still read
			}}},
		},
		Edges: []model.Edge{{ID: "e1", From: "src", FromPort: "success", To: "py"}, {ID: "e2", From: "py", FromPort: "success", To: "dst"}},
	}
	f, _ := st.SaveFlow(ctx, model.Flow{Name: "pushd", Graph: g})
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted || d.RowsWritten != 300 {
		t.Fatalf("%s %d %s", d.Status, d.RowsWritten, d.Error)
	}
	bs, _ := st.ListBulletins(ctx, run.ID, 0, 50)
	found := false
	for _, b := range bs {
		if strings.Contains(b.Message, "not reading 2 column(s) no destination uses: email, is_active") {
			found = true
		}
	}
	if !found {
		t.Errorf("pushdown bulletin missing: %+v", bs)
	}
	if n := count(t, pool, `SELECT count(*) FROM pushd."user" WHERE handle = upper('u' || id)`); n != 300 {
		t.Errorf("script column from a pushed-down-safe column: %d", n)
	}
	if n := count(t, pool, `SELECT count(*) FROM information_schema.columns WHERE table_schema='pushd' AND column_name IN ('email','is_active','username')`); n != 0 {
		t.Errorf("ignored columns created: %d", n)
	}
}

// Sink column settings: a cast of incoming values, a target type applied to
// an existing column, and a computed column with its own type.
func TestSinkTypesAndExpressions(t *testing.T) {
	st, m, pool := setup(t)
	ctx := context.Background()
	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.tables", Name: "Source", Config: map[string]any{"connection": "src", "tables": []any{"logs"}}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Config: map[string]any{"connection": "tgt", "mode": "insert",
				"column_map": []any{
					map[string]any{"table": "logs", "from": "msg", "to": "msg", "type": "text"},
					map[string]any{"table": "logs", "from": "at", "cast": "text"},
				},
				"expressions": []any{
					map[string]any{"column": "msg_upper", "expr": "upper(msg)", "type": "varchar(200)"},
					map[string]any{"table": "logs", "column": "n", "expr": `Int(substr(msg, 1))`},
				}}},
		},
		Edges: []model.Edge{{ID: "e", From: "src", FromPort: "success", To: "dst"}},
	}
	f, err := st.SaveFlow(ctx, model.Flow{Name: "types", Graph: g})
	if err != nil {
		t.Fatal(err)
	}
	conns := map[string]dbx.Connection{
		"src": {ID: "src", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}},
		"tgt": {ID: "tgt", Driver: "postgres", Host: "localhost", User: "postgres", Database: "nifi_tgt", Params: map[string]string{"sslmode": "disable"}},
	}
	plan, err := flow.SinkPlan(ctx, func(_ context.Context, id string) (dbx.Connection, error) { return conns[id], nil }, g, "dst", 5)
	if err != nil {
		t.Fatal(err)
	}
	pc := map[string]flow.ColumnPlan{}
	for _, c := range plan.Tables[0].Columns {
		pc[c.Name] = c
	}
	if pc["msg"].Status != "retype" || len(plan.Tables[0].Alter) != 1 || pc["msg_upper"].Expr != "upper(msg)" ||
		pc["msg_upper"].SourceType != "varchar(200)" || pc["at"].Cast != "text" || pc["n"].Status != "add" {
		t.Fatalf("plan: %+v alter=%v", plan.Tables[0].Columns, plan.Tables[0].Alter)
	}
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if d := wait(t, m, run.ID); d.Status != model.RunCompleted {
		t.Fatalf("status %s: %s", d.Status, d.Error)
	}
	types := map[string]string{}
	rows, _ := pool.Query(ctx, `SELECT column_name, format_type(atttypid, atttypmod) FROM information_schema.columns c
		JOIN pg_attribute a ON a.attrelid = 'public.logs'::regclass AND a.attname = c.column_name
		WHERE c.table_schema = 'public' AND c.table_name = 'logs'`)
	for rows.Next() {
		var n, ty string
		rows.Scan(&n, &ty)
		types[n] = ty
	}
	rows.Close()
	if types["msg"] != "text" || types["msg_upper"] != "character varying(200)" || types["n"] != "bigint" {
		t.Fatalf("types: %v", types)
	}
	var up string
	var n int64
	if err := pool.QueryRow(ctx, `SELECT msg_upper, n FROM logs WHERE msg = 'm7'`).Scan(&up, &n); err != nil || up != "M7" || n != 7 {
		t.Fatalf("row: %q %d %v", up, n, err)
	}
}

// stopLive stops a live run and waits for it, so the test's store is not
// closed underneath a run that is still writing.
func stopLive(t *testing.T, m *flow.Manager, flowID, runID string) {
	t.Helper()
	m.StopRuns([]string{flowID}, "")
	for i := 0; i < 100; i++ {
		if d, _ := m.Detail(context.Background(), runID); d.Status.Finished() {
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
	t.Fatalf("run %s did not stop", runID)
}

// A live flow: rows are followed as they change at the source, and a
// destination in "apply changes" mode writes what changed and removes what was
// deleted. The run has no end of its own — it is stopped.
func TestLiveChangeFeed(t *testing.T) {
	st, m, tgt := setup(t)
	ctx := context.Background()
	src, err := pgxpool.New(ctx, "postgres://postgres@localhost/nifi_src?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}
	defer src.Close()
	if _, err := src.Exec(ctx, `DROP TABLE IF EXISTS feed;
		CREATE TABLE feed (id int PRIMARY KEY, name text, deleted_at timestamptz,
			updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
		INSERT INTO feed (id, name) VALUES (1, 'ann'), (2, 'bo')`); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { src.Exec(context.Background(), `DROP TABLE IF EXISTS feed`) })

	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "src", Type: "source.changes", Name: "Changes", Config: map[string]any{
				"connection": "src", "tables": []any{"feed"}, "watermark": "updated_at",
				"start": "beginning", "poll": 1, "deleted_when": "deleted_at != nil"}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Config: map[string]any{
				"connection": "tgt", "apply_changes": true}},
		},
		Edges: []model.Edge{{ID: "e", From: "src", FromPort: "success", To: "dst"}},
	}
	f, err := st.SaveFlow(ctx, model.Flow{Name: "live", Graph: g})
	if err != nil {
		t.Fatal(err)
	}
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if !run.Live {
		t.Fatal("a flow with a change feed should run live")
	}

	names := func() string {
		rows, err := tgt.Query(ctx, `SELECT id || '=' || name FROM feed ORDER BY id`)
		if err != nil {
			return "no table"
		}
		defer rows.Close()
		var out []string
		for rows.Next() {
			var s string
			rows.Scan(&s)
			out = append(out, s)
		}
		return strings.Join(out, ",")
	}
	until := func(want string) {
		t.Helper()
		for i := 0; i < 100; i++ {
			if got := names(); got == want {
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Fatalf("target is %q, want %q", names(), want)
	}

	until("1=ann,2=bo")

	// An update, an insert and a delete, all while the run keeps going.
	if _, err := src.Exec(ctx, `UPDATE feed SET name = 'anna', updated_at = clock_timestamp() WHERE id = 1;
		INSERT INTO feed (id, name) VALUES (3, 'cy');
		UPDATE feed SET deleted_at = now(), updated_at = clock_timestamp() WHERE id = 2`); err != nil {
		t.Fatal(err)
	}
	until("1=anna,3=cy")

	if d, _ := m.Detail(ctx, run.ID); d.Status != model.RunRunning {
		t.Fatalf("a live run should still be running, not %s", d.Status)
	}
	stopLive(t, m, f.ID, run.ID)
	if d, _ := m.Detail(ctx, run.ID); d.Status != model.RunStopped {
		t.Fatalf("stopped run is %s: %s", d.Status, d.Error)
	}

	// The position is remembered against the flow, so a second run carries on
	// instead of reading the table again.
	if _, err := src.Exec(ctx, `INSERT INTO feed (id, name) VALUES (4, 'di')`); err != nil {
		t.Fatal(err)
	}
	run2, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	until("1=anna,3=cy,4=di")
	d, _ := m.Detail(ctx, run2.ID)
	if d.RowsRead != 1 {
		t.Fatalf("the second run read %d rows; it should have read only the new one", d.RowsRead)
	}
	stopLive(t, m, f.ID, run2.ID)
}

// One flow, both kinds of source: the tables are read once and then followed.
// The feed's position is taken before the load starts, so a row changed while
// the load was running is not lost — and the feed does not start racing the
// load it would otherwise overtake.
func TestSnapshotThenFollow(t *testing.T) {
	st, m, tgt := setup(t)
	ctx := context.Background()
	src, err := pgxpool.New(ctx, "postgres://postgres@localhost/nifi_src?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}
	defer src.Close()
	if _, err := src.Exec(ctx, `DROP TABLE IF EXISTS feed2;
		CREATE TABLE feed2 (id int PRIMARY KEY, name text,
			updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
		INSERT INTO feed2 (id, name) SELECT i, 'row' || i FROM generate_series(1, 500) i`); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { src.Exec(context.Background(), `DROP TABLE IF EXISTS feed2`) })

	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "load", Type: "source.tables", Name: "Load", Config: map[string]any{
				"connection": "src", "tables": []any{"feed2"}, "batch_rows": 50}},
			{ID: "follow", Type: "source.changes", Name: "Follow", Config: map[string]any{
				"connection": "src", "tables": []any{"feed2"}, "watermark": "updated_at",
				"start": "now", "poll": 1}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Config: map[string]any{
				"connection": "tgt", "apply_changes": true}},
		},
		Edges: []model.Edge{
			{ID: "e1", From: "load", FromPort: "success", To: "dst"},
			{ID: "e2", From: "follow", FromPort: "success", To: "dst"},
		},
	}
	f, err := st.SaveFlow(ctx, model.Flow{Name: "snapshot then follow", Graph: g})
	if err != nil {
		t.Fatal(err)
	}
	// Changed after the feed's position is fixed but (with luck) while the
	// load is still going: either way it must end up applied.
	go func() {
		time.Sleep(50 * time.Millisecond)
		src.Exec(ctx, `UPDATE feed2 SET name = 'CHANGED', updated_at = clock_timestamp() WHERE id = 1`)
	}()
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}
	if !run.Live {
		t.Fatal("a flow with a feed should run live")
	}

	var name string
	var n int
	for i := 0; i < 150; i++ {
		tgt.QueryRow(ctx, `SELECT count(*) FROM feed2`).Scan(&n)
		tgt.QueryRow(ctx, `SELECT name FROM feed2 WHERE id = 1`).Scan(&name)
		if n == 500 && name == "CHANGED" {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}
	if n != 500 || name != "CHANGED" {
		t.Fatalf("target has %d rows, id 1 is %q; want 500 and CHANGED", n, name)
	}
	stopLive(t, m, f.ID, run.ID)
}

// A lookup set to drop rows it cannot enrich must still let a deletion
// through: whatever the row pointed at may have been deleted first, and
// dropping the deletion would leave the row in the destination for good.
func TestLookupKeepsDeletions(t *testing.T) {
	_, _, _ = setup(t)
	ctx := context.Background()
	conns := func(_ context.Context, id string) (dbx.Connection, error) {
		return dbx.Connection{ID: id, Driver: "postgres", Host: "localhost", User: "postgres",
			Database: "nifi_src", Params: map[string]string{"sslmode": "disable"}}, nil
	}
	rt := flow.NewPreviewRuntime(conns)
	n := &model.Node{ID: "l", Type: "transform.lookup", Config: map[string]any{
		"lookups": []any{map[string]any{
			"connection": "src", "table": "logs", "key": "msg", "match": "name",
			"fields": map[string]any{"at": "seen_at"}, "missing": "drop",
		}},
	}}
	impl, err := flow.Build(n, rt)
	if err != nil {
		t.Fatal(err)
	}
	b := &record.Batch{Table: "users", Source: "users",
		Meta:    &record.TableMeta{Name: "users", PrimaryKey: []string{"id"}},
		Columns: []record.Column{{Name: "id", Type: record.Int64}, {Name: "name", Type: record.Text}}}
	b.Append([]any{int64(1), "no-such-msg"}, record.Insert)
	b.Append([]any{int64(2), "also-missing"}, record.Delete)

	c := &collector{}
	if err := impl.(flow.Processor).Process(ctx, b, c); err != nil {
		t.Fatal(err)
	}
	got := c.ops("success")
	if len(got) != 1 || got[0] != record.Delete {
		t.Fatalf("kept %v; only the deletion should have survived", got)
	}
}

// Applying changes must not change how the first load writes. A flow that
// loads with "insert new, keep existing" keeps that — an existing row is left
// alone by the load — while a change that arrives afterwards still overwrites
// it, because an update that has just happened is not a duplicate.
func TestApplyChangesKeepsLoadMode(t *testing.T) {
	st, m, tgt := setup(t)
	ctx := context.Background()
	src, err := pgxpool.New(ctx, "postgres://postgres@localhost/nifi_src?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}
	defer src.Close()
	if _, err := src.Exec(ctx, `DROP TABLE IF EXISTS feed3;
		CREATE TABLE feed3 (id int PRIMARY KEY, name text,
			updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
		INSERT INTO feed3 (id, name) VALUES (1, 'from source')`); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { src.Exec(context.Background(), `DROP TABLE IF EXISTS feed3`) })
	// A row already in the target that the load must not touch.
	if _, err := tgt.Exec(ctx, `DROP TABLE IF EXISTS feed3;
		CREATE TABLE feed3 (id int PRIMARY KEY, name text, updated_at timestamptz);
		INSERT INTO feed3 (id, name) VALUES (1, 'already here')`); err != nil {
		t.Fatal(err)
	}

	g := &model.Graph{
		Nodes: []model.Node{
			{ID: "load", Type: "source.tables", Name: "Load", Config: map[string]any{
				"connection": "src", "tables": []any{"feed3"}}},
			{ID: "follow", Type: "source.changes", Name: "Follow", Config: map[string]any{
				"connection": "src", "tables": []any{"feed3"}, "watermark": "updated_at",
				"start": "now", "poll": 1}},
			{ID: "dst", Type: "sink.postgres", Name: "Target", Config: map[string]any{
				"connection": "tgt", "mode": "merge_ignore", "apply_changes": true,
				"create_indexes": false, "create_foreign_keys": false, "reset_sequences": false, "analyze": false}},
		},
		Edges: []model.Edge{
			{ID: "e1", From: "load", FromPort: "success", To: "dst"},
			{ID: "e2", From: "follow", FromPort: "success", To: "dst"},
		},
	}
	f, err := st.SaveFlow(ctx, model.Flow{Name: "apply keeps load mode", Graph: g})
	if err != nil {
		t.Fatal(err)
	}
	run, err := m.Start(ctx, f.ID, false, "")
	if err != nil {
		t.Fatal(err)
	}

	name := func() string {
		var s string
		tgt.QueryRow(ctx, `SELECT name FROM feed3 WHERE id = 1`).Scan(&s)
		return s
	}
	until := func(want string) {
		t.Helper()
		for i := 0; i < 100; i++ {
			if name() == want {
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Fatalf("target is %q, want %q", name(), want)
	}
	// Give the load time to run and, per merge_ignore, leave the row alone.
	time.Sleep(1500 * time.Millisecond)
	if got := name(); got != "already here" {
		t.Fatalf("the load overwrote an existing row (%q): merge_ignore was not honoured", got)
	}
	// The same row, changed at the source, must now overwrite.
	if _, err := src.Exec(ctx, `UPDATE feed3 SET name = 'changed later', updated_at = clock_timestamp() WHERE id = 1`); err != nil {
		t.Fatal(err)
	}
	until("changed later")
	stopLive(t, m, f.ID, run.ID)
}
