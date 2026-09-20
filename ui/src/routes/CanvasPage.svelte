<script lang="ts">
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import { api } from '../lib/api/client';
  import type { Flow } from '../lib/api/types';
  import { catalog } from '../lib/stores/catalog.svelte';
  import { toast } from '../lib/stores/toast.svelte';
  import { href } from '../lib/router.svelte';
  import FlowEditor from '../lib/canvas/FlowEditor.svelte';
  import { LoaderCircle } from 'lucide-svelte';

  let { id }: { id: string } = $props();

  let flow = $state.raw<Flow | null>(null);
  let error = $state('');

  $effect(() => {
    const fid = id;
    flow = null;
    error = '';
    Promise.all([
      api.flow(fid),
      catalog.loadProcessors().catch((e) => toast.error(`Processor catalog: ${(e as Error).message}`)),
      catalog.loadConnections().catch(() => {}),
      catalog.loadTypes(),
    ]).then(
      ([f]) => (flow = f),
      (e) => (error = (e as Error).message),
    );
  });
</script>

{#if error}
  <div class="empty"><h3>Could not open flow</h3><p>{error}</p><a href={href('/flows')}>Back to flows</a></div>
{:else if !flow}
  <div class="loading"><LoaderCircle size={20} class="spin" /> Loading flow…</div>
{:else}
  <SvelteFlowProvider>
    <FlowEditor {flow} />
  </SvelteFlowProvider>
{/if}

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
