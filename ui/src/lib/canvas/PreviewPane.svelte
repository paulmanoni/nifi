<script lang="ts">
  import { api } from '../api/client';
  import type { Graph, PreviewResponse, PreviewStage } from '../api/types';
  import { catalog } from '../stores/catalog.svelte';
  import { iconFor, categoryColor } from '../icons';
  import DataGrid from '../components/DataGrid.svelte';
  import { Eye, LoaderCircle, ChevronRight, Rows3, LayoutList, TriangleAlert } from 'lucide-svelte';

  let {
    nodeId,
    nodeName,
    getGraph,
    trigger = 0,
    onselectnode,
    onresult,
  }: {
    nodeId: string | null;
    nodeName?: string;
    getGraph: () => Graph;
    trigger?: number;
    onselectnode?: (id: string) => void;
    onresult?: (nodeId: string, r: PreviewResponse) => void;
  } = $props();

  let result = $state<PreviewResponse | null>(null);
  let forNode = $state<string | null>(null);
  let table = $state('');
  let limit = $state(20);
  let loading = $state(false);
  let error = $state('');
  let stageIdx = $state(-1);
  let stacked = $state(false);
  let ctrl: AbortController | null = null;

  export async function run(tbl?: string) {
    if (!nodeId) return;
    ctrl?.abort();
    ctrl = new AbortController();
    loading = true;
    error = '';
    const id = nodeId;
    try {
      const r = await api.preview(getGraph(), id, tbl ?? (forNode === id ? table : ''), limit, ctrl.signal);
      result = r;
      forNode = id;
      table = r.table;
      stageIdx = (r.stages?.length ?? 0) - 1;
      onresult?.(id, r);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      error = (e as Error).message;
      result = null;
      forNode = id;
    } finally {
      loading = false;
    }
  }

  let lastTrigger = 0;
  $effect(() => {
    if (trigger !== lastTrigger) {
      lastTrigger = trigger;
      if (trigger) run();
    }
  });

  let stages = $derived(result?.stages ?? []);
  let stale = $derived(!!result && forNode !== nodeId);

  function diff(i: number): { changed: Set<string>; added: Set<string> } {
    const changed = new Set<string>();
    const added = new Set<string>();
    const cur = stages[i];
    const prev = stages[i - 1];
    if (!cur || !prev) return { changed, added };
    const pIdx = new Map(prev.columns.map((c, j) => [c.name, j]));
    const sameRows = cur.rows.length === prev.rows.length;
    cur.columns.forEach((c, j) => {
      const pj = pIdx.get(c.name);
      if (pj === undefined) {
        added.add(c.name);
        return;
      }
      if (prev.columns[pj].type !== c.type) {
        changed.add(c.name);
        return;
      }
      if (sameRows) {
        for (let r = 0; r < cur.rows.length; r++) {
          if (JSON.stringify(cur.rows[r]?.[j]) !== JSON.stringify(prev.rows[r]?.[pj])) {
            changed.add(c.name);
            break;
          }
        }
      }
    });
    return { changed, added };
  }

  // A stage can drop twenty columns at once. The names matter when you go
  // looking, the count matters at a glance, so the badge shows a few and keeps
  // the rest in its tooltip instead of growing off the side of the pane.
  const SHOWN = 4;
  function brief(names: string[]): string {
    if (names.length <= SHOWN) return names.join(', ');
    return `${names.slice(0, SHOWN).join(', ')} +${names.length - SHOWN} more`;
  }

  function removed(i: number): string[] {
    const cur = stages[i];
    const prev = stages[i - 1];
    if (!cur || !prev) return [];
    const names = new Set(cur.columns.map((c) => c.name));
    return prev.columns.map((c) => c.name).filter((n) => !names.has(n));
  }

  function specOf(s: PreviewStage) {
    return catalog.byType.get(s.type);
  }
</script>

