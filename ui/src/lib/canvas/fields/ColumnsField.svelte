<script lang="ts">
  import type { Column } from '../../api/types';
  import ColumnPicker from './ColumnPicker.svelte';
  import { X } from 'lucide-svelte';

  let { value = $bindable(), groups }: { value?: string[]; groups: { table: string; columns: Column[] }[] } = $props();

  let draft = $state('');
  let list = $derived(Array.isArray(value) ? value : []);
  let allNames = $derived([...new Set(groups.flatMap((g) => g.columns.map((c) => c.name)))]);

  function add(n: string) {
    n = n.trim();
    if (n && !list.includes(n)) value = [...list, n];
  }
  function remove(n: string) {
    value = list.filter((x) => x !== n);
  }
</script>

<div class="cols">
  {#if list.length}
    <div class="chips">
      {#each list as c (c)}
        <span class="chip mono" class:unknown={allNames.length > 0 && !allNames.includes(c)} title={allNames.length && !allNames.includes(c) ? 'Not in the input schema' : c}>
          {c}<button type="button" onclick={() => remove(c)} aria-label="Remove {c}"><X size={11} /></button>
        </span>
      {/each}
    </div>
  {/if}
  <div class="row">
    <ColumnPicker bind:value={draft} {groups} clearOnPick exclude={list} placeholder="Add column…" onpick={add} />
  </div>
  {#if allNames.length}
    <div class="row tiny">
      <button type="button" class="link" onclick={() => (value = [...new Set([...list, ...allNames])])}>add all</button>
      {#if list.length}<button type="button" class="link" onclick={() => (value = [])}>clear</button>{/if}
    </div>
  {/if}
</div>

<style>
  .cols {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 2px 1px 7px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-text);
    font-size: 11.5px;
  }
  .chip.unknown {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .chip button {
    display: inline-flex;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    padding: 1px;
    border-radius: 50%;
  }
  .chip button:hover {
    background: color-mix(in srgb, currentColor 18%, transparent);
  }
  .link {
    border: none;
    background: none;
    color: var(--accent-text);
    cursor: pointer;
    padding: 0;
    font: inherit;
  }
</style>
