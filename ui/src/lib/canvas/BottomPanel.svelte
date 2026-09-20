<script lang="ts">
  import type { Graph, Issue, PreviewResponse } from '../api/types';
  import { isActive } from '../api/types';
  import type { LiveRun } from '../run/live.svelte';
  import type { BottomTab } from './model';
  import { href } from '../router.svelte';
  import PreviewPane from './PreviewPane.svelte';
  import RunProgress from '../run/RunProgress.svelte';
  import Bulletins from '../run/Bulletins.svelte';
  import DeadLetters from '../run/DeadLetters.svelte';
  import RunsHistory from '../run/RunsHistory.svelte';
  import Queues from '../run/Queues.svelte';
  import { ChevronDown, ChevronUp, TriangleAlert, CircleX, ExternalLink, CircleCheck } from 'lucide-svelte';

  let {
    tab = $bindable('preview'),
    open = $bindable(true),
    height = $bindable(300),
    live,
    flowId,
    nodeId,
    nodeName,
    getGraph,
    previewTrigger,
    issues,
    validated,
    histKey,
    names,
    onselectnode,
    onselectedge,
    onpreviewresult,
    canData = true,
  }: {
    tab?: BottomTab;
    open?: boolean;
    height?: number;
    live: LiveRun;
    flowId: string;
    nodeId: string | null;
    nodeName?: string;
    getGraph: () => Graph;
    previewTrigger: number;
    issues: Issue[];
    validated: boolean;
    histKey: number;
    names: Map<string, string>;
    onselectnode: (id: string) => void;
    onselectedge: (id: string) => void;
    onpreviewresult: (nodeId: string, r: PreviewResponse) => void;
    canData?: boolean;
  } = $props();

  function show(t: BottomTab) {
    if (tab === t && open) open = false;
    else {
      tab = t;
      open = true;
    }
  }

  let dragging = false;
  let startY = 0;
  let startH = 0;
  function down(e: PointerEvent) {
    dragging = true;
    startY = e.clientY;
    startH = height;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!dragging) return;
    height = Math.max(140, Math.min(window.innerHeight - 200, startH + (startY - e.clientY)));
  }
  function up() {
    dragging = false;
    try {
      localStorage.setItem('nifi.bottomHeight', String(height));
    } catch {}
  }

  let errs = $derived(issues.filter((i) => i.level === 'error').length);
  let d = $derived(live.detail);
  let queued = $derived((d?.edges ?? []).reduce((n, e) => n + (e.queuedRows || 0), 0));
  let bulletinErrs = $derived(live.bulletins.filter((b) => b.level === 'error').length);
</script>

