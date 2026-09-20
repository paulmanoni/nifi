<script lang="ts">
  import type { RunDetail, TableProgress } from '../api/types';
  import { fmtCompact, fmtDuration, fmtNum, pct } from '../format';
  import { Search, Check, CircleX, LoaderCircle, Clock } from 'lucide-svelte';

  let { detail }: { detail: RunDetail } = $props();

  let q = $state('');
  let statusFilter = $state<'all' | TableProgress['status']>('all');

  const phases = [
    { key: 'loading', label: 'Load data' },
    { key: 'indexes', label: 'Indexes' },
    { key: 'constraints', label: 'Constraints' },
    { key: 'sequences', label: 'Sequences' },
  ];
  let phaseIdx = $derived(
    detail.status === 'completed' ? phases.length : phases.findIndex((p) => p.key === (detail.phase || (detail.status === 'running' ? 'loading' : ''))),
  );

  let tables = $derived(detail.tables ?? []);
  let counts = $derived({
    all: tables.length,
    pending: tables.filter((t) => t.status === 'pending').length,
    reading: tables.filter((t) => t.status === 'reading').length,
    done: tables.filter((t) => t.status === 'done').length,
    failed: tables.filter((t) => t.status === 'failed').length,
  });
  // A live run follows its source: there is no total to be a fraction of, no
  // load phases to step through, and it ends only when it is stopped.
  let isLive = $derived(!!detail.live);
  let deleted = $derived(tables.reduce((a, t) => a + (t.rowsDeleted || 0), 0));
  let est = $derived(tables.reduce((a, t) => a + (t.estimatedRows || 0), 0));
  let chunksDone = $derived(tables.reduce((a, t) => a + (t.chunksDone || 0), 0));
  let chunksTotal = $derived(tables.reduce((a, t) => a + (t.chunksTotal || 0), 0));
  let rate = $derived((detail.nodes ?? []).reduce((m, n) => Math.max(m, n.rowsPerSec || 0), 0));

  const order: Record<string, number> = { reading: 0, failed: 1, pending: 2, done: 3 };
  let shown = $derived(
    tables
      .filter((t) => (statusFilter === 'all' || t.status === statusFilter) && (!q || t.table.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.table.localeCompare(b.table)),
  );
</script>

<div class="rp">
  <div class="totals">
    <div class="stat"><div class="k">Rows read</div><div class="v num" title={fmtNum(detail.rowsRead)}>{fmtCompact(detail.rowsRead)}</div></div>
    <div class="stat">
      <div class="k">Rows written</div>
      <div class="v num" title={fmtNum(detail.rowsWritten)}>
        {fmtCompact(detail.rowsWritten)}{#if !isLive}<span class="of"> / ~{fmtCompact(est)}</span>{/if}
      </div>
    </div>
    {#if isLive}
      <div class="stat"><div class="k">Rows deleted</div><div class="v num" title={fmtNum(deleted)}>{fmtCompact(deleted)}</div></div>
    {/if}
    <div class="stat"><div class="k">Failed</div><div class="v num" class:bad={detail.rowsFailed > 0}>{fmtCompact(detail.rowsFailed)}</div></div>
    <div class="stat"><div class="k">Tables</div><div class="v num">{isLive ? counts.all : `${counts.done} / ${counts.all}`}</div></div>
    {#if !isLive}
      <div class="stat"><div class="k">Chunks</div><div class="v num">{fmtCompact(chunksDone)}<span class="of"> / {fmtCompact(chunksTotal)}</span></div></div>
    {/if}
    <div class="stat"><div class="k">Throughput</div><div class="v num">{fmtCompact(rate)}<span class="of"> rows/s</span></div></div>
    <div class="stat"><div class="k">{isLive ? 'Following for' : 'Elapsed'}</div><div class="v num">{fmtDuration(detail.startedAt, detail.finishedAt)}</div></div>
    {#if !isLive}
      <div class="overall">
        <div class="progress" class:ok={detail.status === 'completed'} class:err={detail.status === 'failed'}><div style:width="{detail.status === 'completed' ? 100 : pct(detail.rowsWritten, est)}%"></div></div>
      </div>
    {/if}
  </div>

  {#if isLive}
    <p class="note muted small">
      This run follows its source and keeps going: new and changed rows are written as they appear, and rows deleted at
      the source are removed. It ends when you stop it, and starts again where it left off.
    </p>
  {:else}
    <div class="phases">
      {#each phases as p, i}
        <div class="phase" class:done={phaseIdx > i} class:cur={phaseIdx === i && detail.status !== 'failed'} class:fail={phaseIdx === i && detail.status === 'failed'}>
          <span class="pd">{#if phaseIdx > i}<Check size={10} />{:else}{i + 1}{/if}</span>{p.label}
        </div>
        {#if i < phases.length - 1}<div class="pline" class:done={phaseIdx > i}></div>{/if}
      {/each}
    </div>
  {/if}

  {#if detail.error}<div class="rerr">{detail.error}</div>{/if}

  <div class="filters">
    <div class="search"><Search size={13} /><input class="input" placeholder="Filter tables…" bind:value={q} /></div>
    {#each ['all', 'reading', 'pending', 'done', 'failed'] as s}
      <button class="btn sm" class:active={statusFilter === s} onclick={() => (statusFilter = s as typeof statusFilter)}>
        {s} <span class="muted">{counts[s as keyof typeof counts]}</span>
      </button>
    {/each}
  </div>

  <div class="tlist">
    {#each shown as t (t.table)}
      <div class="trow {t.status}">
        <span class="ic">
          {#if t.status === 'done'}<Check size={13} />{:else if t.status === 'failed'}<CircleX size={13} />{:else if t.status === 'reading'}<LoaderCircle size={13} class="spin" />{:else}<Clock size={13} />{/if}
        </span>
        <span class="tn mono ellipsis" title={t.table}>{t.table}</span>
        <div class="bar">
          {#if !isLive}
            <div class="progress" class:ok={t.status === 'done'} class:err={t.status === 'failed'}>
              <div style:width="{t.status === 'done' ? 100 : pct(t.rowsWritten, t.estimatedRows)}%"></div>
            </div>
          {/if}
        </div>
        <span class="num small nums" title="{fmtNum(t.rowsWritten)} written / {fmtNum(t.rowsRead)} read{isLive ? '' : ` / ~${fmtNum(t.estimatedRows)} estimated`}">
          {fmtCompact(t.rowsWritten)}{#if !isLive}<span class="muted"> / ~{fmtCompact(t.estimatedRows)}</span>{/if}
        </span>
        <span class="num small muted chunks" title={isLive ? 'rows removed because the source deleted them' : 'chunks done / total'}>
          {isLive ? (t.rowsDeleted ? `${fmtCompact(t.rowsDeleted)} deleted` : '') : `${t.chunksDone}/${t.chunksTotal} ch`}
        </span>
        <span class="num small fails" class:bad={t.rowsFailed > 0}>{t.rowsFailed ? `${fmtCompact(t.rowsFailed)} failed` : ''}</span>
      </div>
    {:else}
      <div class="empty small">{tables.length ? 'No tables match.' : 'No table progress yet.'}</div>
    {/each}
  </div>
</div>

<style>
  .rp {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }
  .totals {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 20px;
    align-items: flex-end;
  }
  .stat .k {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-3);
    font-weight: 600;
  }
  .stat .v {
    font-size: 16px;
    font-weight: 600;
  }
  .of {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-3);
  }
  .bad {
    color: var(--err);
  }
  .overall {
    flex: 1 1 100%;
  }
  .note {
    margin: 0;
    max-width: 78ch;
  }
  .phases {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .phase {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-3);
  }
  .pd {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 10px;
    border: 1px solid var(--border-strong);
    background: var(--bg-sunken);
  }
  .phase.done {
    color: var(--ok);
  }
  .phase.done .pd {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .phase.cur {
    color: var(--accent-text);
    font-weight: 600;
  }
  .phase.cur .pd {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    animation: pulse 1.4s ease-in-out infinite;
  }
  .phase.fail {
    color: var(--err);
  }
  .phase.fail .pd {
    background: var(--err);
    border-color: var(--err);
    color: #fff;
  }
  @keyframes pulse {
    50% {
      box-shadow: 0 0 0 4px var(--accent-soft);
    }
  }
  .pline {
    width: 28px;
    height: 1px;
    background: var(--border-strong);
  }
  .pline.done {
    background: var(--ok);
  }
  .rerr {
    padding: 6px 10px;
    background: var(--err-soft);
    color: var(--err);
    border-radius: var(--radius);
    white-space: pre-wrap;
  }
  .filters {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
  .filters .btn {
    text-transform: capitalize;
  }
  .search {
    position: relative;
    width: 200px;
    margin-right: 6px;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 7px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 26px;
    height: 24px;
  }
  .tlist {
    display: flex;
    flex-direction: column;
  }
  .trow {
    display: grid;
    grid-template-columns: 18px minmax(120px, 260px) 1fr 150px 70px 90px;
    align-items: center;
    gap: 10px;
    padding: 4px 6px;
    border-bottom: 1px solid var(--border);
  }
  .trow:hover {
    background: var(--bg-hover);
  }
  .ic {
    display: inline-flex;
    color: var(--text-3);
  }
  .done .ic {
    color: var(--ok);
  }
  .failed .ic {
    color: var(--err);
  }
  .reading .ic {
    color: var(--accent);
  }
  .nums {
    text-align: right;
  }
  .chunks,
  .fails {
    text-align: right;
  }
</style>
