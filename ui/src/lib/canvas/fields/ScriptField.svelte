<script lang="ts">
  import ScriptModal from '../ScriptModal.svelte';
  import { Code } from 'lucide-svelte';
  import { getCanvasCtx } from '../context';

  let { value = $bindable(), nodeId, title }: { value?: string; nodeId: string; title: string } = $props();
  let open = $state(false);
  const ctx = getCanvasCtx();
  let ro = $derived(ctx.readOnly());
  let preview = $derived((value ?? '').split('\n').slice(0, 8).join('\n'));
  let lines = $derived((value ?? '').split('\n').length);
</script>

<!-- a div, not a button: it must stay clickable inside a disabled (read-only) fieldset -->
<div class="sf" role="button" tabindex="0" onclick={() => (open = true)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (open = true)} title="Open script editor">
  {#if value?.trim()}
    <pre>{preview}</pre>
    {#if lines > 8}<div class="more tiny muted">… {lines - 8} more lines</div>{/if}
  {:else}
    <div class="muted small">No script yet{ro ? '.' : ' — click to write one.'}</div>
  {/if}
</div>
{#if !ro}
  <button type="button" class="btn sm" style="align-self:flex-start" onclick={() => (open = true)}><Code size={13} /> Edit script</button>
{/if}

{#if open}
  <ScriptModal
    value={value ?? ''}
    {nodeId}
    {title}
    onclose={() => (open = false)}
    onsave={(s) => {
      value = s;
      open = false;
    }}
  />
{/if}

<style>
  .sf {
    display: block;
    width: 100%;
    text-align: left;
    padding: 6px 8px;
    background: var(--bg-sunken);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    color: var(--text);
    font: inherit;
  }
  .sf:hover {
    border-color: var(--accent);
  }
  pre {
    margin: 0;
    font-family: var(--mono);
    font-size: 11px;
    white-space: pre;
    overflow: hidden;
  }
</style>
