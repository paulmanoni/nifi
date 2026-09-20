<script lang="ts">
  import { SvelteFlow, Background, BackgroundVariant, Controls, MarkerType, type Node, type Edge, type NodeTypes } from '@xyflow/svelte';
  import type { Flow, RunSummary } from '../api/types';
  import { theme } from '../stores/theme.svelte';
  import { navigate } from '../router.svelte';
  import { layers, waitingFor } from './status';
  import DepNode from './DepNode.svelte';

  let { flows, runs }: { flows: Flow[]; runs: Map<string, RunSummary | undefined> } = $props();

  const nodeTypes = { dep: DepNode } as unknown as NodeTypes;
  const COL = 300;
  const ROW = 84;

  let nodes = $state.raw<Node[]>([]);
  let edges = $state.raw<Edge[]>([]);

  // Left→right topological layers, computed here (no layout dependency).
  $effect(() => {
    const byId = new Map(flows.map((f) => [f.id, f]));
    const lay = layers(flows);
    const cols = new Map<number, Flow[]>();
    for (const f of [...flows].sort((a, b) => a.name.localeCompare(b.name))) {
      const l = lay.get(f.id) ?? 0;
      cols.set(l, [...(cols.get(l) ?? []), f]);
    }
    const hasDependents = new Set(flows.flatMap((f) => f.dependsOn ?? []));
    const next: Node[] = [];
    for (const [l, list] of cols) {
      list.forEach((f, i) => {
        next.push({
          id: f.id,
          type: 'dep',
          position: { x: l * COL, y: (i - (list.length - 1) / 2) * ROW },
          data: {
            name: f.name,
            run: runs.get(f.id),
            waiting: waitingFor(f, byId, runs),
            hasIn: (f.dependsOn ?? []).length > 0,
            hasOut: hasDependents.has(f.id),
          },
          draggable: false,
          connectable: false,
        });
      });
    }
    nodes = next;
    edges = flows.flatMap((f) =>
      (f.dependsOn ?? [])
        .filter((d) => byId.has(d))
        .map((d) => {
          const st = runs.get(d)?.status;
          return {
            id: `${d}->${f.id}`,
            source: d,
            target: f.id,
            type: 'smoothstep',
            animated: st === 'running',
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#98a2b3' },
            style: 'stroke: var(--edge); stroke-width: 1.5px;',
          } satisfies Edge;
        }),
    );
  });
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
      fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      deleteKey={null}
      minZoom={0.2}
      onnodeclick={({ node }) => navigate(`/flows/${node.id}`)}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={14} size={1} />
      <Controls showLock={false} fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }} />
    </SvelteFlow>
  {/if}
</div>

<style>
  .dag {
    height: 100%;
    min-height: 360px;
    position: relative;
  }
</style>
