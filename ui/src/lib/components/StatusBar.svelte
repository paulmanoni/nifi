<script lang="ts">
  // The strip under the header: how the whole instance is doing, always in
  // view. Each figure is a count of flows in that state, so a glance answers
  // "is anything running, and is anything broken" without leaving the page.
  import { summary } from '../stores/summary.svelte';
  import { fmtCompact } from '../format';
  import { Play, CircleCheck, CircleX, Square, Circle, Radio, Rows3, TriangleAlert, Workflow } from 'lucide-svelte';

  $effect(() => summary.watch());

  let c = $derived(summary.counts);
</script>

<div class="bar" role="status" aria-label="Instance summary">
  <span class="item" title="Flows"><Workflow size={12} /> {c.flows}</span>
  <span class="sep"></span>
  <span class="item run" class:on={c.running > 0} title="Running"><Play size={12} fill="currentColor" /> {c.running}</span>
  {#if c.live > 0}
    <span class="item live" title="Following their source — these end only when stopped"><Radio size={12} /> {c.live}</span>
  {/if}
  <span class="item ok" class:on={c.completed > 0} title="Completed"><CircleCheck size={12} /> {c.completed}</span>
  <span class="item err" class:on={c.failed > 0} title="Failed"><CircleX size={12} /> {c.failed}</span>
  <span class="item" title="Stopped"><Square size={12} /> {c.stopped}</span>
  <span class="item dim" title="Never run"><Circle size={12} /> {c.neverRun}</span>
  <span class="sep"></span>
  <span class="item" title="Rows written across every flow's latest run"><Rows3 size={12} /> {fmtCompact(c.rowsWritten)}</span>
  <span class="item err" class:on={c.rowsFailed > 0} title="Rows that failed and were kept as dead letters">
    <TriangleAlert size={12} /> {fmtCompact(c.rowsFailed)}
  </span>
  <span class="spacer"></span>
  {#if summary.error}
    <span class="item err on" title={summary.error}>disconnected</span>
  {:else if !summary.loaded}
    <span class="item dim">…</span>
  {/if}
</div>

<style>
  .bar {
    height: var(--statusbar-h);
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    background: var(--bg-sunken);
    border-bottom: 1px solid var(--border);
    font-size: 11.5px;
    color: var(--text-2);
    white-space: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .bar::-webkit-scrollbar {
    display: none;
  }
  .item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-variant-numeric: tabular-nums;
  }
  /* A figure only takes colour when it has something to say. */
  .item :global(svg) {
    color: var(--text-3);
  }
  .run.on :global(svg) {
    color: var(--running);
  }
  .ok.on :global(svg) {
    color: var(--ok);
  }
  .err.on :global(svg),
  .err.on {
    color: var(--err);
  }
  .live :global(svg) {
    color: var(--accent);
  }
  .dim {
    color: var(--text-3);
  }
  .sep {
    width: 1px;
    height: 14px;
    background: var(--border);
  }
  .spacer {
    flex: 1;
  }
</style>
