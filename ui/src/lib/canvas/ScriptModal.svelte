<script lang="ts">
  import { api } from '../api/client';
  import type { ScriptTestResponse } from '../api/types';
  import { getCanvasCtx, type Sample } from './context';
  import Modal from '../components/Modal.svelte';
  import CodeEditor from '../components/CodeEditor.svelte';
  import DataGrid from '../components/DataGrid.svelte';
  import { FlaskConical, LoaderCircle, CircleX, Check } from 'lucide-svelte';
  import { auth } from '../stores/auth.svelte';

  const STARTER = `# Python (Starlark dialect). Available imports: json, re, math, time, datetime, hashlib, uuid.
# Not available: other modules, classes, try/except, with.

def transform(row):
    # row is a dict of column -> value. Return a dict, a list of dicts (fan out),
    # or None to drop the row. Set row["_table"] = "name" to send it to another table.
    return row
`;

  let {
    value,
    nodeId,
    title,
    onsave,
    onclose,
  }: { value: string; nodeId: string; title: string; onsave: (s: string) => void; onclose: () => void } = $props();

  const ctx = getCanvasCtx();
  let ro = $derived(ctx.readOnly());
  // script test needs `edit`; its input rows come from preview, which needs `data`.
  let canTest = $derived(auth.can.edit && auth.can.data);

  // svelte-ignore state_referenced_locally
  let code = $state(value?.trim() ? value : STARTER);
  let modeOverride = $state<'auto' | 'row' | 'batch'>('auto');
  let mode = $derived<'row' | 'batch'>(
    modeOverride !== 'auto' ? modeOverride : /^\s*def\s+transform_batch\s*\(/m.test(code) ? 'batch' : 'row',
  );
  let testing = $state(false);
  let sample = $state<Sample>(null);
  let result = $state<ScriptTestResponse | null>(null);
  let err = $state('');
  let view = $state<'output' | 'input'>('output');
  // svelte-ignore state_referenced_locally
  let dirty = $derived(code !== (value?.trim() ? value : STARTER));

  async function test() {
    if (!canTest) return;
    testing = true;
    err = '';
    try {
      sample = await ctx.sampleFor(nodeId);
      if (!sample) {
        err = 'No input rows: connect an upstream node that produces rows (preview returned nothing).';
        result = null;
        return;
      }
      result = await api.scriptTest({ script: code, mode, columns: sample.columns, rows: sample.rows });
      view = 'output';
    } catch (e) {
      err = (e as Error).message;
    } finally {
      testing = false;
    }
  }

  function save() {
    onsave(code);
  }

  function onkey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      e.stopPropagation();
      if (!ro) save();
    }
  }
</script>

<svelte:window onkeydowncapture={onkey} />

<Modal title="Script · {title}" width="min(1280px, 96vw)" height="min(860px, 94vh)" {onclose}>
  {#snippet headerExtra()}
    <span class="badge accent">Starlark (Python dialect)</span>
    <select class="select modesel" bind:value={modeOverride} title="Script mode">
      <option value="auto">mode: auto ({mode})</option>
      <option value="row">mode: row — transform(row)</option>
      <option value="batch">mode: batch — transform_batch(rows)</option>
    </select>
  {/snippet}
  <div class="split">
    <div class="edcol">
      <CodeEditor bind:value={code} language="python" readonly={ro} errorLine={result?.error ? (result.line ?? null) : null} onrun={test} />
    </div>
    <div class="out">
      <div class="obar">
        {#if canTest}
        <button class="btn primary" onclick={test} disabled={testing}>
          {#if testing}<LoaderCircle size={14} class="spin" />{:else}<FlaskConical size={14} />{/if} Test on preview rows
        </button>
        <span class="kbd">⌘/Ctrl ↵</span>
        {:else}
          <span class="muted small">Testing scripts needs the edit and data permissions.</span>
        {/if}
        <span class="spacer"></span>
        {#if sample}<span class="muted small">{sample.rows.length} input rows{sample.table ? ` · ${sample.table}` : ''}</span>{/if}
      </div>

      {#if err}
        <div class="msg err"><CircleX size={14} /> {err}</div>
      {/if}
      {#if result}
        {#if result.error}
          <div class="msg err">
            <CircleX size={14} />
            <div>
              {#if result.line}<strong>Line {result.line}:</strong>{/if}
              <span class="mono">{result.error}</span>
            </div>
          </div>
        {:else}
          <div class="msg ok">
            <Check size={14} /> {result.rows.length} rows out · {result.dropped} dropped · {sample?.rows.length ?? 0} in
          </div>
        {/if}
        <div class="tabs">
          <button class="tab" class:active={view === 'output'} onclick={() => (view = 'output')}>Output</button>
          <button class="tab" class:active={view === 'input'} onclick={() => (view = 'input')}>Input</button>
        </div>
        <div class="grid">
          {#if view === 'output'}
            <DataGrid columns={result.columns ?? []} rows={result.rows ?? []} emptyText={result.error ? 'Script failed' : 'All rows dropped'} />
          {:else if sample}
            <DataGrid columns={sample.columns} rows={sample.rows} />
          {/if}
        </div>
        <div class="logs">
          <div class="lh">Logs <span class="muted">({result.logs?.length ?? 0})</span></div>
          <pre>{#each result.logs ?? [] as l}{l}{'\n'}{:else}<span class="muted">print() output appears here</span>{/each}</pre>
        </div>
      {:else if !err}
        <div class="empty">
          <FlaskConical size={28} />
          <p>Run the script against up to 20 rows arriving at this node — nothing is written.</p>
          <p class="small">
            <code>def transform(row)</code> → dict, list of dicts (fan-out), or <code>None</code> (drop).<br />
            <code>def transform_batch(rows)</code> → list of dicts.
          </p>
        </div>
      {/if}
    </div>
  </div>
  {#snippet footer()}
    <span class="muted small">{ro ? 'Read-only' : dirty ? 'Unsaved script changes' : ''}</span>
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}>{ro ? 'Close' : 'Cancel'}</button>
    {#if !ro}<button class="btn primary" onclick={save}>Apply script</button>{/if}
  {/snippet}
</Modal>

<style>
  .split {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 12px;
    height: calc(min(860px, 94vh) - 124px);
  }
  .edcol {
    min-height: 0;
  }
  .modesel {
    width: auto;
    height: 24px;
    font-size: 12px;
  }
  .out {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }
  .obar {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .msg {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 10px;
    border-radius: var(--radius);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .msg.err {
    background: var(--err-soft);
    color: var(--err);
  }
  .msg.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .grid {
    flex: 1;
    min-height: 120px;
  }
  .logs {
    flex: none;
    max-height: 30%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .lh {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 2px;
  }
  .logs pre {
    margin: 0;
    padding: 6px 8px;
    background: var(--bg-sunken);
    border-radius: var(--radius);
    font-family: var(--mono);
    font-size: 11.5px;
    overflow: auto;
    min-height: 40px;
  }
  .empty p {
    max-width: 380px;
    margin: 0;
  }
</style>
