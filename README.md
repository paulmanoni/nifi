# nifi

**Embeddable, UI-first database migration flows for Go apps.** A NiFi-style
canvas (Svelte + Svelte Flow) and a streaming engine you mount inside an
existing service to move large databases. It handles **MySQL → PostgreSQL**
and **PostgreSQL → PostgreSQL**, with GUI transforms and Python-dialect scripts
for the hard cases.

- **UI first.** Drag sources, transforms and sinks onto a canvas, configure them
  through generated forms, and preview real rows at any node before running.
- **Scripts when needed.** A `Python Script` node runs Starlark (a Python
  dialect interpreted in pure Go: no CGO, sandboxed). It has a test runner in
  the editor that shows the failing line.
- **Built for big tables.** Parallel primary-key range chunks, bounded queues
  with back-pressure, and PostgreSQL `COPY` with idempotent staged merge.
  Chunk checkpoints make stop and resume exact. A bad row is isolated and
  dead-lettered instead of failing the table.
- **Embedded.** One `http.Handler` serves the API, a live SSE run stream and the
  UI. Management state lives in SQLite. There is no Node at build or run time
  for consumers, because `ui/dist` ships in the module.

## Embed it

```go
eng, err := nifi.New(nifi.Config{
    DataPath: "var/nifi.db",
    BasePath: "/migrations",
    Connections: []nifi.Connection{
        {ID: "legacy", Driver: "mysql", Host: "10.0.0.5", User: "ro", Password: "${LEGACY_PW}", Database: "portal"},
        {ID: "main", Driver: "postgres", Host: "localhost", User: "app", Password: "${PG_PW}", Database: "app",
            Params: map[string]string{"sslmode": "disable"}},
    },
    Authorize: func(r *http.Request, a nifi.Action) error { /* your auth */ return nil },
})
defer eng.Close(ctx)              // stops runs; they resume on next boot
mux.Handle("/migrations/", eng.Handler())
```

**Connections are declared in code.** The UI lists, tests and browses them but
never creates or edits them, and never sees credentials.

### In a nexus app

```go
nexusnifi.Module(nexusnifi.Config{
    Path:      "/flows",
    Databases: []string{"legacy", "main"},          // [databases.*] from nexus.toml
    Engine:    nifi.Config{DataPath: "var/nifi.db"},
    Options:   []nexus.RestOption{auth.Required()},
    Permissions: map[nifi.Action]string{            // checked with auth.Can
        nifi.ActionEdit: "change_migration",
        nifi.ActionRun:  "run_migration",
        nifi.ActionData: "view_migration_data",
    },
})
```

`nexusnifi.Routes(cfg)...` spreads the same routes into an existing module so
its `nexus.Path` prefix applies.

### Connections

A connection is a database flows read from or write to. There are two ways to
have one, and both are listed together:

- **Declared in code**, on `nifi.Config.Connections`. The credentials stay in
  the host's own configuration and the UI cannot change them — it shows them
  locked, so a flow referring to one can still be understood.
- **Added in the UI**, kept in the state file. For pointing the tool at a
  database without a redeploy.

What the host declared always wins: a stored connection can never take over an
id the application believes it owns, and the API refuses to write or delete
one. Passwords are write-only either way — never returned by the API, and
leaving the field empty on an edit keeps the one already stored rather than
blanking it.

A stored password sits in the state file in plain text, so treat that file as
a secret: it is already where run history and dead-lettered rows live. Where
that is not good enough, declare the connection in code and read the password
from the host's own secret store.

## Authorization

Every API call maps to one action: `view`, `edit` (change flows), `run`
(start, stop, pause, resume) or `data` (anything that reveals table contents:
previews, table browsing, dead-lettered rows). There are two ways to decide:

1. **Host auth.** Set `Config.Authorize` (or `nexusnifi.Config.Permissions`).
   `nifi.Permissions(can, map[Action]string{…})` adapts any
   `can(ctx, permission)` function.
