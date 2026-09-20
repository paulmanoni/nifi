<script lang="ts">
  import { onDestroy } from 'svelte';
  import { api } from '../api/client';
  import type { Graph, GraphNode, SinkPlan, SinkPlanColumn, SinkPlanTable, TableSummary } from '../api/types';
  import { toast } from '../stores/toast.svelte';
  import Modal from '../components/Modal.svelte';
  import Skeleton from '../components/Skeleton.svelte';
  import {
    Search,
    TriangleAlert,
    CircleX,
    KeyRound,
    Copy,
    ChevronDown,
    ChevronRight,
    LoaderCircle,
    RotateCcw,
    Plus,
    Check,
    ArrowRight,
    RefreshCw,
    Sparkles,
  } from 'lucide-svelte';

  type KV = { key: string; value: string };
  type CM = { table: string; from: string; to?: string; cast?: string; type?: string };
  type EX = { table: string; column: string; expr: string; type: string };
  import TargetColumnPicker from './fields/TargetColumnPicker.svelte';
  import ExprField from './fields/ExprField.svelte';
  import { catalog } from '../stores/catalog.svelte';
  import { Trash2 } from 'lucide-svelte';

  let {
    node,
    getGraph,
    readOnly = false,
    onapply,
    onclose,
  }: {
    node: GraphNode;
    getGraph: () => Graph;
    readOnly?: boolean;
    onapply: (m: { table_map: KV[]; column_map: CM[]; expressions: EX[] }) => void;
    onclose: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const cfg = node.config ?? {};
  // svelte-ignore state_referenced_locally
  const nodeId = node.id;
  const cfgSchema: string = cfg.schema || 'public';
  const nameCase: string = cfg.name_case || 'preserve';
  const connectionId: string = cfg.connection || '';

  let map = $state<KV[]>(Array.isArray(cfg.table_map) ? cfg.table_map.map((p: KV) => ({ key: p.key, value: p.value })) : []);
  let cmap = $state<CM[]>(Array.isArray(cfg.column_map) ? cfg.column_map.map((c: CM) => ({ ...c })) : []);
  let exprs = $state<EX[]>(
    Array.isArray(cfg.expressions)
      ? cfg.expressions.map((e: EX) => ({ table: e.table ?? '', column: e.column ?? '', expr: e.expr ?? '', type: e.type ?? '' }))
      : [],
  );
  catalog.loadTypes();
  const pgTypes = ['text', 'varchar(255)', 'integer', 'bigint', 'smallint', 'numeric(12,2)', 'double precision', 'boolean', 'date',
    'timestamp', 'timestamptz', 'jsonb', 'uuid', 'bytea', 'text[]'];
  let plan = $state<SinkPlan | null>(null);
  let planError = $state('');
  let loading = $state(false);
  let q = $state('');
  let sel = $state<string | null>(null);
  let showSql = $state(true);

  // ---------- default target (mirrors the engine's targetName) ----------
  function snake(s: string) {
    let out = '';
    const rs = [...s];
    rs.forEach((r, i) => {
      const up = r !== r.toLowerCase() && r === r.toUpperCase();
      if (up) {
        const prev = rs[i - 1];
        const next = rs[i + 1];
        const isLower = (c?: string) => !!c && c === c.toLowerCase() && c !== c.toUpperCase();
        const isUpper = (c?: string) => !!c && c === c.toUpperCase() && c !== c.toLowerCase();
        const isDigit = (c?: string) => !!c && /[0-9]/.test(c);
        if (i > 0 && (isLower(prev) || isDigit(prev) || (isLower(next) && isUpper(prev)))) out += '_';
        out += r.toLowerCase();
      } else if (r === ' ' || r === '-' || r === '.') out += '_';
      else out += r;
    });
    return out.replaceAll('__', '_').replace(/^_+|_+$/g, '');
  }
  const applyCase = (n: string) => (nameCase === 'lower' ? n.toLowerCase() : nameCase === 'snake' ? snake(n) : n);
  const baseName = (t: string) => (t.includes('.') ? t.slice(t.lastIndexOf('.') + 1) : t);
  const defaultTarget = (source: string) => `${cfgSchema}.${applyCase(baseName(source))}`;
  const qualify = (v: string) => (v.includes('.') ? v : `${cfgSchema}.${v}`);

  // ---------- plan fetching (debounced on mapping changes) ----------
  let ctrl: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function graphWithMap(): Graph {
    const g = getGraph();
    return {
      ...g,
      nodes: g.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, config: { ...n.config, table_map: $state.snapshot(map), column_map: $state.snapshot(cmap), expressions: validExprs() } }
          : n,
      ),
    };
  }

  async function fetchPlan() {
    ctrl?.abort();
    ctrl = new AbortController();
    loading = true;
    try {
      const p = await api.sinkPlan(graphWithMap(), nodeId, ctrl.signal);
      plan = p;
      planError = '';
      if (!sel || !p.tables.some((t) => t.source === sel)) sel = p.tables[0]?.source ?? null;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      planError = (e as Error).message;
    } finally {
      loading = false;
    }
  }
  fetchPlan();
  function refetch() {
    clearTimeout(timer);
    timer = setTimeout(fetchPlan, 350);
  }
  onDestroy(() => {
    clearTimeout(timer);
    ctrl?.abort();
  });

  // ---------- target tables of the sink connection ----------
  let targets = $state<TableSummary[]>([]);
  if (connectionId) api.tables(connectionId).then((t) => (targets = (t ?? []).sort((a, b) => `${a.schema}.${a.name}`.localeCompare(`${b.schema}.${b.name}`)))).catch(() => {});

  let tables = $derived(plan?.tables ?? []);
  let shown = $derived(tables.filter((t) => !q || `${t.source} ${t.schema}.${t.table}`.toLowerCase().includes(q.toLowerCase())));
  let cur = $derived(tables.find((t) => t.source === sel) ?? null);
  let counts = $derived({
    create: tables.filter((t) => t.action === 'create').length,
    load: tables.filter((t) => t.action === 'load').length,
    error: tables.filter((t) => t.action === 'error').length,
  });

  function setTarget(source: string, value: string) {
    if (readOnly) return;
    const v = value.trim();
    const rest = map.filter((p) => p.key.toLowerCase() !== source.toLowerCase());
    map = !v || qualify(v) === defaultTarget(source) ? rest : [...rest, { key: source, value: qualify(v) }];
    refetch();
  }

  // ---------- column mapping ----------
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const defaultCol = (from: string) => applyCase(from);

  const entry = (table: string, from: string) => cmap.find((c) => same(c.table, table) && c.from === from);
  /** Merge a change into the {table, from, to, cast, type} entry; drop it
   *  when nothing differs from the defaults. `to` "" = skip. */
  function patchColumn(table: string, from: string, patch: Partial<CM>) {
    if (readOnly) return;
    const cur = { ...(entry(table, from) ?? { table, from }), ...patch } as CM;
    if (cur.to === defaultCol(from)) delete cur.to;
    if (!cur.cast) delete cur.cast;
    if (!cur.type?.trim()) delete cur.type;
    if ((cur.cast || cur.type) && cur.to === undefined) cur.to = defaultCol(from);
    if (cur.to === defaultCol(from) && !cur.cast && !cur.type) delete cur.to;
    const rest = cmap.filter((c) => !(same(c.table, table) && c.from === from));
    cmap = cur.to === undefined && !cur.cast && !cur.type ? rest : [...rest, cur];
    refetch();
  }
  function setColumn(table: string, from: string, to: string) {
    patchColumn(table, from, { to });
  }

  // ---------- computed columns ----------
  function validExprs() {
    return $state.snapshot(exprs).filter((e) => e.column.trim() && e.expr.trim());
  }
  const exprsFor = (t: SinkPlanTable) => exprs.map((e, i) => ({ e, i })).filter(({ e }) => !e.table || same(e.table, t.source));
  function addExpr(t: SinkPlanTable) {
    exprs = [...exprs, { table: t.source, column: '', expr: '', type: '' }];
  }
  function setExpr(i: number, patch: Partial<EX>) {
    exprs[i] = { ...exprs[i], ...patch };
    refetch();
  }
  function removeExpr(i: number) {
    exprs = exprs.filter((_, j) => j !== i);
    refetch();
  }
  const planOf = (t: SinkPlanTable, name: string) => t.columns.find((c) => c.expr && c.name === name);

  /** Include/ignore one column: ignoring maps it to "" (skip); including
   *  restores its default name unless another target was chosen. */
  function setIncluded(table: string, c: SinkPlanColumn, include: boolean) {
    if (readOnly || !c.source) return;
    if (include) {
      cmap = cmap.filter((e) => !(same(e.table, table) && e.from === c.source));
    } else {
      cmap = [...cmap.filter((e) => !(same(e.table, table) && e.from === c.source)), { table, from: c.source, to: '' }];
    }
    refetch();
  }

  function setAllIncluded(t: SinkPlanTable, include: boolean) {
    if (readOnly) return;
    const cols = incoming(t);
    let next = cmap.filter((e) => !(same(e.table, t.source) && cols.some((c) => c.source === e.from && e.to === '')));
    if (!include) {
      next = next.filter((e) => !(same(e.table, t.source) && cols.some((c) => c.source === e.from)));
      next = [...next, ...cols.filter((c) => !c.primaryKey).map((c) => ({ table: t.source, from: c.source!, to: '' }))];
    }
    cmap = next;
    refetch();
  }
  const isIgnored = (c: SinkPlanColumn) => c.status === 'skipped';

  function colOptions(t: SinkPlanTable) {
    if (!t.exists) return [];
    return t.columns
      .filter((c) => c.targetType && c.status !== 'create')
      .map((c) => ({ name: c.name, type: c.targetType, unfilled: c.status === 'target_only' }))
      .sort((a, b) => Number(!!b.unfilled) - Number(!!a.unfilled) || a.name.localeCompare(b.name));
  }
  const incoming = (t: SinkPlanTable) =>
    t.columns.filter((c) => c.source && !c.expr && c.status !== 'target_only').sort((a, b) => Number(!!a.introducedBy) - Number(!!b.introducedBy));
  const targetOnly = (t: SinkPlanTable) => t.columns.filter((c) => c.status === 'target_only');
  const introduced = (t: SinkPlanTable) => t.columns.filter((c) => c.introducedBy && c.source && !c.expr);
  const rowTarget = (c: SinkPlanColumn) => (c.status === 'skipped' ? '' : c.name);

  // ---------- target picker ----------
  let pickSchema = $state('');
  let pickName = $state('');
  let pickOpen = $state(false);
  $effect(() => {
    if (cur) {
      pickSchema = cur.schema;
      pickName = cur.table;
    }
  });
  let pickMatches = $derived(
    targets
      .filter((t) => {
        const n = pickName.trim().toLowerCase();
        return !n || t.name.toLowerCase().includes(n) || `${t.schema}.${t.name}`.toLowerCase().includes(n);
      })
      .slice(0, 50),
  );
  let exactExists = $derived(targets.some((t) => t.schema === pickSchema.trim() && t.name === pickName.trim()));

  function choose(schema: string, name: string) {
    pickOpen = false;
    if (!cur) return;
    pickSchema = schema;
    pickName = name;
    setTarget(cur.source, `${schema}.${name}`);
  }

  // ---------- column diff ----------
  const statusLabel: Record<SinkPlanColumn['status'], string> = {
    create: '+ create',
    match: '✓ match',
    add: '+ will be added',
    type_differs: 'converted',
    retype: 'type changed',
    dropped: 'not written',
    skipped: 'ignored',
    target_only: 'target only',
  };
  function summary(cols: SinkPlanColumn[]) {
    const n = (s: SinkPlanColumn['status']) => cols.filter((c) => c.status === s).length;
    const parts: string[] = [];
    if (n('create')) parts.push(`${n('create')} to create`);
    if (n('match')) parts.push(`${n('match')} match`);
    if (n('add')) parts.push(`${n('add')} will be added`);
    if (n('retype')) parts.push(`${n('retype')} retyped`);
    if (n('type_differs')) parts.push(`${n('type_differs')} type differ${n('type_differs') === 1 ? 's' : ''}`);
    if (n('dropped')) parts.push(`${n('dropped')} not written`);
    if (n('skipped')) parts.push(`${n('skipped')} ignored`);
    if (n('target_only')) parts.push(`${n('target_only')} target-only`);
    return parts.join(' · ');
  }
  // target-only NOT NULL columns with no default make every insert fail
  const blocking = (c: SinkPlanColumn) =>
    c.status === 'target_only' && !c.nullable && (!c.note || /without (a )?default|no default/i.test(c.note));

  async function copyDdl(s: string) {
    try {
      await navigator.clipboard.writeText(s);
      toast.success('SQL copied');
    } catch {
      toast.error('Clipboard unavailable');
    }
  }

  const norm = (m: KV[], c: CM[], x: EX[]) =>
    JSON.stringify([
      m.map((p) => [p.key, p.value]),
      c.map((e) => [e.table, e.from, e.to ?? null, e.cast ?? '', e.type ?? '']),
      x.map((e) => [e.table ?? '', e.column, e.expr, e.type ?? '']),
    ]);
  const original = norm(
    Array.isArray(cfg.table_map) ? cfg.table_map : [],
    Array.isArray(cfg.column_map) ? cfg.column_map : [],
    Array.isArray(cfg.expressions) ? cfg.expressions : [],
  );
  let dirty = $derived(norm(map, cmap, exprs) !== original);