<div class="pv">
  <div class="bar">
    <button class="btn primary sm" onclick={() => run()} disabled={!nodeId || loading}>
      {#if loading}<LoaderCircle size={13} class="spin" />{:else}<Eye size={13} />{/if}
      Preview{nodeName ? ` “${nodeName}”` : ''}
    </button>
    {#if result && result.tables?.length}
      <label class="small dim" for="pv-table">Table</label>
      <select id="pv-table" class="select sm-sel mono" bind:value={table} onchange={() => run(table)}>
        {#each result.tables as t}<option value={t}>{t}</option>{/each}
      </select>
    {/if}
    <label class="small dim" for="pv-limit">Rows</label>
    <select id="pv-limit" class="select sm-sel" style="width:70px" bind:value={limit}>
      {#each [10, 20, 50, 100, 200] as n}<option value={n}>{n}</option>{/each}
    </select>
    {#if stages.length > 1}
      <button class="btn sm icon" class:active={stacked} title={stacked ? 'Show one stage' : 'Stack all stages'} onclick={() => (stacked = !stacked)}>
        {#if stacked}<Rows3 size={13} />{:else}<LayoutList size={13} />{/if}
      </button>
    {/if}
    <span class="spacer"></span>
    {#if stale}<span class="badge warn">showing preview of another node</span>{/if}
    <span class="tiny muted">Nothing is written — rows run through each stage in memory.</span>
  </div>

  {#if error}
    <div class="perr"><TriangleAlert size={14} /> <span>{error}</span></div>
  {:else if !result}
    <div class="empty small">
      <p>
        {#if nodeId}
          Click <strong>Preview</strong> to run {limit} sample rows from the source through every stage up to “{nodeName}”.
        {:else}
          Select a node on the canvas, then preview the data arriving at and leaving it.
        {/if}
      </p>
    </div>
  {:else}
    <div class="stages">
      {#each stages as s, i}
        {@const sp = specOf(s)}
        {@const Icon = iconFor(sp?.icon, sp?.category)}
        {#if i > 0}<ChevronRight size={13} class="sep" />{/if}
        <button class="stage" class:on={!stacked && stageIdx === i} style:--cat={sp ? categoryColor[sp.category] : 'var(--text-3)'} onclick={() => ((stageIdx = i), (stacked = false))} ondblclick={() => onselectnode?.(s.nodeId)} title="Double-click to select node">
          <Icon size={12} />
          <span class="sn ellipsis">{s.name}</span>
          <span class="badge">{s.rows.length}</span>
          {#if s.port && s.port !== 'success'}<span class="badge {s.port === 'failure' ? 'err' : 'info'} mono">{s.port}</span>{/if}
          {#if s.errors?.length}<span class="badge err">{s.errors.length} err</span>{/if}
        </button>
      {/each}
    </div>
    <div class="grids" class:stacked>
      {#each stages as s, i}
        {#if stacked || stageIdx === i}
          {@const d = diff(i)}
          {@const rm = removed(i)}
          <section class="sg">
            {#if stacked || d.changed.size || d.added.size || rm.length}
              <div class="sh">
                {#if stacked}<strong>{s.name}</strong><span class="muted tiny mono">{s.type}</span>{/if}
                {#if d.added.size}
                  <span class="badge ok list" title="Added: {[...d.added].join(', ')}">+{brief([...d.added])}</span>
                {/if}
                {#if d.changed.size}
                  <span class="badge warn list" title="Changed: {[...d.changed].join(', ')}">~{brief([...d.changed])}</span>
                {/if}
                {#if rm.length}
                  <span class="badge err list" title="Dropped: {rm.join(', ')}">−{brief(rm)}</span>
                {/if}
              </div>
            {/if}
            <div class="gbox">
              <DataGrid columns={s.columns ?? []} rows={s.rows ?? []} errors={s.errors ?? []} changed={d.changed} added={d.added} emptyText="No rows left this stage" />
            </div>
          </section>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .pv {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .sm-sel {
    height: 24px;
    width: auto;
    max-width: 260px;
    font-size: 12px;
  }
  .perr {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    padding: 8px 10px;
    border-radius: var(--radius);
    background: var(--err-soft);
    color: var(--err);
    white-space: pre-wrap;
  }
  .stages {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow-x: auto;
    flex: none;
    padding-bottom: 2px;
  }
  .stages :global(.sep) {
    color: var(--text-3);
    flex: none;
  }
  .stage {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: none;
    max-width: 260px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--border);
    border-left: 3px solid var(--cat);
    border-radius: var(--radius);
    background: var(--bg-elev);
    color: var(--text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .stage :global(svg) {
    color: var(--cat);
    flex: none;
  }
  .stage.on {
    background: var(--accent-soft);
    border-color: var(--accent);
    border-left-color: var(--cat);
  }
  .sn {
    font-weight: 500;
  }
  .grids {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .grids.stacked {
    overflow: auto;
  }
  .sg {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stacked .sg {
    flex: none;
  }
  .stacked .gbox {
    height: 220px;
  }
  .gbox {
    flex: 1;
    min-height: 0;
  }
  .sh {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 12px;
    min-width: 0;
  }
  /* A badge listing column names must give way to the pane, not push past it. */
  .sh :global(.badge.list) {
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    line-height: 18px;
  }
</style>