2. **Built-in credentials.** Set `Config.Users` for a login screen with a
   signed session cookie and per-user actions:

   ```go
   Users: []nifi.User{
       {Username: "admin", Password: "$2a$10$…"},   // bcrypt; all actions
       {Username: "auditor", Password: "${AUDITOR_PW}", Actions: []nifi.Action{nifi.ActionView}},
   },
   SessionKey: os.Getenv("NIFI_SESSION_KEY"),
   ```

The UI reads the effective permissions from `/api/meta` and hides what the
user cannot do. Run bulletins record who started, stopped or resumed a run.

## Processors

| Category | Processor | What it does |
|---|---|---|
| Source | Database Tables | Whole tables (or all of them) in parallel, resumable chunks |
| Source | SQL Query | A custom SELECT; resumable with a key column |
| Source | Table Changes | Follows tables as they change; the run stays live |
| Transform | Rename Columns / Select-Drop / Rename Tables | Shape names; keys, indexes and FKs follow |
| Transform | Compute Columns | Expressions: `lower(trim(email))`, `concat(a, ' ', b)`, `coalesce(x, 0)` |
| Transform | Convert Types / Map Values / Lookup | Casts, code → label maps, batched lookups in another table |
| Route | Filter / Route | Conditions to named relationships (`table == "users"`, `age >= 18`) |
| Script | Python Script | `def transform(row)` → dict, list of dicts, or `None` |
| Sink | PostgreSQL Tables | COPY / merge / insert, apply changes, create tables, post-load indexes, FKs, sequences |
| Sink | Discard | Terminates a branch |

### Different paths per table

