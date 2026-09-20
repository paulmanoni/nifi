<script lang="ts">
  import type { ProcessorSpec } from '../api/types';
  import { iconFor, categoryColor, categoryOrder } from '../icons';
  import { Search, ChevronDown, ChevronRight } from 'lucide-svelte';
  import Skeleton from '../components/Skeleton.svelte';

  let { processors, loaded, onadd }: { processors: ProcessorSpec[]; loaded: boolean; onadd: (type: string) => void } = $props();

  let q = $state('');
  let collapsed = $state<Record<string, boolean>>({});

  let groups = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    const match = (p: ProcessorSpec) =>
      !needle || p.label.toLowerCase().includes(needle) || p.type.toLowerCase().includes(needle) || p.description?.toLowerCase().includes(needle);
    const cats = [...categoryOrder, ...new Set(processors.map((p) => p.category).filter((c) => !categoryOrder.includes(c)))];
    return cats
      .map((c) => ({ cat: c, items: processors.filter((p) => p.category === c && match(p)) }))
      .filter((g) => g.items.length);
  });

  function dragstart(e: DragEvent, p: ProcessorSpec) {
    e.dataTransfer?.setData('application/nifi-processor', p.type);
    e.dataTransfer?.setData('text/plain', p.type);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  }
</script>

<aside class="palette">
  <div class="ph">
    <div class="search">
      <Search size={13} />
      <input class="input" placeholder="Search processors…" bind:value={q} />
    </div>
  </div>
  <div class="groups scroll">
    {#if !loaded}
      <Skeleton rows={10} height={22} />
    {:else}
      {#each groups as g (g.cat)}
        <button class="gh" onclick={() => (collapsed[g.cat] = !collapsed[g.cat])}>
          {#if collapsed[g.cat] && !q}<ChevronRight size={12} />{:else}<ChevronDown size={12} />{/if}
          <span class="cdot" style:background={categoryColor[g.cat]}></span>
          {g.cat}
          <span class="spacer"></span>
          <span class="muted tiny">{g.items.length}</span>
        </button>
        {#if !collapsed[g.cat] || q}
          {#each g.items as p (p.type)}
            {@const Icon = iconFor(p.icon, p.category)}
            <div
              class="item"
              role="button"
              tabindex="0"
              draggable="true"
              ondragstart={(e) => dragstart(e, p)}
              ondblclick={() => onadd(p.type)}
              onkeydown={(e) => e.key === 'Enter' && onadd(p.type)}
              title="{p.description}\n\nDrag onto the canvas (or double-click) to add."
              style:--cat={categoryColor[p.category]}
            >
              <span class="ic"><Icon size={14} /></span>
              <div class="txt">
                <div class="lb ellipsis">{p.label}</div>
                <div class="ds ellipsis">{p.description}</div>
              </div>
            </div>
          {/each}
        {/if}
      {:else}
        <div class="empty small">{processors.length ? 'No processors match.' : 'No processors available.'}</div>
      {/each}
    {/if}
  </div>
  <div class="hint tiny muted">Drag onto the canvas · double-click to add</div>
</aside>

<style>
  .palette {
    width: 232px;
    flex: none;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border-right: 1px solid var(--border);
    min-height: 0;
  }
  .ph {
    padding: 8px;
    border-bottom: 1px solid var(--border);
  }
  .search {
    position: relative;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 8px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 26px;
  }
  .groups {
    flex: 1;
    min-height: 0;
    padding: 4px 6px 8px;
  }
  .gh {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-top: 6px;
    padding: 4px 4px;
    border: none;
    background: none;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-3);
    cursor: pointer;
  }
  .cdot {
    width: 7px;
    height: 7px;
    border-radius: 2px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 6px;
    border-radius: var(--radius);
    border: 1px solid transparent;
    cursor: grab;
    user-select: none;
  }
  .item:hover,
  .item:focus-visible {
    background: var(--bg-hover);
    border-color: var(--border);
    outline: none;
  }
  .item:active {
    cursor: grabbing;
  }
  .ic {
    width: 26px;
    height: 26px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--cat) 14%, transparent);
    color: var(--cat);
  }
  .txt {
    min-width: 0;
    flex: 1;
  }
  .lb {
    font-weight: 500;
    font-size: 12.5px;
  }
  .ds {
    font-size: 11px;
    color: var(--text-3);
  }
  .hint {
    padding: 6px 10px;
    border-top: 1px solid var(--border);
  }
</style>
