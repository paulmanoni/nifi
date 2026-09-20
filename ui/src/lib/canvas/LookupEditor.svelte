<script lang="ts">
  import type { Column } from '../api/types';
  import LookupStep from './LookupStep.svelte';
  import { Plus, ChevronRight, Info } from 'lucide-svelte';

  // Lookup node editor: an ordered list of lookup tables (config.lookups),
  // each applied to the rows left by the previous one. A config written in
  // the original single-lookup shape is shown as one entry and migrated on
  // the first edit.
  let {
    config,
    groups,
    readOnly = false,
    canData = true,
    onset,
  }: {
    config: Record<string, any>;
    groups: { table: string; columns: Column[] }[];
    readOnly?: boolean;
    canData?: boolean;
    onset: (key: string, value: any) => void;
  } = $props();

  const entryKeys = ['connection', 'table', 'key', 'match', 'fields', 'existing', 'missing', 'where'];

  let entries = $derived.by<Record<string, any>[]>(() => {
    if (Array.isArray(config.lookups) && config.lookups.length) return config.lookups;
    const single: Record<string, any> = {};
    for (const k of entryKeys) if (config[k] !== undefined) single[k] = config[k];
    return [single];
  });

  function write(next: Record<string, any>[]) {
    onset('lookups', next);
    for (const k of entryKeys) if (config[k] !== undefined) onset(k, undefined);
  }
  function setEntry(i: number, key: string, value: any) {
    const next = entries.map((e, j) => (j === i ? { ...e, [key]: value } : e));
    if (value === undefined) delete next[i][key];
    write(next);
  }
  function add() {
    const last = entries[entries.length - 1] ?? {};
    write([...entries, { connection: last.connection, match: last.match, existing: 'fill', missing: 'null' }]);
  }
  function remove(i: number) {
    write(entries.filter((_, j) => j !== i));
  }
  function move(i: number, d: -1 | 1) {
    const next = [...entries];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    write(next);
  }

  let chain = $derived(entries.map((e) => e.table || '…').join(' → '));
  let showAdvanced = $state(false);
  $effect(() => {
    if (config.only_tables || (config.cache_size && config.cache_size !== 200000)) showAdvanced = true;
  });
</script>

<div class="lke">
  {#if entries.length > 1}
    <div class="chain"><Info size={13} /> <span>Lookups run in order: <b class="mono">{chain}</b>. Each one sees the columns filled by the ones above it.</span></div>
  {/if}

  {#each entries as e, i (i)}
    <LookupStep
      config={e}
      {groups}
      {readOnly}
      {canData}
      index={i}
      total={entries.length}
      onset={(k, v) => setEntry(i, k, v)}
      onremove={entries.length > 1 ? () => remove(i) : undefined}
      onmove={(d) => move(i, d)}
    />
  {/each}

  {#if !readOnly}
    <button type="button" class="btn addbtn" onclick={add}>
      <Plus size={13} /> Add another lookup table
    </button>
    <p class="hint">For example: names from <span class="mono">applicant</span>, then — only where still empty — from <span class="mono">employer_users</span>.</p>
  {/if}

  <button type="button" class="adv" onclick={() => (showAdvanced = !showAdvanced)}>
    <ChevronRight size={12} class={showAdvanced ? 'rot' : ''} /> Node options
  </button>
  {#if showAdvanced}
    <div class="advbody">
      <div class="field">
        <label for="lke-only">Only incoming tables</label>
        <input id="lke-only" class="input" placeholder="all tables" value={config.only_tables ?? ''} disabled={readOnly} oninput={(e) => onset('only_tables', e.currentTarget.value)} />
      </div>
      <div class="field">
        <label for="lke-cache">Cache entries per lookup table</label>
        <input id="lke-cache" class="input num" type="number" min="1000" value={config.cache_size ?? 200000} disabled={readOnly} oninput={(e) => onset('cache_size', Number(e.currentTarget.value) || 200000)} />
      </div>
    </div>
  {/if}
</div>

<style>
  .lke {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .chain {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 12px;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .chain :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--accent);
  }
  .addbtn {
    justify-content: center;
    border-style: dashed;
  }
  .hint {
    margin: -6px 0 0;
    font-size: 11px;
    color: var(--text-3);
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
    color: var(--text-3);
    cursor: pointer;
  }
  .adv :global(.rot) {
    transform: rotate(90deg);
  }
  .advbody {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 12px;
    border-left: 2px solid var(--border);
  }
</style>
