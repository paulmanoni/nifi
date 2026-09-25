<script lang="ts">
  import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/svelte';
  import { getCanvasCtx } from './context';
  import { outputPorts, defaultConcurrency, type PNode } from './model';
  import { iconFor, categoryColor } from '../icons';
  import { fmtCompact, fmtNum } from '../format';
  import { TriangleAlert, Play, Square, Pause } from 'lucide-svelte';

  // Processor card: tinted icon · name/type · status dot, a 2×2 stats grid,
  // and a footer with one pill per output relationship (handle on the right edge).
  let { id, data, selected }: NodeProps<PNode> = $props();

  const ctx = getCanvasCtx();
  const updateInternals = useUpdateNodeInternals();

  let node = $derived(data.node);
  let spec = $derived(ctx.specs().get(node.type));
  let ports = $derived(outputPorts(spec, node.config));
  let hasInput = $derived((spec?.inputs ?? 1) > 0);
  let isSource = $derived(spec?.inputs === 0);
  let Icon = $derived(iconFor(spec?.icon, spec?.category));
  let color = $derived(spec ? categoryColor[spec.category] : 'var(--text-3)');

  let issues = $derived(ctx.issues().get(id) ?? []);
  let invalid = $derived(!spec || issues.some((i) => i.level === 'error'));
  let stats = $derived(ctx.showStats() ? ctx.live.nodeStats.get(id) : undefined);
  let nodeBulletins = $derived(
    ctx.showStats() ? ctx.live.bulletins.filter((b) => b.nodeId === id && (b.level === 'warn' || b.level === 'error')) : [],
  );
  let bulletinLines = $derived([
    ...issues.map((i) => `${i.level === 'error' ? 'Error' : 'Warning'}: ${i.message}`),
    ...nodeBulletins.slice(-5).map((b) => `${b.level === 'error' ? 'Error' : 'Warning'}: ${b.table ? `[${b.table}] ` : ''}${b.message}`),
  ]);
  let bulletinErr = $derived(issues.some((i) => i.level === 'error') || nodeBulletins.some((b) => b.level === 'error'));

  type Status = 'disabled' | 'invalid' | 'running' | 'stopped';
  let running = $derived(ctx.live.detail?.status === 'running' && !!stats && !node.disabled);
  let status = $derived<Status>(node.disabled ? 'disabled' : invalid ? 'invalid' : running ? 'running' : 'stopped');
  const statusTitle: Record<Status, string> = { disabled: 'Disabled', invalid: 'Invalid', running: 'Running', stopped: 'Stopped' };

  let conc = $derived(spec?.supportsConcurrency ? Math.max(1, node.concurrency || defaultConcurrency(spec)) : 1);
  const dash = '—';
  let vIn = $derived(!stats ? dash : isSource ? dash : fmtCompact(stats.rowsIn));
  let vOut = $derived(!stats ? dash : fmtCompact(stats.rowsOut));
  let vRate = $derived(!stats ? dash : `${fmtCompact(Math.round(stats.rowsPerSec))}/s`);
  let vTasks = $derived(!stats ? `${conc}` : `${stats.active}/${conc}`);
  let errs = $derived(stats?.errors ?? 0);

  let portKey = $derived(ports.join('|') + (hasInput ? '1' : '0'));
  $effect(() => {
    void portKey;
    updateInternals(id);
  });
</script>

