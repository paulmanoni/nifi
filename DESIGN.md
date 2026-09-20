# nifi — embeddable, UI-first data migration flows for Go apps

A NiFi-style flow designer and runtime you embed in an existing Go service as a
library. Users draw a flow on a canvas (source → transforms → sink), configure
each processor through generated forms, preview data at any node, and drop into
a Python-dialect script (Starlark) only when a GUI transform is not enough.

Scope of v1: **MySQL → PostgreSQL** and **PostgreSQL → PostgreSQL**, sized for
databases with hundreds of tables and tables with 100M+ rows.

## Packaging

```
github.com/paulmanoni/nifi            engine: New(Config) → *Engine, Engine.Handler()
github.com/paulmanoni/nifi/nexusnifi  nexus adapter: nexusnifi.Module(cfg) nexus.Option
github.com/paulmanoni/nifi/cmd/nifi   standalone binary (dev + ops use)
ui/                                   Svelte 5 + Vite source; ui/dist is committed and go:embed'ed
```

Consumers `go get` the module and never build the UI: `ui/dist` ships in the
module. The whole surface (JSON API, SSE, SPA) is one `http.Handler`, mounted
under any prefix; the SPA uses hash routing and relative asset URLs so it works
at `/nifi`, `/admin/migrations`, or the root.

Management state lives in a **SQLite** file (pure Go, modernc.org/sqlite):
flows, runs, chunk plans and checkpoints, per-node stats snapshots, bulletins,
and dead-lettered rows. Migrated data never touches SQLite, except rows that
failed and were dead-lettered.

**Connections are code-only.** The host app declares them in `nifi.Config`
(the nexus adapter can lift `[databases.*]` blocks from nexus.toml). The UI
lists, tests and browses them but cannot create or edit them, and credentials
never leave the server.

**Authorization** maps every call to one action: `view`, `edit`, `run`, or
`data` (anything that reveals row contents). It is decided either by the host
(`Config.Authorize`; the nexus adapter maps actions to `auth.Can`
permissions) or by built-in credentials (`Config.Users`: bcrypt or env
passwords, per-user actions, signed session cookie). The UI hides what
`/api/meta` says the user cannot do.

## Data model

Data moves as **record batches**, not NiFi byte blobs — a batch is a table name,
a schema, and `[][]any` rows (typically 1–5k rows). Before reading, a source
emits one zero-row *schema batch* per table on the same channels, so every
processor (and the sink's table creation) sees a table's shape even when the
table is empty. Processing is order-independent: sinks create tables lazily on
whichever batch arrives first.

Each batch carries the source table's metadata (primary key, indexes, foreign
keys, estimated rows). Column-shaping processors (rename, select, compute)
rewrite that metadata so the sink can recreate indexes and FKs under the new
names.

Logical types: `bool int16 int32 int64 uint64 float32 float64 decimal string
text bytes date time timestamp timestamptz json uuid enum set bit year` plus
precision/scale/length. Readers map native types in; writers map them out.

## Execution

Each node runs as a set of goroutines joined by **bounded channels**; a full
channel blocks the producer (back-pressure, the NiFi queue threshold). Transform
nodes have a `concurrency` setting; sources read disjoint chunks in parallel.

### Chunking (what makes large tables tractable)

A table is split into chunks before reading:

* single integer PK → range chunks `[lo, hi)` sized from MIN/MAX and row estimate,
  read in parallel with `WHERE pk >= ? AND pk < ?` (no OFFSET, no big sort);
* any other PK (composite, string, uuid) → sequential keyset pages
  `WHERE (a,b) > (?,?) ORDER BY a,b LIMIT n`, checkpointed per page;
* no PK → one streaming scan (warned in validation: not resumable).

The chunk plan is persisted in SQLite on the first run and reused on resume, so
chunk boundaries are stable across restarts.

### Acknowledgement and resume

Every batch holds a **ticket** for its chunk. Processors that split or route a
batch add references to the ticket; sinks release them only after the target
transaction commits; drops release immediately. When a chunk's ticket reaches
zero the chunk is marked done in SQLite. Resume skips done chunks. Sinks write
idempotently by default (stage + merge), so a chunk that committed just before a
crash but was never marked done is re-applied harmlessly.

### Writes to PostgreSQL

* `merge` (default): `COPY` into a temp staging table, then
  `INSERT … SELECT … ON CONFLICT (pk) DO UPDATE` — COPY speed, idempotent.
* `merge_ignore`: same with `DO NOTHING`.
* `copy`: straight `COPY` — fastest, for fresh loads into empty tables.
* `insert`: staged COPY + plain `INSERT` (duplicates become dead letters).

A failed chunk is retried with backoff; if it still fails, the sink bisects the
batch to isolate the offending rows, writes the good ones, and dead-letters the
bad ones with the database error. One malformed row never stops a 100M-row table.

Schema handling on the sink: create missing tables from the incoming schema,
optionally truncate first, load without secondary indexes/FKs, then after all
data is in: build indexes (parallel), add FKs (`NOT VALID` + `VALIDATE`), and
reset identity sequences to `MAX(pk)`.

MySQL quirks handled by the sink's `sanitize` option (on by default): zero dates
→ NULL, NUL bytes stripped from text, invalid UTF-8 repaired, `tinyint(1)` →
boolean, unsigned widening, `enum`/`set` → text, `json` → jsonb.

## Transforms: GUI first, script last

GUI processors cover the common cases without code: rename / select / drop
columns, computed columns via expressions (expr-lang, e.g.
`lower(trim(email))`), filter, cast, value mapping, lookup against another
database table (batched `IN` queries, cached), route by table or expression, rename tables.

`Script` runs **Starlark** (a Python dialect interpreted in pure Go — sandboxed,
deterministic, no CGO): either `def transform(row)` returning a dict, a list of
dicts (fan-out), or `None` (drop), or `def transform_batch(rows)`. Scripts get
helpers for JSON, regex, dates, hashing, and lookups. Every script and
expression can be tested against sample rows in the editor before running.

Row-level errors never abort a run: the row goes to the node's `failure`
relationship, and an unconnected `failure` lands in the dead-letter store.

## Observability

Per node: rows in/out, batches, errors, queued rows on each outgoing edge,
throughput. Per table: estimated rows, rows read/written, chunks done/total.
Pushed to the UI over Server-Sent Events once a second while a run is live.
Bulletins (warnings/errors) are persisted per run.
