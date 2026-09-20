import type { Flow, RunSummary } from '../api/types';

/** Latest run per flow: a live (active) run wins over the flow's stored lastRun. */
export function latestRuns(flows: Flow[], active: RunSummary[]): Map<string, RunSummary | undefined> {
  const byFlow = new Map<string, RunSummary>();
  for (const r of active) {
    const cur = byFlow.get(r.flowId);
    if (!cur || +new Date(r.startedAt) > +new Date(cur.startedAt)) byFlow.set(r.flowId, r);
  }
  const out = new Map<string, RunSummary | undefined>();
  for (const f of flows) {
    const live = byFlow.get(f.id);
    const last = f.lastRun;
    out.set(f.id, live && (!last || +new Date(live.startedAt) >= +new Date(last.startedAt)) ? live : (last ?? live));
  }
  return out;
}

/** Names of prerequisites that haven't completed — what a pending run waits for. */
export function waitingFor(flow: Flow, byId: Map<string, Flow>, runs: Map<string, RunSummary | undefined>): string[] {
  return (flow.dependsOn ?? [])
    .filter((id) => runs.get(id)?.status !== 'completed')
    .map((id) => byId.get(id)?.name ?? id);
}

/** Topological layers (0 = no prerequisites). Cycles (shouldn't exist) are cut. */
export function layers(flows: Flow[]): Map<string, number> {
  const byId = new Map(flows.map((f) => [f.id, f]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const deps = (byId.get(id)?.dependsOn ?? []).filter((d) => byId.has(d));
    const d = deps.length ? 1 + Math.max(...deps.map(depth)) : 0;
    visiting.delete(id);
    memo.set(id, d);
    return d;
  };
  for (const f of flows) depth(f.id);
  return memo;
}
