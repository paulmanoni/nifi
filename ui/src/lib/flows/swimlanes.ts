// Layout for the dependency graph, grouped into folder lanes.
//
// At a hundred flows the individual node is noise: what an operator wants
// first is the shape of the migration — reference data feeds people, people
// feed applications — and only then which flow inside a lane is stuck. So the
// lane is the unit, a lane collapses to one box, and the links between
// collapsed lanes carry how many dependencies they stand for.
//
// A lane is one level of the folder tree below whatever the sidebar has
// scoped to: at the root the lanes are the top folders, and picking one
// re-lanes the graph to its children. Everything here is pure so the layout
// can be reasoned about without a canvas.
import type { Flow } from '../api/types';
import { normalizeFolder } from './folders';

export const NODE_W = 170;
export const NODE_H = 34;
const COL_GAP = 42;
const ROW_GAP = 12;
const PAD_X = 12;
const PAD_TOP = 26;
const PAD_BOTTOM = 12;
const LANE_GAP_X = 70;
const LANE_GAP_Y = 30;
/** A collapsed lane is one box; it never shrinks below a readable width. */
export const COLLAPSED_W = 210;
export const COLLAPSED_H = 58;

export type Lane = {
  /** Folder path of the lane; "" is the lane for flows with no folder. */
  path: string;
  name: string;
  flows: Flow[];
};

/** Which lane a flow belongs to, given what the sidebar has scoped to. */
export function laneOf(flow: Flow, scope: string): string {
  const path = normalizeFolder(flow.folder ?? '');
  if (!path) return '';
  if (!scope) return path.split('/')[0];
  if (path === scope) return scope;
  const rest = path.slice(scope.length + 1);
  return scope + '/' + rest.split('/')[0];
}

/**
 * The level to lane by. Folder trees often have a single trunk — every flow
 * under "migrations" — and laning by that draws one box around everything,
 * which says nothing. So descend while a level holds exactly one folder and
 * stop at the first that actually divides the flows.
 */
export function laneScope(flows: Flow[], scope: string): string {
  let at = scope;
  for (let guard = 0; guard < 16; guard++) {
    const keys = new Set(flows.map((f) => laneOf(f, at)));
    if (keys.size !== 1) return at;
    const only = [...keys][0];
    if (only === '' || only === at) return at;
    at = only;
  }
  return at;
}

export function lanesFor(flows: Flow[], rawScope: string): Lane[] {
  const scope = laneScope(flows, rawScope);
  const by = new Map<string, Flow[]>();
  for (const f of flows) {
    const k = laneOf(f, scope);
    (by.get(k) ?? by.set(k, []).get(k)!).push(f);
  }
  const lanes = [...by.entries()].map(([path, fs]) => ({
    path,
    name: path === '' ? 'Ungrouped' : path === scope ? path.split('/').pop()! : path.slice(scope ? scope.length + 1 : 0),
    flows: fs.sort((a, b) => a.name.localeCompare(b.name)),
  }));
  // Ungrouped last; it is a leftover, not a peer.
  return lanes.sort((a, b) => (a.path === '' ? 1 : b.path === '' ? -1 : a.name.localeCompare(b.name)));
}

/** Longest-path layering over any node set, ignoring edges that leave it. */
function rank<T>(ids: T[], depsOf: (id: T) => T[]): Map<T, number> {
  const present = new Set(ids);
  const memo = new Map<T, number>();
  const visiting = new Set<T>();
  const depth = (id: T): number => {
    const seen = memo.get(id);
    if (seen !== undefined) return seen;
    if (visiting.has(id)) return 0; // a cycle stops here rather than hanging
    visiting.add(id);
    const ds = depsOf(id).filter((d) => present.has(d));
    const d = ds.length ? 1 + Math.max(...ds.map(depth)) : 0;
    visiting.delete(id);
    memo.set(id, d);
    return d;
  };
  for (const id of ids) depth(id);
  return memo;
}

/**
 * Order nodes within each column by the average position of what they connect
 * to in the previous column. One barycentre pass removes most of the crossings
 * that alphabetical ordering causes, without a layout library.
 */
function untangle<T>(columns: T[][], depsOf: (id: T) => T[]): T[][] {
  const pos = new Map<T, number>();
  columns[0]?.forEach((id, i) => pos.set(id, i));
  for (let c = 1; c < columns.length; c++) {
    const col = columns[c];
    const key = new Map<T, number>();
    col.forEach((id, i) => {
      const ups = depsOf(id).filter((d) => pos.has(d));
      key.set(id, ups.length ? ups.reduce((s, d) => s + pos.get(d)!, 0) / ups.length : i);
    });
    col.sort((a, b) => key.get(a)! - key.get(b)! || 0);
    col.forEach((id, i) => pos.set(id, i));
  }
  return columns;
}

function columnsOf<T>(ids: T[], depsOf: (id: T) => T[]): T[][] {
  const ranks = rank(ids, depsOf);
  const cols: T[][] = [];
  for (const id of ids) {
    const r = ranks.get(id) ?? 0;
    (cols[r] ??= []).push(id);
  }
  for (let i = 0; i < cols.length; i++) cols[i] ??= [];
  return untangle(cols, depsOf);
}

