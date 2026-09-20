<script lang="ts">
  import { api } from '../api/client';
  import type { RunSummary } from '../api/types';
  import { toast } from '../stores/toast.svelte';
  import { confirm } from '../stores/confirm.svelte';
  import { Pause, Play, Square } from 'lucide-svelte';

  let { run, onchange }: { run: RunSummary; onchange: (s: RunSummary) => void } = $props();
  let busy = $state(false);

  async function act(kind: 'pause' | 'resume' | 'stop') {
    if (kind === 'stop') {
      const ok = await confirm({
        title: 'Stop run',
        message: 'Stop this run? In-flight chunks are abandoned; committed chunks are kept and the run can be resumed later.',
        confirmLabel: 'Stop run',
        danger: true,
      });
      if (!ok) return;
    }
    busy = true;
    try {
      const s = kind === 'pause' ? await api.pauseRun(run.id) : kind === 'resume' ? await api.resumeRun(run.id) : await api.stopRun(run.id);
      onchange(s);
    } catch (e) {
      toast.error(e);
    } finally {
      busy = false;
    }
  }
</script>

{#if run.status === 'running'}
  <button class="btn" disabled={busy} onclick={() => act('pause')}><Pause size={14} /> Pause</button>
{:else if run.status === 'paused'}
  <button class="btn" disabled={busy} onclick={() => act('resume')}><Play size={14} /> Resume</button>
{/if}
{#if run.status === 'running' || run.status === 'pending' || run.status === 'paused'}
  <button class="btn danger" disabled={busy} onclick={() => act('stop')}><Square size={13} /> Stop</button>
{/if}
