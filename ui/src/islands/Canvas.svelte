<script lang="ts">
  // The flow designer, mounted by the server-rendered flow page.
  import CanvasPage from '../routes/CanvasPage.svelte';
  import Toasts from '../lib/components/Toasts.svelte';
  import ConfirmDialog from '../lib/components/ConfirmDialog.svelte';
  import { auth } from '../lib/stores/auth.svelte';
  import { LoaderCircle } from 'lucide-svelte';

  let { id }: { id: string } = $props();
  auth.load();
</script>

{#if auth.loaded}
  <CanvasPage {id} />
{:else}
  <div class="loading"><LoaderCircle size={20} class="spin" /> Loading flow…</div>
{/if}
<Toasts />
<ConfirmDialog />

<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    color: var(--text-3);
  }
</style>
