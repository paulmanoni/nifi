# nifi HTTP API (contract between engine and UI)

All paths are relative to the mount prefix. The server injects
`<script>window.__NIFI__={"base":"/nifi"}</script>` into `index.html`; the UI
prefixes every API call with `base`. JSON everywhere. Errors:
`{"error": "message"}` with a 4xx/5xx status.

## Meta

`GET /api/meta` →
`{"version":"0.1.0","title":"Data Flows","user":"ada","auth":"host","authenticated":true,"maxParallelRuns":0,"permissions":{"view":true,"edit":true,"run":false,"data":true}}`

## Authorization

The host app supplies an authorizer; every call is checked against one action:

| action | endpoints |
|---|---|
| `view` | UI shell, flows/runs/bulletins reads, processors, types, connections list, validate, SSE |
| `edit` | create/update/delete/duplicate flows, wizard, script/expr test |
| `run`  | start/resume a run, pause/resume/stop |
| `data` | table browsing, preview, schema, connection test, dead letters (they expose row contents) |

Denied calls answer `401 {"error"}` (not signed in) or `403 {"error"}`. The UI
reads `permissions` from `/api/meta` and hides or disables what the user
cannot do (never offer an action that would 403).

## Processor catalog

`GET /api/processors` → `ProcessorSpec[]`

```ts
type ProcessorSpec = {
  type: string              // "source.tables", "transform.rename", "sink.postgres", …
  label: string             // "Database Tables"
  category: "Source" | "Transform" | "Route" | "Script" | "Sink"
  description: string
  icon: string              // lucide icon name: "database", "pencil", "filter", "code", …
  inputs: 0 | 1             // sources have 0
  relationships: string[]   // static output ports, e.g. ["success","failure"]; sinks: ["failure"]
  dynamicRelationships?: string // property key whose list items' `name` add ports (route rules)
  supportsConcurrency: boolean
  streaming?: boolean       // a source that follows its input: a run of it is live
  hidden?: boolean          // not offered in the palette
  properties: PropertySpec[]
}

type PropertySpec = {
  key: string
  label: string
  kind: PropertyKind
  required?: boolean
  default?: any
  help?: string
  options?: {value: string, label: string, description?: string}[]
                      // kinds "select" and "picker"; only "picker" shows description
  connectionKey?: string   // for "table"/"tables": the property holding the connection id
  showIf?: {key: string, equals: any}          // conditional visibility
  columns?: {key: string, label: string, kind: "string"|"expr"|"select"|"column"|"type", options?: {value:string,label:string}[]}[]
                            // for kind "list": the row editor's columns
}

type PropertyKind =
  | "string" | "text" | "int" | "bool" | "select"
  | "picker"          // like select, for a list too long to scan: a searchable
                      // drawer showing each option's label and description
  | "connection"      // select from GET /api/connections (value = connection id)
  | "table"           // one table of the connection in `connectionKey`
  | "tables"          // multi-select tables of `connectionKey` (empty = all)
  | "columns"         // multi-select from the node's input schema
  | "column"          // one column from input schema
  | "keyvalue"        // [{key, value}] — e.g. old name → new name
  | "list"            // [{...}] rows edited with `columns` definitions
  | "expr"            // one expression (monospace editor + Test button)
  | "script"          // Starlark code editor (CodeMirror python mode) + Test
```

Column kinds inside `list`: `column` = pick from input schema; `type` = pick a
logical type (`GET /api/types`); `expr` = expression field.

`GET /api/types` → `[{"value":"text","label":"text"}, …]`

## Connections (declared in code, read-only)

Connections are configured by the host application when it mounts the
library. The UI can list, test and browse them — it never creates, edits or
deletes them, and never sees credentials.

```ts
type Connection = { id: string; name: string; driver: "mysql" | "postgres";
                    host: string; port: number; user: string; database: string;
                    description?: string }
```

* `GET /api/connections` → `Connection[]`
* `POST /api/connections/test` `{id}` → `{"ok":true,"serverVersion":"8.0.36","latencyMs":4}` or `{"ok":false,"error":"…"}`
* `GET /api/connections/:id/tables` → `TableSummary[]`
  `{schema, name, estimatedRows, sizeBytes, hasPrimaryKey}`
* `GET /api/connections/:id/tables/:table` → `TableMeta` (`:table` may be `schema.table`)

```ts
type Column = { name: string; type: string; nativeType: string; nullable: boolean;
                length?: number; precision?: number; scale?: number; default?: string }
type TableMeta = { schema: string; name: string; columns: Column[]; primaryKey: string[];
                   indexes: {name:string, columns:string[], unique:boolean}[];
                   foreignKeys: {name:string, columns:string[], refTable:string, refColumns:string[], onDelete:string, onUpdate:string}[];
                   estimatedRows: number }
```

