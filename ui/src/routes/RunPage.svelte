<script lang="ts">
  import { onDestroy } from 'svelte';
  import { api } from '../lib/api/client';
  import type { Flow } from '../lib/api/types';
  import { href } from '../lib/router.svelte';
  import { fmtTime } from '../lib/format';
  import { LiveRun } from '../lib/run/live.svelte';
  import StatusPill from '../lib/components/StatusPill.svelte';
  import Skeleton from '../lib/components/Skeleton.svelte';
  import RunProgress from '../lib/run/RunProgress.svelte';
  import Bulletins from '../lib/run/Bulletins.svelte';
  import DeadLetters from '../lib/run/DeadLetters.svelte';
  import RunsHistory from '../lib/run/RunsHistory.svelte';
  import RunControls from '../lib/run/RunControls.svelte';
  import { ArrowLeft, Workflow, WifiOff } from 'lucide-svelte';
  import { auth } from '../lib/stores/auth.svelte';

  let { id }: { id: string } = $props();

  const live = new LiveRun();
  let flow = $state<Flow | null>(null);
  let tab = $state<'progress' | 'bulletins' | 'dead' | 'history'>('progress');
  let histKey = $state(0);

  // svelte-ignore state_referenced_locally
  live.start(id);
  live.onEnd = () => histKey++;
  onDestroy(() => live.stop());

  $effect(() => {
    const fid = live.detail?.flowId;
    if (fid && flow?.id !== fid) api.flow(fid).then((f) => (flow = f)).catch(() => {});
  });

  let names = $derived(new Map((flow?.graph?.nodes ?? []).map((n) => [n.id, n.name])));
  let d = $derived(live.detail);
</script>

<div class="page">
  {#if live.error}
    <div class="empty"><h3>Run not found</h3><p>{live.error}</p><a href={href('/flows')}>Back to flows</a></div>
  {:else if !d}
    <Skeleton rows={8} />
  {:else}
    <div class="page-head">
      <a class="btn ghost icon" href={flow ? href(`/flows/${flow.id}`) : href('/flows')} title="Back"><ArrowLeft size={16} /></a>
      <div>
        <h1>Run <span class="mono muted small">{d.id}</span></h1>
        <div class="muted small">
          {#if flow}<a href={href(`/flows/${flow.id}`)}><Workflow size={12} /> {flow.name}</a> · {/if}started {fmtTime(d.startedAt)}{#if d.finishedAt} · finished {fmtTime(d.finishedAt)}{/if}
        </div>
      </div>
      <StatusPill status={d.status} live={d.live} />
      {#if live.connection === 'reconnecting'}<span class="badge warn"><WifiOff size={11} /> reconnecting</span>{/if}
      <span class="spacer"></span>
      {#if auth.can.run}<RunControls run={d} onchange={(s) => live.patch(s)} />{/if}
    </div>

    <div class="card body">
      <div class="tabs">
        <button class="tab" class:active={tab === 'progress'} onclick={() => (tab = 'progress')}>Progress</button>
        <button class="tab" class:active={tab === 'bulletins'} onclick={() => (tab = 'bulletins')}>
          Bulletins {#if live.bulletins.length}<span class="badge">{live.bulletins.length}</span>{/if}
        </button>
        {#if auth.can.data}
          <button class="tab" class:active={tab === 'dead'} onclick={() => (tab = 'dead')}>
            Dead letters {#if d.rowsFailed}<span class="badge err">{d.rowsFailed}</span>{/if}
          </button>
        {/if}
        <button class="tab" class:active={tab === 'history'} onclick={() => (tab = 'history')}>Run history</button>
      </div>
      <div class="content">
        {#if tab === 'progress'}
          <RunProgress detail={d} />
        {:else if tab === 'bulletins'}
          <div class="fill"><Bulletins bulletins={live.bulletins} nodeName={(n) => names.get(n)} /></div>
        {:else if tab === 'dead' && auth.can.data}
          <div class="fill"><DeadLetters runId={d.id} tables={(d.tables ?? []).map((t) => t.table)} nodeName={(n) => names.get(n)} /></div>
        {:else}
          <RunsHistory flowId={d.flowId} currentId={d.id} refreshKey={histKey} />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page-head h1 {
    font-size: 16px;
  }
  .body {
    padding: 0 16px 16px;
  }
  .content {
    padding-top: 12px;
  }
  .fill {
    height: calc(100vh - 260px);
    min-height: 300px;
  }
</style>
