<script lang="ts" module>
  import type { TableSummary as TS } from '../../api/types';
  const cache = new Map<string, TS[]>();
</script>

<script lang="ts">
  import { api } from '../../api/client';
  import type { TableSummary } from '../../api/types';
  import { catalog } from '../../stores/catalog.svelte';
  import { fmtCompact } from '../../format';
  import { tableRef } from '../../tables';
  import { Search, TriangleAlert, RefreshCw } from 'lucide-svelte';
  import { auth } from '../../stores/auth.svelte';

  let {
    value = $bindable(),
    connectionId,
    multi = false,
  }: { value?: any; connectionId?: string; multi?: boolean } = $props();

  let tables = $state<TableSummary[] | null>(null);
  let err = $state('');
  let q = $state('');
  let conn = $derived(catalog.connections.find((c) => c.id === connectionId));

  async function load(id: string, force = false) {
    err = '';
    if (!force && cache.has(id)) {
      tables = cache.get(id)!;
      return;
    }
    tables = null;
    try {
      const t = ((await api.tables(id)) ?? []).sort((a, b) => a.name.localeCompare(b.name));
      cache.set(id, t);
      if (id === connectionId) tables = t;
    } catch (e) {
      if (id === connectionId) {
        err = (e as Error).message;
        tables = [];
      }
    }
  }

  // Table listing needs the `data` permission; without it the fields fall back to free text.
  let canList = $derived(auth.can.data);
  let freeText = $state('');
  $effect(() => {
    if (!canList && multi) freeText = Array.isArray(value) ? value.join(', ') : '';
  });

  $effect(() => {
    if (!canList) return;
    if (connectionId) load(connectionId);
    else tables = null;
  });

  let refs = $derived((tables ?? []).map((t) => ({ t, ref: tableRef(t, conn?.driver) })));
  let shown = $derived(refs.filter((r) => !q || r.ref.toLowerCase().includes(q.toLowerCase())));
  let selected = $derived(new Set<string>(multi && Array.isArray(value) ? value : []));

  function toggle(ref: string) {
    const s = new Set(selected);
    s.has(ref) ? s.delete(ref) : s.add(ref);
    value = refs.map((r) => r.ref).filter((r) => s.has(r)).concat([...s].filter((r) => !refs.some((x) => x.ref === r)));
  }
</script>

{#if !canList}
  {#if multi}
    <textarea
      class="textarea mono"
      rows="3"
      value={freeText}
      placeholder="customers, orders"
      onchange={(e) => (value = e.currentTarget.value.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean))}
    ></textarea>
    <span class="help">Comma-separated table names. Browsing tables needs the data permission.</span>
  {:else}
    <input class="input mono" value={value ?? ''} placeholder="table" oninput={(e) => (value = e.currentTarget.value)} />
  {/if}
{:else if !connectionId}
  <div class="muted small">Choose a connection first.</div>
{:else if !multi}
  <div class="row">
    <input class="input mono" list="tbl-{connectionId}" bind:value placeholder={tables === null ? 'Loading tables…' : 'table'} />
    <button type="button" class="btn icon" title="Reload tables" onclick={() => connectionId && load(connectionId, true)}><RefreshCw size={13} /></button>
  </div>
  <datalist id="tbl-{connectionId}">
    {#each refs as r}<option value={r.ref}>~{fmtCompact(r.t.estimatedRows)} rows</option>{/each}
  </datalist>
  {#if err}<div class="errtxt small">{err}</div>{/if}
{:else}
  <div class="multi">
    <div class="mh">
      <div class="search"><Search size={12} /><input class="input" placeholder="Filter…" bind:value={q} /></div>
      <button type="button" class="btn sm" onclick={() => (value = [...new Set([...(Array.isArray(value) ? value : []), ...shown.map((r) => r.ref)])])}>All</button>
      <button type="button" class="btn sm" onclick={() => (value = [])}>None</button>
    </div>
    <div class="tl scroll">
      {#if tables === null}
        <div class="muted small pad">Loading…</div>
      {:else if err}
        <div class="errtxt small pad">{err}</div>
      {:else}
        {#each shown as r (r.ref)}
          <label class="ti">
            <input type="checkbox" checked={selected.has(r.ref)} onchange={() => toggle(r.ref)} />
            <span class="mono ellipsis">{r.ref}</span>
            {#if !r.t.hasPrimaryKey}<span class="warn" title="No primary key"><TriangleAlert size={11} /></span>{/if}
            <span class="spacer"></span>
            <span class="tiny muted num">{fmtCompact(r.t.estimatedRows)}</span>
          </label>
        {:else}
          <div class="muted small pad">No tables.</div>
        {/each}
      {/if}
    </div>
    <div class="tiny muted">{selected.size ? `${selected.size} selected` : 'None selected = all tables'}</div>
  </div>
{/if}

<style>
  .multi {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .mh {
    display: flex;
    gap: 4px;
  }
  .search {
    position: relative;
    flex: 1;
  }
  .search :global(svg) {
    position: absolute;
    left: 7px;
    top: 8px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 24px;
    height: 24px;
  }
  .tl {
    max-height: 200px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 2px;
  }
  .ti {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
  }
  .ti:hover {
    background: var(--bg-hover);
  }
  .ti input {
    accent-color: var(--accent);
    margin: 0;
  }
  .warn {
    color: var(--warn);
    display: inline-flex;
  }
  .pad {
    padding: 6px;
  }
  .errtxt {
    color: var(--err);
  }
</style>
