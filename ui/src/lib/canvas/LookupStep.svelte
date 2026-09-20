<script lang="ts" module>
  import type { TableMeta as TM } from '../api/types';
  const metaCache = new Map<string, Promise<TM>>();
</script>

<script lang="ts">
  import { api } from '../api/client';
  import type { Column, TableMeta } from '../api/types';
  import { catalog } from '../stores/catalog.svelte';
  import TableField from './fields/TableField.svelte';
  import ColumnPicker from './fields/ColumnPicker.svelte';
  import { ArrowRight, KeyRound, Search, LoaderCircle, ChevronRight, Info, ArrowUp, ArrowDown, X } from 'lucide-svelte';

  // One lookup table of a Lookup node: connection, table, key, match,
  // fields [{key,value}], existing, missing, where.
  let {
    config,
    groups,
    readOnly = false,
    canData = true,
    index = 0,
    total = 1,
    onset,
    onremove,
    onmove,
  }: {
    config: Record<string, any>;
    groups: { table: string; columns: Column[] }[];
    readOnly?: boolean;
    canData?: boolean;
    index?: number;
    total?: number;
    onset: (key: string, value: any) => void;
    onremove?: () => void;
    onmove?: (dir: -1 | 1) => void;
  } = $props();
  const uid = Math.random().toString(36).slice(2, 8);

  $effect(() => {
    catalog.loadConnections().catch(() => {});
  });

  let connId = $derived((config.connection as string) ?? '');
  let table = $derived((config.table as string) ?? '');
  let conn = $derived(catalog.connections.find((c) => c.id === connId));

  // ---- lookup table columns ----
  let meta = $state<TableMeta | null>(null);
  let metaErr = $state('');
  let metaLoading = $state(false);
  $effect(() => {
    const c = connId,
      t = table;
    meta = null;
    metaErr = '';
    if (!c || !t || !canData) return;
    const k = `${c}|${t}`;
    if (!metaCache.has(k)) metaCache.set(k, api.tableMeta(c, t));
    metaLoading = true;
    metaCache
      .get(k)!
      .then((m) => {
        if (c === connId && t === table) meta = m;
      })
      .catch((e) => {
        metaCache.delete(k);
        if (c === connId && t === table) metaErr = (e as Error).message;
      })
      .finally(() => (metaLoading = false));
  });

  let lookupCols = $derived(meta?.columns ?? []);
  let indexed = $derived(
    new Set([...(meta?.primaryKey ?? []), ...(meta?.indexes ?? []).map((i) => i.columns[0])].filter(Boolean)),
  );

  // match is "column" or "table.column" (applies to that incoming table only).
  let tablesIn = $derived(groups.map((g) => g.table));
  let matchRaw = $derived((config.match as string) ?? '');
  let matchTable = $derived.by(() => {
    const i = matchRaw.lastIndexOf('.');
    if (i <= 0) return '';
    const t = matchRaw.slice(0, i);
    return tablesIn.some((x) => x.toLowerCase() === t.toLowerCase()) || tablesIn.length === 0 ? t : '';
  });
  let matchCol = $derived(matchTable ? matchRaw.slice(matchTable.length + 1) : matchRaw);
  let matchGroups = $derived(matchTable ? groups.filter((g) => g.table.toLowerCase() === matchTable.toLowerCase()) : groups);
  function setMatch(table: string, col: string) {
    onset('match', table && col ? `${table}.${col}` : col);
  }
  let appliesTo = $derived(matchTable || (tablesIn.length === 1 ? tablesIn[0] : ''));
  let skippedTables = $derived(
    matchTable
      ? tablesIn.filter((t) => t.toLowerCase() !== matchTable.toLowerCase())
      : groups.filter((g) => matchCol && !g.columns.some((c) => c.name === matchCol)).map((g) => g.table),
  );

  // Suggest the join key once columns are known: <incoming table>_id or user_id.
  let inputCols = $derived(groups.flatMap((g) => g.columns.map((c) => c.name)));
  $effect(() => {
    if (readOnly || !meta || config.key) return;
    const guess = meta.columns.find((c) => /_id$/.test(c.name) && inputCols.includes('id'));
    if (guess) {
      onset('key', guess.name);
      if (!config.match) {
        const withId = groups.find((g) => g.columns.some((c) => c.name === 'id'));
        onset('match', groups.length > 1 && withId ? `${withId.table}.id` : 'id');
      }
    }
  });

  // ---- fields (lookup column → new column) ----
  type Pair = { key: string; value: string };
  let pairs = $derived<Pair[]>(
    (Array.isArray(config.fields) ? config.fields : []).filter((p: Pair) => p && typeof p.key === 'string' && p.key.trim() !== ''),
  );
  let picked = $derived(new Map(pairs.map((p) => [p.key, p.value])));
  let q = $state('');
  let shownCols = $derived(
    lookupCols.filter((c) => c.name !== config.key && (!q || c.name.toLowerCase().includes(q.toLowerCase()))),
  );

  function writePairs(next: Map<string, string>) {
    // keep the lookup table's column order
    const ordered = lookupCols.filter((c) => next.has(c.name)).map((c) => ({ key: c.name, value: next.get(c.name) || c.name }));
    const extra = [...next]
      .filter(([k]) => k.trim() !== '' && !lookupCols.some((c) => c.name === k))
      .map(([key, value]) => ({ key, value }));
    onset('fields', [...ordered, ...extra]);
  }
  function toggle(col: string, on: boolean) {
    const m = new Map(picked);
    if (on) m.set(col, m.get(col) || col);
    else m.delete(col);
    writePairs(m);
  }
  function rename(col: string, to: string) {
    const m = new Map(picked);
    m.set(col, to);
    writePairs(m);
  }
  function all(on: boolean) {
    const m = new Map(picked);
    for (const c of shownCols) on ? m.set(c.name, m.get(c.name) || c.name) : m.delete(c.name);
    writePairs(m);
  }

  const existing = $derived((config.existing as string) || 'overwrite');
  const missing = $derived((config.missing as string) || 'null');
  let showAdvanced = $state(false);
  $effect(() => {
    if (config.where || config.multiple === 'last' || config.null_key === 'keep') showAdvanced = true;
  });

  let summary = $derived.by(() => {
    if (!connId || !table) return 'Choose the table to look values up in.';
    if (!config.key || !matchCol) return `Choose how rows of ${table} match incoming rows.`;
    if (!pairs.length) return `Choose which ${table} columns to copy.`;
    const cols = pairs.map((p) => (p.value && p.value !== p.key ? `${p.key} as ${p.value}` : p.key)).join(', ');
    const fill = existing === 'fill' ? ' only where they are still empty' : '';
    const miss =
      missing === 'drop' ? 'Rows with no match are dropped.' : missing === 'fail' ? 'Rows with no match go to failure.' : 'Rows with no match keep empty values.';
    const who = appliesTo ? `incoming ${appliesTo} row` : 'incoming row';
    const ref = appliesTo ? `${appliesTo}.${matchCol}` : matchCol;
    const skip = skippedTables.length ? ` Other tables (${skippedTables.join(', ')}) pass through unchanged.` : '';
    return `For each ${who}, find the ${table} row where ${table}.${config.key} = ${ref}, and copy ${cols}${fill}. ${miss}${skip}`;
  });
