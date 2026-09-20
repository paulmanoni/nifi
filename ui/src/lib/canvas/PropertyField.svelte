<script lang="ts">
  import type { Column, PropertySpec } from '../api/types';
  import { catalog } from '../stores/catalog.svelte';
  import ColumnPicker from './fields/ColumnPicker.svelte';
  import ColumnsField from './fields/ColumnsField.svelte';
  import TableField from './fields/TableField.svelte';
  import TableEditor from './fields/TableEditor.svelte';
  import ExprField from './fields/ExprField.svelte';
  import ScriptField from './fields/ScriptField.svelte';
  import PickerField from './fields/PickerField.svelte';
  import { RefreshCw } from 'lucide-svelte';

  let {
    spec,
    value = $bindable(),
    config,
    nodeId,
    nodeName,
    groups,
  }: {
    spec: PropertySpec;
    value?: any;
    config: Record<string, any>;
    nodeId: string;
    nodeName: string;
    groups: { table: string; columns: Column[] }[];
  } = $props();

  let fid = $derived(`pf-${nodeId}-${spec.key}`);
  let missing = $derived(
    spec.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0 && spec.kind !== 'tables')),
  );

  $effect(() => {
    if (spec.kind === 'connection') catalog.loadConnections().catch(() => {});
  });
</script>

<div class="field" class:missing>
  {#if spec.kind === 'bool'}
    <label class="boolrow" for={fid}>
      <span class="switch"><input id={fid} type="checkbox" checked={!!value} onchange={(e) => (value = e.currentTarget.checked)} /><span></span></span>
      <span class="bl">{spec.label}{#if spec.required}<span class="req"> *</span>{/if}</span>
    </label>
  {:else}
    <label for={fid}>{spec.label}{#if spec.required}<span class="req">*</span>{/if}</label>
    {#if spec.kind === 'string'}
      <input id={fid} class="input" value={value ?? ''} oninput={(e) => (value = e.currentTarget.value)} placeholder={spec.default != null ? String(spec.default) : ''} />
    {:else if spec.kind === 'text'}
      <textarea id={fid} class="textarea" rows="3" value={value ?? ''} oninput={(e) => (value = e.currentTarget.value)}></textarea>
    {:else if spec.kind === 'int'}
      <input
        id={fid}
        class="input num"
        type="number"
        step="1"
        value={value ?? ''}
        placeholder={spec.default != null ? String(spec.default) : ''}
        oninput={(e) => {
          const s = e.currentTarget.value;
          value = s === '' ? undefined : Math.trunc(Number(s));
        }}
      />
    {:else if spec.kind === 'select'}
      <select id={fid} class="select" value={value ?? ''} onchange={(e) => (value = e.currentTarget.value)}>
        {#if !spec.required || value == null || value === ''}<option value="">—</option>{/if}
        {#each spec.options ?? [] as o}<option value={o.value}>{o.label}</option>{/each}
      </select>
    {:else if spec.kind === 'picker'}
      <PickerField bind:value options={spec.options ?? []} required={spec.required} label={spec.label} />
    {:else if spec.kind === 'connection'}
      <div class="row">
        <select id={fid} class="select" value={value ?? ''} onchange={(e) => (value = e.currentTarget.value)}>
          <option value="">{catalog.connectionsLoaded ? 'Select connection…' : 'Loading…'}</option>
          {#each catalog.connections as c}<option value={c.id}>{c.name || c.id} · {c.driver}/{c.database}</option>{/each}
          {#if value && catalog.connectionsLoaded && !catalog.connections.some((c) => c.id === value)}
            <option value={value}>{value} (missing)</option>
          {/if}
        </select>
        <button type="button" class="btn icon" title="Reload connections" onclick={() => catalog.loadConnections(true)}><RefreshCw size={13} /></button>
      </div>
    {:else if spec.kind === 'table'}
      <TableField bind:value connectionId={spec.connectionKey ? config?.[spec.connectionKey] : undefined} />
    {:else if spec.kind === 'tables'}
      <TableField bind:value multi connectionId={spec.connectionKey ? config?.[spec.connectionKey] : undefined} />
    {:else if spec.kind === 'columns'}
      <ColumnsField bind:value {groups} />
    {:else if spec.kind === 'column'}
      <ColumnPicker bind:value={() => value ?? '', (v) => (value = v)} {groups} />
    {:else if spec.kind === 'keyvalue' || spec.kind === 'list'}
      <TableEditor {spec} bind:value {groups} {nodeId} {nodeName} {config} />
    {:else if spec.kind === 'expr'}
      <ExprField bind:value={() => value ?? '', (v) => (value = v)} {nodeId} />
    {:else if spec.kind === 'script'}
      <ScriptField bind:value={() => value ?? '', (v) => (value = v)} {nodeId} title={nodeName} />
    {:else}
      <input id={fid} class="input mono" value={typeof value === 'string' ? value : JSON.stringify(value ?? '')} oninput={(e) => (value = e.currentTarget.value)} />
      <span class="help">Unsupported property kind “{spec.kind}”.</span>
    {/if}
  {/if}
  {#if spec.help}<span class="help">{spec.help}</span>{/if}
  {#if missing}<span class="help reqmsg">Required</span>{/if}
</div>

<style>
  .boolrow {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--text);
    font-size: 12.5px;
    font-weight: 500;
  }
  .missing :global(.input),
  .missing :global(.select) {
    border-color: color-mix(in srgb, var(--err) 55%, var(--border-strong));
  }
  .reqmsg {
    color: var(--err) !important;
  }
</style>
