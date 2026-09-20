<script lang="ts">
  // A select for a list too long to scan: the choices open in a drawer where
  // they can be searched and read, each with the line that says what it is.
  import type { Option } from '../../api/types';
  import Modal from '../../components/Modal.svelte';
  import { Search, Check, ChevronDown, X } from 'lucide-svelte';

  let {
    value = $bindable(),
    options,
    required = false,
    label = 'Choose',
  }: { value?: string; options: Option[]; required?: boolean; label?: string } = $props();

  let open = $state(false);
  let q = $state('');

  let chosen = $derived(options.find((o) => o.value === value));
  let shown = $derived(
    !q.trim()
      ? options
      : options.filter((o) => {
          const n = q.toLowerCase();
          return o.value.toLowerCase().includes(n) || o.label.toLowerCase().includes(n) || (o.description ?? '').toLowerCase().includes(n);
        }),
  );

  function pick(o: Option) {
    value = o.value;
    open = false;
    q = '';
  }
</script>

<button type="button" class="picker" class:unchosen={!chosen} onclick={() => ((open = true), (q = ''))}>
  <span class="chosen">
    {#if chosen}
      <span class="lbl">{chosen.label}</span>
      {#if chosen.description}<span class="desc ellipsis">{chosen.description}</span>{/if}
    {:else}
      <span class="lbl muted">Choose…</span>
    {/if}
  </span>
  <ChevronDown size={14} />
</button>
{#if value && !required}
  <button type="button" class="clear" onclick={() => (value = undefined)}><X size={11} /> Clear</button>
{/if}

{#if open}
  <Modal title={label} width="min(680px, 96vw)" height="min(560px, 82vh)" onclose={() => (open = false)}>
    {#snippet headerExtra()}
      <span class="tiny muted count">{shown.length} of {options.length}</span>
    {/snippet}
    <div class="search">
      <Search size={14} />
      <!-- svelte-ignore a11y_autofocus -->
      <input class="input" placeholder="Search…" bind:value={q} autofocus />
    </div>
    <div class="list scroll">
      {#each shown as o (o.value)}
        <button type="button" class="opt" class:on={o.value === value} onclick={() => pick(o)}>
          <span class="tick">{#if o.value === value}<Check size={13} />{/if}</span>
          <span class="body">
            <span class="ol">{o.label}</span>
            {#if o.description}<span class="od">{o.description}</span>{/if}
          </span>
        </button>
      {:else}
        <p class="muted small none">Nothing matches “{q}”.</p>
      {/each}
    </div>
  </Modal>
{/if}

<style>
  .picker {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    text-align: left;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: 5px 8px;
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }
  .picker:hover {
    border-color: var(--accent);
  }
  .picker.unchosen .lbl {
    color: var(--text-3);
  }
  .chosen {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .lbl {
    font-size: 12.5px;
  }
  .desc {
    font-size: 11px;
    color: var(--text-3);
  }
  .clear {
    align-self: flex-start;
    margin-top: 4px;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    font-size: 11px;
    color: var(--text-3);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .clear:hover {
    color: var(--err);
  }
  .search {
    position: relative;
    margin-bottom: 8px;
  }
  .search :global(svg) {
    position: absolute;
    left: 9px;
    top: 8px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 30px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
  }
  .opt {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    text-align: left;
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 6px 8px;
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }
  .opt:hover {
    background: var(--bg-hover);
  }
  .opt.on {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .tick {
    width: 14px;
    flex: none;
    color: var(--accent-text);
    padding-top: 2px;
  }
  .body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ol {
    font-size: 12.5px;
    font-weight: 600;
  }
  .od {
    font-size: 11.5px;
    color: var(--text-2);
  }
  .none {
    padding: 20px;
    text-align: center;
  }
  .count {
    margin-left: 8px;
  }
</style>
