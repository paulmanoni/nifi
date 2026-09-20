<script lang="ts">
  import type { Snippet } from 'svelte';
  import { X } from 'lucide-svelte';

  let {
    title,
    onclose,
    width = '560px',
    height,
    children,
    footer,
    headerExtra,
  }: {
    title: string;
    onclose: () => void;
    width?: string;
    height?: string;
    children: Snippet;
    footer?: Snippet;
    headerExtra?: Snippet;
  } = $props();

  function onkey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onclose();
    }
  }
</script>

<svelte:window onkeydown={onkey} />

<div class="backdrop" role="presentation" onmousedown={(e) => e.target === e.currentTarget && onclose()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={title} style:width style:height>
    <header>
      <h2>{title}</h2>
      {@render headerExtra?.()}
      <span class="spacer"></span>
      <button class="btn ghost icon" onclick={onclose} aria-label="Close"><X size={16} /></button>
    </header>
    <div class="body">
      {@render children()}
    </div>
    {#if footer}
      <footer>{@render footer()}</footer>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 14, 22, 0.45);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fade 0.12s ease;
  }
  .modal {
    max-width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    animation: pop 0.14s ease;
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    font-size: 14px;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-top: 1px solid var(--border);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      transform: translateY(6px) scale(0.99);
      opacity: 0;
    }
  }
</style>
