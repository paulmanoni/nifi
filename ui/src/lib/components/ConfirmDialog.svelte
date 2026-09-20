<script lang="ts">
  import { confirmStore } from '../stores/confirm.svelte';
  import Modal from './Modal.svelte';
  let btn = $state<HTMLButtonElement>();
  $effect(() => {
    if (confirmStore.current) queueMicrotask(() => btn?.focus());
  });
</script>

{#if confirmStore.current}
  {@const c = confirmStore.current}
  <Modal title={c.title} width="420px" onclose={() => confirmStore.answer(false)}>
    <p class="msg">{c.message}</p>
    {#snippet footer()}
      <span class="spacer"></span>
      <button class="btn" onclick={() => confirmStore.answer(false)}>Cancel</button>
      <button bind:this={btn} class="btn {c.danger ? 'danger solid' : 'primary'}" onclick={() => confirmStore.answer(true)}>
        {c.confirmLabel ?? 'Confirm'}
      </button>
    {/snippet}
  </Modal>
{/if}

<style>
  .msg {
    margin: 0;
    color: var(--text-2);
    white-space: pre-wrap;
  }
</style>
