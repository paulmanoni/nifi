<script lang="ts">
  import type { GraphEdge, Issue } from '../api/types';
  import { DEFAULT_BACKPRESSURE } from './model';
  import { fmtNum } from '../format';
  import { X, Trash2, ArrowRight, TriangleAlert } from 'lucide-svelte';
  import type { EdgeStats } from '../api/types';

  let {
    edge,
    fromName,
    toName,
    stats,
    issues = [],
    onchange,
    onclose,
    ondelete,
    readOnly = false,
    loadTables,
    siblings = [],
  }: {
    edge: GraphEdge;
    fromName: string;
    toName: string;
    stats?: EdgeStats;
    issues?: Issue[];
    onchange: (patch: Partial<GraphEdge>) => void;
    onclose: () => void;
    ondelete: () => void;
    readOnly?: boolean;
    /** tables leaving the upstream node (null when they can't be listed) */
    loadTables?: () => Promise<string[] | null>;
    /** other connections from the same node + relationship */
    siblings?: { toName: string; tables?: string[] }[];
  } = $props();

  let available = $state<string[] | null>(null);
  let loading = $state(false);
  $effect(() => {
    void edge.id;
    if (!loadTables) return;
    loading = true;
    loadTables()
      .then((t) => (available = t))
      .catch(() => (available = null))
      .finally(() => (loading = false));
  });

  let only = $derived((edge.tables ?? []).length > 0);
  let chosen = $derived(new Set((edge.tables ?? []).map((t) => t.toLowerCase())));
  let options = $derived([...new Set([...(available ?? []), ...(edge.tables ?? [])])]);
  let freeText = $state('');

  function setTables(t: string[]) {
    onchange({ tables: t.length ? t : undefined });
  }
  function toggle(t: string, on: boolean) {
    const cur = (edge.tables ?? []).filter((x) => x.toLowerCase() !== t.toLowerCase());
    setTables(on ? [...cur, t] : cur);
  }
  const carries = (tables: string[] | undefined, t: string) => !tables?.length || tables.some((x) => x.toLowerCase() === t.toLowerCase());
  // tables no connection from this port carries: their rows stop here
  let unrouted = $derived(
    (available ?? []).filter((t) => !carries(edge.tables, t) && !siblings.some((s) => carries(s.tables, t))),
  );
</script>

