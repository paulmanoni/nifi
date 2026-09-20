<script lang="ts">
  import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/svelte';
  import { getCanvasCtx } from './context';
  import { outputPorts, defaultConcurrency, type PNode } from './model';
  import { iconFor, categoryColor } from '../icons';
  import { fmtCompact, fmtNum } from '../format';
  import { TriangleAlert } from 'lucide-svelte';

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
  <div class="head">
    <span class="ic"><Icon size={16} strokeWidth={1.8} /></span>
    <div class="titles">
      <div class="name" title={node.name}>{node.name}</div>
      <div class="type">{spec?.label ?? `Unknown · ${node.type}`}</div>
    </div>
    <div class="flags">
      {#if bulletinLines.length}
        <span class="bul" class:err={bulletinErr} title={bulletinLines.join('\n')}><TriangleAlert size={13} strokeWidth={2.2} /></span>
      {/if}
      <span class="dot {status}" title={statusTitle[status]}></span>
    </div>
  </div>

  <div class="stats" class:idle={!stats} title={stats ? `${fmtNum(stats.rowsIn)} in · ${fmtNum(stats.rowsOut)} out · ${fmtNum(stats.batchesIn)} batches` : 'No run yet'}>
    <div class="s"><span class="k">In</span><span class="v">{vIn}</span></div>
    <div class="s"><span class="k">Out</span><span class="v">{vOut}</span></div>
    <div class="s"><span class="k">Rate</span><span class="v">{vRate}</span></div>
    <div class="s">
      <span class="k">Tasks</span>
      <span class="v">{vTasks}{#if errs > 0}<span class="e"> · {fmtCompact(errs)} err</span>{/if}</span>
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
    width: 272px;
    background: var(--node-bg);
    border: 1px solid var(--node-border);
    border-radius: 6px;
    box-shadow: var(--node-shadow);
    color: var(--text);
    font-size: 12px;
    transition: box-shadow 0.15s, border-color 0.15s;
  }
  .pn:hover {
    box-shadow: var(--node-shadow-hover);
  }
  .pn.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent), var(--node-shadow-hover);
  }
  .pn.disabled {
    opacity: 0.55;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 8px 10px;
  }
  .ic {
    width: 28px;
    height: 28px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: 7px;
    color: var(--cat);
    background: color-mix(in srgb, var(--cat) 13%, transparent);
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: 13px;
    font-weight: 600;
    line-height: 17px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .type {
    font-size: 11px;
    line-height: 14px;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .flags {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 2px;
  }
  .bul {
    display: inline-flex;
    color: var(--warn);
    cursor: help;
  }
  .bul.err {
    color: var(--err);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-3);
    opacity: 0.55;
  }
  .dot.running {
    background: var(--ok);
    opacity: 1;
    animation: pulse 1.6s ease-out infinite;
  }
  .dot.invalid {
    background: var(--warn);
    opacity: 1;
  }
  .dot.disabled {
    background: transparent;
    border: 1.5px solid var(--text-3);
  }
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 55%, transparent);
    }
    100% {
      box-shadow: 0 0 0 6px transparent;
    }
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin: 0 10px 10px;
    padding: 7px 9px;
    border-radius: 5px;
    background: var(--node-well);
  }
  .s {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .k {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-3);
    line-height: 12px;
  }
  .v {
    font-family: var(--mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    line-height: 16px;
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
    padding: 5px 0 5px;
  }
  .port {
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 12px;
  }
  .pill {
    font-size: 10.5px;
    line-height: 16px;
    padding: 0 7px;
    border-radius: 999px;
    background: var(--node-well);
    border: 1px solid var(--border);
    color: var(--text-2);
    font-weight: 500;
  }
  .pill.fail {
    background: color-mix(in srgb, var(--err) 9%, transparent);
    border-color: color-mix(in srgb, var(--err) 28%, transparent);
    color: var(--err);
  }
</style>
