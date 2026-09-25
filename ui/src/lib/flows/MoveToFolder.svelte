<script lang="ts">
  import { untrack } from 'svelte';
  import { Folder, FolderInput, FolderMinus } from 'lucide-svelte';
  import Modal from '../components/Modal.svelte';
  import { folderPaths, normalizeFolder } from './folders';
  import type { Flow } from '../api/types';

  // Where flows go used to be a window.prompt: free text, no sight of the
  // folders that already exist, and nothing to stop "migrations /people ".
  // Here the existing ones are the first thing you see, because filing
  // alongside something is the common case and typing a new path is not.
  let {
    flows,
    count,
    current = '',
    busy = false,
    onmove,
    onclose,
  }: {
    flows: Flow[];
    count: number;
    current?: string;
    busy?: boolean;
    onmove: (folder: string) => void;
    onclose: () => void;
  } = $props();

  // Opens on whatever the selection is filed under today; the dialog is
  // mounted fresh per use, so the initial value is the whole intent.
  let picked = $state(untrack(() => normalizeFolder(current)));
  let fresh = $state('');
  const existing = $derived(folderPaths(flows));
  const target = $derived(normalizeFolder(fresh) || picked);
</script>

<Modal title={`Move ${count} flow${count === 1 ? '' : 's'}`} {onclose} width="460px">
  <div class="body">
    <p class="muted small">
      A folder is just the path a flow carries, so moving the last flow out of one
      removes it. Use <code>/</code> to nest.
    </p>

    <div class="list" role="radiogroup" aria-label="Existing folders">
      <button class="opt" class:on={picked === '' && !fresh} onclick={() => ((picked = ''), (fresh = ''))}>
        <FolderMinus size={13} />
        <span>Ungrouped</span>
        <span class="muted tiny">no folder</span>
      </button>
      {#each existing as path}
        <button class="opt" class:on={picked === path && !fresh} onclick={() => ((picked = path), (fresh = ''))}>
          <Folder size={13} />
          <span class="path">{path}</span>
        </button>
      {/each}
    </div>

    <label class="new">
      <span class="muted small">Or a new folder</span>
      <input class="input" placeholder="e.g. migrations/archive" bind:value={fresh} />
    </label>
  </div>

  {#snippet footer()}
    <span class="muted small">
      {#if target}Moving to <strong>{target}</strong>{:else}Removing from any folder{/if}
    </span>
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}>Cancel</button>
    <button class="btn primary" disabled={busy} onclick={() => onmove(target)}>
      <FolderInput size={14} /> Move
    </button>
  {/snippet}
</Modal>

<style>
  .body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .list {
    max-height: 240px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-sunken);
  }
  .opt {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 9px;
    border: 0;
    border-bottom: 1px solid var(--border);
    background: none;
    font: inherit;
    font-size: 12px;
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }
  .opt:last-child {
    border-bottom: 0;
  }
  .opt:hover {
    background: var(--bg-hover);
  }
  .opt.on {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    font-weight: 600;
  }
  .path {
    font-family: var(--mono);
    font-size: 11.5px;
  }
  .new {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
