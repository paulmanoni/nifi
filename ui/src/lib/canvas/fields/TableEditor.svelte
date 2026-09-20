<script lang="ts">
  // Row-table settings (Map Columns, Map Values, Rename, Compute, Cast, Route
  // rules, column/table mappings) edited in a large dialog. The side panel shows
  // a compact summary; the dialog edits a draft that is applied on Save.
  import type { Column, ListColumnSpec, PropertySpec } from '../../api/types';
  import { catalog } from '../../stores/catalog.svelte';
  import { getCanvasCtx } from '../context';
  import Modal from '../../components/Modal.svelte';
  import ColumnPicker from './ColumnPicker.svelte';
  import ExprField from './ExprField.svelte';
  import { Plus, Trash2, ChevronUp, ChevronDown, Search, Maximize2, Check, ListPlus, Sparkles, LoaderCircle } from 'lucide-svelte';

  type Row = Record<string, any>;
  type KV = { key: string; value: string };

  let {
    spec,
    value = $bindable(),
    groups,
    nodeId,
    nodeName,
    config,
  }: {
    spec: PropertySpec;
    value?: any;
    groups: { table: string; columns: Column[] }[];
    nodeId: string;
    nodeName: string;
    config: Record<string, any>;
  } = $props();

  const ctx = getCanvasCtx();
  let isKV = $derived(spec.kind === 'keyvalue');
  let cols = $derived<ListColumnSpec[]>(
    spec.columns?.length
      ? spec.columns
      : isKV
        ? [
            { key: 'key', label: 'Key', kind: 'column' },
            { key: 'value', label: 'Value', kind: 'string' },
          ]
        : [],
  );

  function toRows(v: any): Row[] {
    if (Array.isArray(v)) return v.map((r) => ({ ...r }));
    if (isKV && v && typeof v === 'object') return Object.entries(v as Record<string, string>).map(([key, value]) => ({ key, value }));
    return [];
  }
  let rows = $derived(toRows(value));

  // ---- dialog ----
  let open = $state(false);
  let draft = $state<Row[]>([]);
  let q = $state('');
  let colQ = $state('');
  let loadingSample = $state(false);

  function openEditor() {
    draft = toRows(value);
    q = '';
    open = true;
    if (cols.some((c) => c.kind === 'type')) catalog.loadTypes();
  }
  function save() {
    value = isKV ? draft.map((r) => ({ key: r.key ?? '', value: r.value ?? '' }) as KV) : draft;
    open = false;
  }

  let nameCol = $derived(cols.find((c) => c.kind === 'column') ?? cols.find((c) => c.kind === 'string'));
  let exprCol = $derived(cols.find((c) => c.kind === 'expr'));
  // incoming columns can seed rows when a cell names a column
  let seeds = $derived(cols.some((c) => c.kind === 'column') || (!!exprCol && !!nameCol));
  let used = $derived(new Set(draft.map((r) => (nameCol ? String(r[nameCol.key] ?? '') : '')).filter(Boolean)));

  function blank(): Row {
    const b: Row = {};
    for (const c of cols) b[c.key] = c.kind === 'select' ? (c.options?.[0]?.value ?? '') : '';
    return b;
  }
  function addRow(seed?: string) {
    const r = blank();
    if (seed) {
      if (nameCol) r[nameCol.key] = seed;
      if (exprCol) r[exprCol.key] = /^[a-z_][a-z0-9_]*$/.test(seed) ? seed : `row["${seed}"]`;
    }
    draft = [...draft, r];
  }
  function addAll() {
    const have = used;
    for (const g of groups) for (const c of g.columns) if (!have.has(c.name)) addRow(c.name);
  }
  function set(i: number, key: string, v: any) {
    draft[i] = { ...draft[i], [key]: v };
  }
  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[i], next[j]] = [next[j], next[i]];
    draft = next;
  }
  function remove(i: number) {
    draft = draft.filter((_, j) => j !== i);
  }
  function matches(r: Row) {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return cols.some((c) => String(r[c.key] ?? '').toLowerCase().includes(s));
  }

  // Map Values: offer the values seen in a sample of the chosen column.
  let valueColumn = $derived(isKV && spec.key === 'mapping' && typeof config?.column === 'string' ? config.column : '');
  async function addSampleValues() {
    loadingSample = true;
    try {
      const s = await ctx.sampleFor(nodeId);
      const idx = (s?.columns ?? []).findIndex((c) => c.name === valueColumn);
      if (idx < 0) return;
      const have = new Set(draft.map((r) => String(r.key ?? '')));
      const seen: string[] = [];
      for (const row of s?.rows ?? []) {
        const v = row[idx];
        if (v == null) continue;
        const k = String(v);
        if (!have.has(k) && !seen.includes(k)) seen.push(k);
      }
      draft = [...draft, ...seen.map((k) => ({ key: k, value: '' }))];
    } finally {
      loadingSample = false;
    }
  }

  let incoming = $derived(
    groups
      .map((g) => ({ table: g.table, columns: g.columns.filter((c) => !colQ.trim() || c.name.toLowerCase().includes(colQ.toLowerCase())) }))
      .filter((g) => g.columns.length),
  );
  let shown = $derived(draft.map((r, i) => ({ r, i })).filter(({ r }) => matches(r)));
  let preview = $derived(rows.slice(0, 6));
  let grid = $derived(cols.map((c) => (c.kind === 'expr' ? 'minmax(260px, 3fr)' : c.kind === 'type' || c.kind === 'select' ? 'minmax(110px, 0.8fr)' : 'minmax(150px, 1.2fr)')).join(' '));
