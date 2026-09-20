<script lang="ts">
  import type { RunSummary } from '../api/types';
  import { fmtCompact, fmtNum, fmtRelative, pct } from '../format';
  import { href } from '../router.svelte';
  import StatusPill from '../components/StatusPill.svelte';

  let {
    run,
    waiting = [],
    estimated = 0,
  }: { run?: RunSummary; waiting?: string[]; estimated?: number } = $props();

  let active = $derived(run && (run.status === 'running' || run.status === 'paused' || run.status === 'stopping'));
  // A live run has no total to be a fraction of.
  let noTotal = $derived(!!run?.live || !estimated);
</script>

<div class="cell">
  <div class="row1">
    {#if run}
      <a href={href(`/runs/${run.id}`)} onclick={(e) => e.stopPropagation()} title="Open run"><StatusPill status={run.status} live={run.live} size="sm" /></a>
    {:else}
      <StatusPill status={null} size="sm" />
    {/if}
    {#if run?.status === 'pending'}
      <span class="sub ellipsis" title={waiting.length ? `Waiting for ${waiting.join(', ')}` : 'Queued for a free run slot'}>
        {waiting.length ? `waiting for ${waiting.join(', ')}` : 'queued'}
      </span>
    {:else if active}
      <span class="sub num">{fmtCompact(run!.rowsWritten)}{noTotal ? '' : ` / ~${fmtCompact(estimated)}`} rows</span>
    {:else if run?.status === 'completed'}
      <span class="sub" title={run.finishedAt}>{fmtRelative(run.finishedAt ?? run.startedAt)}</span>
    {:else if run?.error}
      <span class="sub err ellipsis" title={run.error}>{run.error}</span>
    {:else if run}
      <span class="sub">{fmtRelative(run.startedAt)}</span>
    {/if}
  </div>
  {#if active}
    <div class="progress" title="{fmtNum(run!.rowsWritten)} rows written">
      <div style:width="{noTotal ? 8 : pct(run!.rowsWritten, estimated)}%" class:indet={noTotal}></div>
    </div>
  {/if}
</div>

<style>
  .cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .row1 {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .row1 a {
    text-decoration: none;
    flex: none;
  }
  .sub {
    font-size: 12px;
    color: var(--text-3);
    min-width: 0;
    max-width: 320px;
  }
  .sub.err {
    color: var(--err);
  }
  .progress {
    max-width: 260px;
  }
  .indet {
    animation: indet 1.4s ease-in-out infinite;
  }
  @keyframes indet {
    0% {
      margin-left: 0;
    }
    50% {
      margin-left: 80%;
    }
    100% {
      margin-left: 0;
    }
  }
</style>
