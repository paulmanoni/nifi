<script lang="ts">
  import { api } from '../api/client';
  import type { DeadLetterPage } from '../api/types';
  import { fmtClock, fmtNum } from '../format';
  import { toast } from '../stores/toast.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw } from 'lucide-svelte';
  import { confirm } from '../stores/confirm.svelte';
  import { auth } from '../stores/auth.svelte';
  import { navigate } from '../router.svelte';

  let { runId, tables = [], nodeName }: { runId: string; tables?: string[]; nodeName?: (id: string) => string | undefined } = $props();

  let replaying = $state('');

  async function replay(nodeId: string) {
    const label = nodeName?.(nodeId) ?? nodeId;
    const ok = await confirm({
      title: 'Replay dead letters',
      message: `Feed every dead-lettered row of “${label}” back into it and on through the rest of the flow? This starts a run of its own and writes to the same targets.`,
      confirmLabel: 'Replay',
    });
    if (!ok) return;
    replaying = nodeId;
    try {
      const r = await api.replayDeadLetters(runId, nodeId);
      toast.success('Replay started');
      navigate(`/runs/${r.id}`);
    } catch (e) {
      toast.error(e);
    } finally {
      replaying = '';
    }
  }

  const limit = 50;
  let table = $state('');
  let offset = $state(0);
  let page = $state<DeadLetterPage | null>(null);
  let loading = $state(false);
  let open = $state<string | null>(null);
  /** The nodes that dead-lettered rows in this run, from the page shown. */
  let nodes = $derived([...new Set((page?.items ?? []).map((d) => d.nodeId))]);

  async function load() {
    loading = true;
    try {
      page = await api.deadLetters(runId, table, offset, limit);
    } catch (e) {
      toast.error(e);
      page ??= { total: 0, items: [] };
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void runId;
    void table;
    void offset;
    load();
  });
</script>

<div class="dl">
  <div class="bar">
    <select class="select" style="width:240px;height:24px" bind:value={table} onchange={() => (offset = 0)}>
      <option value="">All tables</option>
      {#each tables as t}<option value={t}>{t}</option>{/each}
    </select>
    <button class="btn sm icon" title="Refresh" onclick={load}><RefreshCw size={13} class={loading ? 'spin' : ''} /></button>
    {#if auth.can.run}
      {#each nodes as n (n)}
        <button class="btn sm" disabled={!!replaying} onclick={() => replay(n)} title="Run these rows through the flow again, from this node on">
          <RotateCcw size={12} /> Replay {nodeName?.(n) ?? n}
        </button>
      {/each}
    {/if}
    <span class="spacer"></span>
    {#if page}
      <span class="muted small num">{page.total ? `${offset + 1}–${Math.min(offset + limit, page.total)} of ${fmtNum(page.total)}` : '0 rows'}</span>
      <button class="btn sm icon" disabled={offset === 0} onclick={() => (offset = Math.max(0, offset - limit))} aria-label="Previous"><ChevronLeft size={14} /></button>
      <button class="btn sm icon" disabled={offset + limit >= page.total} onclick={() => (offset += limit)} aria-label="Next"><ChevronRight size={14} /></button>
    {/if}
  </div>
  <div class="list scroll">
    {#if !page}
      <Skeleton rows={5} />
    {:else}
      {#each page.items as d (d.id)}
        <div class="item" class:open={open === d.id}>
          <button class="head" onclick={() => (open = open === d.id ? null : d.id)}>
            <span class="t mono">{fmtClock(d.time)}</span>
            <span class="tbl mono">{d.table}</span>
            <span class="node">{nodeName?.(d.nodeId) ?? d.nodeId}</span>
            <span class="err ellipsis">{d.error}</span>
          </button>
          {#if open === d.id}
            <div class="body">
              <div class="errfull">{d.error}</div>
              <pre>{JSON.stringify(d.row, null, 2)}</pre>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty small">No dead-lettered rows{table ? ` for ${table}` : ''}. 🎉</div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .dl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .list {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-elev);
  }
  .item {
    border-bottom: 1px solid var(--border);
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    text-align: left;
  }
  .head:hover {
    background: var(--bg-hover);
  }
  .t {
    color: var(--text-3);
    font-size: 11px;
  }
  .tbl {
    flex: none;
  }
  .node {
    flex: none;
    color: var(--text-2);
  }
  .err {
    flex: 1;
    color: var(--err);
  }
  .body {
    padding: 4px 8px 8px 24px;
  }
  .errfull {
    color: var(--err);
    white-space: pre-wrap;
    margin-bottom: 4px;
  }
  pre {
    margin: 0;
    padding: 8px;
    background: var(--bg-sunken);
    border-radius: var(--radius);
    font-family: var(--mono);
    font-size: 11.5px;
    max-height: 260px;
    overflow: auto;
  }
</style>
