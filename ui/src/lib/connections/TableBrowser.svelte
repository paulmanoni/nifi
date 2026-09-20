<script lang="ts">
  import { api } from '../api/client';
  import type { Connection, TableMeta, TableSummary } from '../api/types';
  import { fmtBytes, fmtCompact, fmtNum } from '../format';
  import { tableRef } from '../tables';
  import Skeleton from '../components/Skeleton.svelte';
  import { Search, KeyRound, TriangleAlert, Link } from 'lucide-svelte';

  let { conn }: { conn: Connection } = $props();

  let tables = $state<TableSummary[] | null>(null);
  let err = $state('');
  let q = $state('');
  let sel = $state<string | null>(null);
  let meta = $state<TableMeta | null>(null);
  let metaErr = $state('');
  let metaLoading = $state(false);

  $effect(() => {
    const id = conn.id;
    tables = null;
    err = '';
    sel = null;
    meta = null;
    api.tables(id).then(
      (t) => (tables = (t ?? []).sort((a, b) => a.name.localeCompare(b.name))),
      (e) => ((err = e.message), (tables = [])),
    );
  });

  async function open(t: TableSummary) {
    const ref = tableRef(t, conn.driver);
    sel = ref;
    meta = null;
    metaErr = '';
    metaLoading = true;
    try {
      const m = await api.tableMeta(conn.id, ref);
      if (sel === ref) meta = m;
    } catch (e) {
      if (sel === ref) metaErr = (e as Error).message;
    } finally {
      metaLoading = false;
    }
  }

  let shown = $derived((tables ?? []).filter((t) => !q || `${t.schema}.${t.name}`.toLowerCase().includes(q.toLowerCase())));
  let totalRows = $derived((tables ?? []).reduce((a, t) => a + (t.estimatedRows || 0), 0));
  let totalBytes = $derived((tables ?? []).reduce((a, t) => a + (t.sizeBytes || 0), 0));
</script>

<div class="tb">
  <div class="list">
    <div class="lhead">
      <div class="search">
        <Search size={13} />
        <input class="input" placeholder="Filter {tables?.length ?? ''} tables…" bind:value={q} />
      </div>
      {#if tables?.length}<div class="muted tiny num">~{fmtCompact(totalRows)} rows · {fmtBytes(totalBytes)}</div>{/if}
    </div>
    <div class="items scroll">
      {#if tables === null}
        <Skeleton rows={10} height={12} />
      {:else if err}
        <div class="empty"><span class="errtxt">{err}</span></div>
      {:else}
        {#each shown as t (t.schema + '.' + t.name)}
          {@const ref = tableRef(t, conn.driver)}
          <button class="item" class:on={sel === ref} onclick={() => open(t)}>
            <span class="mono ellipsis">{tableRef(t, conn.driver)}</span>
            {#if !t.hasPrimaryKey}<span class="warn" title="No primary key"><TriangleAlert size={12} /></span>{/if}
            <span class="spacer"></span>
            <span class="muted tiny num">{fmtCompact(t.estimatedRows)}</span>
          </button>
        {:else}
          <div class="empty small">No tables</div>
        {/each}
      {/if}
    </div>
  </div>
  <div class="detail scroll">
    {#if !sel}
      <div class="empty">Select a table to inspect its columns, keys and indexes.</div>
    {:else if metaLoading}
      <Skeleton rows={8} />
    {:else if metaErr}
      <div class="empty"><span class="errtxt">{metaErr}</span></div>
    {:else if meta}
      <div class="mhead">
        <h3 class="mono">{meta.schema ? meta.schema + '.' : ''}{meta.name}</h3>
        <span class="badge">~{fmtNum(meta.estimatedRows)} rows</span>
        {#if meta.primaryKey?.length}<span class="badge accent"><KeyRound size={11} /> {meta.primaryKey.join(', ')}</span>{:else}<span class="badge warn">no primary key</span>{/if}
      </div>
      <div class="table-wrap">
      <table class="table compact">
        <thead><tr><th>Column</th><th>Type</th><th>Native</th><th>Null</th><th>Default</th></tr></thead>
        <tbody>
          {#each meta.columns as c}
            <tr>
              <td class="mono">
                {#if meta.primaryKey?.includes(c.name)}<KeyRound size={11} class="pk" />{/if}
                {c.name}
              </td>
              <td><span class="badge">{c.type}{c.length ? `(${c.length})` : c.precision ? `(${c.precision}${c.scale ? ',' + c.scale : ''})` : ''}</span></td>
              <td class="mono muted">{c.nativeType}</td>
              <td class="muted">{c.nullable ? 'yes' : 'no'}</td>
              <td class="mono muted ellipsis" style="max-width:160px" title={c.default}>{c.default ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
      {#if meta.indexes?.length}
        <h4>Indexes</h4>
        <div class="table-wrap">
        <table class="table compact">
          <tbody>
            {#each meta.indexes as ix}
              <tr><td class="mono">{ix.name}</td><td class="mono">({ix.columns.join(', ')})</td><td>{#if ix.unique}<span class="badge info">unique</span>{/if}</td></tr>
            {/each}
          </tbody>
        </table>
        </div>
      {/if}
      {#if meta.foreignKeys?.length}
        <h4>Foreign keys</h4>
        <div class="table-wrap">
        <table class="table compact">
          <tbody>
            {#each meta.foreignKeys as fk}
              <tr>
                <td class="mono">{fk.name}</td>
                <td class="mono">({fk.columns.join(', ')}) <Link size={11} /> {fk.refTable}({fk.refColumns.join(', ')})</td>
                <td class="muted tiny">{fk.onDelete ? `ON DELETE ${fk.onDelete}` : ''} {fk.onUpdate ? `ON UPDATE ${fk.onUpdate}` : ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .tb {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100%;
    min-height: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    min-height: 0;
  }
  .lhead {
    padding: 8px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .search {
    position: relative;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 8px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 26px;
  }
  .items {
    flex: 1;
    min-height: 0;
    padding: 4px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--text);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font: inherit;
    text-align: left;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .warn {
    color: var(--warn);
    display: inline-flex;
  }
  .detail {
    padding: 12px 16px;
    min-height: 0;
  }
  .mhead {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .mhead h3 {
    font-size: 14px;
  }
  h4 {
    margin: 16px 0 6px;
    font-size: 12px;
    color: var(--text-2);
  }
  .compact td,
  .compact th {
    padding: 4px 8px;
  }
  :global(.pk) {
    color: var(--warn);
    vertical-align: -1px;
  }
  .errtxt {
    color: var(--err);
  }
</style>
