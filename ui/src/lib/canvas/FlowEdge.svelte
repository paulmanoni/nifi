<script lang="ts">
  import { BaseEdge, EdgeLabel, getSmoothStepPath, type EdgeProps } from '@xyflow/svelte';
  import { getCanvasCtx } from './context';
  import { DEFAULT_BACKPRESSURE, type FEdge } from './model';
  import { fmtCompact, fmtNum, pct } from '../format';

  // Neutral smoothstep connection. The label pill appears only when it says
  // something: the relationship (when the source has several), and the queue
  // + back-pressure bar while a run is active.
  let { id, source, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, sourceHandleId, markerEnd, selected, data }: EdgeProps<FEdge> =
    $props();

  const ctx = getCanvasCtx();

  let path = $derived(
    getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 8, offset: 20 }),
  );
  let port = $derived(sourceHandleId ?? data?.edge.fromPort ?? '');
  let multi = $derived(ctx.portsOf(source).length > 1 || port !== 'success');
  let live = $derived(ctx.live.active && ctx.showStats());
  let stats = $derived(live ? ctx.live.edgeStats.get(id) : undefined);
  let cap = $derived(stats?.capacityRows || data?.edge.backPressureRows || DEFAULT_BACKPRESSURE);
  let queued = $derived(stats?.queuedRows ?? 0);
  let fill = $derived(pct(queued, cap));
  let level = $derived(fill >= 90 ? 'full' : fill >= 60 ? 'warn' : 'ok');
  let issues = $derived(ctx.edgeIssues().get(id) ?? []);
  let tables = $derived(data?.edge.tables ?? []);
  let tablesText = $derived(tables.length <= 2 ? tables.join(', ') : `${tables.length} tables`);
  let showLabel = $derived(multi || !!stats || selected || issues.length > 0 || tables.length > 0);

  let prevPassed = -1;
  let flowing = $state(false);
  $effect(() => {
    const p = stats?.rowsPassed ?? -1;
    flowing = !!stats && prevPassed >= 0 && p > prevPassed;
    prevPassed = p;
  });
</script>

<BaseEdge
  {id}
  path={path[0]}
  {markerEnd}
  class={['fe', port === 'failure' && 'fail', flowing && 'flowing', selected && 'sel', issues.length > 0 && 'issue'].filter(Boolean).join(' ')}
  interactionWidth={16}
/>
{#if showLabel}
  <EdgeLabel x={path[1]} y={path[2]} selectEdgeOnClick>
    <div
      class="lbl"
      class:sel={selected}
      class:fail={port === 'failure'}
      class:issue={issues.length > 0}
      title={[
        `${port}`,
        stats ? `queued ${fmtNum(queued)} / ${fmtNum(cap)} · ${fmtNum(stats.rowsPassed)} passed` : '',
        ...issues.map((i) => i.message),
      ]
        .filter(Boolean)
        .join('\n')}
    >
      {#if multi || !tables.length}<span class="rel">{port}</span>{/if}
      {#if tables.length}<span class="tb" title="Only these tables: {tables.join(', ')}">▦ {tablesText}</span>{/if}
      {#if stats}
        <span class="q">{fmtCompact(queued)}<span class="cap">/{fmtCompact(cap)}</span></span>
        <span class="bar"><span class={level} style:width="{Math.max(fill, queued > 0 ? 4 : 0)}%"></span></span>
      {/if}
    </div>
  </EdgeLabel>
{/if}

<style>
  .lbl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 20px;
    padding: 0 8px;
    background: var(--node-bg);
    border: 1px solid var(--node-border);
    border-radius: 999px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    font-size: 10.5px;
    color: var(--text-2);
    white-space: nowrap;
    cursor: pointer;
  }
  .lbl.sel {
    border-color: var(--accent);
    color: var(--accent-text);
  }
  .lbl.issue {
    border-color: var(--warn);
  }
  .rel {
    font-weight: 500;
  }
  .tb {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--accent-text, var(--accent));
  }
  .lbl.fail .rel {
    color: var(--err);
  }
  .q {
    font-family: var(--mono);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }
  .cap {
    color: var(--text-3);
  }
  .bar {
    width: 32px;
    height: 4px;
    border-radius: 2px;
    background: var(--node-well);
    box-shadow: inset 0 0 0 1px var(--border);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--ok);
    transition: width 0.5s ease;
  }
  .bar span.warn {
    background: var(--warn);
  }
  .bar span.full {
    background: var(--err);
  }
</style>
