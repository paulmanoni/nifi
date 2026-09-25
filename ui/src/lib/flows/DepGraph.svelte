<script lang="ts">
  import { tick } from 'svelte';
  import {
    SvelteFlow,
    Background,
    BackgroundVariant,
    Controls,
    MarkerType,
    useSvelteFlow,
    type Node,
    type Edge,
    type NodeTypes,
  } from '@xyflow/svelte';
  import type { Flow, RunSummary } from '../api/types';
  import { theme } from '../stores/theme.svelte';
  import { navigate } from '../router.svelte';
  import { waitingFor } from './status';
  import DepNode from './DepNode.svelte';
  import LaneNode from './LaneNode.svelte';
  import { COLLAPSED_H, COLLAPSED_W, NODE_H, NODE_W, edgesFor, lanesFor, layout } from './swimlanes';

  let {
    flows,
    runs,
    scope = '',
    highlight = '',
  }: { flows: Flow[]; runs: Map<string, RunSummary | undefined>; scope?: string; highlight?: string } = $props();

  const nodeTypes = { dep: DepNode, lane: LaneNode } as unknown as NodeTypes;
  const FOLD_KEY = 'nifi.graphFolded';
  const { fitView } = useSvelteFlow();

  // Remembered folding wins; with none, every lane starts closed, because the
  // first thing worth seeing is which folders feed which — not two dozen nodes.
  const remembered = (() => {
    try {
      const v = localStorage.getItem(FOLD_KEY);
      return v === null ? null : (JSON.parse(v) as string[]);
    } catch {
      return null;
    }
  })();
  let folded = $state(new Set<string>(remembered ?? []));
  let decided = remembered !== null;
  function toggleLane(path: string) {
    const s = new Set(folded);
    s.has(path) ? s.delete(path) : s.add(path);
    folded = s;
    try {
      localStorage.setItem(FOLD_KEY, JSON.stringify([...s]));
    } catch {}
  }

  let nodes = $state.raw<Node[]>([]);
  let edges = $state.raw<Edge[]>([]);

  $effect(() => {
    if (decided || !flows.length) return;
    decided = true;
    folded = new Set(lanesFor(flows, scope).map((l) => l.path));
  });

  const matches = (f: Flow) => !!highlight && f.name.toLowerCase().includes(highlight.toLowerCase());

  $effect(() => {
    const byId = new Map(flows.map((f) => [f.id, f]));
    const running = (id: string) => {
      const s = runs.get(id)?.status;
      return s === 'running' || s === 'stopping';
    };
    const { lanes, flows: placed } = layout(flows, scope, folded);

    // Svelte Flow needs a parent before its children, so lanes come first.
    const next: Node[] = lanes.map((l) => {
      const counts = { total: l.lane.flows.length, running: 0, failed: 0, completed: 0 };
      for (const f of l.lane.flows) {
        const s = runs.get(f.id)?.status;
        if (s === 'running' || s === 'stopping' || s === 'pending' || s === 'paused') counts.running++;
        else if (s === 'failed') counts.failed++;
        else if (s === 'completed') counts.completed++;
      }
      return {
        id: `lane:${l.lane.path}`,
        type: 'lane',
        position: { x: l.x, y: l.y },
        width: l.collapsed ? COLLAPSED_W : l.w,
        height: l.collapsed ? COLLAPSED_H : l.h,
        data: { name: l.lane.name, path: l.lane.path, collapsed: l.collapsed, counts, ontoggle: toggleLane },
        draggable: false,
        connectable: false,
        selectable: false,
        zIndex: 0,
      } satisfies Node;
    });

    const hasDependents = new Set(flows.flatMap((f) => f.dependsOn ?? []));
    for (const p of placed) {
      next.push({
        id: p.flow.id,
        type: 'dep',
        parentId: `lane:${p.lane}`,
        extent: 'parent',
        position: { x: p.x, y: p.y },
        width: NODE_W,
        height: NODE_H,
        data: {
          name: p.flow.name,
          run: runs.get(p.flow.id),
          waiting: waitingFor(p.flow, byId, runs),
          hasIn: (p.flow.dependsOn ?? []).length > 0,
          hasOut: hasDependents.has(p.flow.id),
          compact: true,
          dim: !!highlight && !matches(p.flow),
          hit: matches(p.flow),
        },
        draggable: false,
        connectable: false,
        zIndex: 1,
      } satisfies Node);
    }
    nodes = next;

    edges = edgesFor(flows, scope, folded, running).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: e.running,
      label: e.count > 1 ? String(e.count) : undefined,
      labelBgPadding: [4, 2] as [number, number],
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#98a2b3' },
      style: `stroke: var(--edge); stroke-width: ${e.bundled ? Math.min(1.5 + e.count * 0.7, 5) : 1.5}px;`,
      zIndex: 2,
    })) as Edge[];
  });

  // Folding changes the whole shape, so re-frame rather than leaving the
  // viewport pointing at where something used to be.
  let shape = $derived(`${scope}|${[...folded].sort().join(',')}|${flows.length}`);
  $effect(() => {
    shape;
    // Svelte Flow needs the nodes measured before it can frame them, and that
    // is a paint away — fitting on the same tick lands on the old bounds and
    // leaves the graph parked in a corner.
    let alive = true;
    tick().then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => alive && fitView({ padding: 0.12, maxZoom: 1.1, duration: 250 })),
      ),
    );
    return () => {
      alive = false;
    };
  });

  let laneCount = $derived(lanesFor(flows, scope).length);
</script>

<div class="dag">
  {#if flows.length === 0}
    <div class="empty small">No flows.</div>
  {:else}
    <SvelteFlow
      bind:nodes
      bind:edges
      {nodeTypes}
      colorMode={theme.resolved}
      fitView
      fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      deleteKey={null}
      minZoom={0.1}
      onnodeclick={({ node }) => node.type === 'dep' && navigate(`/flows/${node.id}`)}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={14} size={1} />
      <Controls showLock={false} fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }} />
    </SvelteFlow>
    <div class="lanebar">
      <button class="lb" onclick={() => (folded = new Set(lanesFor(flows, scope).map((l) => l.path)))}>Collapse all</button>
      <button class="lb" onclick={() => (folded = new Set())}>Expand all</button>
      <span class="muted tiny">{laneCount} folder{laneCount === 1 ? '' : 's'}</span>
    </div>
  {/if}
</div>

<style>
  .dag {
    height: 100%;
    min-height: 420px;
    position: relative;
  }
  .lanebar {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    background: var(--node-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--node-shadow);
  }
  .lb {
    border: 0;
    background: none;
    padding: 1px 4px;
    font: inherit;
    font-size: 11px;
    color: var(--accent);
    cursor: pointer;
  }
  .lb:hover {
    text-decoration: underline;
  }
</style>
