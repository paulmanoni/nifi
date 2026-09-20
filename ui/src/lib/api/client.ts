import type { ExprFunction, FlowVersion, Parameter, QueueInfo,
  Bulletin,
  Column,
  Connection,
  ConnectionTestResult,
  DeadLetterPage,
  ExprTestResponse,
  Flow,
  Graph,
  Issue,
  Meta,
  Option,
  PreviewResponse,
  ProcessorSpec,
  RunAllResult,
  RunDetail,
  RunSummary,
  SchemaResponse,
  StopAllResult,
  ScriptTestRequest,
  SinkPlan,
  ScriptTestResponse,
  TableMeta,
  TableSummary,
  WizardRequest,
} from './types';

declare global {
  interface Window {
    __NIFI__?: { base?: string };
  }
}

export const base: string = (window.__NIFI__?.base ?? '').replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  /** Already surfaced to the user (e.g. the global 403 toast) — callers need not toast it again. */
  handled = false;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Global 401/403 hooks, installed by the auth store (avoids an import cycle). */
export const authHooks = {
  unauthorized: (_message: string) => {},
  forbidden: (_err: ApiError, _method: string, _path: string) => {},
};

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}/api${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(`Network error: ${(e as Error).message}`, 0);
  }
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) throw new ApiError(text.slice(0, 300) || res.statusText, res.status);
      throw new ApiError('Invalid JSON from server', res.status);
    }
  }
  // A bare {"error": "..."} body is an error even on 2xx; responses that
  // legitimately carry an `error` field (schema, script test, connection test) have other keys.
  const bareError =
    data && typeof data === 'object' && !Array.isArray(data) && typeof data.error === 'string' && Object.keys(data).length === 1;
  if (!res.ok || bareError) {
    const err = new ApiError(data?.error ?? `${res.status} ${res.statusText}`, res.status);
    // Login/logout answer 401 for bad credentials — that's a form error, not a lost session.
    if (path.startsWith('/auth/')) throw err;
    if (res.status === 401) {
      err.handled = true;
      authHooks.unauthorized(err.message);
    } else if (res.status === 403) {
      authHooks.forbidden(err, method, path);
    }
    throw err;
  }
  return data as T;
}

const get = <T>(p: string, signal?: AbortSignal) => request<T>('GET', p, undefined, signal);
const post = <T>(p: string, b?: unknown, signal?: AbortSignal) => request<T>('POST', p, b ?? {}, signal);
const put = <T>(p: string, b: unknown) => request<T>('PUT', p, b);
const del = <T>(p: string) => request<T>('DELETE', p);
const enc = encodeURIComponent;

