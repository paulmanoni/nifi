<script lang="ts">
  import type { Column } from '../../api/types';

  type Group = { table: string; columns: Column[] };

  let {
    value = $bindable(),
    groups = [],
    placeholder = 'column',
    clearOnPick = false,
    onpick,
    exclude = [],
  }: {
    value?: string;
    groups?: Group[];
    placeholder?: string;
    clearOnPick?: boolean;
    onpick?: (name: string) => void;
    exclude?: string[];
  } = $props();

  let open = $state(false);
  let active = $state(0);

  let filtered = $derived.by(() => {
    const n = (value ?? '').toLowerCase();
    const showAll = !n || groups.some((g) => g.columns.some((c) => c.name === value));
    return groups
      .map((g) => ({
        table: g.table,
        columns: g.columns.filter((c) => !exclude.includes(c.name) && (showAll || c.name.toLowerCase().includes(n))),
      }))
      .filter((g) => g.columns.length);
  });
  let flat = $derived(filtered.flatMap((g) => g.columns.map((c) => c.name)));
  let multiTable = $derived(groups.length > 1);

  function pick(name: string) {
    onpick?.(name);
    value = clearOnPick ? '' : name;
    open = false;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      open = true;
      active = Math.min(flat.length - 1, active + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      active = Math.max(0, active - 1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && flat[active]) pick(flat[active]);
      else if (value?.trim()) pick(value.trim());
    } else if (e.key === 'Escape') {
      if (open) {
        open = false;
        e.stopPropagation();
      }
    }
  }
</script>

<div class="cp">
  <input
    class="input mono"
    bind:value
    {placeholder}
    onfocus={() => ((open = true), (active = 0))}
    onblur={() => setTimeout(() => (open = false), 120)}
    oninput={() => ((open = true), (active = 0))}
    {onkeydown}
    autocomplete="off"
    spellcheck="false"
  />
  {#if open && flat.length}
    <div class="dd scroll">
      {#each filtered as g}
        {#if multiTable}<div class="gt mono">{g.table}</div>{/if}
        {#each g.columns as c}
          {@const i = flat.indexOf(c.name)}
          <button
            type="button"
            class="opt"
            class:act={i === active}
            onmousedown={(e) => (e.preventDefault(), pick(c.name))}
          >
            <span class="mono">{c.name}</span><span class="t">{c.type}</span>
          </button>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .cp {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .dd {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 2px);
    max-height: 220px;
    z-index: 20;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 3px;
  }
  .gt {
    font-size: 10.5px;
    color: var(--text-3);
    padding: 4px 6px 2px;
    font-weight: 600;
  }
  .opt {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border: none;
    background: none;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: left;
  }
  .opt.act,
  .opt:hover {
    background: var(--accent-soft);
  }
  .t {
    margin-left: auto;
    font-size: 10.5px;
    color: var(--text-3);
  }
</style>
