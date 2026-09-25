// Mirrors API.md exactly — the JSON contract with the Go engine.

export type Permissions = { view: boolean; edit: boolean; run: boolean; data: boolean };

export type Meta = {
  version: string;
  title: string;
  user?: string;
  permissions: Permissions;
  /** Present on newer engines: the authorizer mode and whether the caller is signed in. */
  auth?: 'none' | 'host' | 'builtin';
  authenticated?: boolean;
  /** Max runs executing at once (0 = unlimited); extra runs wait as `pending`. */
  maxParallelRuns?: number;
};

// ---------- processor catalog ----------

export type Category = 'Source' | 'Transform' | 'Route' | 'Script' | 'Sink';

export type PropertyKind =
  | 'string'
  | 'text'
  | 'int'
  | 'bool'
  | 'select'
  | 'picker'
  | 'connection'
  | 'table'
  | 'tables'
  | 'columns'
  | 'column'
  | 'keyvalue'
  | 'list'
  | 'expr'
  | 'script';

export type Option = { value: string; label: string; description?: string };

export type ListColumnKind = 'string' | 'expr' | 'select' | 'column' | 'type';

export type ListColumnSpec = {
  key: string;
  label: string;
  kind: ListColumnKind;
  options?: Option[];
};

export type PropertySpec = {
  key: string;
  label: string;
  kind: PropertyKind;
  required?: boolean;
  default?: any;
  help?: string;
  options?: Option[];
  connectionKey?: string;
  showIf?: { key: string; equals: any };
  columns?: ListColumnSpec[];
};

export type ProcessorSpec = {
  type: string;
  label: string;
  category: Category;
  description: string;
  icon: string;
  inputs: 0 | 1;
  relationships: string[];
  dynamicRelationships?: string;
  supportsConcurrency: boolean;
  properties: PropertySpec[];
};

// ---------- connections ----------

export type Driver = 'mysql' | 'postgres';

/** Declared by the host application in code; the UI never creates, edits or deletes them. */
export type Connection = {
  id: string;
  name: string;
  driver: Driver;
  host: string;
  port: number;
  user: string;
  database: string;
  description?: string;
  /** Added here rather than declared by the application, so it can be changed here. */
  managed?: boolean;
};

/** What a connection is saved with. The password is write-only: it is never
 *  returned, and leaving it empty on an edit keeps the one already stored. */
export type ConnectionInput = {
  name: string;
  driver: Driver;
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
  description?: string;
  params?: Record<string, string>;
};

export type ConnectionTestResult =
  | { ok: true; serverVersion: string; latencyMs: number }
  | { ok: false; error: string };

export type TableSummary = {
  schema: string;
  name: string;
  estimatedRows: number;
  sizeBytes: number;
  hasPrimaryKey: boolean;
};

export type Column = {
  name: string;
  type: string;
  nativeType: string;
  nullable: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  default?: string;
};

export type IndexMeta = { name: string; columns: string[]; unique: boolean };

export type ForeignKeyMeta = {
  name: string;
  columns: string[];
  refTable: string;
  refColumns: string[];
  onDelete: string;
  onUpdate: string;
};

export type TableMeta = {
  schema: string;
  name: string;
  columns: Column[];
  primaryKey: string[];
  indexes: IndexMeta[];
  foreignKeys: ForeignKeyMeta[];
  estimatedRows: number;
};

// ---------- flows ----------

export type Viewport = { x: number; y: number; zoom: number };

export type GraphNode = {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  concurrency?: number;
  disabled?: boolean;
  notes?: string;
};

export type GraphEdge = {
  id: string;
  from: string;
  fromPort: string;
  to: string;
  backPressureRows?: number;
  /** only these tables travel along the connection; absent/empty = all */
  tables?: string[];
  /** how often to try the destination again when it fails on a batch */
  retries?: number;
  /** wait before the first retry ("2s"), doubling each time */
  retryBackoff?: string;
  /** when the retries are used up: stop the run, or keep going */
  onFailure?: 'fail' | 'dead_letter';
};

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; viewport?: Viewport };

export type Flow = {
  id: string;
  name: string;
  description: string;
  graph: Graph | null;
  /** Flow ids that must complete before this one runs. */
  dependsOn?: string[];
  /** cron expression or shorthand ("0 2 * * *", "@every 30m") */
  schedule?: string;
  scheduleEnabled?: boolean;
  lastFire?: string;
  /** when the schedule fires next (computed by the server) */
  nextRun?: string;
  /** groups flows in the list; nested with "/" */
  folder?: string;
  /** counts saved edits */
  version?: number;
  createdAt: string;
  updatedAt: string;
  lastRun?: RunSummary;
};

export type Issue = {
  nodeId?: string;
  edgeId?: string;
  level: 'error' | 'warning';
  message: string;
};

export type WriteMode = 'merge' | 'merge_ignore' | 'copy' | 'insert';

export type WizardRequest = {
  name: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  tables: string[];
  targetSchema: string;
  mode: WriteMode;
  createTables: boolean;
  truncate: boolean;
};

export type SchemaResponse = {
  tables: { table: string; columns: Column[] }[];
  error?: string;
};

export type FlowVersion = {
  flowId: string;
  version: number;
  name: string;
  description?: string;
  dependsOn?: string[];
  graph?: Graph;
  savedAt: string;
  actor?: string;
  note?: string;
};

