<script lang="ts">
  import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
  import type { RunSummary } from '../api/types';
  import { fmtCompact } from '../format';

  type DepData = { name: string; run?: RunSummary; waiting: string[]; hasIn: boolean; hasOut: boolean };
  let { data }: NodeProps<Node<DepData>> = $props();

  let status = $derived(data.run?.status ?? 'never');
  let sub = $derived(
    !data.run
      ? 'never run'
      : status === 'pending'
        ? data.waiting.length
          ? `waiting for ${data.waiting.join(', ')}`
          : 'queued'
        : status === 'failed' || status === 'stopped'
          ? (data.run.error ?? status)
          : `${fmtCompact(data.run.rowsWritten)} rows written`,
  );
</script>

<div class="dn {status}" title="{data.name}\n{sub}">
  <div class="top">
    <span class="dot"></span>
    <span class="name">{data.name}</span>
  </div>
  <div class="sub">{sub}</div>
  {#if data.hasIn}<Handle type="target" position={Position.Left} isConnectable={false} class="dh" />{/if}
  {#if data.hasOut}<Handle type="source" position={Position.Right} isConnectable={false} class="dh" />{/if}
</div>

<style>
  .dn {
    --c: var(--text-3);
    width: 220px;
    padding: 8px 10px 8px 12px;
    background: var(--node-bg);
    border: 1px solid var(--node-border);
    border-left: 3px solid var(--c);
    border-radius: 6px;
    box-shadow: var(--node-shadow);
    cursor: pointer;
    transition: box-shadow 0.15s, background 0.2s;
  }
  .dn:hover {
    box-shadow: var(--node-shadow-hover);
  }
  .dn.running,
  .dn.stopping {
    --c: var(--accent);
    background: color-mix(in srgb, var(--accent) 6%, var(--node-bg));
  }
  .dn.pending,
  .dn.paused {
    --c: var(--warn);
  }
  .dn.completed {
    --c: var(--ok);
  }
  .dn.failed {
    --c: var(--err);
    background: color-mix(in srgb, var(--err) 6%, var(--node-bg));
  }
  .dn.stopped {
    --c: var(--text-2);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .dot {
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: 50%;
    background: var(--c);
  }
  .running .dot {
    animation: pulse 1.4s ease-out infinite;
  }
  .never .dot {
    background: transparent;
    border: 1.5px solid var(--text-3);
  }
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent);
    }
    100% {
      box-shadow: 0 0 0 6px transparent;
    }
  }
  .name {
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sub {
    margin-top: 2px;
    padding-left: 15px;
    font-size: 11px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .failed .sub {
    color: var(--err);
  }
  :global(.svelte-flow .svelte-flow__handle.dh) {
    width: 6px;
    height: 6px;
    border: none;
    box-shadow: none;
    background: var(--edge);
    cursor: default;
  }
</style>
