<script lang="ts">
  import { Handle, Position, type NodeProps, type Node } from '@xyflow/svelte';
  import { ChevronDown, ChevronRight, Folder } from 'lucide-svelte';

  // A lane is both the container the open flows sit in and, once collapsed,
  // the single box that stands for them. Same header either way, so the click
  // target does not move when it folds.
  type Counts = { total: number; running: number; failed: number; completed: number };
  type LaneData = {
    name: string;
    path: string;
    collapsed: boolean;
    counts: Counts;
    ontoggle: (path: string) => void;
  };
  let { data }: NodeProps<Node<LaneData>> = $props();

  let state = $derived(
    data.counts.running ? 'running' : data.counts.failed ? 'failed' : data.counts.completed === data.counts.total ? 'completed' : 'never',
  );
</script>

<div class="lane {state}" class:folded={data.collapsed}>
  <button
    class="hd"
    onclick={(e) => (e.stopPropagation(), data.ontoggle(data.path))}
    title={data.collapsed ? `Open ${data.name}` : `Collapse ${data.name}`}
  >
    {#if data.collapsed}<ChevronRight size={12} />{:else}<ChevronDown size={12} />{/if}
    <Folder size={12} />
    <span class="nm">{data.name}</span>
    <span class="n">{data.counts.total}</span>
  </button>
  {#if data.collapsed}
    <div class="pips">
      {#if data.counts.running}<span class="pip running">{data.counts.running} running</span>{/if}
      {#if data.counts.failed}<span class="pip failed">{data.counts.failed} failed</span>{/if}
      {#if data.counts.completed}<span class="pip completed">{data.counts.completed} done</span>{/if}
      {#if !data.counts.running && !data.counts.failed && !data.counts.completed}
        <span class="pip">never run</span>
      {/if}
    </div>
  {/if}
  <Handle type="target" position={Position.Left} isConnectable={false} class="dh" />
  <Handle type="source" position={Position.Right} isConnectable={false} class="dh" />
</div>

<style>
  .lane {
    --c: var(--border-strong);
    width: 100%;
    height: 100%;
    border: 1px solid var(--border);
    border-top: 2px solid var(--c);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--bg-sunken) 60%, transparent);
    box-sizing: border-box;
  }
  .lane.folded {
    background: var(--node-bg);
    box-shadow: var(--node-shadow);
    cursor: pointer;
  }
  .lane.running {
    --c: var(--accent);
  }
  .lane.failed {
    --c: var(--err);
  }
  .lane.completed {
    --c: var(--ok);
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    padding: 3px 8px;
    border: 0;
    background: none;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
  }
  .hd:hover {
    color: var(--text);
  }
  .nm {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .n {
    margin-left: auto;
    font-family: var(--mono);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--text-3);
    text-transform: none;
  }
  .pips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 2px 8px 6px;
  }
  .pip {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 2px;
    background: var(--bg-sunken);
    color: var(--text-2);
  }
  .pip.running {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--accent-text, var(--accent));
  }
  .pip.failed {
    background: color-mix(in srgb, var(--err) 18%, transparent);
    color: var(--err);
  }
  .pip.completed {
    background: color-mix(in srgb, var(--ok) 18%, transparent);
    color: var(--ok);
  }
</style>