<section class="bp" style:height={open ? `${height}px` : 'auto'}>
  {#if open}
    <div class="resize" role="separator" aria-orientation="horizontal" onpointerdown={down} onpointermove={move} onpointerup={up}></div>
  {/if}
  <div class="tabs">
    {#if canData}
      <button class="tab" class:active={open && tab === 'preview'} onclick={() => show('preview')}>Preview</button>
    {/if}
    <button class="tab" class:active={open && tab === 'run'} onclick={() => show('run')}>
      Run {#if live.active}<span class="livedot"></span>{/if}
    </button>
    <button class="tab" class:active={open && tab === 'bulletins'} onclick={() => show('bulletins')}>
      Bulletins {#if live.bulletins.length}<span class="badge {bulletinErrs ? 'err' : ''}">{live.bulletins.length}</span>{/if}
    </button>
    {#if canData}
      <button class="tab" class:active={open && tab === 'dead'} onclick={() => show('dead')}>
        Dead letters {#if d?.rowsFailed}<span class="badge err">{d.rowsFailed}</span>{/if}
      </button>
    {/if}
    {#if d && canData}
      <button class="tab" class:active={open && tab === 'queues'} onclick={() => show('queues')}>
        Queues {#if queued}<span class="badge accent">{queued}</span>{/if}
      </button>
    {/if}
    <button class="tab" class:active={open && tab === 'issues'} onclick={() => show('issues')}>
      Issues {#if issues.length}<span class="badge {errs ? 'err' : 'warn'}">{issues.length}</span>{/if}
    </button>
    <button class="tab" class:active={open && tab === 'history'} onclick={() => show('history')}>History</button>
    <span class="spacer"></span>
    {#if d && (tab === 'run' || tab === 'bulletins' || tab === 'dead')}
      <a class="btn ghost sm" href={href(`/runs/${d.id}`)} title="Open run page"><ExternalLink size={12} /> Run page</a>
    {/if}
    <button class="btn ghost sm icon" onclick={() => (open = !open)} title={open ? 'Collapse' : 'Expand'}>
      {#if open}<ChevronDown size={14} />{:else}<ChevronUp size={14} />{/if}
    </button>
  </div>
  {#if open}
    <div class="content" class:scroll={tab === 'run' || tab === 'issues' || tab === 'history'}>
      {#if canData}
        <div class="pane" class:hidden={tab !== 'preview'}>
          <PreviewPane {nodeId} {nodeName} {getGraph} trigger={previewTrigger} {onselectnode} onresult={onpreviewresult} />
        </div>
      {/if}
      {#if tab === 'run'}
        {#if d}
          <RunProgress detail={d} />
        {:else}
          <div class="empty small"><p>No runs yet. Press <strong>Run</strong> in the toolbar to start one.</p></div>
        {/if}
      {:else if tab === 'bulletins'}
        {#if d}
          <Bulletins bulletins={live.bulletins} nodeName={(n) => names.get(n)} onnode={onselectnode} />
        {:else}
          <div class="empty small">Bulletins from the latest run appear here.</div>
        {/if}
      {:else if tab === 'dead' && canData}
        {#if d}
          <DeadLetters runId={d.id} tables={(d.tables ?? []).map((t) => t.table)} nodeName={(n) => names.get(n)} />
        {:else}
          <div class="empty small">Rows that failed and were not routed anywhere land here.</div>
        {/if}
      {:else if tab === 'queues' && canData && d}
        <Queues runId={d.id} live={isActive(d.status)} {onselectedge} />
      {:else if tab === 'issues'}
        {#if !validated}
          <div class="empty small"><p>Press <strong>Validate</strong> to check the flow.</p></div>
        {:else if issues.length === 0}
          <div class="empty small"><CircleCheck size={20} /> No issues found.</div>
        {:else}
          <div class="issues">
            {#each issues as i}
              <button class="iss {i.level}" onclick={() => (i.nodeId ? onselectnode(i.nodeId) : i.edgeId ? onselectedge(i.edgeId) : null)}>
                {#if i.level === 'error'}<CircleX size={13} />{:else}<TriangleAlert size={13} />{/if}
                {#if i.nodeId}<span class="who">{names.get(i.nodeId) ?? i.nodeId}</span>{:else if i.edgeId}<span class="who">connection</span>{/if}
                <span>{i.message}</span>
              </button>
            {/each}
          </div>
        {/if}
      {:else if tab === 'history'}
        <RunsHistory {flowId} currentId={d?.id} refreshKey={histKey} />
      {/if}
    </div>
  {/if}
</section>

<style>
  .bp {
    position: relative;
    flex: none;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border-top: 1px solid var(--border);
    min-height: 0;
  }
  .resize {
    position: absolute;
    top: -4px;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
    z-index: 5;
  }
  .resize:hover {
    background: linear-gradient(transparent 3px, var(--accent) 3px, var(--accent) 5px, transparent 5px);
  }
  .tabs {
    padding: 0 6px 0 8px;
    flex: none;
    align-items: center;
  }
  .tab {
    height: 32px;
  }
  .content {
    flex: 1;
    min-height: 0;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
  }
  .pane {
    flex: 1;
    min-height: 0;
  }
  .pane.hidden {
    display: none;
  }
  .livedot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ok);
    animation: blink 1s ease-in-out infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0.3;
    }
  }
  .issues {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .iss {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .iss:hover {
    background: var(--bg-hover);
  }
  .iss :global(svg) {
    flex: none;
  }
  .iss.error :global(svg) {
    color: var(--err);
  }
  .iss.warning :global(svg) {
    color: var(--warn);
  }
  .who {
    font-weight: 600;
    flex: none;
  }
</style>
