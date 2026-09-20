import type { Edge, Node } from '@xyflow/svelte';
import type { Graph, GraphEdge, GraphNode, ProcessorSpec, PropertySpec } from '../api/types';
import { uid, clone } from '../format';

export type PNodeData = { node: GraphNode };
export type FEdgeData = { edge: GraphEdge };
export type PNode = Node<PNodeData, 'processor'>;
export type FEdge = Edge<FEdgeData, 'flow'>;

export const DEFAULT_BACKPRESSURE = 20000;

export function toFlowNode(n: GraphNode): PNode {
  return { id: n.id, type: 'processor', position: { ...n.position }, data: { node: n } };
}

export function toFlowEdge(e: GraphEdge): FEdge {
  return {
    id: e.id,
    type: 'flow',
    source: e.from,
    sourceHandle: e.fromPort,
    target: e.to,
    targetHandle: 'in',
    data: { edge: e },
  };
}

export function toGraph(nodes: PNode[], edges: FEdge[], viewport?: Graph['viewport']): Graph {
  return {
    nodes: nodes.map((n) => ({ ...n.data.node, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) } })),
    edges: edges.map((e) => ({
      ...e.data!.edge,
      id: e.id,
      from: e.source,
      fromPort: e.sourceHandle ?? 'success',
      to: e.target,
    })),
    ...(viewport ? { viewport } : {}),
  };
}

/** Evaluate a PropertySpec's showIf against a config. */
export function visible(p: PropertySpec, config: Record<string, any>): boolean {
  if (!p.showIf) return true;
  const v = config?.[p.showIf.key];
  const want = p.showIf.equals;
  if (Array.isArray(want)) return want.includes(v);
  // tolerate "true"/true and number/string mismatches
  return v === want || String(v ?? '') === String(want ?? '') || (want === false && v == null);
}

/** Output ports: static relationships + dynamic ones from a list property's items' `name`. */
export function outputPorts(spec: ProcessorSpec | undefined, config: Record<string, any>): string[] {
  if (!spec) return ['success'];
  const statics = spec.relationships ?? [];
  const dynamic: string[] = [];
  if (spec.dynamicRelationships) {
    const items = config?.[spec.dynamicRelationships];
    if (Array.isArray(items)) {
      for (const it of items) {
        const name = typeof it === 'string' ? it : it?.name;
        if (name && typeof name === 'string' && !dynamic.includes(name) && !statics.includes(name)) dynamic.push(name);
      }
    }
  }
  // user-defined rules first, then the static ports, with `failure` always last
  return [...dynamic, ...statics.filter((p) => p !== 'failure'), ...(statics.includes('failure') ? ['failure'] : [])];
}

export function defaultConfig(spec: ProcessorSpec): Record<string, any> {
  const c: Record<string, any> = {};
  for (const p of spec.properties ?? []) {
    if (p.default !== undefined) c[p.key] = clone(p.default);
  }
  return c;
}

export function newNode(spec: ProcessorSpec, position: { x: number; y: number }, existing: string[]): GraphNode {
  let name = spec.label;
  let i = 2;
  while (existing.includes(name)) name = `${spec.label} ${i++}`;
  return {
    id: uid('n'),
    type: spec.type,
    name,
    position,
    config: defaultConfig(spec),
    ...(spec.supportsConcurrency ? { concurrency: defaultConcurrency(spec) } : {}),
  };
}

/** Parallel workers a new node starts with (mirrors the engine's default). */
export function defaultConcurrency(spec: ProcessorSpec | undefined): number {
  if (!spec?.supportsConcurrency) return 1;
  return spec.category === 'Source' || spec.category === 'Sink' || spec.category === 'Script' ? 4 : 2;
}

/** Structural JSON used for dirty-checking & history (positions rounded). */
export function graphKey(g: Graph): string {
  return JSON.stringify({ n: g.nodes, e: g.edges });
}

export type BottomTab = 'preview' | 'run' | 'bulletins' | 'dead' | 'queues' | 'issues' | 'history';
