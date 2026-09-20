<script lang="ts">
  import type { Column } from '../api/types';
  import { cellText, prettyValue } from '../format';
  import { X, TriangleAlert } from 'lucide-svelte';

  let {
    columns,
    rows,
    errors = [],
    changed,
    added,
    emptyText = 'No rows',
  }: {
    columns: Column[];
    rows: any[][];
    errors?: { row: number; message: string }[];
    changed?: Set<string>;
    added?: Set<string>;
    emptyText?: string;
  } = $props();

  let errByRow = $derived.by(() => {
    const m = new Map<number, string[]>();
    for (const e of errors ?? []) {
      const a = m.get(e.row) ?? [];
      a.push(e.message);
      m.set(e.row, a);
    }
    return m;
  });

  let inspect = $state<{ col: string; value: unknown } | null>(null);

  function typeHint(c: Column) {
    let t = c.type || c.nativeType;
    if (c.length) t += `(${c.length})`;
    else if (c.precision) t += `(${c.precision}${c.scale ? ',' + c.scale : ''})`;
    return t;
  }
</script>

<div class="grid-wrap">
  <div class="grid scroll">
    <table>
      <thead>
        <tr>
          <th class="idx">#</th>
          {#each columns as c}
            <th class:changed={changed?.has(c.name)} class:added={added?.has(c.name)} title={`${c.name}\n${c.nativeType || c.type}${c.nullable ? ' NULL' : ' NOT NULL'}`}>
              <div class="cname">{c.name}</div>
              <div class="ctype">{typeHint(c)}{c.nullable ? '' : ' ·NN'}</div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as r, i}
          {@const errs = errByRow.get(i)}
          <tr class:err={!!errs}>
            <td class="idx" title={errs?.join('\n')}>
              {#if errs}<TriangleAlert size={12} />{:else}{i + 1}{/if}
            </td>
            {#each columns as c, j}
              {@const v = cellText(r?.[j])}
              <td
                class="{v.kind}"
                class:changed={changed?.has(c.name)}
                title={v.kind === 'null' ? 'NULL' : v.text.length > 40 || v.kind === 'json' ? prettyValue(r?.[j]) : undefined}
                onclick={() => (inspect = { col: c.name, value: r?.[j] })}
              >{v.text.length > 120 ? v.text.slice(0, 120) + '…' : v.text}</td>
            {/each}
          </tr>
          {#if errs}
            <tr class="errmsg"><td></td><td colspan={columns.length}>{errs.join(' · ')}</td></tr>
          {/if}
        {:else}
          <tr><td class="none" colspan={columns.length + 1}>{emptyText}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if inspect}
    <div class="inspect">
      <div class="row">
        <strong class="mono">{inspect.col}</strong>
        <span class="spacer"></span>
        <button class="btn ghost sm icon" onclick={() => (inspect = null)} aria-label="Close"><X size={13} /></button>
      </div>
      <pre>{prettyValue(inspect.value)}</pre>
    </div>
  {/if}
</div>

<style>
  .grid-wrap {
    position: relative;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .grid {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-elev);
  }
  table {
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;
    min-width: 100%;
  }
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--bg-sunken);
    text-align: left;
    padding: 4px 10px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    font-weight: 600;
    white-space: nowrap;
  }
  th.changed {
    background: color-mix(in srgb, var(--warn-soft) 70%, var(--bg-sunken));
  }
  th.added {
    background: color-mix(in srgb, var(--ok-soft) 70%, var(--bg-sunken));
  }
  .cname {
    font-family: var(--mono);
    color: var(--text);
  }
  .ctype {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--text-3);
  }
  td {
    padding: 3px 10px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 11.5px;
    white-space: nowrap;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: default;
  }
  td.changed {
    background: color-mix(in srgb, var(--warn-soft) 45%, transparent);
  }
  td.null {
    color: var(--text-3);
    font-style: italic;
    font-size: 10.5px;
  }
  td.num {
    text-align: right;
    color: var(--info);
  }
  td.bool {
    color: var(--cat-transform);
  }
  td.json {
    color: var(--cat-script);
  }
  .idx {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--bg-sunken);
    color: var(--text-3);
    text-align: right;
    width: 1%;
    font-family: var(--mono);
  }
  th.idx {
    z-index: 2;
  }
  tr.err td {
    background: var(--err-soft);
  }
  tr.err .idx {
    color: var(--err);
  }
  tr.errmsg td {
    background: var(--err-soft);
    color: var(--err);
    font-family: var(--font);
    white-space: normal;
    font-size: 11.5px;
  }
  tbody tr:hover td:not(.idx) {
    background: var(--bg-hover);
  }
  .none {
    text-align: center;
    color: var(--text-3);
    padding: 20px;
    font-family: var(--font);
  }
  .inspect {
    position: absolute;
    right: 8px;
    bottom: 8px;
    width: min(460px, 70%);
    max-height: 70%;
    display: flex;
    flex-direction: column;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 6px 8px;
    z-index: 3;
  }
  .inspect pre {
    margin: 4px 0 0;
    overflow: auto;
    font-family: var(--mono);
    font-size: 11.5px;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
