<script lang="ts">
  import { api } from '../api/client';
  import type { TableSummary, WriteMode } from '../api/types';
  import { catalog } from '../stores/catalog.svelte';
  import { toast } from '../stores/toast.svelte';
  import { navigate } from '../router.svelte';
  import { fmtBytes, fmtCompact } from '../format';
  import { tableRef } from '../tables';
  import Modal from '../components/Modal.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import { ArrowRight, Search, TriangleAlert, Check } from 'lucide-svelte';
  import { auth } from '../stores/auth.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let step = $state(1);
  let name = $state('');
  let sourceId = $state('');
  let targetId = $state('');
  let tables = $state<TableSummary[] | null>(null);
  let tablesErr = $state('');
  let selected = $state(new Set<string>());
  let filter = $state('');
  let targetSchema = $state('public');
  let mode = $state<WriteMode>('merge');
  let createTables = $state(true);
  let truncate = $state(false);
  let submitting = $state(false);

  catalog.loadConnections().catch(toast.error);

  let conns = $derived(catalog.connections);
  let source = $derived(conns.find((c) => c.id === sourceId));
  let target = $derived(conns.find((c) => c.id === targetId));
  let targets = $derived(conns.filter((c) => c.driver === 'postgres'));

  $effect(() => {
    if (!name && source && target) name = `${source.name} → ${target.name}`;
  });

  let loadedFor = '';
  // Without `data` permission tables can't be listed: the user names them (or migrates all).
  let manualTables = $state('');
  let manualList = $derived(manualTables.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean));

  async function loadTables() {
    if (!auth.can.data) return;
    if (!sourceId || loadedFor === sourceId) return;
    loadedFor = sourceId;
    tables = null;
    tablesErr = '';
    try {
      const t = (await api.tables(sourceId)) ?? [];
      tables = t.sort((a, b) => a.name.localeCompare(b.name));
      selected = new Set(t.map((x) => tableRef(x, source?.driver)));
    } catch (e) {
      tablesErr = (e as Error).message;
      tables = [];
      loadedFor = '';
    }
  }

  let visible = $derived(
    (tables ?? []).filter((t) => !filter || `${t.schema}.${t.name}`.toLowerCase().includes(filter.toLowerCase())),
  );
  let allSelected = $derived(!!tables?.length && selected.size === tables.length);
  let selRows = $derived((tables ?? []).filter((t) => selected.has(tableRef(t, source?.driver))).reduce((a, t) => a + (t.estimatedRows || 0), 0));
  let selBytes = $derived((tables ?? []).filter((t) => selected.has(tableRef(t, source?.driver))).reduce((a, t) => a + (t.sizeBytes || 0), 0));
  let noPk = $derived((tables ?? []).filter((t) => !t.hasPrimaryKey && selected.has(tableRef(t, source?.driver))).length);

  function toggle(ref: string) {
    const s = new Set(selected);
    s.has(ref) ? s.delete(ref) : s.add(ref);
    selected = s;
  }
  function setVisible(on: boolean) {
    const s = new Set(selected);
    for (const t of visible) {
      const r = tableRef(t, source?.driver);
      on ? s.add(r) : s.delete(r);
    }
    selected = s;
  }

  function next() {
    if (step === 1) {
      step = 2;
      loadTables();
    } else if (step === 2) step = 3;
  }

  async function submit() {
    submitting = true;
    try {
      const f = await api.wizard({
        name: name.trim() || 'Database migration',
        sourceConnectionId: sourceId,
        targetConnectionId: targetId,
        tables: !auth.can.data ? manualList : allSelected ? [] : [...selected],
        targetSchema: targetSchema.trim() || 'public',
        mode,
        createTables,
        truncate,
      });
      toast.success('Migration flow created');
      onclose();
      navigate(`/flows/${f.id}`);
    } catch (e) {
      toast.error(e);
    } finally {
      submitting = false;
    }
  }

  const modes: { value: WriteMode; label: string; help: string }[] = [
    { value: 'merge', label: 'Merge (upsert)', help: 'COPY into staging, then INSERT … ON CONFLICT DO UPDATE. Idempotent; safe to resume.' },
    { value: 'merge_ignore', label: 'Merge, ignore existing', help: 'Like merge but ON CONFLICT DO NOTHING — existing rows win.' },
    { value: 'copy', label: 'COPY (fastest)', help: 'Straight COPY. For fresh loads into empty tables; not idempotent.' },
    { value: 'insert', label: 'Batched INSERT', help: 'Multi-row INSERT fallback. Slowest.' },
  ];