One source can read many tables and send each down its own path: a
connection can carry **only some tables** (click the connection → "Tables on
this connection"). For example:

```
Legacy tables (user, applicant, employer_users)
  ──[user]────────────→ Lookup "User names" ──→ PostgreSQL Tables
  ──[employer_users]──→ Python Script ────────→ PostgreSQL Tables
  ──[applicant]───────────────────────────────→ PostgreSQL Tables
```

A table that no connection carries stops at that node, and the run log says
so. Preview and the Target tables dialog follow the same routing.

### One table enriched from others (joins)

When a target row is one source row plus fields that live in other tables,
use a **Lookup** node, which can hold several lookup tables applied in order
(or chain several Lookup nodes). For example, `users.first_name/last_name`
come from `applicant` or, failing that, from `employer_users`:

```
Database Tables (user)
  → Lookup  applicant       key user_id = id   fields first_name, last_name
  → Lookup  employer_users  key user_id = id   fields first_name, last_name, phone
            when the column already has a value: “Keep it — only fill empty values”
            only lookup rows where: deleted = 0
  → PostgreSQL Tables       user → users
```

The second lookup behaves like `COALESCE(applicant.x, employer_users.x)`. Lookups
run as batched `IN (…)` queries with a cache, so they scale to millions of
rows. When a key has several rows, the first one (by key, then primary key)
wins. The Target tables dialog shows these columns as “added by Names from
applicant”.

### Several tables into one, and scripts that route rows

- **Many → one.** Map several incoming tables to the same target (Target tables
  dialog, or a Rename Tables step). A new target is created from the *union* of
  their columns. Columns a feeder doesn't provide are nullable, and indexes and
  FKs from all feeders are built after load. With merge, a key shared between
  feeders means the later row overwrites the earlier one; the plan and a run
  bulletin warn about this. Keep keys disjoint, or put a source column in the key.
- **One → many from a script.** Set `row["_table"] = "other_table"` in a
  Python Script to send that row to another table. The `_table` key itself is
  never written, and the new table shows up in the plan like any other.

Rows that fail on any node leave on its `failure` relationship. If that
relationship isn't connected, the rows are stored as dead letters with the
error, viewable per run.

### Folders

A flow can sit in a folder (nested with `/`, e.g. `migrations/shortlisting`).
The flow list groups by folder, each group collapses, and a folder filter
narrows the page. Select flows and "Move to folder" puts them somewhere in
one go — the way to keep a hundred flows navigable.

### History

Every save of a flow is kept (the last 50). The clock button on the canvas
lists them with who saved them and the note the API was given, says what
restoring one would change (nodes added, removed or reconfigured, and
connections), and puts it back. A restore is itself a save, so it can be
undone.

### Queues, retries and replay

While a run goes, the **Queues** tab shows every connection: how many rows
wait on it, how many have passed, a peek at the rows of the most recent
batch, and a button to throw away what is queued (those chunks then commit as
if they had been written).

A connection can also decide what happens when the node it feeds fails on a
batch:

- **Retry** it a few times, waiting a little longer each time — for the
  transient: a dropped connection, a deadlock, a target that was briefly away.
- **When the retries are used up**: stop the run (the default), or keep going
  and send those rows to dead letters.

Dead letters keep the row, the node that failed on it and why — and can be
**replayed**: the stored rows go back into that node and on through the rest
of the flow as a run of its own. Fix the cause, replay the rows that broke,
leave the rest alone.

### Parameters

A setting can refer to a parameter as `#{name}`, so one flow runs unchanged
against different environments — a target schema, a row filter, a path:

```
Target schema     #{schema}
Row filter        created_at >= '#{since}'
```

They are edited on the **Parameters** page, and the application can declare
its own (shown there but not editable, so deployment values stay where the
deployment defines them):

```go
nifi.Config{Parameters: []nifi.Parameter{
    {Name: "schema", Value: os.Getenv("TARGET_SCHEMA"), Description: "target schema"},
    {Name: "api_key", Value: os.Getenv("API_KEY"), Sensitive: true}, // never returned by the API
}}
```

A flow that names a parameter nobody defined fails validation, saying which.

### Schedules

A flow can run itself: open **Schedule** on its canvas and give it a cron
expression (`0 2 * * *`, `0 6 * * mon-fri`) or a shorthand (`@hourly`,
`@daily`, `@every 30m`). The flow list shows the expression and when it next
runs.

A scheduled start is exactly what pressing Run does. A flow still running
when its next time comes round is skipped (noted in that run's bulletins),
so slow runs never pile up, and an instance that was down when a flow was due
starts it once when it comes back rather than replaying every missed slot.
Times are the server's. `nifi.Config{NoScheduler: true}` turns scheduling off
for an instance.

### Following changes (live flows)

A flow does not have to read its source once and stop. Give it a **Table
Changes** source and it keeps going: rows are written as they appear at the
source, and the run ends only when you stop it.

It needs one column per table that moves whenever a row is written — the
`updated_at` every ORM already maintains. Rows are read in `(updated_at,
primary key)` order, so nothing is missed and nothing is read twice, and the
position is remembered against the **flow**, not the run: stop it, deploy,
start it again, and it carries on from the row it left off at rather than
re-reading the table.

Turn on the destination's **Apply changes from a feed**. A row the feed
reports as changed then overwrites the matching row, and a row it reports as
deleted is removed — in the order the changes arrived, so a row inserted and
then removed does not survive. Without it a deleted row would simply be left
behind, which validation warns about.

It is a setting beside the write mode, not one of its values, because the two
answer different questions. The write mode governs the **load**: a flow that
fills a table with "insert new, keep existing" keeps doing exactly that. A
**change** is not a duplicate — it is something that has just happened — so it
always overwrites. One flow can therefore load conservatively and still follow
faithfully.

Hard `DELETE`s are invisible to any source that polls a table — the row is
simply gone. Soft deletes are not: fill in **A row is deleted when** with an
expression over the row (`deleted_at != nil`, `status == "archived"`) and
those rows are removed from the destination instead of written. To follow
hard deletes, give the engine a source that reads the database's replication
log; see *Extending it* below, and set `Streaming: true` on it.

**Load it, then follow it — in one run.** Put both sources in the same flow:
a **Database Tables** source for the initial load and a **Table Changes**
source beside it, both feeding the same chain. The feed fixes its position
before anything runs, then waits until the load has finished before it starts
emitting — so the load is not racing the changes that would overtake it, and
a row changed *while* it was loading is still applied afterwards. The run
stays live once the load is done ("tables loaded; now following changes").

One flow then describes the whole life of a table: how it is first filled and
how it is kept up to date, with one mapping in between.

Live runs behave differently in a few places, all of them deliberate:

- The run page shows what it has written and deleted and how long it has been
  following, instead of a percentage of a total that does not exist.
- Nothing waits for one. A flow that depends on a live flow starts as soon as
  the live one is following, and a live run never occupies a parallel run
  slot.
- Post-load work (indexes, foreign keys, sequences) runs when the **load**
  finishes rather than when the run does — otherwise a flow that then follows
  its source for a week would never build an index or reset a sequence.
- A lookup set to drop rows it cannot enrich still lets a deletion through:
  what the row pointed at may have been deleted first, and dropping the
  deletion would leave the row in the destination for good.
- One page of changes is in flight per table at a time. The position only
  moves once those rows are written, which is what makes a restart exact.

A flow reading a table once and a flow following it are the same flow with a
different source, so the mapping in between — every rename, cast, lookup,
expression and script — is written once and used by both.

### Extending it: your own nodes and functions

The embedding app can add nodes to the palette and functions to every
expression, so a flow can use code the GUI could only re-implement.

```go
nifi.Config{
    // a transform (Category "Sink" for a sink, Ports for extra outputs)
    Processors: []nifi.Processor{{
        Type: "app.geocode", Label: "Geocode", Icon: "map-pin",
        Properties: []nifi.Property{{Key: "column", Label: "Address column", Kind: "column", Required: true}},
        New: func(s nifi.Settings) (nifi.Handler, error) {
            col := s.String("column")
            return nifi.Func(func(ctx context.Context, in *record.Batch) (*record.Batch, error) {
                … // enrich in.Rows, or emit to another port with a full Handler
                return in, nil
            }), nil
        },
    }},
    // a source: it lists its tables, samples them for previews and streams
    Sources: []nifi.Source{{
        Type: "app.api", Label: "Partner API", Icon: "cloud-download",
        New: func(s nifi.Settings) (nifi.Reader, error) { return &apiReader{page: s.Int("page_size", 500)}, nil },
    }, {
        // Streaming: Read blocks until the run is stopped. Rows carry what
        // happened to them, and the position survives restarts.
        Type: "app.binlog", Label: "Replication log", Icon: "radio", Streaming: true,
        New: func(s nifi.Settings) (nifi.Reader, error) { return &binlogReader{s: s}, nil },
    }},
    // functions, listed in the expression editor next to the built-ins
    Functions: []nifi.Function{{
        Name: "normalizePhone", Args: "value", Help: "+255 form of a local number",
        Fn: func(a ...any) (any, error) { return phone.Normalize(fmt.Sprint(a[0])), nil },
    }},
}
```

### A node from a Go function

Writing a `Handler` by hand means the engine can run your code but knows
nothing else about it — not what it emits, not which row a dropped one was,
not how to keep a change's insert/update/delete attached to the row it came
from. `nifi.Mapper` is the same node declared instead of assembled: the input
type says how to read a row, the output type says what the node emits.

```go
type User struct {
    ID      int64  `nifi:"id"`
    Name    string `nifi:"full_name"`
    Email   *string
    Secret  string `nifi:"-"`      // not written
}

nifi.Config{Processors: []nifi.Processor{
    nifi.Mapper[nifi.Row, User]{
        Type: "app.map_users", Label: "Map users", Icon: "user",
        PrimaryKey: []string{"id"},
        Properties: []nifi.Property{{Key: "domain", Label: "Email domain", Kind: "string"}},
        // Open builds the mapping from the node's settings and returns what
        // to release at the end. Use Map instead when the mapping needs
        // nothing but the row. Open runs whenever the node is built — which
        // includes checking a flow — so read settings here, but open
        // connections behind the first row (a sync.Once), not here.
        Open: func(s nifi.Settings) (nifi.MapFunc[nifi.Row, User], func(), error) {
            domain := s.String("domain")
            return func(ctx context.Context, in nifi.Row) (*User, error) {
                name, _ := in["name"].(string)
                if name == "" {
                    return nil, nil             // drop the row
                }
                return &User{ID: in["id"].(int64), Name: name}, nil
            }, nil, nil
        },
    }.Processor(),
}}
```

- **`nil` drops a row, an `error` fails only that row** — it goes to
  "failure" with the message while the rest of the batch goes on.
- **The output columns come from the type.** Field → column by the `nifi`
  tag, else `db`, else `json`, else snake_case; `-` leaves a field out;
  embedded structs flatten; a nil pointer is NULL.
- **The input is `nifi.Row`** (column → value) **or a struct**, filled from
  the incoming columns by name.
- **Operations follow their own row.** A mapping that drops rows makes
  position stop meaning identity; the library keeps each output row's
  insert/update/delete attached to the input row it came from, which is what
  a live flow needs and what is easy to get wrong by hand.
- **`Render`** takes over turning mapped values into rows, for a host that
  has to match an ORM's write rules exactly. Give `Columns` alongside it —
  or use `gormx` below, which fills both in.

### Writing onto a schema an ORM owns (`gormx`)

Migrating into tables a GORM application already writes to means matching
what *it* writes, and "every field, as it stands" is not that. GORM applies
rules on Create: a zero field takes its `default` tag, a zero
`CreatedAt`/`UpdatedAt` becomes now, and a column whose default lives in the
database is left out of the statement entirely while every row leaves it zero
— so the database applies it per row, instead of a zero overriding it.

`github.com/paulmanoni/nifi/gormx` is those rules, as a module of its own so
core nifi never links GORM:

```go
gormx.Mapper(nifi.Mapper[nifi.Row, User]{
    Type: "app.map_users", Label: "Map users", Map: mapUser,
}).Processor()
```

It fills in the node's columns, primary key and rendering from the model's
own schema — no connection needed, only the naming strategy, which you pass
with `gormx.Naming` if your app configures one. `gormx.Copy()` switches to
what a bulk COPY that ignores conflicts does instead: the struct as it
stands, no defaults, no timestamps, every column. `gormx.Describe` gives the
same thing without a node, for code that renders rows itself.

`gormx.Value` renders a single value the way a field is rendered — pointer
dereferenced, `driver.Valuer` asked, named scalar reduced. Reach for it
wherever a host computes a value some other way, an expression function most
of all: a helper's answer and a mapper's field have to reach the database
looking alike, and two implementations that agree by coincidence do not stay
agreeing.

### Saying what a node emits

A node that implements `Schematic` stops being opaque:

```go
func (h *myHandler) Columns(in []record.Column) ([]record.Column, error)
```

The designer then shows its output without running it, and the schema keeps
flowing through it when the sample it is given has no rows — which is exactly
when a node that renders from a schema tends to report fewer columns than it
really writes. A `Mapper` implements it already, from its output type.

A node gets everything a built-in one has: several output ports, per-row
failures (`out.Emit("failure", batch)` → dead letters with a message per
row), bulletins, and the optional `Starter` / `Finisher` / `Closer` /
`Previewer` / `Schematic` interfaces for setup, post-load work, cleanup,
previews and declaring a schema.
`Settings` reads the node's properties (`String`, `Int`, `Rows`, `Pairs`,
…), resolves a configured `Connection`, posts bulletins and says whether
this is a preview or a resumed run.

Properties render as real UI: `string`, `text`, `int`, `bool`, `select`,
`picker`, `expr`, `script`, `column(s)`, `table(s)`, `connection`, plus
`keyvalue` and `list` (edited in the table dialog, with `Columns` describing
the cells).

`picker` is `select` for a list too long to be a dropdown — a hundred
mappings, every table in a warehouse. It opens a searchable drawer showing
each `Option`'s `Label` and `Description`, so the choices can be read rather
than recognised:

```go
{Key: "migration", Label: "Migration", Kind: "picker", Required: true,
 Options: []nifi.Option{{Value: "users", Label: "users",
     Description: "user → users · 14 columns · key id"}, …}}
```

A source marked `Streaming: true` follows its input instead of reading it
once — a replication log, a queue, a change feed. Its `Read` blocks until the
context is cancelled, and the run it belongs to is live (see *Following
changes* above). Two things make it exact:

- Tag each row with what happened to it: `batch.Append(row, record.Delete)`
  (or `record.Insert` / `record.Update`). A PostgreSQL sink in **Apply
  changes** mode upserts and deletes accordingly; every other node carries
  the tag through untouched.
- Keep the position with `s.Remember(ctx, "cursor", pos)` and read it back
  with `s.Recall`. It is stored against the flow, not the run, so the next
  run continues. Write it from the batch's `record.Ticket` completion
  callback, so the position only moves once those rows are safely written.
- `s.LoadedFirst()` says whether the same flow read its sources once before
  this one started — the difference between "the tables have just been
  loaded, now follow them" and "follow only".
- `s.RunID` is the run the node belongs to (empty in a preview). Anything a
  host keeps for the length of a run — a prepared target, a warmed cache —
  belongs against it, so two runs never share and `Config.AfterRun` can drop
  it when the run ends. `Config.BeforeRun` gets the same id on its `FlowRef`.

Use them to reuse code that already exists — an app's mapping helpers, an
internal API, a file format the engine does not know — not to hide logic a
GUI transform could show.

## How large migrations stay safe

- **Chunking.** A single integer primary key is split into ranges read in
  parallel. Composite or text keys page with keyset reads. Tables without a
  key stream in one pass (flagged as not resumable).
- **Exactly-once bookkeeping.** Every batch holds a ticket for its chunk. The
  chunk is checkpointed in SQLite only after every derived batch is committed
  or deliberately dropped. Resume skips committed chunks.
- **Writes.** The default `merge` mode COPYs into a temp staging table, then
  runs `INSERT … ON CONFLICT (pk) DO UPDATE`, so a re-applied chunk is
  harmless. `copy` is the fastest mode for empty targets and switches to
  `merge_ignore` on resume.
- **Bad rows.** The row is found from the COPY error line, or by bisecting the
  batch, then dead-lettered while the rest commits. `MaxErrors` stops a run
  that is failing systematically.
- **Post-load.** Secondary indexes are built in parallel after the data is in.
  FKs are added `NOT VALID` and then validated; orphans are reported and the
  constraint is left in place. Identity sequences are reset to `MAX(pk)`,
  followed by `ANALYZE`.
- **MySQL quirks.** Zero dates become NULL. `tinyint(1)` and `bit(1)` become
  boolean, and unsigned types are widened. `enum`/`set` become text and `json`
  becomes jsonb. NUL bytes are stripped and invalid UTF-8 is repaired.

## Standalone

```bash
go run ./cmd/nifi -addr :8090 -config connections.json
```

`connections.json` holds `{"connections": [{"id": …, "driver": "mysql", …}]}`.

## Development

```bash
cd ui && npm install && npm run build      # rebuilds ui/dist (committed)
NIFI_UI_DIR=ui/dist go run ./cmd/nifi      # serve the UI from disk: refresh after rebuilds
go test ./...                              # unit + API tests
NIFI_TEST_PG=1 NIFI_TEST_MYSQL=127.0.0.1:3407 go test ./...   # + database integration
```

Integration fixtures: `testdata/seed_pg.sql` (PostgreSQL databases `nifi_src`
and an empty `nifi_tgt`, user `postgres` on localhost) and
`testdata/seed_mysql.sql` (MySQL as root without a password).
