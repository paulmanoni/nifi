<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '../stores/theme.svelte';
  import type { EditorHandle } from './codemirror';

  let {
    value = $bindable(),
    language = 'python',
    errorLine = null,
    onrun,
    readonly = false,
  }: { value?: string; language?: 'python' | 'plain'; errorLine?: number | null; onrun?: () => void; readonly?: boolean } = $props();

  let host = $state<HTMLDivElement>();
  let ed = $state<EditorHandle | null>(null);
  let failed = $state(false);

  onMount(() => {
    let destroyed = false;
    import('./codemirror')
      .then((m) => {
        if (destroyed || !host) return;
        ed = m.createEditor(host, {
          doc: value ?? '',
          language,
          dark: theme.resolved === 'dark',
          onChange: (s) => (value = s),
          onRun: () => onrun?.(),
          readOnly: readonly,
        });
        if (!readonly) ed.focus();
      })
      .catch(() => (failed = true));
    return () => {
      destroyed = true;
      ed?.destroy();
    };
  });

  $effect(() => {
    ed?.setDoc(value ?? '');
  });
  $effect(() => {
    ed?.setErrorLine(errorLine ?? null);
  });
  $effect(() => {
    ed?.setDark(theme.resolved === 'dark');
  });
</script>

<div class="ed" bind:this={host}>
  {#if !ed && !failed}<div class="loading skeleton"></div>{/if}
  {#if failed}
    <textarea class="textarea mono fallback" bind:value></textarea>
  {/if}
</div>

<style>
  .ed {
    position: relative;
    height: 100%;
    min-height: 120px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--bg-elev);
  }
  .ed :global(.cm-editor) {
    height: 100%;
  }
  .loading {
    position: absolute;
    inset: 8px;
  }
  .fallback {
    height: 100%;
    border: none;
  }
</style>