<aside class="cfg">
  <header>
    <div class="t"><div class="tt">Connection</div><div class="tiny muted mono">{edge.id}</div></div>
    {#if !readOnly}<button class="btn ghost sm icon danger" title="Delete connection (Del)" onclick={ondelete}><Trash2 size={14} /></button>{/if}
    <button class="btn ghost sm icon" title="Close (Esc)" onclick={onclose}><X size={14} /></button>
  </header>
  <div class="body">
    <div class="path">
      <strong class="ellipsis">{fromName}</strong>
      <span class="badge {edge.fromPort === 'failure' ? 'err' : 'ok'} mono">{edge.fromPort}</span>
      <ArrowRight size={13} />
      <strong class="ellipsis">{toName}</strong>
    </div>
    {#each issues as i}
      <div class="iss {i.level}"><TriangleAlert size={12} /> {i.message}</div>
    {/each}
    <div class="field">
      <span class="field-label">Tables on this connection</span>
      <div class="seg">
        <label class:on={!only}>
          <input type="radio" name="etab-{edge.id}" checked={!only} disabled={readOnly} onchange={() => setTables([])} />
          All tables
        </label>
        <label class:on={only}>
          <input
            type="radio"
            name="etab-{edge.id}"
            checked={only}
            disabled={readOnly}
            onchange={() => setTables(available?.length ? [available[0]] : [])}
          />
          Only some
        </label>
      </div>
      {#if only}
        {#if loading}
          <span class="help">loading tables…</span>
        {:else if options.length}
          <div class="tlist">
            {#each options as t (t)}
              <label class="trow">
                <input type="checkbox" checked={chosen.has(t.toLowerCase())} disabled={readOnly} onchange={(e) => toggle(t, e.currentTarget.checked)} />
                <span class="mono">{t}</span>
                {#each siblings.filter((s) => s.tables?.length && carries(s.tables, t)) as s}
                  <span class="also" title="Also carried to {s.toName}">→ {s.toName}</span>
                {/each}
              </label>
            {/each}
          </div>
        {:else}
          <input
            class="input mono"
            placeholder="table names, comma-separated"
            value={freeText || (edge.tables ?? []).join(', ')}
            disabled={readOnly}
            oninput={(e) => {
              freeText = e.currentTarget.value;
              setTables(freeText.split(',').map((x) => x.trim()).filter(Boolean));
            }}
          />
        {/if}
      {/if}
      <span class="help">
        Send only some of the upstream tables along this connection — e.g. <span class="mono">user</span> through a Lookup,
        the rest straight to the sink. Connect the same output again for the other tables.
      </span>
      {#if unrouted.length}
        <div class="iss"><TriangleAlert size={12} /> Not sent anywhere from {fromName}: {unrouted.join(', ')}</div>
      {/if}
    </div>
    <div class="field">
      <label for="bp">Back-pressure threshold (rows)</label>
      <input
        id="bp"
        class="input num"
        type="number"
        min="1"
        step="1000"
        value={edge.backPressureRows ?? ''}
        disabled={readOnly}
        placeholder={String(DEFAULT_BACKPRESSURE)}
        oninput={(e) => {
          const s = e.currentTarget.value;
          onchange({ backPressureRows: s === '' ? undefined : Math.max(1, Math.trunc(Number(s))) });
        }}
      />
      <span class="help">When this many rows are queued on the connection, the upstream node blocks. Default {fmtNum(DEFAULT_BACKPRESSURE)}.</span>
    </div>
    <div class="field">
      <label for="retries">Retry the destination</label>
      <div class="row">
        <input
          id="retries"
          class="input num"
          type="number"
          min="0"
          max="20"
          step="1"
          value={edge.retries ?? ''}
          disabled={readOnly}
          placeholder="0"
          oninput={(e) => {
            const s = e.currentTarget.value;
            onchange({ retries: s === '' ? undefined : Math.max(0, Math.min(20, Math.trunc(Number(s)))) });
          }}
        />
        <input
          class="input"
          style="width:90px"
          value={edge.retryBackoff ?? ''}
          disabled={readOnly || !edge.retries}
          placeholder="2s"
          title="Wait before the first retry; it doubles each time"
          oninput={(e) => onchange({ retryBackoff: e.currentTarget.value.trim() || undefined })}
        />
      </div>
      <span class="help">
        How often a batch is tried again when the destination fails on it, and the wait before the first retry (it doubles
        each time). For the transient: a dropped connection, a deadlock, a target that was briefly away.
      </span>
    </div>
    <div class="field">
      <label for="onfail">When the retries are used up</label>
      <select
        id="onfail"
        class="select"
        value={edge.onFailure ?? 'fail'}
        disabled={readOnly}
        onchange={(e) => onchange({ onFailure: e.currentTarget.value === 'dead_letter' ? 'dead_letter' : undefined })}
      >
        <option value="fail">Stop the run</option>
        <option value="dead_letter">Keep going — send the rows to dead letters</option>
      </select>
      <span class="help">Dead-lettered rows keep the error and can be replayed once the cause is fixed.</span>
    </div>
    {#if stats}
      <div class="stats">
        <div><span class="k">Queued</span><span class="v">{fmtNum(stats.queuedRows)} / {fmtNum(stats.capacityRows)}</span></div>
        <div><span class="k">Passed</span><span class="v">{fmtNum(stats.rowsPassed)}</span></div>
        {#if stats.retried}<div><span class="k">Retried</span><span class="v">{fmtNum(stats.retried)}</span></div>{/if}
        {#if stats.rowsDropped}<div><span class="k">Dropped</span><span class="v">{fmtNum(stats.rowsDropped)}</span></div>{/if}
      </div>
    {/if}
  </div>
</aside>

<style>
  .cfg {
    width: 300px;
    flex: none;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border-left: 1px solid var(--border);
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 8px 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .t {
    flex: 1;
  }
  .tt {
    font-weight: 600;
  }
  .body {
    padding: 12px;
  }
  .path {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    min-width: 0;
  }
  .iss {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 4px 8px;
    margin-bottom: 8px;
    border-radius: var(--radius-sm);
    background: var(--warn-soft);
    color: var(--warn);
    font-size: 12px;
  }
  .iss.error {
    background: var(--err-soft);
    color: var(--err);
  }
  .stats {
    display: flex;
    gap: 20px;
  }
  .seg {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 6px;
  }
  .seg label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }
  .seg label input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .seg label.on {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .tlist {
    border: 1px solid var(--border);
    border-radius: 6px;
    max-height: 220px;
    overflow: auto;
    margin-bottom: 6px;
  }
  .trow {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
    cursor: pointer;
  }
  .trow:last-child {
    border-bottom: none;
  }
  .also {
    margin-left: auto;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 10.5px;
    color: var(--text-3);
    white-space: nowrap;
  }
  .trow .mono {
    flex: none;
  }
  .field {
    margin-bottom: 14px;
  }
  .stats div {
    display: flex;
    flex-direction: column;
  }
  .k {
    font-size: 10.5px;
    text-transform: uppercase;
    color: var(--text-3);
    font-weight: 600;
  }
  .v {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
</style>