<div class="pn" class:selected class:disabled={node.disabled} style:--cat={color} role="presentation" ondblclick={() => ctx.opennode(id)}>
  {#if bulletinLines.length}
    <span class="bul" class:err={bulletinErr} title={bulletinLines.join('\n')}><TriangleAlert size={11} strokeWidth={2.4} /></span>
  {/if}

  <div class="head">
    <span class="st {status}" title={statusTitle[status]}>
      {#if status === 'running'}<Play size={11} fill="currentColor" strokeWidth={0} />
      {:else if status === 'invalid'}<TriangleAlert size={11} strokeWidth={2.4} />
      {:else if status === 'disabled'}<Pause size={11} fill="currentColor" strokeWidth={0} />
      {:else}<Square size={10} fill="currentColor" strokeWidth={0} />{/if}
    </span>
    <span class="ic"><Icon size={13} strokeWidth={1.9} /></span>
    <div class="titles">
      <div class="type" title={spec?.label ?? node.type}>{spec?.label ?? `Unknown · ${node.type}`}</div>
      <div class="name" title={node.name}>{node.name}</div>
    </div>
  </div>

  <div class="stats" class:idle={!stats} title={stats ? `${fmtNum(stats.rowsIn)} in · ${fmtNum(stats.rowsOut)} out · ${fmtNum(stats.batchesIn)} batches` : 'No run yet'}>
    <div class="s"><span class="k">In</span><span class="v">{vIn}</span></div>
    <div class="s"><span class="k">Out</span><span class="v">{vOut}</span></div>
    <div class="s"><span class="k">Rate</span><span class="v">{vRate}</span></div>
    <div class="s">
      <span class="k">Tasks / Errors</span>
      <span class="v">{vTasks}{#if errs > 0}<span class="e"> · {fmtCompact(errs)}</span>{/if}</span>
    </div>
  </div>

  {#if ports.length}
    <div class="ports">
      {#each ports as p (p)}
        <div class="port">
          <span class="pill" class:fail={p === 'failure'}>{p}</span>
          <Handle type="source" position={Position.Right} id={p} class="h h-out {p === 'failure' ? 'h-fail' : ''}" />
        </div>
      {/each}
    </div>
  {/if}

  {#if hasInput}
    <Handle type="target" position={Position.Left} id="in" class="h h-in" />
  {/if}
</div>

<style>
  .pn {
    position: relative;
    width: 296px;
    background: var(--node-bg);
    border: 1px solid var(--node-border);
    border-radius: var(--radius);
    box-shadow: var(--node-shadow);
    color: var(--text);
    font-size: 11.5px;
    transition: box-shadow 0.12s, border-color 0.12s;
  }
  .pn:hover {
    box-shadow: var(--node-shadow-hover);
  }
  .pn.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), var(--node-shadow-hover);
  }
  .pn.disabled {
    opacity: 0.6;
  }

  /* Bulletins sit in the corner of the component itself, as they do on a
     NiFi canvas — visible without opening anything. */
  .bul {
    position: absolute;
    top: -1px;
    right: -1px;
    display: inline-flex;
    padding: 2px 3px;
    background: var(--warn);
    color: #fff;
    border-radius: 0 var(--radius) 0 var(--radius);
    cursor: help;
    z-index: 1;
  }
  .bul.err {
    background: var(--err);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--border);
  }
  /* Run state is a glyph, not a dot: shape carries it as well as colour. */
  .st {
    flex: none;
    display: inline-flex;
    width: 13px;
    justify-content: center;
    color: var(--stopped);
  }
  .st.running {
    color: var(--running);
  }
  .st.invalid {
    color: var(--invalid);
  }
  .st.disabled {
    color: var(--disabled);
  }
  .ic {
    flex: none;
    display: inline-flex;
    color: var(--cat);
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  .type {
    font-size: 12px;
    font-weight: 600;
    line-height: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name {
    font-size: 11px;
    line-height: 14px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Label on the left, figure on the right — a readout, not a card. */
  .stats {
    padding: 4px 8px 5px;
  }
  .s {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    line-height: 16px;
  }
  .k {
    font-size: 11px;
    color: var(--text-2);
    white-space: nowrap;
  }
  .v {
    font-family: var(--mono);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .idle .v {
    color: var(--text-3);
  }
  .e {
    color: var(--err);
  }

  .ports {
    border-top: 1px solid var(--border);
    background: var(--node-well);
    padding: 3px 0;
  }
  .port {
    position: relative;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
  }
  .pill {
    font-size: 10px;
    line-height: 14px;
    padding: 0 5px;
    border-radius: var(--radius);
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    color: var(--text-2);
    font-weight: 500;
  }
  .pill.fail {
    border-color: var(--err);
    color: var(--err);
  }
</style>