export const api = {
  meta: () => get<Meta>('/meta'),
  login: (username: string, password: string) => post<{ ok: true; user: string }>('/auth/login', { username, password }),
  logout: () => post<{ ok: true }>('/auth/logout'),
  processors: () => get<ProcessorSpec[]>('/processors'),
  types: () => get<Option[]>('/types'),
  functions: () => get<ExprFunction[]>('/functions'),
  parameters: () => get<Parameter[]>('/parameters'),
  saveParameter: (name: string, p: Partial<Parameter>) => put<Parameter>(`/parameters/${encodeURIComponent(name)}`, p),
  deleteParameter: (name: string) => del<{ ok: boolean }>(`/parameters/${encodeURIComponent(name)}`),
  versions: (id: string) => get<FlowVersion[]>(`/flows/${id}/versions`),
  version: (id: string, v: number) => get<FlowVersion>(`/flows/${id}/versions/${v}`),
  restoreVersion: (id: string, v: number) => post<Flow>(`/flows/${id}/versions/${v}/restore`, {}),
  setFolder: (ids: string[], folder: string) => post<{ ok: boolean; moved: number }>(`/flows/folder`, { ids, folder }),
  queues: (runId: string) => get<QueueInfo[]>(`/runs/${runId}/queues`),
  emptyQueue: (runId: string, edgeId: string) => post<{ droppedRows: number }>(`/runs/${runId}/queues/${encodeURIComponent(edgeId)}/empty`, {}),
  replayDeadLetters: (runId: string, nodeId: string, ids?: string[]) => post<RunSummary>(`/runs/${runId}/deadletters/replay`, { nodeId, ids }),
  setSchedule: (id: string, schedule: string, enabled: boolean) => put<Flow>(`/flows/${id}/schedule`, { schedule, enabled }),

  connections: () => get<Connection[]>('/connections'),
  testConnection: (id: string) => post<ConnectionTestResult>('/connections/test', { id }),
  tables: (id: string, signal?: AbortSignal) => get<TableSummary[]>(`/connections/${enc(id)}/tables`, signal),
  tableMeta: (id: string, table: string) => get<TableMeta>(`/connections/${enc(id)}/tables/${enc(table)}`),

  flows: () => get<Flow[]>('/flows'),
  flow: (id: string) => get<Flow>(`/flows/${enc(id)}`),
  createFlow: (f: { name: string; description?: string; graph?: Graph; dependsOn?: string[] }) => post<Flow>('/flows', f),
  updateFlow: (id: string, f: { name?: string; description?: string; graph?: Graph; dependsOn?: string[] }) =>
    put<Flow>(`/flows/${enc(id)}`, f),
  deleteFlow: (id: string) => del<{ ok: true }>(`/flows/${enc(id)}`),
  duplicateFlow: (id: string) => post<Flow>(`/flows/${enc(id)}/duplicate`),
  validate: (graph: Graph) => post<Issue[]>('/flows/validate', { graph }),
  wizard: (w: WizardRequest) => post<Flow>('/flows/wizard', w),
  schema: (graph: Graph, nodeId: string, signal?: AbortSignal) =>
    post<SchemaResponse>('/flows/schema', { graph, nodeId }, signal),
  preview: (graph: Graph, nodeId: string, table?: string, limit?: number, signal?: AbortSignal) =>
    post<PreviewResponse>('/flows/preview', { graph, nodeId, table: table || undefined, limit }, signal),

  sinkPlan: (graph: Graph, nodeId: string, signal?: AbortSignal) => post<SinkPlan>('/flows/sink-plan', { graph, nodeId }, signal),

  scriptTest: (r: ScriptTestRequest) => post<ScriptTestResponse>('/script/test', r),
  exprTest: (expr: string, columns: Column[], row: any[]) => post<ExprTestResponse>('/expr/test', { expr, columns, row }),

  startRun: (flowId: string, resume = false, withDependencies = true) =>
    post<RunSummary>(`/flows/${enc(flowId)}/runs`, { resume, withDependencies }),
  runAll: (flowIds: string[] = [], resume = false) => post<RunAllResult>('/runs/all', { flowIds, resume }),
  stopAll: (flowIds: string[] = []) => post<StopAllResult>('/runs/stop-all', { flowIds }),
  flowRuns: (flowId: string) => get<RunSummary[]>(`/flows/${enc(flowId)}/runs`),
  run: (id: string) => get<RunDetail>(`/runs/${enc(id)}`),
  pauseRun: (id: string) => post<RunSummary>(`/runs/${enc(id)}/pause`),
  resumeRun: (id: string) => post<RunSummary>(`/runs/${enc(id)}/resume`),
  stopRun: (id: string) => post<RunSummary>(`/runs/${enc(id)}/stop`),
  bulletins: (id: string, after = 0) => get<Bulletin[]>(`/runs/${enc(id)}/bulletins?after=${after}`),
  deadLetters: (id: string, table = '', offset = 0, limit = 50) =>
    get<DeadLetterPage>(`/runs/${enc(id)}/deadletters?table=${enc(table)}&offset=${offset}&limit=${limit}`),
  activeRuns: () => get<RunSummary[]>('/runs/active'),
};

export type RunStreamHandlers = {
  detail?: (d: RunDetail) => void;
  bulletin?: (b: Bulletin) => void;
  end?: (s: RunSummary) => void;
  connection?: (state: 'open' | 'reconnecting') => void;
};

/** Subscribes to a run's SSE stream with auto-reconnect. Returns a close function. */
export function streamRun(runId: string, h: RunStreamHandlers): () => void {
  let es: EventSource | null = null;
  let closed = false;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const parse = <T>(e: MessageEvent): T | null => {
    try {
      return JSON.parse(e.data) as T;
    } catch {
      return null;
    }
  };

  const open = () => {
    if (closed) return;
    es = new EventSource(`${base}/api/runs/${enc(runId)}/events`);
    es.onopen = () => {
      retry = 0;
      h.connection?.('open');
    };
    es.addEventListener('detail', (e) => {
      const d = parse<RunDetail>(e as MessageEvent);
      if (d) h.detail?.(d);
    });
    es.addEventListener('bulletin', (e) => {
      const b = parse<Bulletin>(e as MessageEvent);
      if (b) h.bulletin?.(b);
    });
    es.addEventListener('end', (e) => {
      const s = parse<RunSummary>(e as MessageEvent);
      closed = true;
      es?.close();
      if (s) h.end?.(s);
    });
    es.onerror = () => {
      if (closed) return;
      es?.close();
      h.connection?.('reconnecting');
      const delay = Math.min(10000, 500 * 2 ** retry++);
      timer = setTimeout(open, delay);
    };
  };
  open();
  return () => {
    closed = true;
    clearTimeout(timer);
    es?.close();
  };
}