## Flows

```ts
type Flow = { id: string; name: string; description: string; graph: Graph;
              dependsOn: string[]      // flow ids that must complete before this one runs
              createdAt: string; updatedAt: string; lastRun?: RunSummary }
type Graph = { nodes: Node[]; edges: Edge[]; viewport?: {x:number,y:number,zoom:number} }
type Node = { id: string; type: string; name: string; position: {x:number,y:number};
              config: Record<string, any>; concurrency?: number; disabled?: boolean; notes?: string }
type Edge = { id: string; from: string; fromPort: string; to: string;
              backPressureRows?: number     // default 20000
              tables?: string[] }           // only these tables travel along it; absent = all
```

* `GET /api/flows` → `Flow[]` (graph omitted: `graph: null`)
* `POST /api/flows` `{name, description?, graph?, dependsOn?}` → `Flow`
* `GET /api/flows/:id` → `Flow`
* `PUT /api/flows/:id` `{name?, description?, graph?, dependsOn?}` → `Flow`
  (400 on unknown ids, self-reference or a cycle — the error names the cycle)
* `DELETE /api/flows/:id` → `{"ok":true}` (409 while another flow depends on it)
* `POST /api/flows/:id/duplicate` → `Flow`
* `GET /api/flows/:id/versions` → `FlowVersion[]` (newest first, no graphs)
* `GET /api/flows/:id/versions/:version` → `FlowVersion` with its graph
* `POST /api/flows/:id/versions/:version/restore` → the flow, saved as a new version
* `POST /api/flows/folder` `{ids, folder}` → `{ok, moved, folder}` ("" ungroups)
* `GET /api/runs/:id/queues` → `QueueInfo[]` — per connection: queued/passed/dropped
  rows, retries, and up to 20 rows of the most recent batch (empty for a finished run)
