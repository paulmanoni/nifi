<script lang="ts">
  import { api } from '../lib/api/client';
  import type { Parameter } from '../lib/api/types';
  import { toast } from '../lib/stores/toast.svelte';
  import { confirm } from '../lib/stores/confirm.svelte';
  import { auth } from '../lib/stores/auth.svelte';
  import { fmtRelative } from '../lib/format';
  import Skeleton from '../lib/components/Skeleton.svelte';
  import { Plus, Trash2, Search, Lock, Check, X, SlidersHorizontal, Pencil } from 'lucide-svelte';

  let params = $state<Parameter[] | null>(null);
  let q = $state('');
  let editing = $state<string | null>(null);
  let draft = $state<Parameter>({ name: '', value: '', description: '', sensitive: false });
  let saving = $state(false);

  async function load() {
    try {
      params = (await api.parameters()) ?? [];
    } catch (e) {
      toast.error(e);
      params ??= [];
    }
  }
  load();

  let shown = $derived(
    (params ?? []).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.description ?? '').toLowerCase().includes(q.toLowerCase())),
  );

  function add() {
    editing = '';
    draft = { name: '', value: '', description: '', sensitive: false };
  }
  function edit(p: Parameter) {
    editing = p.name;
    draft = { ...p, value: p.sensitive ? '' : p.value };
  }
  async function save() {
    const name = draft.name.trim();
    if (!name) return;
    saving = true;
    try {
      await api.saveParameter(name, { value: draft.value ?? '', description: draft.description ?? '', sensitive: !!draft.sensitive });
      toast.success(`#{${name}} saved`);
      editing = null;
      await load();
    } catch (e) {
      toast.error(e);
    } finally {
      saving = false;
    }
  }
  async function remove(p: Parameter) {
    const ok = await confirm({
      title: 'Delete parameter',
      message: `Delete #{${p.name}}? Flows that use it stop validating until it is defined again.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteParameter(p.name);
      await load();
    } catch (e) {
      toast.error(e);
    }
  }
</script>

<div class="page">
  <div class="page-head">
    <h1>Parameters</h1>
    <span class="badge">{params?.length ?? 0}</span>
    <span class="spacer"></span>
    <div class="search"><Search size={14} /><input class="input" placeholder="Filter parameters…" bind:value={q} /></div>
    {#if auth.can.edit}<button class="btn primary" onclick={add}><Plus size={14} /> New parameter</button>{/if}
  </div>

  <p class="lead muted">
    A parameter fills in a node's settings, so the same flow runs against different environments. Write
    <span class="mono">#&#123;name&#125;</span> in any setting — a target schema, a row filter, a file path — and it is replaced when the flow runs.
  </p>

  <div class="card">
    {#if params === null}
      <Skeleton rows={4} />
    {:else if params.length === 0 && editing === null}
      <div class="empty">
        <SlidersHorizontal size={30} />
        <h3>No parameters yet</h3>
        <p>Add one, then refer to it in a node's settings as <span class="mono">#&#123;name&#125;</span>.</p>
        {#if auth.can.edit}<button class="btn primary" onclick={add}><Plus size={14} /> New parameter</button>{/if}
      </div>
    {:else}
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Name</th><th>Value</th><th>Description</th><th>Updated</th><th style="width:1%"></th></tr>
          </thead>
          <tbody>
            {#if editing === ''}
              <tr class="editing">
                <td><input class="input mono" placeholder="schema" bind:value={draft.name} /></td>
                <td><input class="input mono" placeholder="value" bind:value={draft.value} /></td>
                <td><input class="input" placeholder="what it is for" bind:value={draft.description} /></td>
                <td colspan="2">
                  <div class="row end">
                    <label class="sens"><input type="checkbox" bind:checked={draft.sensitive} /> Sensitive</label>
                    <button class="btn sm" onclick={() => (editing = null)}><X size={13} /> Cancel</button>
                    <button class="btn sm primary" onclick={save} disabled={saving || !draft.name.trim()}><Check size={13} /> Save</button>
                  </div>
                </td>
              </tr>
            {/if}
            {#each shown as p (p.name)}
              {#if editing === p.name}
                <tr class="editing">
                  <td class="mono">{p.name}</td>
                  <td><input class="input mono" placeholder={p.sensitive ? 'new value' : 'value'} bind:value={draft.value} /></td>
                  <td><input class="input" bind:value={draft.description} /></td>
                  <td colspan="2">
                    <div class="row end">
                      <label class="sens"><input type="checkbox" bind:checked={draft.sensitive} /> Sensitive</label>
                      <button class="btn sm" onclick={() => (editing = null)}><X size={13} /> Cancel</button>
                      <button class="btn sm primary" onclick={save} disabled={saving}><Check size={13} /> Save</button>
                    </div>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td class="mono nm">#&#123;{p.name}&#125;{#if p.fixed}<span class="tag" title="Set by the application; edit it where the application is configured">fixed</span>{/if}</td>
                  <td class="mono val">
                    {#if p.sensitive}<span class="hidden"><Lock size={11} /> hidden</span>{:else}{p.value || '—'}{/if}
                  </td>
                  <td class="muted">{p.description || '—'}</td>
                  <td class="muted">{p.updatedAt ? fmtRelative(p.updatedAt) : '—'}</td>
                  <td>
                    {#if auth.can.edit && !p.fixed}
                      <div class="row actions">
                        <button class="btn ghost sm icon" title="Edit" onclick={() => edit(p)}><Pencil size={14} /></button>
                        <button class="btn ghost sm icon danger" title="Delete" onclick={() => remove(p)}><Trash2 size={14} /></button>
                      </div>
                    {/if}
                  </td>
                </tr>
              {/if}
            {:else}
              <tr><td colspan="5" class="muted" style="text-align:center;padding:20px">No parameter matches “{q}”.</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .lead {
    max-width: 70ch;
    margin: -4px 0 12px;
    font-size: 12.5px;
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
  .nm {
    white-space: nowrap;
  }
  .val {
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hidden {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-3);
    font-style: italic;
  }
  .tag {
    margin-left: 6px;
    padding: 1px 5px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font);
  }
  .editing td {
    background: var(--bg-sunken);
  }
  .row.end {
    justify-content: flex-end;
    gap: 6px;
  }
  .sens {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-2);
  }
  .actions {
    gap: 2px;
    justify-content: flex-end;
  }
  .empty p {
    max-width: 380px;
  }
</style>
