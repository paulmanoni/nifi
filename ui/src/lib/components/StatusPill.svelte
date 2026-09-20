<script lang="ts">
  import type { RunStatus } from '../api/types';
  let {
    status,
    size = 'md',
    live = false,
  }: { status?: RunStatus | null; size?: 'sm' | 'md'; live?: boolean } = $props();
  // A live run is always "running"; saying so adds nothing, while saying it is
  // live says the thing that matters — it has no end of its own.
  let label = $derived(live && status === 'running' ? 'live' : status);
  const cls: Record<string, string> = {
    pending: 'muted',
    running: 'running',
    paused: 'warn',
    stopping: 'warn',
    stopped: 'muted',
    completed: 'ok',
    failed: 'err',
  };
</script>

{#if status}
  <span class="pill {cls[status] ?? 'muted'} {size}" title={live ? 'Follows its source; ends only when stopped' : undefined}>
    <span class="dot"></span>{label}
  </span>
{:else}
  <span class="pill none {size}">never run</span>
{/if}

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    text-transform: capitalize;
    background: var(--muted-soft);
    color: var(--text-2);
    white-space: nowrap;
  }
  .pill.sm {
    height: 18px;
    padding: 0 7px;
    font-size: 11px;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .none {
    font-weight: 500;
    color: var(--text-3);
    text-transform: none;
  }
  .ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .err {
    background: var(--err-soft);
    color: var(--err);
  }
  .warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .running {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .running .dot {
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.3;
      transform: scale(0.7);
    }
  }
</style>
