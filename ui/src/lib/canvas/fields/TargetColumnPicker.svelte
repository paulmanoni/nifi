<script lang="ts">
  // Inline combobox for a column-mapping row: existing target columns
  // (unfilled target-only ones first), a free-text new name, or skip.
  type Opt = { name: string; type?: string; unfilled?: boolean };

  let {
    value,
    options = [],
    readOnly = false,
    onpick,
  }: { value: string; options?: Opt[]; readOnly?: boolean; onpick: (to: string) => void } = $props();

  let text = $state('');
  let open = $state(false);
  $effect(() => {
    text = value;
  });

  let needle = $derived(open && text !== value ? text.trim().toLowerCase() : '');
  let matches = $derived(options.filter((o) => !needle || o.name.toLowerCase().includes(needle)));
  let isNew = $derived(!!text.trim() && text.trim() !== value && !options.some((o) => o.name === text.trim()));

  function pick(to: string) {
    open = false;
    text = to;
    if (to !== value) onpick(to);
  }
</script>

<div class="tcp" class:skip={value === ''}>
  <input
    class="input mono"
    bind:value={text}
    placeholder="— skip —"
    disabled={readOnly}
    spellcheck="false"
    autocomplete="off"
    onfocus={() => (open = true)}
    oninput={() => (open = true)}
    onblur={() =>
      setTimeout(() => {
        if (!open) return;
        open = false;
        if (text.trim() !== value) pick(text.trim());
      }, 150)}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        pick(text.trim());
      } else if (e.key === 'Escape' && open) {
        e.stopPropagation();
        open = false;
        text = value;
      }
    }}
  />
  {#if open && !readOnly}
    <div class="dd scroll">
      {#if isNew}
        <button class="opt new" onmousedown={(e) => (e.preventDefault(), pick(text.trim()))}>Use new name: <span class="mono">{text.trim()}</span></button>
      {/if}
      <button class="opt skipopt" onmousedown={(e) => (e.preventDefault(), pick(''))}>— skip — <span class="muted tiny">don't write this column</span></button>
      {#each matches as o (o.name)}
        <button class="opt" class:cur={o.name === value} onmousedown={(e) => (e.preventDefault(), pick(o.name))}>
          <span class="mono">{o.name}</span>
          {#if o.unfilled}<span class="uf">not provided yet</span>{/if}
          <span class="spacer"></span>
          {#if o.type}<span class="tiny muted mono">{o.type}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tcp {
    position: relative;
    min-width: 150px;
  }
  .tcp .input {
    height: 24px;
    font-size: 12px;
  }
  .tcp.skip .input {
    font-style: italic;
  }
  .dd {
    position: absolute;
    left: 0;
    min-width: 260px;
    top: calc(100% + 2px);
    z-index: 20;
    max-height: 240px;
    padding: 3px;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    color: var(--text);
    font: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }
  .opt:hover,
  .opt.cur {
    background: var(--accent-soft);
  }
  .opt.new {
    color: var(--ok);
  }
  .opt.skipopt {
    color: var(--text-2);
    border-bottom: 1px solid var(--border);
    border-radius: 0;
  }
  .uf {
    font-size: 10px;
    color: var(--warn);
  }
</style>
