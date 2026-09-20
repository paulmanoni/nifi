<script lang="ts">
  import { api } from '../api/client';
  import type { Flow } from '../api/types';
  import Modal from '../components/Modal.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import { Search, CircleX, Link2 } from 'lucide-svelte';

  let {
    flowId,
    current,
    readOnly = false,
    onclose,
    onsaved,
  }: { flowId: string; current: string[]; readOnly?: boolean; onclose: () => void; onsaved: (deps: string[]) => void } = $props();

  let flows = $state<Flow[] | null>(null);
  // svelte-ignore state_referenced_locally
  let picked = $state(new Set<string>(current));
  let q = $state('');
  let saving = $state(false);
  let error = $state('');

  api.flows().then(
    (f) => (flows = (f ?? []).filter((x) => x.id !== flowId).sort((a, b) => a.name.localeCompare(b.name))),
    (e) => ((error = (e as Error).message), (flows = [])),
  );

  let shown = $derived((flows ?? []).filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase())));
  let dependents = $derived(new Set((flows ?? []).filter((f) => f.dependsOn?.includes(flowId)).map((f) => f.id)));
  let changed = $derived(picked.size !== current.length || current.some((c) => !picked.has(c)));

  function toggle(id: string) {
    if (readOnly) return;
    const s = new Set(picked);
    s.has(id) ? s.delete(id) : s.add(id);
    picked = s;
    error = '';
  }

  async function save() {
    saving = true;
    error = '';
    const deps = (flows ?? []).filter((f) => picked.has(f.id)).map((f) => f.id);
    // keep ids we couldn't list (shouldn't happen) rather than silently dropping them
    for (const id of picked) if (!deps.includes(id)) deps.push(id);
    try {
      const f = await api.updateFlow(flowId, { dependsOn: deps });
      onsaved(f.dependsOn ?? deps);
    } catch (e) {
      error = (e as Error).message; // e.g. "flow dependencies form a cycle: A → B → A"
    } finally {
      saving = false;
    }
  }
</script>

<Modal title="Dependencies" width="520px" {onclose}>
  <p class="intro">
    This flow runs only after the flows selected here have <strong>completed</strong>. “Run” starts unfinished prerequisites first; if one
    fails or is stopped, this run stops too.
  </p>
  <div class="search">
    <Search size={13} />
    <input class="input" placeholder="Search flows…" bind:value={q} />
  </div>
  <div class="list scroll">
    {#if flows === null}
      <Skeleton rows={5} />
    {:else}
      {#each shown as f (f.id)}
        <label class="item" class:on={picked.has(f.id)} class:ro={readOnly}>
          <input type="checkbox" checked={picked.has(f.id)} disabled={readOnly} onchange={() => toggle(f.id)} />
          <span class="nm ellipsis">{f.name}</span>
          {#if dependents.has(f.id)}<span class="badge warn" title="This flow depends on the current one — selecting it would form a cycle">depends on this</span>{/if}
          {#if f.dependsOn?.length}<span class="tiny muted"><Link2 size={10} /> {f.dependsOn.length}</span>{/if}
        </label>
      {:else}
        <div class="empty small">{flows.length ? 'No flows match.' : 'There are no other flows yet.'}</div>
      {/each}
    {/if}
  </div>
  {#if error}
    <div class="err" role="alert"><CircleX size={14} /> <span>{error}</span></div>
  {/if}
  {#snippet footer()}
    <span class="muted small">{picked.size} selected</span>
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}>{readOnly ? 'Close' : 'Cancel'}</button>
    {#if !readOnly}
      <button class="btn primary" onclick={save} disabled={saving || !changed}>{saving ? 'Saving…' : 'Save'}</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .intro {
    margin: 0 0 12px;
    color: var(--text-2);
  }
  .search {
    position: relative;
    margin-bottom: 6px;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 8px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 27px;
  }
  .list {
    max-height: 320px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 3px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--accent-soft);
  }
  .item.ro {
    cursor: default;
  }
  .item input {
    accent-color: var(--accent);
    margin: 0;
  }
  .nm {
    flex: 1;
    min-width: 0;
  }
  .err {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 10px;
    padding: 7px 10px;
    border-radius: var(--radius);
    background: var(--err-soft);
    color: var(--err);
  }
  .err :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
