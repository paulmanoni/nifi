<script lang="ts">
  import { api } from '../api/client';
  import type { Flow } from '../api/types';
  import Modal from '../components/Modal.svelte';
  import { fmtRelative } from '../format';
  import { Clock, CircleX, Check } from 'lucide-svelte';

  let {
    flow,
    readOnly = false,
    onclose,
    onsaved,
  }: { flow: Flow; readOnly?: boolean; onclose: () => void; onsaved: (f: Flow) => void } = $props();

  // svelte-ignore state_referenced_locally
  let spec = $state(flow.schedule ?? '');
  // svelte-ignore state_referenced_locally
  let enabled = $state(!!flow.scheduleEnabled);
  let saving = $state(false);
  let error = $state('');
  // svelte-ignore state_referenced_locally
  let next = $state(flow.nextRun ?? '');

  const presets = [
    { spec: '@every 30m', label: 'Every 30 minutes' },
    { spec: '@hourly', label: 'Every hour' },
    { spec: '0 2 * * *', label: 'Every night at 02:00' },
    { spec: '0 6 * * mon-fri', label: 'Weekdays at 06:00' },
    { spec: '0 3 * * 0', label: 'Sundays at 03:00' },
    { spec: '0 4 1 * *', label: 'First of the month at 04:00' },
  ];

  let changed = $derived(spec.trim() !== (flow.schedule ?? '') || enabled !== !!flow.scheduleEnabled);

  async function save() {
    saving = true;
    error = '';
    try {
      const f = await api.setSchedule(flow.id, spec.trim(), spec.trim() ? enabled : false);
      next = f.nextRun ?? '';
      onsaved(f);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = false;
    }
  }
  async function clear() {
    spec = '';
    enabled = false;
    await save();
  }
</script>

<Modal title="Schedule" width="560px" {onclose}>
  <p class="intro">
    While a schedule is on, this flow starts by itself at those times — the same as pressing Run. A flow that is still
    running when its next time comes round is skipped, so slow runs never pile up. Times are the server's.
  </p>

  <div class="field">
    <label for="sch-spec">When to run</label>
    <input
      id="sch-spec"
      class="input mono"
      placeholder="0 2 * * *"
      bind:value={spec}
      disabled={readOnly}
      oninput={() => (error = '')}
    />
    <p class="help">
      A cron expression — minute, hour, day of month, month, weekday — or <span class="mono">@hourly</span>,
      <span class="mono">@daily</span>, <span class="mono">@weekly</span>, <span class="mono">@monthly</span>,
      <span class="mono">@every 30m</span>.
    </p>
  </div>

  {#if !readOnly}
    <div class="presets">
      {#each presets as p}
        <button class="chip" class:on={spec.trim() === p.spec} onclick={() => ((spec = p.spec), (error = ''))}>{p.label}</button>
      {/each}
    </div>
  {/if}

  <label class="on-row" class:dim={!spec.trim()}>
    <span class="switch"><input type="checkbox" bind:checked={enabled} disabled={readOnly || !spec.trim()} /><span></span></span>
    <span>
      <b>Run on this schedule</b>
      <span class="sub">Off keeps the schedule saved but never starts the flow.</span>
    </span>
  </label>

  {#if next && enabled && spec.trim()}
    <div class="next"><Clock size={13} /> Next run {fmtRelative(next)} <span class="muted">({new Date(next).toLocaleString()})</span></div>
  {/if}
  {#if flow.lastFire}
    <p class="tiny muted">Last started by the schedule {fmtRelative(flow.lastFire)}.</p>
  {/if}
  {#if error}<div class="callout err"><CircleX size={15} /> <span>{error}</span></div>{/if}

  {#snippet footer()}
    {#if !readOnly && (flow.schedule || spec)}
      <button class="btn danger ghost" onclick={clear} disabled={saving}>Remove schedule</button>
    {/if}
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}>{readOnly ? 'Close' : 'Cancel'}</button>
    {#if !readOnly}
      <button class="btn primary" onclick={save} disabled={saving || !changed}><Check size={13} /> Save</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .intro {
    margin: 0 0 12px;
    font-size: 12.5px;
    color: var(--text-2);
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 12px;
  }
  .chip {
    border: 1px solid var(--border-strong);
    background: var(--bg-elev);
    border-radius: 999px;
    padding: 3px 10px;
    font: inherit;
    font-size: 12px;
    color: var(--text-2);
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--accent);
  }
  .chip.on {
    background: var(--accent-soft);
    color: var(--accent-text);
    border-color: var(--accent);
  }
  .on-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    cursor: pointer;
  }
  .on-row.dim {
    opacity: 0.55;
  }
  .on-row b {
    display: block;
    font-size: 12.5px;
  }
  .sub {
    display: block;
    font-size: 11.5px;
    color: var(--text-3);
  }
  .next {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    background: var(--accent-soft);
    color: var(--accent-text);
    font-size: 12.5px;
  }
</style>
