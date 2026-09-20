<script lang="ts">
  import { api } from '../../api/client';
  import { getCanvasCtx } from '../context';
  import { cellText } from '../../format';
  import { FlaskConical, LoaderCircle, FunctionSquare, Search } from 'lucide-svelte';
  import { catalog } from '../../stores/catalog.svelte';
  import { auth } from '../../stores/auth.svelte';

  let { value = $bindable(), nodeId, compact = false }: { value?: string; nodeId: string; compact?: boolean } = $props();
  const ctx = getCanvasCtx();
  // expr test needs `edit`; the sample row comes from preview, which needs `data`.
  let canTest = $derived(auth.can.edit && auth.can.data);

  let el = $state<HTMLInputElement | null>(null);
  let fnOpen = $state(false);
  let fnQ = $state('');
  let testing = $state(false);

  const groupLabels: Record<string, string> = {
    text: 'Text', value: 'Values & numbers', time: 'Dates & times', hash: 'Hashing & ids',
    go: 'Go-compatible helpers', app: 'This application',
  };
  let fnList = $derived(
    catalog.functions.filter((f) => {
      const q = fnQ.trim().toLowerCase();
      return !q || f.name.toLowerCase().includes(q) || (f.help ?? '').toLowerCase().includes(q);
    }),
  );
  let fnGroups = $derived(
    [...new Set(fnList.map((f) => f.group ?? 'other'))].map((g) => ({ group: g, label: groupLabels[g] ?? g, items: fnList.filter((f) => (f.group ?? 'other') === g) })),
  );

  function openFns() {
    catalog.loadFunctions();
    fnQ = '';
    fnOpen = !fnOpen;
  }
  /** Insert `name(` at the caret (replacing any selection). */
  function insert(name: string) {
    const src = value ?? '';
    const at = el?.selectionStart ?? src.length;
    const to = el?.selectionEnd ?? at;
    const call = `${name}(`;
    value = src.slice(0, at) + call + src.slice(to) + '';
    fnOpen = false;
    queueMicrotask(() => {
      el?.focus();
      const pos = at + call.length;
      el?.setSelectionRange(pos, pos);
    });
  }
  let result = $state<{ value?: unknown; type?: string; error?: string; note?: string } | null>(null);
  let rowIdx = $state(0);
  let sampleRows = $state(0);

  async function test() {
    testing = true;
    result = null;
    try {
      const s = await ctx.sampleFor(nodeId);
      const columns = s?.columns ?? [];
      const rows = s?.rows ?? [];
      sampleRows = rows.length;
      const row = rows[Math.min(rowIdx, Math.max(0, rows.length - 1))] ?? [];
      const r = await api.exprTest(value ?? '', columns, row);
      result = { ...r, note: rows.length ? `row ${Math.min(rowIdx, rows.length - 1) + 1} of ${rows.length}${s?.table ? ` · ${s.table}` : ''}` : 'no sample row (empty input)' };
    } catch (e) {
      result = { error: (e as Error).message };
    } finally {
      testing = false;
    }
  }
</script>

<div class="expr" class:compact>
  <div class="row">
    <input
      bind:this={el}
      class="input mono"
      bind:value
      placeholder="e.g. lower(trim(email))"
      spellcheck="false"
      onkeydown={(e) => e.key === 'Enter' && canTest && (e.preventDefault(), test())}
    />
    <button type="button" class="btn {compact ? 'sm icon' : ''}" onclick={openFns} title="Functions you can use here">
      <FunctionSquare size={13} />{compact ? '' : ' Functions'}
    </button>
    {#if canTest}
    <button type="button" class="btn {compact ? 'sm icon' : ''}" onclick={test} disabled={testing || !value} title="Evaluate against a sample row from preview">
      {#if testing}<LoaderCircle size={13} class="spin" />{:else}<FlaskConical size={13} />{/if}{compact ? '' : ' Test'}
    </button>
    {/if}
  </div>
  {#if fnOpen}
    <button type="button" class="scrim" aria-label="Close function list" onclick={() => (fnOpen = false)}></button>
    <div class="fns" role="dialog" aria-label="Functions">
      <div class="fsearch"><Search size={12} /><input class="input sm" placeholder="Search functions" bind:value={fnQ} /></div>
      <div class="flist">
        {#each fnGroups as g (g.group)}
          <div class="fg tiny muted">{g.label}</div>
          {#each g.items as f (f.name)}
            <button type="button" class="fn" onclick={() => insert(f.name)} title={f.help}>
              <span class="mono fname">{f.name}<span class="args">({f.args ?? ''})</span></span>
              {#if f.help}<span class="fhelp">{f.help}</span>{/if}
            </button>
          {/each}
        {:else}
          <p class="tiny muted pad">No function matches “{fnQ}”.</p>
        {/each}
      </div>
      <p class="tiny muted pad">Columns are variables: <span class="mono">email</span>, or <span class="mono">row["Name"]</span> when the name is unusual. Click a function to insert it.</p>
    </div>
  {/if}
  {#if result}
    <div class="res" class:err={!!result.error}>
      {#if result.error}
        <span class="mono">{result.error}</span>
      {:else}
        {@const c = cellText(result.value)}
        <span class="mono val {c.kind}">{c.text}</span>
        <span class="badge">{result.type}</span>
      {/if}
      <span class="spacer"></span>
      {#if sampleRows > 1}
        <select class="rowsel" bind:value={rowIdx} onchange={test} title="Sample row">
          {#each Array(sampleRows) as _, i}<option value={i}>row {i + 1}</option>{/each}
        </select>
      {/if}
      {#if result.note}<span class="tiny muted">{result.note}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .expr {
    position: relative;
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: transparent;
    border: none;
  }
  .fns {
    position: absolute;
    z-index: 61;
    top: calc(100% + 4px);
    right: 0;
    width: min(420px, 90vw);
    max-height: 360px;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .fsearch {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--border);
    color: var(--text-3);
  }
  .fsearch .input {
    flex: 1;
  }
  .flist {
    overflow: auto;
    padding: 4px;
  }
  .fg {
    padding: 6px 6px 2px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .fn {
    display: block;
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    padding: 4px 6px;
    cursor: pointer;
    color: var(--text);
    font: inherit;
  }
  .fn:hover {
    background: var(--bg-hover);
  }
  .fname {
    font-size: 12px;
  }
  .args {
    color: var(--text-3);
  }
  .fhelp {
    display: block;
    font-size: 11.5px;
    color: var(--text-2);
  }
  .pad {
    padding: 6px 8px;
  }
  .expr {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .expr .input {
    flex: 1;
    min-width: 0;
  }
  .compact .input {
    height: 24px;
  }
  .res {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: var(--ok-soft);
    font-size: 12px;
    flex-wrap: wrap;
  }
  .res.err {
    background: var(--err-soft);
    color: var(--err);
  }
  .val {
    word-break: break-all;
  }
  .val.null {
    color: var(--text-3);
    font-style: italic;
  }
  .rowsel {
    font: inherit;
    font-size: 11px;
    background: transparent;
    color: var(--text-2);
    border: 1px solid var(--border);
    border-radius: 3px;
  }
</style>
