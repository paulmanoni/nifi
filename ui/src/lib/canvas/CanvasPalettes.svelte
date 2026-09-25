<script lang="ts">
  // The two panels a NiFi canvas keeps in its bottom-left corner.
  //
  // Navigate is where you are: a birdseye of the whole flow and the zoom
  // controls. Operate is what you have selected and what can be done to it,
  // so the actions are in one place whatever put the selection there — a
  // click, a marquee, or the keyboard.
  import { MiniMap, useSvelteFlow } from '@xyflow/svelte';
  import type { GraphNode, GraphEdge } from '../api/types';
  import { iconFor } from '../icons';
  import { catalog } from '../stores/catalog.svelte';
  import { ZoomIn, ZoomOut, Maximize, Scan, SlidersHorizontal, Power, Trash2, Spline } from 'lucide-svelte';

  let {
    node,
    edge,
    readOnly = false,
    onconfigure,
    ontoggle,
    ondelete,
  }: {
    node?: GraphNode | null;
    edge?: GraphEdge | null;
    readOnly?: boolean;
    onconfigure: () => void;
    ontoggle: () => void;
    ondelete: () => void;
  } = $props();

  const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useSvelteFlow();

  /** Back to 1:1, keeping the point already at the centre of the view. */
  function actualSize() {
    const v = getViewport();
    setViewport({ x: v.x, y: v.y, zoom: 1 });
  }

  let spec = $derived(node ? catalog.byType.get(node.type) : undefined);
  let Icon = $derived(iconFor(spec?.icon, spec?.category));
  let what = $derived(node ? 'processor' : edge ? 'connection' : '');
</script>

<div class="palettes">
  <section class="pal">
    <header>Navigate</header>
    <div class="map"><MiniMap pannable zoomable nodeStrokeWidth={2} width={168} height={96} /></div>
    <div class="zoom">
      <button type="button" title="Zoom in" onclick={() => zoomIn()}><ZoomIn size={13} /></button>
      <button type="button" title="Zoom out" onclick={() => zoomOut()}><ZoomOut size={13} /></button>
      <button type="button" title="Fit the whole flow" onclick={() => fitView({ maxZoom: 1.1, padding: 0.15 })}><Maximize size={13} /></button>
      <button type="button" title="Actual size" onclick={actualSize}><Scan size={13} /></button>
    </div>
  </section>

  <section class="pal op">
    <header>Operate</header>
    {#if node}
      <div class="sel">
        <span class="si"><Icon size={13} strokeWidth={1.9} /></span>
        <span class="st">
          <span class="sn" title={node.name}>{node.name}</span>
          <span class="sy">{spec?.label ?? node.type}</span>
        </span>
      </div>
    {:else if edge}
      <div class="sel">
        <span class="si"><Spline size={13} strokeWidth={1.9} /></span>
        <span class="st">
          <span class="sn">{edge.fromPort}</span>
          <span class="sy">connection</span>
        </span>
      </div>
    {:else}
      <p class="none">Select a component on the canvas.</p>
    {/if}
    <div class="acts">
      <button type="button" title="Configure" disabled={!what} onclick={onconfigure}><SlidersHorizontal size={13} /></button>
      <button type="button" title={node?.disabled ? 'Enable' : 'Disable'} class:off={node?.disabled} disabled={!node || readOnly} onclick={ontoggle}>
        <Power size={13} />
      </button>
      <button type="button" class="danger" title="Delete" disabled={!what || readOnly} onclick={ondelete}><Trash2 size={13} /></button>
    </div>
  </section>
</div>

<style>
  .palettes {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 186px;
  }
  .pal {
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  header {
    padding: 3px 7px;
    background: var(--bg-sunken);
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-2);
  }
  .map {
    padding: 6px 7px 0;
  }
  .map :global(.svelte-flow__minimap) {
    position: static !important;
    margin: 0 !important;
    background: var(--canvas-bg);
    border: 1px solid var(--border);
  }
  .zoom,
  .acts {
    display: flex;
    gap: 2px;
    padding: 5px 7px;
  }
  button {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    color: var(--text-2);
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text);
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button.off {
    color: var(--disabled);
  }
  button.danger:hover:not(:disabled) {
    border-color: var(--err);
    color: var(--err);
  }
  .sel {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 7px 0;
    min-width: 0;
  }
  .si {
    flex: none;
    color: var(--text-3);
  }
  .st {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .sn {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sy {
    font-size: 10px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .none {
    margin: 0;
    padding: 7px;
    font-size: 10.5px;
    color: var(--text-3);
  }
</style>