</script>

<div class="lk card" class:ro={readOnly}>
  <div class="head">
    <span class="idx">{index + 1}</span>
    <b class="mono">{table || 'New lookup'}</b>
    {#if index > 0}<span class="tiny muted">{existing === 'fill' ? 'fills what earlier lookups left empty' : 'overwrites earlier lookups'}</span>{/if}
    <span class="spacer"></span>
    {#if !readOnly && total > 1}
      <button type="button" class="btn ghost sm icon" title="Apply earlier" disabled={index === 0} onclick={() => onmove?.(-1)}><ArrowUp size={12} /></button>
      <button type="button" class="btn ghost sm icon" title="Apply later" disabled={index === total - 1} onclick={() => onmove?.(1)}><ArrowDown size={12} /></button>
    {/if}
    {#if !readOnly && onremove}
      <button type="button" class="btn ghost sm icon" title="Remove this lookup table" onclick={onremove}><X size={12} /></button>
    {/if}
  </div>
  <div class="summary"><Info size={13} /> <span>{summary}</span></div>

  <section>
    <h4><span class="n">1</span> Look up in</h4>
    <div class="stack">
      <div class="field">
        <label for="lk-conn-{uid}">Connection</label>
        <select id="lk-conn-{uid}" class="input" value={connId} disabled={readOnly} onchange={(e) => onset('connection', e.currentTarget.value)}>
          <option value="" disabled>Select…</option>
          {#each catalog.connections as c (c.id)}
            <option value={c.id}>{c.name || c.id} · {c.driver}</option>
          {/each}
        </select>
      </div>
      <div class="field">
        <span class="field-label">Table</span>
        {#if connId}
          <TableField connectionId={connId} bind:value={() => table, (v) => onset('table', v)} />
        {:else}
          <input class="input" disabled placeholder="choose a connection first" />
        {/if}
      </div>
    </div>
  </section>

  <section>
    <h4><span class="n">2</span> Match rows where</h4>
    <div class="join">
      <div class="side">
        <span class="lbl">{table || 'lookup table'} column</span>
        {#if lookupCols.length}
          <select class="input mono" value={config.key ?? ''} disabled={readOnly} onchange={(e) => onset('key', e.currentTarget.value)}>
            <option value="" disabled>column…</option>
            {#each lookupCols as c (c.name)}
              <option value={c.name}>{c.name}</option>
            {/each}
          </select>
        {:else}
          <input class="input mono" value={config.key ?? ''} placeholder="e.g. user_id" disabled={readOnly} oninput={(e) => onset('key', e.currentTarget.value)} />
        {/if}
      </div>
      <span class="eq">=</span>
      <div class="side">
        <span class="lbl">incoming {appliesTo || ''} column</span>
        <ColumnPicker groups={matchGroups} placeholder="e.g. id" bind:value={() => matchCol, (v) => setMatch(matchTable, v)} />
      </div>
    </div>
    {#if tablesIn.length > 1}
      <div class="field">
        <label for="lk-apply-{uid}">Apply to incoming table</label>
        <select id="lk-apply-{uid}" class="input" value={matchTable} disabled={readOnly} onchange={(e) => setMatch(e.currentTarget.value, matchCol)}>
          <option value="">Every table that has “{matchCol || 'the column'}”</option>
          {#each tablesIn as t (t)}
            <option value={t}>{t} only</option>
          {/each}
        </select>
        {#if skippedTables.length}
          <p class="hint">Passed through unchanged: {skippedTables.join(', ')}</p>
        {/if}
      </div>
    {/if}
    {#if config.key && lookupCols.length && !indexed.has(config.key)}
      <p class="hint warn">{table}.{config.key} has no index — lookups will scan the table. Add one on the source for large tables.</p>
    {/if}
  </section>

  <section>
    <h4>
      <span class="n">3</span> Copy these columns
      {#if lookupCols.length && !readOnly}
        <span class="spacer"></span>
        <button type="button" class="btn ghost sm" onclick={() => all(true)}>All</button>
        <button type="button" class="btn ghost sm" onclick={() => all(false)}>None</button>
      {/if}
    </h4>
    {#if metaLoading}
      <p class="hint"><LoaderCircle size={12} class="spin" /> loading {table} columns…</p>
    {:else if metaErr}
      <p class="hint err">{metaErr}</p>
    {:else if !lookupCols.length}
      <p class="hint">{canData ? 'Pick a table to see its columns.' : "You don't have permission to browse table columns."}</p>
    {:else}
      {#if lookupCols.length > 8}
        <div class="search"><Search size={12} /><input class="input sm" placeholder="filter columns" bind:value={q} /></div>
      {/if}
      <div class="cols">
        {#each shownCols as c (c.name)}
          {@const on = picked.has(c.name)}
          <label class="col" class:on>
            <input type="checkbox" checked={on} disabled={readOnly} onchange={(e) => toggle(c.name, e.currentTarget.checked)} />
            <span class="cn mono">
              {#if meta?.primaryKey.includes(c.name)}<KeyRound size={10} />{/if}{c.name}
            </span>
            <span class="ct mono">{c.nativeType || c.type}</span>
            {#if on}
              <ArrowRight size={11} class="arr" />
              <input
                placeholder="save as"
                class="input sm mono as"
                value={picked.get(c.name)}
                title="Name of the new column in the output"
                disabled={readOnly}
                onclick={(e) => e.preventDefault()}
                oninput={(e) => rename(c.name, e.currentTarget.value.trim() || c.name)}
              />
            {/if}
          </label>
        {/each}
      </div>
      <p class="hint">{pairs.length} of {lookupCols.length - (config.key ? 1 : 0)} columns copied. Edit the name under a column to rename it in the output; an existing column with that name is filled in place.</p>
    {/if}
  </section>

  <section>
    <h4><span class="n">4</span> If the row already has a value</h4>
    <div class="seg">
      <label class:on={existing === 'overwrite'}>
        <input type="radio" name="lk-ex-{uid}" checked={existing === 'overwrite'} disabled={readOnly} onchange={() => onset('existing', 'overwrite')} />
        <b>Overwrite it</b><span>the lookup value always wins</span>
      </label>
      <label class:on={existing === 'fill'}>
        <input type="radio" name="lk-ex-{uid}" checked={existing === 'fill'} disabled={readOnly} onchange={() => onset('existing', 'fill')} />
        <b>Keep it</b><span>only fill empty values — use on a 2nd lookup as a fallback</span>
      </label>
    </div>
  </section>

  <section>
    <h4><span class="n">5</span> If no {table || 'lookup'} row matches</h4>
    <div class="seg three">
      <label class:on={missing === 'null'}>
        <input type="radio" name="lk-miss-{uid}" checked={missing === 'null'} disabled={readOnly} onchange={() => onset('missing', 'null')} />
        <b>Keep the row</b><span>columns stay empty</span>
      </label>
      <label class:on={missing === 'drop'}>
        <input type="radio" name="lk-miss-{uid}" checked={missing === 'drop'} disabled={readOnly} onchange={() => onset('missing', 'drop')} />
        <b>Drop the row</b><span>like an inner join</span>
      </label>
      <label class:on={missing === 'fail'}>
        <input type="radio" name="lk-miss-{uid}" checked={missing === 'fail'} disabled={readOnly} onchange={() => onset('missing', 'fail')} />
        <b>Send to failure</b><span>review as dead letters</span>
      </label>
    </div>
  </section>

  <button type="button" class="adv" onclick={() => (showAdvanced = !showAdvanced)}>
    <ChevronRight size={12} class={showAdvanced ? 'rot' : ''} /> Advanced
  </button>
  {#if showAdvanced}
    <section class="advbody">
      <div class="field">
        <label for="lk-where-{uid}">Only use {table || 'lookup'} rows where</label>
        <input id="lk-where-{uid}" class="input mono" placeholder="e.g. deleted = 0" value={config.where ?? ''} disabled={readOnly} oninput={(e) => onset('where', e.currentTarget.value)} />
        <p class="hint">SQL condition in the {conn?.driver ?? 'source'} dialect.</p>
      </div>
      <div class="field">
        <label for="lk-multi-{uid}">When several {table || 'lookup'} rows match</label>
        <select id="lk-multi-{uid}" class="input" value={(config.multiple as string) || 'first'} disabled={readOnly} onchange={(e) => onset('multiple', e.currentTarget.value)}>
          <option value="first">Use the first (lowest primary key)</option>
          <option value="last">Use the last (highest primary key)</option>
        </select>
      </div>
      <div class="field">
        <label for="lk-null-{uid}">When the incoming {matchCol || 'value'} is empty (NULL)</label>
        <select id="lk-null-{uid}" class="input" value={(config.null_key as string) || 'missing'} disabled={readOnly} onchange={(e) => onset('null_key', e.currentTarget.value)}>
          <option value="missing">Treat it as no match</option>
          <option value="keep">Keep the row unchanged</option>
        </select>
      </div>
    </section>
  {/if}
</div>

<style>
  .lk {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px;
    background: var(--bg-elev, transparent);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
  }
  .idx {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    background: var(--accent);
  }
  .summary {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 9px 11px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
    font-size: 12px;
    line-height: 1.45;
    color: var(--text);
  }
  .summary :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 12px;
    font-weight: 600;
  }
  .n {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 10.5px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .spacer {
    flex: 1;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .join {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 8px;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .lbl {
    font-size: 10.5px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .eq {
    font-family: var(--mono);
    font-size: 14px;
    color: var(--text-3);
    padding-bottom: 5px;
  }
  .hint {
    margin: 0;
    font-size: 11px;
    color: var(--text-3);
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .hint.warn {
    color: var(--warn);
  }
  .hint.err {
    color: var(--err);
  }
  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-3);
  }
  .search input {
    flex: 1;
  }
  .cols {
    border: 1px solid var(--border);
    border-radius: 6px;
    max-height: 260px;
    overflow: auto;
  }
  .col {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    cursor: pointer;
  }
  .col:last-child {
    border-bottom: none;
  }
  .col.on {
    grid-template-columns: 16px minmax(0, 1fr) auto;
    grid-template-areas: 'cb name type' '. as as';
    row-gap: 4px;
    background: color-mix(in srgb, var(--accent) 5%, transparent);
  }
  .col.on > input[type='checkbox'] {
    grid-area: cb;
  }
  .col.on .cn {
    grid-area: name;
  }
  .col.on .ct {
    grid-area: type;
  }
  .col.on :global(.arr) {
    display: none;
  }
  .col.on .as {
    grid-area: as;
  }
  .cn {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ct {
    font-size: 10.5px;
    color: var(--text-3);
    white-space: nowrap;
  }
  .col :global(.arr) {
    color: var(--text-3);
  }
  .as {
    min-width: 0;
  }
  .seg {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .seg label {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    column-gap: 6px;
    row-gap: 1px;
    padding: 7px 9px;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }
  .seg label input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .seg label span {
    font-size: 10.5px;
    color: var(--text-3);
    line-height: 1.3;
  }
  .seg label.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
  }
  .adv {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    padding: 0;
    font-size: 12px;
    color: var(--text-2, var(--text-3));
    cursor: pointer;
  }
  .adv :global(.rot) {
    transform: rotate(90deg);
  }
  .advbody {
    padding-left: 12px;
    border-left: 2px solid var(--border);
  }
  .ro .seg label,
  .ro .col {
    cursor: default;
  }
</style>
