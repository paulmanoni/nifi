<script lang="ts">
  // Every save of a flow is kept. This lists them, says what changed between
  // a saved edit and the flow as it is now, and can put an earlier one back.
  import { api } from '../api/client';
  import type { Flow, FlowVersion, Graph } from '../api/types';
  import Modal from '../components/Modal.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import { fmtRelative } from '../format';
  import { toast } from '../stores/toast.svelte';
  import { confirm } from '../stores/confirm.svelte';
  import { History, RotateCcw, Plus, Minus, Pencil, CircleX } from 'lucide-svelte';

  let {
    flowId,
    current,
    readOnly = false,
    onclose,
    onrestored,
  }: { flowId: string; current: Graph; readOnly?: boolean; onclose: () => void; onrestored: (f: Flow) => void } = $props();

  let versions = $state<FlowVersion[] | null>(null);
  let picked = $state<FlowVersion | null>(null);
  let loading = $state(false);
  let error = $state('');

  // svelte-ignore state_referenced_locally
  api.versions(flowId).then(
    (v) => {
      versions = v ?? [];
      if (versions.length) open(versions[0]);
    },
    (e) => ((error = (e as Error).message), (versions = [])),
  );

  async function open(v: FlowVersion) {
    loading = true;
    try {
      picked = await api.version(flowId, v.version);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  /** What this saved edit would change if it were restored. */
  let diff = $derived.by(() => {
    if (!picked?.graph) return null;
    const now = new Map(current.nodes.map((n) => [n.id, n]));
    const then = new Map(picked.graph.nodes.map((n) => [n.id, n]));
    const added = [...then.values()].filter((n) => !now.has(n.id));
    const removed = [...now.values()].filter((n) => !then.has(n.id));
    const changed = [...then.values()].filter((n) => {
      const c = now.get(n.id);
      return c && JSON.stringify([c.name, c.config, c.concurrency, c.disabled]) !== JSON.stringify([n.name, n.config, n.concurrency, n.disabled]);
    });
    const edges = picked.graph.edges.length - current.edges.length;
    return { added, removed, changed, edges, same: !added.length && !removed.length && !changed.length && edges === 0 };
  });

  async function restore() {
    if (!picked) return;
    const ok = await confirm({
      title: `Restore version ${picked.version}`,
      message: `Put this flow back as it was ${fmtRelative(picked.savedAt)}? The version you have now is kept in the history, so this can be undone.`,
      confirmLabel: 'Restore',
    });
    if (!ok) return;
    loading = true;
    try {
      const f = await api.restoreVersion(flowId, picked.version);
      toast.success(`Restored version ${picked.version}`);
      onrestored(f);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<Modal title="History" width="min(860px, 96vw)" height="min(620px, 88vh)" {onclose}>
  {#snippet headerExtra()}
    {#if versions?.length}<span class="count tiny muted">{versions.length} saved edit{versions.length === 1 ? '' : 's'}</span>{/if}
  {/snippet}

  {#if versions === null}
    <Skeleton rows={6} />
  {:else if versions.length === 0}
    <div class="empty">
      <History size={28} />
      <h3>No history yet</h3>
      <p class="muted small">Each save is kept here, so an edit can be compared with the flow as it is now and put back.</p>
    </div>
  {:else}
    <div class="split">
      <aside class="list scroll">
        {#each versions as v (v.version)}
          <button class="item" class:on={picked?.version === v.version} onclick={() => open(v)}>
            <div class="l1">
              <b>v{v.version}</b>
              <span class="muted tiny">{fmtRelative(v.savedAt)}</span>
            </div>
            <div class="l2 ellipsis">{v.note || v.name}</div>
            {#if v.actor}<div class="tiny muted ellipsis">by {v.actor}</div>{/if}
          </button>
        {/each}
      </aside>
      <section class="detail scroll">
        {#if loading && !picked}
          <Skeleton rows={4} />
        {:else if picked}
          <div class="dh">
            <h3>Version {picked.version}</h3>
            <span class="muted small">saved {fmtRelative(picked.savedAt)}{picked.actor ? ` by ${picked.actor}` : ''}</span>
            <span class="spacer"></span>
            {#if !readOnly}
              <button class="btn primary sm" onclick={restore} disabled={loading}><RotateCcw size={13} /> Restore this version</button>
            {/if}
          </div>
          {#if picked.note}<p class="note">{picked.note}</p>{/if}
          <div class="facts">
            <span><b>{picked.graph?.nodes.length ?? 0}</b> nodes</span>
            <span><b>{picked.graph?.edges.length ?? 0}</b> connections</span>
            <span class="mono">{picked.name}</span>
          </div>

          <h4>Compared with the flow now</h4>
          {#if !diff}
            <p class="muted small">This version kept no flow.</p>
          {:else if diff.same}
            <p class="muted small">Identical — restoring it would change nothing.</p>
          {:else}
            <ul class="diff">
              {#each diff.added as n (n.id)}
                <li class="add"><Plus size={12} /> <b>{n.name}</b> <span class="muted tiny">{n.type}</span> <span class="muted">would come back</span></li>
              {/each}
              {#each diff.removed as n (n.id)}
                <li class="rem"><Minus size={12} /> <b>{n.name}</b> <span class="muted tiny">{n.type}</span> <span class="muted">would be removed</span></li>
              {/each}
              {#each diff.changed as n (n.id)}
                <li class="chg"><Pencil size={12} /> <b>{n.name}</b> <span class="muted">settings would change back</span></li>
              {/each}
              {#if diff.edges !== 0}
                <li class="chg"><Pencil size={12} /> <b>{Math.abs(diff.edges)}</b> <span class="muted">connection{Math.abs(diff.edges) === 1 ? '' : 's'} would be {diff.edges > 0 ? 'added' : 'removed'}</span></li>
              {/if}
            </ul>
          {/if}
        {/if}
        {#if error}<div class="callout err"><CircleX size={15} /> <span>{error}</span></div>{/if}
      </section>
    </div>
  {/if}
</Modal>

<style>
  .split {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 12px;
    height: 100%;
    min-height: 0;
  }
  .list {
    border-right: 1px solid var(--border);
    padding-right: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
  }
  .item {
    text-align: left;
    border: 1px solid transparent;
    background: none;
    border-radius: var(--radius-sm);
    padding: 5px 7px;
    cursor: pointer;
    color: var(--text);
    font: inherit;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .l1 {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .l2 {
    font-size: 12px;
    color: var(--text-2);
  }
  .detail {
    min-width: 0;
    min-height: 0;
  }
  .dh {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dh h3 {
    margin: 0;
  }
  .note {
    margin: 6px 0;
    font-size: 12.5px;
  }
  .facts {
    display: flex;
    gap: 14px;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 12.5px;
    color: var(--text-2);
  }
  h4 {
    margin: 12px 0 6px;
  }
  .diff {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .diff li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
  }
  .diff .add {
    color: var(--ok);
  }
  .diff .rem {
    color: var(--err);
  }
  .diff .chg {
    color: var(--warn);
  }
  .count {
    margin-left: 8px;
  }
</style>
