<script lang="ts">
  import { ChevronRight, Folder, FolderOpen } from 'lucide-svelte';
  import type { FolderNode } from './folders';
  import Self from './FolderTree.svelte';

  let {
    nodes,
    scope,
    open,
    onpick,
    ontoggle,
    depth = 0,
  }: {
    nodes: FolderNode[];
    scope: string;
    open: Set<string>;
    onpick: (path: string) => void;
    ontoggle: (path: string) => void;
    depth?: number;
  } = $props();
</script>

{#each nodes as n (n.path)}
  {@const expanded = open.has(n.path)}
  {@const here = scope === n.path}
  {@const under = scope.startsWith(n.path + '/')}
  <div class="row" class:on={here} class:under style:padding-left="{6 + depth * 13}px">
    {#if n.children.length}
      <button
        class="twist"
        class:open={expanded}
        onclick={() => ontoggle(n.path)}
        aria-label={expanded ? `Collapse ${n.name}` : `Expand ${n.name}`}
        aria-expanded={expanded}><ChevronRight size={11} /></button>
    {:else}
      <span class="twist"></span>
    {/if}
    <button class="pick" onclick={() => onpick(n.path)} title={n.path}>
      {#if here || under}<FolderOpen size={12} />{:else}<Folder size={12} />{/if}
      <span class="nm">{n.name}</span>
      <span class="n">{n.total}</span>
    </button>
  </div>
  {#if expanded && n.children.length}
    <Self nodes={n.children} {scope} {open} {onpick} {ontoggle} depth={depth + 1} />
  {/if}
{/each}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 22px;
    padding-right: 4px;
  }
  .row.on {
    background: var(--accent-soft, color-mix(in srgb, var(--accent) 14%, transparent));
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .row.under {
    background: color-mix(in srgb, var(--accent) 5%, transparent);
  }
  .row:hover:not(.on) {
    background: var(--bg-hover);
  }
  .twist {
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: none;
    color: var(--text-3);
    padding: 0;
    cursor: pointer;
    transition: transform 0.12s ease;
  }
  .twist.open {
    transform: rotate(90deg);
  }
  .pick {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 5px;
    border: 0;
    background: none;
    padding: 0 2px;
    font: inherit;
    font-size: 11.5px;
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }
  .row.on .pick {
    font-weight: 600;
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
  }
</style>
