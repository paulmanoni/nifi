<script lang="ts">
  import { toasts } from '../stores/toast.svelte';
  import { CircleCheck, CircleX, Info, TriangleAlert, X, ChevronRight, ChevronDown } from 'lucide-svelte';
  let open = $state<Record<number, boolean>>({});
  const icons = { info: Info, success: CircleCheck, error: CircleX, warn: TriangleAlert };
</script>

<div class="toasts" aria-live="polite">
  {#each toasts.items as t (t.id)}
    {@const Icon = icons[t.kind]}
    <div class="toast {t.kind}">
      <Icon size={16} />
      <div class="msg">
        {t.message}
        {#if t.details?.lines.length}
          <button class="more" onclick={() => (open[t.id] = !open[t.id])}>
            {#if open[t.id]}<ChevronDown size={12} />{:else}<ChevronRight size={12} />{/if}
            {t.details.title}
          </button>
          {#if open[t.id]}
            <ul>
              {#each t.details.lines as l}<li>{l}</li>{/each}
            </ul>
          {/if}
        {/if}
      </div>
      <button class="btn ghost sm icon" onclick={() => toasts.dismiss(t.id)} aria-label="Dismiss"><X size={13} /></button>
    </div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 420px;
  }
  .toast {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 9px 8px 9px 12px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-left: 3px solid var(--info);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    animation: in 0.16s ease;
  }
  .toast :global(svg:first-child) {
    margin-top: 1px;
    flex: none;
  }
  .toast.success {
    border-left-color: var(--ok);
    color: var(--ok);
  }
  .toast.error {
    border-left-color: var(--err);
    color: var(--err);
  }
  .toast.warn {
    border-left-color: var(--warn);
    color: var(--warn);
  }
  .toast.info {
    color: var(--info);
  }
  .msg {
    flex: 1;
    color: var(--text);
    word-break: break-word;
  }
  .more {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 4px;
    padding: 0;
    border: none;
    background: none;
    color: var(--text-2);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  ul {
    margin: 4px 0 0;
    padding-left: 18px;
    color: var(--text-2);
    font-size: 12px;
    max-height: 180px;
    overflow: auto;
  }
  @keyframes in {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
  }
</style>
