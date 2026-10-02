<script lang="ts">
  // The flow list's Graph view: flows as a dependency graph, lane per folder.
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import DepGraph from '../lib/flows/DepGraph.svelte';
  import type { Flow, RunSummary } from '../lib/api/types';

  type GraphFlow = Pick<Flow, 'id' | 'name' | 'folder' | 'dependsOn'> & { run?: RunSummary };
  let { flows = [], scope = '', highlight = '' }: { flows: GraphFlow[]; scope?: string; highlight?: string } = $props();

  let asFlows = $derived(flows.map((f) => ({ ...f, description: '', graph: null, createdAt: '', updatedAt: '' }) as Flow));
  let runs = $derived(new Map(flows.map((f) => [f.id, f.run])));
</script>

<SvelteFlowProvider>
  <DepGraph flows={asFlows} {runs} {scope} {highlight} />
</SvelteFlowProvider>