</script>

<Modal title="Target tables · {node.name}" width="min(1240px, 96vw)" height="min(820px, 94vh)" {onclose}>
  {#snippet headerExtra()}
    {#if plan}
      <span class="badge ok">{counts.create} new</span>
      <span class="badge info">{counts.load} existing</span>
      {#if counts.error}<span class="badge err">{counts.error} error</span>{/if}
      {#if plan.truncated}<span class="badge warn">showing {tables.length} of {plan.totalTables}</span>{/if}
    {/if}
    {#if loading}<LoaderCircle size={14} class="spin" />{/if}
  {/snippet}

  {#if !plan && planError}
    <div class="callout err"><CircleX size={15} /> <span>{planError}</span></div>
  {:else if !plan}
    <Skeleton rows={10} />
  {:else if tables.length === 0}
    <div class="empty">
      <h3>No tables reach this node yet</h3>
      <p>Connect a source upstream (and pick its tables) to plan the target tables.</p>
    </div>
  {:else}
    <div class="split">
      <aside class="list">
        <div class="search"><Search size={13} /><input class="input" placeholder="Filter {tables.length} tables…" bind:value={q} /></div>
        <div class="items scroll">
          {#each shown as t (t.source)}
            <button class="item" class:on={t.source === sel} onclick={() => (sel = t.source)}>
              <div class="il">
                <span class="src mono ellipsis">{t.source}</span>
                <span class="dst mono ellipsis"><ArrowRight size={10} /> {t.schema}.{t.table}</span>
              </div>
              <div class="ib">
                {#if t.action === 'error'}<span class="tag error">ERROR</span>
                {:else if t.action === 'create'}<span class="tag new">NEW</span>
                {:else}<span class="tag exists">EXISTS</span>{/if}
            {#if t.sharedWith?.length}<span class="tag shared">+ {t.sharedWith.join(', ')} → same table</span>{/if}
                {#if t.sharedWith?.length}<span class="tag shared" title="Also written by: {t.sharedWith.join(', ')}">SHARED</span>{/if}
                {#if t.warnings?.length}<span class="wc" title={t.warnings.join('\n')}><TriangleAlert size={11} />{t.warnings.length}</span>{/if}
                {#if t.mapped}<span class="mapped" title="Explicit mapping">mapped</span>{/if}
              </div>
            </button>
          {:else}
            <div class="empty small">No tables match.</div>
          {/each}
        </div>
      </aside>

      <section class="detail scroll">
        {#if cur}
          {@const t = cur}
          <div class="dh">
            <h3><span class="mono">{t.source}</span> <ArrowRight size={14} /> <span class="mono">{t.schema}.{t.table}</span></h3>
            {#if t.action === 'error'}<span class="tag error">ERROR</span>
            {:else if t.action === 'create'}<span class="tag new">NEW</span>
            {:else}<span class="tag exists">EXISTS</span>{/if}
          </div>
          <div class="facts">
            <span>mode <b>{t.mode}</b></span>
            <span>before load <b>{t.truncate || 'none'}</b></span>
            <span>conflict key <b class="mono">{t.conflictKey?.length ? t.conflictKey.join(', ') : '—'}</b></span>
          </div>

          <div class="picker">
            <div class="field sch">
              <label for="sp-schema">Schema</label>
              <input id="sp-schema" class="input mono" bind:value={pickSchema} disabled={readOnly} onchange={() => cur && setTarget(cur.source, `${pickSchema}.${pickName}`)} />
            </div>
            <div class="field tbl">
              <label for="sp-table">Target table</label>
              <div class="combo">
                <input
                  id="sp-table"
                  class="input mono"
                  bind:value={pickName}
                  disabled={readOnly}
                  autocomplete="off"
                  onfocus={() => (pickOpen = true)}
                  oninput={() => (pickOpen = true)}
                  onblur={() => setTimeout(() => (pickOpen = false), 150)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      choose(pickSchema.trim() || cfgSchema, pickName.trim());
                    } else if (e.key === 'Escape' && pickOpen) {
                      e.stopPropagation();
                      pickOpen = false;
                    }
                  }}
                />
                {#if pickOpen && !readOnly}
                  <div class="dd scroll">
                    {#if pickName.trim() && !exactExists}
                      <button class="opt create" onmousedown={(e) => (e.preventDefault(), choose(pickSchema.trim() || cfgSchema, pickName.trim()))}>
                        <Plus size={12} /> Create new table: <span class="mono">{pickSchema.trim() || cfgSchema}.{pickName.trim()}</span>
                      </button>
                    {/if}
                    {#each pickMatches as m}
                      <button class="opt" onmousedown={(e) => (e.preventDefault(), choose(m.schema, m.name))}>
                        <span class="mono">{m.schema}.{m.name}</span>
                        {#if m.schema === t.schema && m.name === t.table}<Check size={12} />{/if}
                        <span class="spacer"></span>
                        <span class="tiny muted">{m.estimatedRows.toLocaleString()} rows</span>
                      </button>
                    {:else}
                      {#if !pickName.trim()}<div class="none tiny muted">No tables in the target database yet.</div>{/if}
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            {#if t.mapped && !readOnly}
              <button class="btn sm reset" onclick={() => setTarget(t.source, '')} title="Use {defaultTarget(t.source)}"><RotateCcw size={12} /> Default</button>
            {/if}
          </div>

          {#if t.error}<div class="callout err"><CircleX size={15} /> <span>{t.error}</span></div>{/if}
          {#if t.warnings?.length}
            <div class="callout warn">
              <TriangleAlert size={15} />
              <ul>{#each t.warnings as w}<li>{w}</li>{/each}</ul>
            </div>
          {/if}

          {#if t.columns?.length}
            {@const intro = introduced(t)}
            {@const tonly = targetOnly(t)}
            <div class="colhead">
              <h4>Column mapping</h4>
              <span class="sum">{summary(t.columns)}</span>
              <span class="spacer"></span>
              <span class="tiny muted">New columns are detected by running 3 sample rows through the flow</span>
              <button class="btn sm" onclick={fetchPlan} disabled={loading} title="Re-run the sample and re-plan"><RefreshCw size={12} class={loading ? 'spin' : ''} /> Refresh</button>
            </div>
            {#if incoming(t).some((c) => c.primaryKey && isIgnored(c))}
              <div class="pkwarn">
                A primary-key column is ignored: merge can't match existing rows, so re-runs insert duplicates.
              </div>
            {/if}
            {#if intro.length}
              <div class="introsum">
                <Sparkles size={12} />
                {intro.length} column{intro.length === 1 ? '' : 's'} added by transforms:
                {intro.map((c) => `${c.source} (${c.introducedBy})`).join(', ')}
              </div>
            {/if}
            <table class="cols main">
              <colgroup>
                <col style="width:34px" /><col style="width:22%" /><col style="width:26px" /><col style="width:24%" />
                <col style="width:16%" /><col style="width:17%" /><col style="width:108px" />
              </colgroup>
              <thead>
                <tr>
                  <th class="inc">
                    <input
                      type="checkbox"
                      title="Include or ignore all columns (primary keys stay included)"
                      disabled={readOnly}
                      checked={incoming(t).every((c) => !isIgnored(c))}
                      indeterminate={incoming(t).some(isIgnored) && !incoming(t).every(isIgnored)}
                      onchange={(e) => setAllIncluded(t, (e.currentTarget as HTMLInputElement).checked)}
                    />
                  </th>
                  <th>Incoming column</th><th></th><th>Target column</th><th>Incoming type</th><th>Target type</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {#each incoming(t) as c (c.source)}
                  <tr class={c.status} class:ignored={isIgnored(c)} title={c.note}>
                    <td class="inc">
                      <input
                        type="checkbox"
                        title={isIgnored(c) ? 'Ignored — not written to the target. Tick to include.' : 'Included. Untick to ignore this column.'}
                        disabled={readOnly}
                        checked={!isIgnored(c)}
                        onchange={(e) => setIncluded(t.source, c, (e.currentTarget as HTMLInputElement).checked)}
                      />
                    </td>
                    <td class="mono">
                      {#if c.primaryKey}<KeyRound size={11} class="pk" />{/if}
                      <span class:strike={c.status === 'skipped' || c.status === 'dropped'}>{c.source}</span>
                      {#if c.introducedBy}<span class="intro" title="Created by the flow step “{c.introducedBy}”">✦ added by {c.introducedBy}</span>{/if}
                    </td>
                    <td class="arrow"><ArrowRight size={12} /></td>
                    <td>
                      <div class="tcell">
                        <TargetColumnPicker value={rowTarget(c)} options={colOptions(t)} {readOnly} onpick={(to) => setColumn(t.source, c.source!, to)} />
                        {#if c.mapped}<span class="mapped" title="Explicit column mapping">mapped</span>{/if}
                        {#if c.suggest && c.suggest !== c.name && !readOnly}
                          <button class="btn sm sugg" onclick={() => setColumn(t.source, c.source!, c.suggest!)} title="An existing target column looks like the same field">
                            Map to <span class="mono">{c.suggest}</span>
                          </button>
                        {/if}
                      </div>
                    </td>
                    <td class="ty">
                      <select
                        class="select sm mono"
                        title="Convert incoming values before writing"
                        disabled={readOnly || isIgnored(c)}
                        value={entry(t.source, c.source!)?.cast ?? ''}
                        onchange={(e) => patchColumn(t.source, c.source!, { cast: e.currentTarget.value })}
                      >
                        <option value="">{c.cast ? 'as is' : (c.sourceType ?? 'as is')}</option>
                        {#each catalog.types as o}<option value={o.value}>→ {o.label}</option>{/each}
                      </select>
                      {#if c.cast}<span class="tiny muted mono">{c.sourceType}</span>{/if}
                    </td>
                    <td class="ty">
                      <input
                        class="input sm mono"
                        list="pg-types"
                        disabled={readOnly || isIgnored(c) || c.status === 'dropped'}
                        placeholder={c.targetType ?? c.sourceType ?? ''}
                        title={t.exists && c.targetType ? `Current: ${c.targetType}. Set a type to ALTER the column before loading.` : 'PostgreSQL type the column is created with'}
                        value={entry(t.source, c.source!)?.type ?? ''}
                        onchange={(e) => patchColumn(t.source, c.source!, { type: e.currentTarget.value.trim() })}
                      />
                      {#if c.status === 'retype'}<span class="tiny muted mono">was {c.targetType}</span>{/if}
                      {#if !c.nullable && c.targetType}<span class="nn">NOT NULL</span>{/if}
                    </td>
                    <td>
                      <span class="chip {c.status}" title={c.note}>{statusLabel[c.status]}</span>
                    </td>
                  </tr>
                {/each}
                {#if tonly.length}
                  <tr class="sep"><td colspan="7">Target columns not provided by the flow</td></tr>
                  {#each tonly as c (c.name)}
                    <tr class="target_only" title={c.note}>
                      <td></td>
                      <td class="muted">—</td>
                      <td class="arrow"><ArrowRight size={12} /></td>
                      <td class="mono">{#if c.primaryKey}<KeyRound size={11} class="pk" />{/if}{c.name}</td>
                      <td class="mono dim">—</td>
                      <td class="mono dim">{c.targetType ?? '—'}{#if !c.nullable}<span class="nn">NOT NULL</span>{/if}</td>
                      <td>
                        <span class="chip target_only">not provided</span>
                        {#if blocking(c)}<span class="block" title={c.note}><TriangleAlert size={11} /> NOT NULL without default — inserts will fail</span>
                        {:else if c.note}<span class="note">{c.note}</span>{/if}
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          {/if}

          <div class="colhead">
            <h4>Computed columns</h4>
            <span class="sum">extra target columns calculated from the incoming row</span>
            <span class="spacer"></span>
            {#if !readOnly}<button class="btn sm" onclick={() => addExpr(t)}><Plus size={12} /> Add expression</button>{/if}
          </div>
          {#if exprsFor(t).length}
            <table class="cols exprs">
              <colgroup>
                <col style="width:20%" /><col /><col style="width:17%" /><col style="width:15%" /><col style="width:96px" /><col style="width:44px" />
              </colgroup>
              <thead><tr><th>Target column</th><th>Expression</th><th>Target type</th><th>Applies to</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {#each exprsFor(t) as { e, i } (i)}
                  {@const pc = planOf(t, e.column)}
                  <tr>
                    <td><input class="input sm mono" placeholder="full_name" value={e.column} disabled={readOnly} onchange={(ev) => setExpr(i, { column: ev.currentTarget.value.trim() })} /></td>
                    <td class="ex"><ExprField compact nodeId={nodeId} bind:value={() => e.expr, (v) => setExpr(i, { expr: v })} /></td>
                    <td><input class="input sm mono" list="pg-types" placeholder={pc?.sourceType ?? 'inferred'} value={e.type} disabled={readOnly} onchange={(ev) => setExpr(i, { type: ev.currentTarget.value.trim() })} /></td>
                    <td>
                      <select class="select sm" value={e.table ? 'this' : 'all'} disabled={readOnly} onchange={(ev) => setExpr(i, { table: ev.currentTarget.value === 'all' ? '' : t.source })}>
                        <option value="this">{t.source} only</option>
                        <option value="all">every table</option>
                      </select>
                    </td>
                    <td>{#if pc}<span class="chip {pc.status}" title={pc.note}>{statusLabel[pc.status]}</span>{:else}<span class="tiny muted">—</span>{/if}</td>
                    <td>{#if !readOnly}<button class="btn ghost sm icon" onclick={() => removeExpr(i)} aria-label="Remove"><Trash2 size={13} /></button>{/if}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="tiny muted exhint">None. Add an expression such as <span class="mono">concat(first_name, " ", last_name)</span> to write an extra column.</p>
          {/if}

          {#if t.alter?.length}
            <div class="sqlh"><h4>Run before loading</h4></div>
            <pre class="ddl">{t.alter.join(';\n')};</pre>
          {/if}

          {#if t.action === 'create'}
            {#if t.ddl}
              <div class="sqlh">
                <button class="link" onclick={() => (showSql = !showSql)}>
                  {#if showSql}<ChevronDown size={13} />{:else}<ChevronRight size={13} />{/if} SQL
                </button>
                <span class="spacer"></span>
                <button class="btn sm" onclick={() => copyDdl(t.ddl ?? '')}><Copy size={12} /> Copy</button>
              </div>
              {#if showSql}<pre class="ddl">{t.ddl}</pre>{/if}
            {/if}
            {#if t.indexes?.length || t.foreignKeys?.length}
              <div class="after">
                {#if t.indexes?.length}
                  <div><h4>Indexes built after load</h4><ul class="mono">{#each t.indexes as i}<li>{i}</li>{/each}</ul></div>
                {/if}
                {#if t.foreignKeys?.length}
                  <div><h4>Foreign keys added after load</h4><ul class="mono">{#each t.foreignKeys as f}<li>{f}</li>{/each}</ul></div>
                {/if}
              </div>
            {/if}
          {/if}
        {/if}
      </section>
    </div>
  {/if}

  <datalist id="pg-types">{#each pgTypes as ty}<option value={ty}></option>{/each}</datalist>

  {#snippet footer()}
    {#if planError && plan}<span class="small errtxt">{planError}</span>{/if}
    <span class="muted small">
      {readOnly ? 'Read-only' : `${map.length} table mapping${map.length === 1 ? '' : 's'} · ${cmap.length} column setting${cmap.length === 1 ? '' : 's'} · ${exprs.length} computed`}
    </span>
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}>{readOnly ? 'Close' : 'Cancel'}</button>
    {#if !readOnly}
      <button class="btn primary" onclick={() => onapply({ table_map: $state.snapshot(map), column_map: $state.snapshot(cmap), expressions: validExprs() })} disabled={!dirty}>Apply</button>
    {/if}
  {/snippet}
</Modal>

<style>
  .ty > .tiny,
  .ty > .nn {
    display: block;
    margin: 2px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ty .select,
  .ty .input {
    width: 100%;
    height: 26px;
  }
  .exprs td {
    vertical-align: top;
  }
  .exprs td:last-child {
    padding: 5px 4px;
    text-overflow: clip;
    text-align: center;
  }
  .exprs .ex {
    min-width: 0;
  }
  .exhint {
    margin: 4px 0 12px;
  }
  .chip.retype {
    background: color-mix(in srgb, var(--warn) 18%, transparent);
    color: var(--warn);
  }
  .split {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: calc(min(820px, 94vh) - 124px);
    margin: -16px;
  }
  .list {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    min-height: 0;
  }
  .search {
    position: relative;
    padding: 8px;
    border-bottom: 1px solid var(--border);
  }
  .search :global(svg) {
    position: absolute;
    left: 16px;
    top: 16px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 26px;
  }
  .items {
    flex: 1;
    min-height: 0;
    padding: 4px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: none;
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item:hover {
    background: var(--bg-hover);
  }
  .item.on {
    background: var(--accent-soft);
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .il {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .src {
    font-weight: 600;
    font-size: 12px;
  }
  .dst {
    font-size: 11px;
    color: var(--text-3);
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .ib {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }
  .tag {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: 3px;
  }
  .tag.new {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .tag.exists {
    background: var(--info-soft);
    color: var(--info);
  }
  .tag.error {
    background: var(--err-soft);
    color: var(--err);
  }
  .wc {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 10.5px;
    color: var(--warn);
  }
  .mapped {
    font-size: 10px;
    color: var(--accent-text);
  }
  .detail {
    padding: 16px 18px;
    min-height: 0;
    min-width: 0;
    overflow-x: hidden;
  }
  .dh {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dh h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
  }
  .facts {
    display: flex;
    gap: 16px;
    margin: 6px 0 14px;
    font-size: 12px;
    color: var(--text-3);
  }
  .facts b {
    color: var(--text);
    font-weight: 600;
  }
  .picker {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 10px;
    margin-bottom: 12px;
    background: var(--bg-sunken);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .picker .field {
    margin: 0;
  }
  .sch {
    width: 160px;
  }
  .tbl {
    flex: 1;
  }
  .reset {
    height: 28px;
  }
  .combo {
    position: relative;
  }
  .dd {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(100% + 2px);
    z-index: 10;
    max-height: 260px;
    padding: 3px;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 8px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    color: var(--text);
    font: inherit;
    font-size: 12.5px;
    text-align: left;
    cursor: pointer;
  }
  .opt:hover {
    background: var(--accent-soft);
  }
  .opt.create {
    color: var(--ok);
    border-bottom: 1px solid var(--border);
    border-radius: 0;
  }
  .none {
    padding: 6px 8px;
  }
  .callout {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 10px;
    border-radius: var(--radius);
  }
  .callout :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .callout ul {
    margin: 0;
    padding-left: 16px;
  }
  .callout.warn {
    background: var(--warn-soft);
    color: var(--warn);
    border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent);
  }
  .callout.err {
    background: var(--err-soft);
    color: var(--err);
  }
  .colhead {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0 6px;
  }
  .colhead h4 {
    font-size: 13px;
  }
  .sum {
    font-size: 12px;
    color: var(--text-2);
  }
  .introsum {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding: 5px 9px;
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--cat-script) 10%, transparent);
    color: color-mix(in srgb, var(--cat-script) 80%, var(--text));
    font-size: 12px;
  }
  .intro {
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    font-family: var(--font);
    font-size: 10.5px;
    background: color-mix(in srgb, var(--cat-script) 12%, transparent);
    color: color-mix(in srgb, var(--cat-script) 80%, var(--text));
    white-space: nowrap;
  }
  .arrow {
    width: 1%;
    color: var(--text-3);
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .tcell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
    min-width: 0;
  }
  .tcell > :global(*:first-child) {
    flex: 1 1 120px;
    min-width: 0;
  }
  .sugg {
    height: 22px;
    white-space: nowrap;
    color: var(--accent-text);
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border-strong));
  }
  tr.sep td {
    padding: 8px 10px 4px;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-3);
    background: var(--bg-sunken);
  }
  th.inc,
  td.inc {
    width: 28px;
    text-align: center;
    padding-left: 6px;
    padding-right: 0;
  }
  tr.ignored td:not(.inc) {
    opacity: 0.5;
  }
  .tag.shared {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .pkwarn {
    margin: 0 0 8px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    color: var(--warn);
    background: var(--warn-soft);
  }
  .chip.skipped {
    text-decoration: line-through;
  }
  .cols {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 12px;
  }
  .cols th {
    text-align: left;
    padding: 6px 10px;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-3);
    background: var(--bg-sunken);
    border-bottom: 1px solid var(--border);
  }
  .cols td:first-child,
  .cols.main td:nth-child(2),
  .cols td.mono {
    white-space: nowrap;
  }
  .cols th {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cols td :global(.input),
  .cols td :global(.select) {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .cols.main td:nth-child(3) {
    padding-left: 0;
    padding-right: 0;
    text-align: center;
  }
  .cols td {
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    padding: 5px 10px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .cols tr:last-child td {
    border-bottom: none;
  }
  .cols tr.target_only td,
  .cols tr.dropped td {
    color: var(--text-3);
  }
  .cols :global(.pk) {
    color: var(--warn);
    vertical-align: -1px;
  }
  .strike {
    text-decoration: line-through;
  }
  .nn {
    margin-left: 6px;
    font-size: 9.5px;
    color: var(--text-3);
    font-family: var(--font);
  }
  .chip {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    background: var(--muted-soft);
    color: var(--text-2);
    white-space: nowrap;
  }
  .chip.add,
  .chip.create {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .chip.type_differs {
    background: var(--warn-soft);
    color: var(--warn);
    cursor: help;
  }
  .chip.dropped {
    text-decoration: line-through;
  }
  .cols td:last-child {
    white-space: normal;
  }
  .note {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-3);
  }
  .block {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: 8px;
    font-size: 11px;
    color: var(--err);
    font-weight: 500;
  }
  .sqlh {
    display: flex;
    align-items: center;
    margin: 16px 0 6px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: none;
    background: none;
    color: var(--text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .ddl {
    margin: 0;
    padding: 10px 12px;
    background: var(--bg-sunken);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-family: var(--mono);
    font-size: 12px;
    white-space: pre-wrap;
    overflow: auto;
    max-height: 260px;
  }
  .after {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 14px;
  }
  .after h4 {
    font-size: 12px;
    color: var(--text-2);
    margin-bottom: 4px;
  }
  .after ul {
    margin: 0;
    padding-left: 16px;
    font-size: 11.5px;
  }
  .errtxt {
    color: var(--err);
  }
</style>