</script>

<Modal title="Migrate a database" width="760px" height="min(640px, 90vh)" {onclose}>
  {#snippet headerExtra()}
    <div class="steps">
      {#each ['Connections', 'Tables', 'Options'] as s, i}
        <span class="step" class:on={step === i + 1} class:done={step > i + 1}>
          <span class="n">{#if step > i + 1}<Check size={11} />{:else}{i + 1}{/if}</span>{s}
        </span>
      {/each}
    </div>
  {/snippet}

  {#if step === 1}
    {#if !catalog.connectionsLoaded}
      <Skeleton rows={4} />
    {:else if conns.length === 0}
      <div class="empty"><h3>No connections</h3><p>Create a source and a target connection first.</p><a class="btn" href="#/connections">Go to connections</a></div>
    {:else}
      <div class="pair">
        <div class="field">
          <label for="wz-src">Source connection <span class="req">*</span></label>
          <select id="wz-src" class="select" bind:value={sourceId}>
            <option value="" disabled>Select…</option>
            {#each conns as c}<option value={c.id}>{c.name || c.id} ({c.driver} · {c.database})</option>{/each}
          </select>
          {#if source}<span class="help">{source.driver} · {source.host}:{source.port}/{source.database}</span>{/if}
        </div>
        <div class="arrow"><ArrowRight size={18} /></div>
        <div class="field">
          <label for="wz-dst">Target connection (PostgreSQL) <span class="req">*</span></label>
          <select id="wz-dst" class="select" bind:value={targetId}>
            <option value="" disabled>Select…</option>
            {#each targets as c}<option value={c.id} disabled={c.id === sourceId}>{c.name || c.id} ({c.database})</option>{/each}
          </select>
          {#if target}<span class="help">{target.host}:{target.port}/{target.database}</span>{/if}
        </div>
      </div>
      <div class="field">
        <label for="wz-name">Flow name</label>
        <input id="wz-name" class="input" bind:value={name} placeholder="Database migration" />
      </div>
      {#if targets.length === 0}
        <p class="muted small">No PostgreSQL connections yet — v1 writes to PostgreSQL only.</p>
      {/if}
    {/if}
  {:else if step === 2 && !auth.can.data}
    <div class="field">
      <label for="wz-manual">Tables to migrate</label>
      <textarea id="wz-manual" class="textarea mono" rows="6" bind:value={manualTables} placeholder="customers, orders, order_items"></textarea>
      <span class="help">Browsing the source's tables needs the <strong>data</strong> permission. List table names (comma or newline separated), or leave empty to migrate every table.</span>
    </div>
  {:else if step === 2}
    <div class="tbar">
      <div class="search">
        <Search size={14} />
        <input class="input" placeholder="Filter tables…" bind:value={filter} />
      </div>
      <button class="btn sm" onclick={() => setVisible(true)}>Select {filter ? 'shown' : 'all'}</button>
      <button class="btn sm" onclick={() => setVisible(false)}>Select none</button>
      <span class="spacer"></span>
      <span class="muted small num">{selected.size} / {tables?.length ?? 0} tables · ~{fmtCompact(selRows)} rows · {fmtBytes(selBytes)}</span>
    </div>
    {#if tables === null}
      <Skeleton rows={8} />
    {:else if tablesErr}
      <div class="empty"><h3>Could not list tables</h3><p class="errtxt">{tablesErr}</p><button class="btn" onclick={loadTables}>Retry</button></div>
    {:else}
      <div class="tlist scroll">
        <table class="table">
          <thead>
            <tr>
              <th style="width:1%"><input type="checkbox" checked={allSelected} indeterminate={!allSelected && selected.size > 0} onchange={(e) => setVisible(e.currentTarget.checked)} aria-label="Select all" /></th>
              <th>Table</th>
              <th class="right">Est. rows</th>
              <th class="right">Size</th>
              <th style="width:1%"></th>
            </tr>
          </thead>
          <tbody>
            {#each visible as t (t.schema + '.' + t.name)}
              {@const ref = tableRef(t, source?.driver)}
              <tr class="clickable" onclick={() => toggle(ref)}>
                <td><input type="checkbox" checked={selected.has(ref)} onclick={(e) => e.stopPropagation()} onchange={() => toggle(ref)} /></td>
                <td class="mono">{#if t.schema && source?.driver === 'postgres' && t.schema !== 'public'}<span class="muted">{t.schema}.</span>{/if}{t.name}</td>
                <td class="right num">{fmtCompact(t.estimatedRows)}</td>
                <td class="right num muted">{fmtBytes(t.sizeBytes)}</td>
                <td>
                  {#if !t.hasPrimaryKey}
                    <span class="nopk" title="No primary key: read as one streaming scan — not chunked, not resumable, and merge mode cannot upsert."><TriangleAlert size={14} /></span>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="muted" style="text-align:center">No tables</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if noPk}
        <p class="warnline"><TriangleAlert size={13} /> {noPk} selected table{noPk === 1 ? '' : 's'} without a primary key — streamed in one pass and not resumable.</p>
      {/if}
    {/if}
  {:else}
    <div class="summary">
      <strong>{source?.name}</strong> <span class="muted">({source?.driver})</span>
      <ArrowRight size={14} />
      <strong>{target?.name}</strong>
      <span class="spacer"></span>
      <span class="muted">{!auth.can.data ? (manualList.length ? `${manualList.length} tables` : 'all tables') : allSelected ? `all ${tables?.length ?? ''} tables` : `${selected.size} tables`}</span>
    </div>
    <div class="field">
      <label for="wz-schema">Target schema</label>
      <input id="wz-schema" class="input mono" bind:value={targetSchema} style="max-width:240px" />
    </div>
    <div class="field">
      <span class="field-label">Write mode</span>
      <div class="modes">
        {#each modes as m}
          <label class="mode" class:on={mode === m.value}>
            <input type="radio" name="mode" value={m.value} bind:group={mode} />
            <div>
              <div class="ml">{m.label}</div>
              <div class="help">{m.help}</div>
            </div>
          </label>
        {/each}
      </div>
    </div>
    <div class="field">
      <label class="check"><input type="checkbox" bind:checked={createTables} /> Create missing tables in the target</label>
      <label class="check"><input type="checkbox" bind:checked={truncate} /> Truncate target tables before loading</label>
      {#if truncate}<span class="warnline"><TriangleAlert size={13} /> Existing data in the selected target tables will be deleted.</span>{/if}
    </div>
  {/if}

  {#snippet footer()}
    {#if step > 1}<button class="btn" onclick={() => step--}>Back</button>{/if}
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}>Cancel</button>
    {#if step < 3}
      <button class="btn primary" onclick={next} disabled={(step === 1 && (!sourceId || !targetId || sourceId === targetId)) || (step === 2 && auth.can.data && (tables === null || selected.size === 0))}>Next</button>
    {:else}
      <button class="btn primary" onclick={submit} disabled={submitting}>{submitting ? 'Creating…' : 'Create flow'}</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .steps {
    display: flex;
    gap: 14px;
    margin-left: 16px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-3);
    font-size: 12px;
    font-weight: 500;
  }
  .step .n {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 11px;
    background: var(--bg-sunken);
    border: 1px solid var(--border-strong);
  }
  .step.on {
    color: var(--text);
  }
  .step.on .n {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .step.done .n {
    background: var(--ok-soft);
    border-color: var(--ok);
    color: var(--ok);
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: start;
  }
  .arrow {
    padding-top: 26px;
    color: var(--text-3);
  }
  .tbar {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .search {
    position: relative;
    width: 220px;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 7px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 28px;
  }
  .tlist {
    max-height: calc(min(640px, 90vh) - 190px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .tlist .table td {
    padding: 4px 12px;
  }
  .nopk {
    color: var(--warn);
    display: inline-flex;
  }
  .warnline {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--warn);
    font-size: 12px;
    margin: 8px 0 0;
  }
  .errtxt {
    color: var(--err);
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: var(--bg-sunken);
    border-radius: var(--radius);
    margin-bottom: 16px;
  }
  .modes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .mode {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
  }
  .mode.on {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .mode input {
    margin-top: 3px;
    accent-color: var(--accent);
  }
  .ml {
    font-weight: 600;
  }
  .field .check {
    margin-bottom: 4px;
  }
</style>
