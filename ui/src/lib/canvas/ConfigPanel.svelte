<script lang="ts">
  import type { Column, GraphNode, Issue, ProcessorSpec } from '../api/types';
  import { iconFor, categoryColor } from '../icons';
  import { visible, defaultConcurrency } from './model';
  import PropertyField from './PropertyField.svelte';
  import LookupEditor from './LookupEditor.svelte';
  import { X, Trash2, Eye, TriangleAlert, RefreshCw, LoaderCircle, Lock, Table2 } from 'lucide-svelte';

  let {
    node,
    spec,
    issues = [],
    groups,
    schemaState,
    onchange,
    onclose,
    ondelete,
    onpreview,
    onreloadschema,
    readOnly = false,
    canData = true,
    onmapping,
  }: {
    node: GraphNode;
    spec: ProcessorSpec | undefined;
    issues?: Issue[];
    groups: { table: string; columns: Column[] }[];
    schemaState: { loading: boolean; error: string };
    onchange: (patch: Partial<GraphNode>) => void;
    onclose: () => void;
    ondelete: () => void;
    onpreview: () => void;
    onreloadschema: () => void;
    readOnly?: boolean;
    canData?: boolean;
    onmapping?: () => void;
  } = $props();

  let Icon = $derived(iconFor(spec?.icon, spec?.category));
  let needsSchema = $derived(
    (spec?.properties ?? []).some(
      (p) => p.kind === 'columns' || p.kind === 'column' || p.kind === 'keyvalue' || (p.kind === 'list' && p.columns?.some((c) => c.kind === 'column')),
    ),
  );
  let shownProps = $derived((spec?.properties ?? []).filter((p) => visible(p, node.config ?? {})));

  function setConfig(key: string, v: any) {
    const c = { ...(node.config ?? {}) };
    if (v === undefined) delete c[key];
    else c[key] = v;
    onchange({ config: c });
  }
</script>

<aside class="cfg">
  <header style:--cat={spec ? categoryColor[spec.category] : 'var(--text-3)'}>
    <span class="ic"><Icon size={15} /></span>
    <div class="t">
      <div class="tt ellipsis">{spec?.label ?? node.type}</div>
      <div class="tiny muted mono ellipsis">{node.type} · {node.id}</div>
    </div>
    {#if canData}<button class="btn ghost sm icon" title="Preview data at this node" onclick={onpreview}><Eye size={14} /></button>{/if}
    {#if !readOnly}<button class="btn ghost sm icon danger" title="Delete node (Del)" onclick={ondelete}><Trash2 size={14} /></button>{/if}
    <button class="btn ghost sm icon" title="Close (Esc)" onclick={onclose}><X size={14} /></button>
  </header>
  <div class="body scroll">
    {#if spec?.description}<p class="desc">{spec.description}</p>{/if}

    {#if issues.length}
      <div class="issues">
        {#each issues as i}
          <div class="iss {i.level}"><TriangleAlert size={12} /> {i.message}</div>
        {/each}
      </div>
    {/if}

    {#if onmapping && canData}
      <button class="btn mapbtn" onclick={onmapping} title="See which tables will be created or loaded, and map them (also: double-click the node)">
        <Table2 size={14} /> Table mapping…
      </button>
    {/if}
    {#if readOnly}<div class="ro"><Lock size={12} /> Read-only — your account can't edit flows.</div>{/if}
    <fieldset class="fs" disabled={readOnly}>
    <div class="field">
      <label for="cfg-name">Name</label>
      <input id="cfg-name" class="input" value={node.name} oninput={(e) => onchange({ name: e.currentTarget.value })} />
    </div>
    <div class="grid2">
      {#if spec?.supportsConcurrency}
        <div class="field">
          <label for="cfg-conc">Concurrency</label>
          <input
            id="cfg-conc"
            class="input num"
            type="number"
            min="1"
            max="64"
            value={node.concurrency || defaultConcurrency(spec)}
            oninput={(e) => onchange({ concurrency: Math.max(1, Math.min(64, Math.trunc(Number(e.currentTarget.value)) || 1)) })}
          />
        </div>
      {/if}
      <div class="field">
        <span class="field-label">Enabled</span>
        <label class="row" style="height:28px;cursor:pointer">
          <span class="switch"><input type="checkbox" checked={!node.disabled} onchange={(e) => onchange({ disabled: !e.currentTarget.checked })} /><span></span></span>
          <span class="small dim">{node.disabled ? 'Disabled — skipped' : 'Enabled'}</span>
        </label>
      </div>
    </div>

    <div class="sect">
      <span>Properties</span>
      {#if needsSchema && canData}
        <span class="spacer"></span>
        {#if schemaState.loading}
          <span class="tiny muted"><LoaderCircle size={11} class="spin" /> schema…</span>
        {:else if schemaState.error}
          <span class="tiny err" title={schemaState.error}>schema unavailable</span>
        {:else}
          <span class="tiny muted">{groups.reduce((a, g) => a + g.columns.length, 0)} input columns</span>
        {/if}
        <button class="btn ghost sm icon" title="Reload input schema" onclick={onreloadschema}><RefreshCw size={12} /></button>
      {/if}
    </div>

    {#if !spec}
      <p class="muted small">Unknown processor type — its properties can't be edited.</p>
    {:else if (spec.properties ?? []).length === 0}
      <p class="muted small">This processor has no properties.</p>
    {/if}

    {#if node.type === 'transform.lookup'}
      <LookupEditor config={node.config ?? {}} {groups} {readOnly} {canData} onset={setConfig} />
    {:else}
    {#each shownProps as p (p.key)}
      <PropertyField
        spec={p}
        config={node.config ?? {}}
        nodeId={node.id}
        nodeName={node.name}
        {groups}
        bind:value={() => node.config?.[p.key], (v) => setConfig(p.key, v)}
      />
    {/each}
    {/if}

    <div class="sect"><span>Notes</span></div>
    <textarea class="textarea" rows="3" placeholder="Notes for your team…" value={node.notes ?? ''} oninput={(e) => onchange({ notes: e.currentTarget.value })}></textarea>
    </fieldset>
  </div>
</aside>

<style>
  .cfg {
    width: 340px;
    flex: none;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border-left: 1px solid var(--border);
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 8px 8px 10px;
    border-bottom: 1px solid var(--border);
    border-top: 3px solid var(--cat);
  }
  .ic {
    width: 28px;
    height: 28px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--cat) 14%, transparent);
    color: var(--cat);
  }
  .t {
    flex: 1;
    min-width: 0;
  }
  .tt {
    font-weight: 600;
  }
  .body {
    flex: 1;
    min-height: 0;
    padding: 12px;
  }
  .mapbtn {
    width: 100%;
    justify-content: center;
    margin-bottom: 12px;
  }
  .fs {
    border: none;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .ro {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    margin-bottom: 12px;
    border-radius: var(--radius-sm);
    background: var(--muted-soft);
    color: var(--text-2);
    font-size: 12px;
  }
  .desc {
    margin: 0 0 12px;
    color: var(--text-2);
    font-size: 12px;
  }
  .issues {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
  }
  .iss {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .iss :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .iss.error {
    background: var(--err-soft);
    color: var(--err);
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .sect {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .sect span:first-child {
    flex: none;
  }
  .err {
    color: var(--err);
  }
</style>