export type QueueInfo = {
  edgeId: string;
  from: string;
  fromName: string;
  fromPort: string;
  to: string;
  toName: string;
  queuedRows: number;
  capacityRows: number;
  rowsPassed: number;
  rowsDropped?: number;
  retried?: number;
  retries?: number;
  onFailure?: string;
  table?: string;
  columns?: Column[];
  rows?: any[][];
  seenAt?: string;
};

export type Parameter = {
  name: string;
  value: string;
  description?: string;
  sensitive?: boolean;
  updatedAt?: string;
  /** set by the host application; not editable here */
  fixed?: boolean;
};

export type ExprFunction = { name: string; args?: string; help?: string; group?: string };

export type SinkPlanColumnStatus = 'create' | 'match' | 'add' | 'type_differs' | 'retype' | 'dropped' | 'skipped' | 'target_only';

export type SinkPlanColumn = {
  /** target column */
  name: string;
  /** incoming column (absent for target_only) */
  source?: string;
  /** an explicit column_map entry applies */
  mapped?: boolean;
  /** flow step that created the column (e.g. a Python Script) */
  introducedBy?: string;
  /** existing target column that looks like the same field */
  suggest?: string;
  sourceType?: string;
  targetType?: string;
  nullable: boolean;
  primaryKey?: boolean;
  /** conversion applied to incoming values */
  cast?: string;
  /** configured PostgreSQL type of the target column */
  setType?: string;
  /** computed column expression */
  expr?: string;
  status: SinkPlanColumnStatus;
  note?: string;
};

export type SinkPlanTable = {
  source: string;
  schema: string;
  table: string;
  mapped: boolean;
  exists: boolean;
  action: 'create' | 'load' | 'error';
  mode: string;
  truncate: string;
  conflictKey: string[];
  columns: SinkPlanColumn[];
  ddl?: string;
  /** ALTER COLUMN … TYPE statements run before loading */
  alter?: string[];
  indexes: string[];
  foreignKeys: string[];
  warnings: string[];
  error?: string;
  /** other incoming tables writing into the same target table */
  sharedWith: string[];
};

export type SinkPlan = { totalTables: number; truncated: boolean; tables: SinkPlanTable[] };

export type PreviewStage = {
  nodeId: string;
  name: string;
  type: string;
  port: string;
  /** table name as it leaves this stage (after any renames) */
  table?: string;
  columns: Column[];
  rows: any[][];
  errors: { row: number; message: string }[];
};

export type PreviewResponse = {
  table: string;
  tables: string[];
  stages: PreviewStage[];
  /** rows arriving at the previewed node (null for sources / when none reach it) */
  input?: PreviewStage | null;
  /** whether the shown table reaches the node (tables can be routed per connection) */
  reaches?: boolean;
};

export type ScriptTestRequest = {
  script: string;
  mode: 'row' | 'batch';
  columns: Column[];
  rows: any[][];
};

export type ScriptTestResponse = {
  columns: Column[];
  rows: any[][];
  dropped: number;
  error?: string;
  line?: number;
  logs: string[];
};

export type ExprTestResponse = { value: any; type: string; error?: string };

// ---------- runs ----------

export type RunStatus = 'pending' | 'running' | 'paused' | 'stopping' | 'stopped' | 'completed' | 'failed';

export type RunSummary = {
  id: string;
  flowId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  rowsRead: number;
  rowsWritten: number;
  rowsFailed: number;
  error?: string;
  /** a run that follows its source instead of reading it once: it ends only when stopped */
  live?: boolean;
};

export type NodeStats = {
  nodeId: string;
  rowsIn: number;
  rowsOut: number;
  batchesIn: number;
  errors: number;
  rowsPerSec: number;
  active: number;
};

export type EdgeStats = {
  edgeId: string;
  queuedRows: number;
  capacityRows: number;
  rowsPassed: number;
  /** rows discarded by emptying the queue */
  rowsDropped?: number;
  /** batches the destination was given another try */
  retried?: number;
};

export type TableProgress = {
  table: string;
  status: 'pending' | 'reading' | 'done' | 'failed';
  estimatedRows: number;
  rowsRead: number;
  rowsWritten: number;
  /** rows removed from the destination because the source deleted them */
  rowsDeleted?: number;
  rowsFailed: number;
  chunksDone: number;
  chunksTotal: number;
};

export type RunPhase = 'loading' | 'indexes' | 'constraints' | 'sequences' | '';

export type RunDetail = RunSummary & {
  nodes: NodeStats[];
  edges: EdgeStats[];
  tables: TableProgress[];
  phase: RunPhase | string;
};

export type Bulletin = {
  seq: number;
  time: string;
  level: 'info' | 'warn' | 'error';
  nodeId?: string;
  table?: string;
  message: string;
};

export type DeadLetter = {
  id: string;
  nodeId: string;
  table: string;
  error: string;
  row: Record<string, any>;
  time: string;
};

export type DeadLetterPage = { total: number; items: DeadLetter[] };

export type RunAllResult = {
  started: RunSummary[];
  skipped: { flowId: string; name: string; reason: string }[];
};

export type StopAllResult = { stopped: RunSummary[] };

export const ACTIVE_STATUSES: RunStatus[] = ['pending', 'running', 'paused', 'stopping'];
export const isActive = (s?: RunStatus) => !!s && ACTIVE_STATUSES.includes(s);
