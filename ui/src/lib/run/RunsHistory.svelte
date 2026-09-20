<script lang="ts">
  import { api } from '../api/client';
  import type { RunSummary } from '../api/types';
  import { fmtCompact, fmtDuration, fmtTime } from '../format';
  import { href } from '../router.svelte';
  import StatusPill from '../components/StatusPill.svelte';
  import Skeleton from '../components/Skeleton.svelte';

  let { flowId, currentId, refreshKey = 0 }: { flowId: string; currentId?: string; refreshKey?: number } = $props();
  let runs = $state<RunSummary[] | null>(null);
  let err = $state('');

  $effect(() => {
    void refreshKey;
    api.flowRuns(flowId).then(
      (r) => (runs = r ?? []),
      (e) => ((err = e.message), (runs = [])),
    );
  });
</script>

{#if runs === null}
  <Skeleton rows={4} />
{:else if err}
  <div class="empty small">{err}</div>
{:else if runs.length === 0}
  <div class="empty small">This flow has never run.</div>
{:else}
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>Started</th><th>Status</th><th>Duration</th><th class="right">Read</th><th class="right">Written</th><th class="right">Failed</th><th></th></tr></thead>
    <tbody>
      {#each runs as r (r.id)}
        <tr class:cur={r.id === currentId}>
          <td>{fmtTime(r.startedAt)}</td>
          <td><StatusPill status={r.status} live={r.live} size="sm" /></td>
          <td class="num">{fmtDuration(r.startedAt, r.finishedAt)}</td>
          <td class="right num">{fmtCompact(r.rowsRead)}</td>
          <td class="right num">{fmtCompact(r.rowsWritten)}</td>
          <td class="right num" style:color={r.rowsFailed ? 'var(--err)' : undefined}>{fmtCompact(r.rowsFailed)}</td>
          <td><a href={href(`/runs/${r.id}`)}>Open</a></td>
        </tr>
      {/each}
    </tbody>
  </table>
  </div>
{/if}

<style>
  .table td,
  .table th {
    padding: 4px 10px;
  }
  tr.cur td {
    background: var(--accent-soft);
  }
</style>
