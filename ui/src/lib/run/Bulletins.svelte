<script lang="ts">
  import type { Bulletin } from '../api/types';
  import { fmtClock } from '../format';
  import { Search } from 'lucide-svelte';

  let {
    bulletins,
    nodeName,
    onnode,
    follow = true,
  }: { bulletins: Bulletin[]; nodeName?: (id: string) => string | undefined; onnode?: (id: string) => void; follow?: boolean } = $props();

  let level = $state<'all' | 'info' | 'warn' | 'error'>('all');
  let q = $state('');
  let box = $state<HTMLDivElement>();
  let stick = $state(true);

  let shown = $derived(
    bulletins.filter(
      (b) =>
        (level === 'all' || b.level === level || (level === 'warn' && b.level === 'error')) &&
        (!q || b.message.toLowerCase().includes(q.toLowerCase()) || b.table?.toLowerCase().includes(q.toLowerCase())),
    ),
  );
  let counts = $derived({
    warn: bulletins.filter((b) => b.level === 'warn').length,
    error: bulletins.filter((b) => b.level === 'error').length,
  });

  $effect(() => {
    void shown.length;
    if (follow && stick && box) queueMicrotask(() => box && (box.scrollTop = box.scrollHeight));
  });

  function onscroll() {
    if (!box) return;
    stick = box.scrollHeight - box.scrollTop - box.clientHeight < 24;
  }
</script>

<div class="bl">
  <div class="bar">
    <div class="search"><Search size={13} /><input class="input" placeholder="Filter messages…" bind:value={q} /></div>
    <button class="btn sm" class:active={level === 'all'} onclick={() => (level = 'all')}>All <span class="muted">{bulletins.length}</span></button>
    <button class="btn sm" class:active={level === 'warn'} onclick={() => (level = 'warn')}>Warnings+ <span class="muted">{counts.warn + counts.error}</span></button>
    <button class="btn sm" class:active={level === 'error'} onclick={() => (level = 'error')}>Errors <span class="muted">{counts.error}</span></button>
  </div>
  <div class="list scroll" bind:this={box} {onscroll}>
    {#each shown as b (b.seq)}
      <div class="b {b.level}">
        <span class="t mono">{fmtClock(b.time)}</span>
        <span class="lv">{b.level}</span>
        {#if b.nodeId}
          <button class="node" onclick={() => onnode?.(b.nodeId!)} disabled={!onnode} title="Select node">{nodeName?.(b.nodeId) ?? b.nodeId}</button>
        {/if}
        {#if b.table}<span class="tbl mono">{b.table}</span>{/if}
        <span class="m">{b.message}</span>
      </div>
    {:else}
      <div class="empty small">No bulletins{bulletins.length ? ' match' : ' yet'}.</div>
    {/each}
  </div>
</div>

<style>
  .bl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    min-height: 0;
  }
  .bar {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .search {
    position: relative;
    width: 220px;
    margin-right: 6px;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 7px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 26px;
    height: 24px;
  }
  .list {
    flex: 1;
    min-height: 0;
    font-size: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-elev);
  }
  .b {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 3px 8px;
    border-bottom: 1px solid var(--border);
    border-left: 3px solid transparent;
  }
  .b.warn {
    border-left-color: var(--warn);
    background: color-mix(in srgb, var(--warn-soft) 50%, transparent);
  }
  .b.error {
    border-left-color: var(--err);
    background: color-mix(in srgb, var(--err-soft) 60%, transparent);
  }
  .t {
    color: var(--text-3);
    font-size: 11px;
    flex: none;
  }
  .lv {
    flex: none;
    width: 40px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--info);
  }
  .warn .lv {
    color: var(--warn);
  }
  .error .lv {
    color: var(--err);
  }
  .node {
    flex: none;
    font: inherit;
    font-size: 11px;
    padding: 0 6px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--bg-elev);
    color: var(--accent-text);
    cursor: pointer;
  }
  .node:disabled {
    cursor: default;
    color: var(--text-2);
  }
  .tbl {
    flex: none;
    color: var(--text-2);
  }
  .m {
    flex: 1;
    word-break: break-word;
    white-space: pre-wrap;
  }
</style>