export type PlacedFlow = { flow: Flow; lane: string; x: number; y: number };
export type PlacedLane = {
  lane: Lane;
  collapsed: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type Layout = { lanes: PlacedLane[]; flows: PlacedFlow[] };

export function layout(flows: Flow[], rawScope: string, collapsed: Set<string>): Layout {
  const lanes = lanesFor(flows, rawScope);
  const laneOfId = new Map<string, string>();
  for (const l of lanes) for (const f of l.flows) laneOfId.set(f.id, l.path);
  const present = new Set(flows.map((f) => f.id));
  const depsOf = (f: Flow) => (f.dependsOn ?? []).filter((d) => present.has(d));

  // Lane-level dependencies: a lane waits on another if any of its flows do.
  const laneDeps = new Map<string, Set<string>>(lanes.map((l) => [l.path, new Set<string>()]));
  for (const f of flows) {
    const mine = laneOfId.get(f.id)!;
    for (const d of depsOf(f)) {
      const theirs = laneOfId.get(d)!;
      if (theirs !== mine) laneDeps.get(mine)!.add(theirs);
    }
  }

  // Inner geometry first, because a lane's size decides how lanes pack.
  const inner = new Map<string, { w: number; h: number; at: Map<string, { x: number; y: number }> }>();
  for (const l of lanes) {
    if (collapsed.has(l.path)) {
      inner.set(l.path, { w: COLLAPSED_W, h: COLLAPSED_H, at: new Map() });
      continue;
    }
    const ids = l.flows.map((f) => f.id);
    const byId = new Map(l.flows.map((f) => [f.id, f]));
    // Inside a lane, only the dependencies that stay inside it shape the
    // columns; the ones that leave are what the lane links express.
    const cols = columnsOf(ids, (id) => depsOf(byId.get(id)!).filter((d) => laneOfId.get(d) === l.path));
    const at = new Map<string, { x: number; y: number }>();
    let tallest = 0;
    cols.forEach((col, c) => {
      col.forEach((id, r) => {
        at.set(id, { x: PAD_X + c * (NODE_W + COL_GAP), y: PAD_TOP + r * (NODE_H + ROW_GAP) });
      });
      tallest = Math.max(tallest, col.length);
    });
    inner.set(l.path, {
      w: PAD_X * 2 + Math.max(1, cols.length) * NODE_W + Math.max(0, cols.length - 1) * COL_GAP,
      h: PAD_TOP + PAD_BOTTOM + Math.max(1, tallest) * NODE_H + Math.max(0, tallest - 1) * ROW_GAP,
      at,
    });
  }

  // Lanes are laid out left to right in their own dependency order.
  const laneCols = columnsOf(
    lanes.map((l) => l.path),
    (p) => [...(laneDeps.get(p) ?? [])],
  );
  const placed: PlacedLane[] = [];
  const placedFlows: PlacedFlow[] = [];
  let x = 0;
  for (const col of laneCols) {
    const widest = Math.max(0, ...col.map((p) => inner.get(p)!.w));
    let y = 0;
    for (const p of col) {
      const l = lanes.find((v) => v.path === p)!;
      const geo = inner.get(p)!;
      placed.push({ lane: l, collapsed: collapsed.has(p), x, y, w: geo.w, h: geo.h });
      for (const f of l.flows) {
        const at = geo.at.get(f.id);
        if (at) placedFlows.push({ flow: f, lane: p, x: at.x, y: at.y });
      }
      y += geo.h + LANE_GAP_Y;
    }
    x += widest + LANE_GAP_X;
  }
  return { lanes: placed, flows: placedFlows };
}

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  /** How many flow-to-flow dependencies this line stands for. */
  count: number;
  /** True when at least one end is a collapsed lane. */
  bundled: boolean;
  running: boolean;
};

/**
 * Edges between what is actually drawn: flow to flow where both lanes are
 * open, and lane to lane wherever an end is collapsed — several dependencies
 * between the same pair becoming one line with a count.
 */
export function edgesFor(
  flows: Flow[],
  rawScope: string,
  collapsed: Set<string>,
  isRunning: (flowId: string) => boolean,
): GraphEdge[] {
  const present = new Set(flows.map((f) => f.id));
  const laneOfId = new Map<string, string>();
  for (const l of lanesFor(flows, rawScope)) for (const f of l.flows) laneOfId.set(f.id, l.path);
  const endpoint = (id: string) => {
    const lane = laneOfId.get(id)!;
    return collapsed.has(lane) ? `lane:${lane}` : id;
  };

  const out = new Map<string, GraphEdge>();
  for (const f of flows) {
    for (const d of (f.dependsOn ?? []).filter((x) => present.has(x))) {
      const source = endpoint(d);
      const target = endpoint(f.id);
      if (source === target) continue; // both ends inside one collapsed lane
      const id = `${source}->${target}`;
      const e = out.get(id);
      if (e) {
        e.count++;
        e.running ||= isRunning(d);
      } else {
        out.set(id, {
          id,
          source,
          target,
          count: 1,
          bundled: source.startsWith('lane:') || target.startsWith('lane:'),
          running: isRunning(d),
        });
      }
    }
  }
  return [...out.values()];
}