</script>

<div class="summary">
  {#if rows.length}
    <button type="button" class="mini" onclick={openEditor} title="Open the table editor">
      {#each preview as r}
        <div class="mr">
          {#each cols.slice(0, 2) as c, ci}
            {#if ci > 0}<span class="arr">→</span>{/if}
            <span class="mono cell" class:dim={!r[c.key]}>{r[c.key] || '—'}</span>
          {/each}
        </div>
      {/each}
      {#if rows.length > preview.length}<div class="more tiny muted">+ {rows.length - preview.length} more</div>{/if}
    </button>
  {:else}
    <p class="tiny muted">No rows yet.</p>
  {/if}
  <button type="button" class="btn sm" onclick={openEditor}><Maximize2 size={12} /> {rows.length ? `Edit ${rows.length} row${rows.length === 1 ? '' : 's'}` : 'Open table editor'}</button>
</div>

{#if open}
  <Modal title="{nodeName} · {spec.label}" onclose={() => (open = false)} width="min(1280px, 96vw)" height="min(820px, 90vh)">
    {#snippet headerExtra()}
      <span class="count tiny muted">{draft.length} row{draft.length === 1 ? '' : 's'}</span>
    {/snippet}
    <div class="ed" class:noside={!seeds}>
      {#if seeds}
        <aside>
          <div class="ah">
            <b>Incoming columns</b>
            <button type="button" class="btn ghost sm" onclick={addAll} title="Add a row for every incoming column not used yet"><ListPlus size={12} /> All</button>
          </div>
          <div class="search"><Search size={12} /><input class="input sm" placeholder="filter" bind:value={colQ} /></div>
          <div class="incoming">
            {#each incoming as g (g.table)}
              {#if groups.length > 1}<div class="gt tiny muted">{g.table}</div>{/if}
              {#each g.columns as c (g.table + c.name)}
                <button type="button" class="ic" class:on={used.has(c.name)} onclick={() => addRow(c.name)} title={used.has(c.name) ? 'Already used — click to add again' : 'Add a row for this column'}>
                  {#if used.has(c.name)}<Check size={11} />{:else}<Plus size={11} />{/if}
                  <span class="mono">{c.name}</span>
                  <span class="t mono">{c.nativeType || c.type}</span>
                </button>
              {/each}
            {:else}
              <p class="tiny muted">No incoming columns (connect an input or run a preview).</p>
            {/each}
          </div>
        </aside>
      {/if}
      <section class="main">
        <div class="bar">
          <div class="search grow"><Search size={12} /><input class="input sm" placeholder="Search rows" bind:value={q} /></div>
          {#if valueColumn}
            <button type="button" class="btn sm" onclick={addSampleValues} disabled={loadingSample} title="Add a row for each value of {valueColumn} seen in the preview sample">
              {#if loadingSample}<LoaderCircle size={12} class="spin" />{:else}<Sparkles size={12} />{/if} Values from sample
            </button>
          {/if}
          <button type="button" class="btn sm primary" onclick={() => addRow()}><Plus size={12} /> Add row</button>
        </div>
        <div class="tbl" style:--grid={grid}>
          <div class="th">
            <span class="n">#</span>
            {#each cols as c (c.key)}<span>{c.label}</span>{/each}
            <span></span>
          </div>
          {#each shown as { r, i } (i)}
            <div class="tr">
              <span class="n">
                <span class="tiny muted">{i + 1}</span>
                <span class="mvs">
                  <button type="button" class="mv" onclick={() => move(i, -1)} disabled={i === 0 || !!q} aria-label="Move up"><ChevronUp size={11} /></button>
                  <button type="button" class="mv" onclick={() => move(i, 1)} disabled={i === draft.length - 1 || !!q} aria-label="Move down"><ChevronDown size={11} /></button>
                </span>
              </span>
              {#each cols as c (c.key)}
                <div class="td">
                  {#if c.kind === 'column'}
                    <ColumnPicker value={r[c.key] ?? ''} {groups} onpick={(n) => set(i, c.key, n)} />
                  {:else if c.kind === 'expr'}
                    <ExprField compact {nodeId} bind:value={() => r[c.key] ?? '', (v) => set(i, c.key, v)} />
                  {:else if c.kind === 'select'}
                    <select class="select" value={r[c.key] ?? ''} onchange={(e) => set(i, c.key, e.currentTarget.value)}>
                      {#each c.options ?? [] as o}<option value={o.value}>{o.label}</option>{/each}
                    </select>
                  {:else if c.kind === 'type'}
                    <select class="select mono" value={r[c.key] ?? ''} onchange={(e) => set(i, c.key, e.currentTarget.value)}>
                      <option value="">auto</option>
                      {#each catalog.types as o}<option value={o.value}>{o.label}</option>{/each}
                    </select>
                  {:else}
                    <input class="input mono" value={r[c.key] ?? ''} oninput={(e) => set(i, c.key, e.currentTarget.value)} />
                  {/if}
                </div>
              {/each}
              <button type="button" class="btn ghost sm icon" onclick={() => remove(i)} aria-label="Remove row"><Trash2 size={13} /></button>
            </div>
          {:else}
            <p class="empty tiny muted">{draft.length ? 'No row matches the search.' : seeds ? 'Add rows, or click incoming columns on the left.' : 'Add a row to start.'}</p>
          {/each}
        </div>
        {#if spec.help}<p class="help">{spec.help}</p>{/if}
      </section>
    </div>
    {#snippet footer()}
      <span class="spacer"></span>
      <button type="button" class="btn" onclick={() => (open = false)}>Cancel</button>
      <button type="button" class="btn primary" onclick={save}><Check size={13} /> Apply</button>
    {/snippet}
  </Modal>
{/if}

<style>
  .summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
  .mini {
    width: 100%;
    text-align: left;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-sunken);
    padding: 4px 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 1px;
    color: var(--text);
  }
  .mini:hover {
    border-color: var(--border-strong);
  }
  .mr {
    display: flex;
    gap: 6px;
    min-width: 0;
    font-size: 11.5px;
  }
  .mr .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }
  .mr .cell:first-child {
    flex: 0 1 40%;
  }
  .dim {
    color: var(--text-3);
  }
  .arr {
    color: var(--text-3);
  }
  .more {
    padding-top: 2px;
  }
  .ed {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 12px;
    height: 100%;
    min-height: 0;
  }
  .ed.noside {
    grid-template-columns: 1fr;
  }
  aside {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    border-right: 1px solid var(--border);
    padding-right: 10px;
  }
  .ah {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }
  .incoming {
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 0;
  }
  .gt {
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ic {
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: none;
    padding: 3px 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text);
    font-size: 12px;
    text-align: left;
  }
  .ic:hover {
    background: var(--bg-hover, var(--bg-sunken));
  }
  .ic.on {
    color: var(--text-3);
  }
  .ic .mono:first-of-type {
    white-space: nowrap;
  }
  .ic .t {
    margin-left: auto;
    color: var(--text-3);
    font-size: 10.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-3);
  }
  .search .input {
    flex: 1;
  }
  .main {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    min-width: 0;
  }
  .bar {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .grow {
    flex: 1;
  }
  .tbl {
    overflow: auto;
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .th,
  .tr {
    display: grid;
    grid-template-columns: 44px var(--grid) 32px;
    gap: 6px;
    align-items: start;
    padding: 4px 8px;
  }
  .th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--bg-sunken);
    border-bottom: 1px solid var(--border);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-2, var(--text-3));
    padding-top: 6px;
    padding-bottom: 6px;
  }
  .tr {
    border-bottom: 1px solid var(--border);
  }
  .tr:hover {
    background: color-mix(in srgb, var(--bg-sunken) 50%, transparent);
  }
  .td {
    min-width: 0;
  }
  .td .input,
  .td .select {
    width: 100%;
    height: 26px;
  }
  .n {
    display: flex;
    align-items: center;
    gap: 2px;
    padding-top: 5px;
  }
  .mvs {
    display: flex;
    flex-direction: column;
  }
  .mv {
    border: none;
    background: none;
    color: var(--text-3);
    padding: 0;
    cursor: pointer;
    display: inline-flex;
  }
  .mv:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .empty {
    padding: 16px;
  }
  .help {
    font-size: 11.5px;
    color: var(--text-3);
    margin: 0;
  }
  .count {
    margin-left: 8px;
  }
</style>
