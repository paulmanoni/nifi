<script lang="ts">
  // What each connection is holding right now, with a peek at the rows
  // waiting in it and a way to throw them away.
  import { api } from '../api/client';
  import type { QueueInfo } from '../api/types';
  import { fmtNum, cellText } from '../format';
  import { toast } from '../stores/toast.svelte';
  import { confirm } from '../stores/confirm.svelte';
  import { auth } from '../stores/auth.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import { RefreshCw, Trash2, ArrowRight, RotateCw, Inbox } from 'lucide-svelte';

  let { runId, live = false, onselectedge }: { runId: string; live?: boolean; onselectedge?: (id: string) => void } = $props();

  let queues = $state<QueueInfo[] | null>(null);
  let loading = $state(false);
  let open = $state<string | null>(null);
  let timer: ReturnType<typeof setInterval> | undefined;

  async function load() {
    loading = true;
    try {
      queues = (await api.queues(runId)) ?? [];
    } catch (e) {
      toast.error(e);
      queues ??= [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void runId;
    load();
    clearInterval(timer);
    if (live) timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  });

  async function empty(q: QueueInfo) {
    const ok = await confirm({
      title: 'Empty queue',
      message: `Throw away the ${fmtNum(q.queuedRows)} row${q.queuedRows === 1 ? '' : 's'} waiting before “${q.toName}”? They are not written anywhere, and the run carries on with what comes next.`,
      confirmLabel: 'Empty queue',
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await api.emptyQueue(runId, q.edgeId);
      toast.info(`Dropped ${fmtNum(r.droppedRows)} rows`);
      load();
    } catch (e) {
      toast.error(e);
    }
  }
</script>

<div class="q">
  <div class="bar">
    <span class="muted small">{live ? 'Updating while the run goes' : 'A finished run holds nothing'}</span>
    <span class="spacer"></span>
    <button class="btn sm icon" title="Refresh" onclick={load}><RefreshCw size={13} class={loading ? 'spin' : ''} /></button>
  </div>

  {#if queues === null}
    <Skeleton rows={3} />
  {:else if queues.length === 0}
    <div class="none"><Inbox size={22} /><p class="muted small">Nothing queued. Connections show their rows here while a run is going.</p></div>
  {:else}
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>Connection</th><th class="right">Queued</th><th class="right">Passed</th><th>Retries</th><th style="width:1%"></th></tr>
        </thead>
        <tbody>
          {#each queues as q (q.edgeId)}
            <tr class="clickable" onclick={() => (open = open === q.edgeId ? null : q.edgeId)}>
              <td>
                <span class="conn">
                  <b>{q.fromName}</b>
                  {#if q.fromPort && q.fromPort !== 'success'}<span class="port">{q.fromPort}</span>{/if}
                  <ArrowRight size={12} />
                  <b>{q.toName}</b>
                </span>
                {#if q.table}<div class="tiny muted">last batch: <span class="mono">{q.table}</span>{#if q.rows?.length} · {q.rows.length} row peek{/if}</div>{/if}
              </td>
              <td class="right num">
                {fmtNum(q.queuedRows)}
                <div class="bar-mini"><div style:width="{Math.min(100, q.capacityRows ? (q.queuedRows / q.capacityRows) * 100 : 0)}%"></div></div>
              </td>
              <td class="right num">{fmtNum(q.rowsPassed)}{#if q.rowsDropped}<div class="tiny err">{fmtNum(q.rowsDropped)} dropped</div>{/if}</td>
              <td>
                {#if q.retries}
                  <span class="tiny"><RotateCw size={11} /> up to {q.retries}{q.onFailure === 'dead_letter' ? ', then dead letters' : ''}</span>
                  {#if q.retried}<div class="tiny warn">{fmtNum(q.retried)} retried</div>{/if}
                {:else}
                  <span class="tiny muted">none</span>
                {/if}
              </td>
              <td onclick={(e) => e.stopPropagation()}>
                <div class="row">
                  {#if onselectedge}
                    <button class="btn ghost sm" onclick={() => onselectedge(q.edgeId)}>Open</button>
                  {/if}
                  {#if auth.can.run && live}
                    <button class="btn ghost sm icon danger" title="Empty this queue" disabled={!q.queuedRows} onclick={() => empty(q)}><Trash2 size={14} /></button>
                  {/if}
                </div>
              </td>
            </tr>
            {#if open === q.edgeId}
              <tr class="peek">
                <td colspan="5">
                  {#if q.rows?.length && q.columns?.length}
                    <div class="table-wrap">
                      <table class="table sm">
                        <thead><tr>{#each q.columns as c}<th class="mono">{c.name}</th>{/each}</tr></thead>
                        <tbody>
                          {#each q.rows as row}
                            <tr>{#each row as v}{@const t = cellText(v)}<td class="mono {t.kind}">{t.text}</td>{/each}</tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                    <p class="tiny muted">The most recent batch to travel this connection{q.seenAt ? ` (${new Date(q.seenAt).toLocaleTimeString()})` : ''} — up to 20 rows.</p>
                  {:else}
                    <p class="tiny muted">No rows have travelled this connection yet.</p>
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .q {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .conn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
  }
  .port {
    padding: 0 5px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    font-size: 10.5px;
    color: var(--text-3);
  }
  .bar-mini {
    height: 3px;
    border-radius: 2px;
    background: var(--bg-sunken);
    margin-top: 3px;
  }
  .bar-mini div {
    height: 100%;
    border-radius: 2px;
    background: var(--accent);
  }
  .none {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 24px;
    color: var(--text-3);
  }
  .none p {
    margin: 0;
  }
  .peek td {
    background: var(--bg-sunken);
  }
  .table.sm td,
  .table.sm th {
    padding: 3px 8px;
    font-size: 11.5px;
  }
  .err {
    color: var(--err);
  }
  .warn {
    color: var(--warn);
  }
</style>