* `POST /api/runs/:id/queues/:edge/empty` → `{ok, droppedRows}`
* `POST /api/runs/:id/deadletters/replay` `{nodeId, ids?}` → the replay `RunSummary`
* `GET /api/parameters` → `{name, value, description?, sensitive?, fixed?, updatedAt}[]`
  (a sensitive parameter's value is always empty)
* `PUT /api/parameters/:name` `{value, description?, sensitive?}` → the parameter
* `DELETE /api/parameters/:name` → `{"ok":true}` (a `fixed` one is refused)
* `PUT /api/flows/:id/schedule` `{schedule, enabled}` → the flow with `nextRun`
  (400 when the expression does not parse)
* `GET /api/functions` → `{name, args?, help?, group?}[]` — every function
  expressions can call: the built-ins plus whatever the host registered
  (`Config.Functions`). Shown in the expression editor.
* `POST /api/flows/validate` `{graph}` → `Issue[]`
  `{nodeId?: string, edgeId?: string, level: "error"|"warning", message: string}`
* `POST /api/flows/wizard` →  creates a ready flow for whole-database migration:
  `{name, sourceConnectionId, targetConnectionId, tables: string[] /*empty=all*/, targetSchema: "public", mode: "merge"|"copy"|..., createTables: true, truncate: false}` → `Flow`

### Schema at a node

`POST /api/flows/schema` `{graph, nodeId}` →
`{tables: [{table: string, columns: Column[]}], error?: string}` — the schema
*arriving at* the node's input (for `columns`/`column` pickers). For a source,
its output.

### Preview

`POST /api/flows/preview` `{graph, nodeId, table?: string, limit?: number}` →

```ts
{ table: string, tables: string[],       // tables available at this node; `table` = the one shown
  stages: { nodeId: string, name: string, type: string,
            port: string,                // relationship the rows left on
            columns: Column[], rows: any[][], errors: {row: number, message: string}[] }[] }
```

Runs `limit` (default 20) rows from the upstream source through each node on the
path to `nodeId` without writing anything (sinks report the SQL they would run in
`errors` = [] and rows = what would be written).

### Sink plan (PostgreSQL Tables node)

`POST /api/flows/sink-plan` `{graph, nodeId}` (data permission) → what the sink
will do for every table reaching it, without writing anything:

```ts
{ totalTables: number, truncated: boolean,          // capped at 500 tables
  tables: {
    source: string                // incoming table name (key in config.table_map)
    schema: string; table: string // resolved target (after table_map, schema, name case)
    mapped: boolean               // an explicit table_map entry exists
    exists: boolean
    action: "create" | "load" | "error"
    mode: string; truncate: string; conflictKey: string[]
    columns: { name: string            // target column
               source?: string          // incoming column (absent for target_only)
               mapped?: boolean         // an explicit column_map entry applies
               introducedBy?: string    // flow step that created it (e.g. a Python Script), else from the source
               suggest?: string         // existing target column that looks like the same field
               sourceType?: string; targetType?: string; nullable: boolean; primaryKey?: boolean;
               status: "create"|"match"|"add"|"type_differs"|"dropped"|"skipped"|"target_only";
               note?: string }[]
    ddl?: string                  // CREATE TABLE … for action "create"
    indexes: string[]; foreignKeys: string[]   // built after load (created tables)
    warnings: string[]; error?: string
    sharedWith: string[]          // other incoming tables writing into the same target
  }[] }
```

The mapping itself lives in the sink's config:
* `table_map`: `[{key: incoming table, value: "schema.table" | "table"}]`
* `column_map`: `[{table: incoming table, from: incoming column, to: target column | "" (skip)}]`
  — unlisted columns keep their name (after the sink's name case).

Columns added by transforms/scripts are detected by running sample rows (3)
through the flow, so a script that only adds a column for some rows shows it
when the sample contains such a row.

### Testing code

* `POST /api/script/test` `{script, mode: "row"|"batch", columns: Column[], rows: any[][]}` →
  `{columns, rows, dropped: number, error?: string, line?: number, logs: string[]}`
* `POST /api/expr/test` `{expr, columns, row: any[]}` → `{value: any, type: string, error?: string}`

## Runs

```ts
type RunStatus = "pending"|"running"|"paused"|"stopping"|"stopped"|"completed"|"failed"
type RunSummary = { id: string; flowId: string; status: RunStatus; startedAt: string;
                    finishedAt?: string; rowsRead: number; rowsWritten: number;
                    rowsFailed: number; error?: string;
                    live?: boolean /* follows its source; ends only when stopped */ }
type NodeStats = { nodeId: string; rowsIn: number; rowsOut: number; batchesIn: number;
                   errors: number; rowsPerSec: number; active: number /* busy workers */ }
type EdgeStats = { edgeId: string; queuedRows: number; capacityRows: number; rowsPassed: number }
type TableProgress = { table: string; status: "pending"|"reading"|"done"|"failed";
                       estimatedRows: number; rowsRead: number; rowsWritten: number;
                       rowsDeleted?: number /* removed because the source deleted them */;
                       rowsFailed: number; chunksDone: number; chunksTotal: number }
type RunDetail = RunSummary & { nodes: NodeStats[]; edges: EdgeStats[]; tables: TableProgress[];
                                phase: string /* "loading" | "indexes" | "constraints" | "sequences" | "" */ }
type Bulletin = { seq: number; time: string; level: "info"|"warn"|"error"; nodeId?: string;
                  table?: string; message: string }
```

* `POST /api/flows/:id/runs` `{resume?: boolean, withDependencies?: boolean /*default true*/}` →
  `RunSummary`. `resume` continues the latest unfinished run, skipping committed
  chunks. With dependencies, prerequisites whose latest run is not `completed`
  run first; this run then starts as `pending` and begins when they complete.
* `POST /api/runs/all` `{flowIds?: string[] /*empty = every flow*/, resume?: boolean}` →
  `{started: RunSummary[], skipped: {flowId, name, reason}[]}` — starts flows in
  dependency order; runs wait as `pending` for their prerequisites (and for a free
  slot when `maxParallelRuns` > 0). A run whose prerequisite fails or is stopped
  ends `stopped` with `error` = `dependency "X" did not complete (failed)`.
* `POST /api/runs/stop-all` `{flowIds?: string[]}` → `{stopped: RunSummary[]}`
  (stops running, paused and pending runs)
* `GET /api/flows/:id/runs` → `RunSummary[]` (newest first)
* `GET /api/runs/:id` → `RunDetail`
* `POST /api/runs/:id/pause` | `/resume` | `/stop` → `RunSummary`
* `GET /api/runs/:id/bulletins?after=<seq>` → `Bulletin[]`
* `GET /api/runs/:id/deadletters?table=&offset=0&limit=50` →
  `{total: number, items: [{id, nodeId, table, error, row: Record<string,any>, time}]}`
* `GET /api/runs/:id/events` — **SSE**. Events:
  * `event: detail` data: `RunDetail` (≈ every 1s while live, and once on connect)
  * `event: bulletin` data: `Bulletin`
  * `event: end` data: `RunSummary` (then the stream closes)
* `GET /api/runs/active` → `RunSummary[]` (running/paused across all flows)
