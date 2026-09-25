<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import {
    SvelteFlow,
    Background,
    BackgroundVariant,
    MarkerType,
    useSvelteFlow,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
    type Viewport,
  } from '@xyflow/svelte';
  import { api } from '../api/client';
  import type { Flow, Graph, GraphEdge, GraphNode, Issue, PreviewResponse, RunSummary } from '../api/types';
  import { isActive } from '../api/types';
  import { catalog } from '../stores/catalog.svelte';
  import { theme } from '../stores/theme.svelte';
  import { auth } from '../stores/auth.svelte';
  import { toast } from '../stores/toast.svelte';
  import { href } from '../router.svelte';
  import { uid, clone } from '../format';
  import { LiveRun } from '../run/live.svelte';
  import { setCanvasCtx, type Sample } from './context';
  import {
    toFlowNode,
    toFlowEdge,
    toGraph,
    graphKey,
    newNode,
    outputPorts,
    type PNode,
    type FEdge,
    type BottomTab,
  } from './model';
  import ProcessorNode from './ProcessorNode.svelte';
  import FlowEdge from './FlowEdge.svelte';
  import Palette from './Palette.svelte';
  import ConfigPanel from './ConfigPanel.svelte';
  import EdgePanel from './EdgePanel.svelte';
  import BottomPanel from './BottomPanel.svelte';
  import StatusPill from '../components/StatusPill.svelte';
  import RunControls from '../run/RunControls.svelte';
  import CanvasPalettes from './CanvasPalettes.svelte';
  import DependenciesModal from '../flows/DependenciesModal.svelte';
  import ScheduleModal from '../flows/ScheduleModal.svelte';
  import HistoryModal from '../flows/HistoryModal.svelte';
  import SinkPlanModal from './SinkPlanModal.svelte';
  import { latestRuns, waitingFor } from '../flows/status';
  import {
    ArrowLeft,
    Save,
    ShieldCheck,
    Play,
    RotateCcw,
    Undo2,
    Redo2,
    Check,
    LoaderCircle,
    CircleAlert,
    MousePointerClick,
    WifiOff,
    Eye,
    Link2,
    Clock,
    History,
    ChevronDown,
  } from 'lucide-svelte';

  let { flow }: { flow: Flow } = $props();

  // Permission gates (GET /api/meta). Denied endpoints are never called.
  let canEdit = $derived(auth.can.edit);
  let canRun = $derived(auth.can.run);
  let canData = $derived(auth.can.data);

  // svelte-ignore state_referenced_locally
  const initial: Flow = flow;
  const flowId = initial.id;
  const { screenToFlowPosition, fitView } = useSvelteFlow();

  const markerEnd = { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#98a2b3' };
  const withMarker = (e: FEdge): FEdge => ({ ...e, markerEnd });

  let nodes = $state.raw<PNode[]>((initial.graph?.nodes ?? []).map(toFlowNode));
  let edges = $state.raw<FEdge[]>((initial.graph?.edges ?? []).map((e) => withMarker(toFlowEdge(e))));
  let name = $state(initial.name);
  let dependsOn = $state<string[]>(initial.dependsOn ?? []);
  let showDeps = $state(false);
  let showSchedule = $state(false);
  let showHistory = $state(false);
  let schedule = $state<{ schedule?: string; scheduleEnabled?: boolean; lastFire?: string; nextRun?: string }>({
    schedule: initial.schedule,
    scheduleEnabled: initial.scheduleEnabled,
    lastFire: initial.lastFire,
    nextRun: initial.nextRun,
  });
  let sinkPlanFor = $state<string | null>(null);
  let runMenu = $state(false);
  const initialViewport: Viewport | undefined = initial.graph?.viewport;
  let viewport: Viewport | undefined = $state.raw(initialViewport);

  const nodeTypes = { processor: ProcessorNode } as unknown as NodeTypes;
  const edgeTypes = { flow: FlowEdge } as unknown as EdgeTypes;

  // ---------- derived graph & dirty tracking ----------

  let graph = $derived(toGraph(nodes, edges));
  let key = $derived(graphKey(graph));
  let savedKey = $state(graphKey(toGraph(untrack(() => nodes), untrack(() => edges))) + '\u0001' + initial.name);
  let dirty = $derived(key + '\u0001' + name !== savedKey);
  let saving = $state(false);
  let saveError = $state('');
  const getGraph = (): Graph => ({ ...toGraph(nodes, edges), ...(viewport ? { viewport } : {}) });

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingSave = false;

  $effect(() => {
    if (!canEdit || !dirty) return;
    void key;
    void name;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save(), 1000);
  });

  async function save(manual = false): Promise<boolean> {
    clearTimeout(saveTimer);
    if (!canEdit) return false;
    if (saving) {
      pendingSave = true;
      return false;
    }
    if (!dirty && !manual) return true;
    const g = getGraph();
    const sentKey = graphKey(g) + '\u0001' + name;
    const sentName = name.trim() || 'Untitled flow';
    saving = true;
    try {
      await api.updateFlow(flowId, { name: sentName, graph: g });
      savedKey = sentKey;
      saveError = '';
      if (manual) toast.success('Saved');
      autoValidate();
      return true;
    } catch (e) {
      saveError = (e as Error).message;
      if (manual || !saveErrorShown) toast.error(`Save failed: ${saveError}`);
      saveErrorShown = true;
      return false;
    } finally {
      saving = false;
      if (pendingSave) {
        pendingSave = false;
        if (dirty) save();
      }
    }
  }
  let saveErrorShown = false;

  // ---------- history (undo / redo) ----------

  type Snap = { key: string; nodes: GraphNode[]; edges: GraphEdge[] };
  let history = $state.raw<Snap[]>([]);
  let hIdx = $state(-1);
  let histTimer: ReturnType<typeof setTimeout> | undefined;

  function snapshot(): Snap {
    const g = toGraph(nodes, edges);
    return { key: graphKey(g), nodes: clone(g.nodes), edges: clone(g.edges) };
  }
  history = [snapshot()];
  hIdx = 0;

  $effect(() => {
    const k = key;
    if (nodes.some((n) => n.dragging)) return;
    clearTimeout(histTimer);
    histTimer = setTimeout(() => {
      untrack(() => {
        if (history[hIdx]?.key === k) return;
        const next = history.slice(0, hIdx + 1).concat(snapshot()).slice(-100);
        history = next;
        hIdx = next.length - 1;
      });
    }, 350);
  });

  function restore(s: Snap) {
    const sel = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    nodes = s.nodes.map((n) => ({ ...toFlowNode(clone(n)), selected: sel.has(n.id) }));
    edges = s.edges.map((e) => withMarker(toFlowEdge(clone(e))));
  }
  function undo() {
    clearTimeout(histTimer);
    if (history[hIdx]?.key !== key) {
      // uncommitted change: commit it first so redo can return to it
      const next = history.slice(0, hIdx + 1).concat(snapshot());
      history = next;
      hIdx = next.length - 1;
    }
    if (hIdx <= 0) return;
    hIdx--;
    restore(history[hIdx]);
  }
  function redo() {
    if (hIdx >= history.length - 1) return;
    hIdx++;
    restore(history[hIdx]);
  }

  // ---------- selection ----------

  let selNodes = $derived(nodes.filter((n) => n.selected));
  let selEdges = $derived(edges.filter((e) => e.selected));
  let selectedNode = $derived(selNodes.length === 1 ? selNodes[0] : null);
  let selectedEdge = $derived(!selectedNode && selEdges.length === 1 ? selEdges[0] : null);
  let selectedId = $derived(selectedNode?.id ?? null);

  function selectNode(id: string, focus = true) {
    nodes = nodes.map((n) => ({ ...n, selected: n.id === id }));
    edges = edges.map((e) => (e.selected ? { ...e, selected: false } : e));
    if (focus) fitView({ nodes: [{ id }], duration: 350, maxZoom: 1.1, padding: 0.6 });
  }
  /** Double-click: PostgreSQL sinks open the target-table planner, other nodes their config panel. */
  function openNode(id: string) {
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    if (!n.selected) selectNode(id, false);
    if (n.data.node.type === 'sink.postgres') openSinkPlan(id);
  }
  function openSinkPlan(id: string) {
    if (!canData) {
      toast.info('Planning target tables inspects the databases, which needs the data permission.');
      return;
    }
    sinkPlanFor = id;
  }

  function selectEdge(id: string) {
    nodes = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));
    edges = edges.map((e) => ({ ...e, selected: e.id === id }));
  }
  function clearSelection() {
    nodes = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));
    edges = edges.map((e) => (e.selected ? { ...e, selected: false } : e));
  }

  // ---------- mutations ----------

  function updateNode(id: string, patch: Partial<GraphNode>) {
    const old = nodes.find((n) => n.id === id);
    if (!old) return;
    // Snapshot: never let a Svelte state proxy reach xyflow (it structuredClones node data).
    const next: GraphNode = { ...old.data.node, ...$state.snapshot(patch) };
    nodes = nodes.map((n) => (n.id === id ? { ...n, data: { node: next } } : n));
    if (patch.config) reconcilePorts(id, old.data.node, next);
  }

  /** Keep edges attached when dynamic relationships are renamed; drop edges of removed ports. */
  function reconcilePorts(id: string, before: GraphNode, after: GraphNode) {
    const spec = catalog.byType.get(after.type);
    if (!spec?.dynamicRelationships) return;
    const a = outputPorts(spec, before.config);
    const b = outputPorts(spec, after.config);
    if (a.join('|') === b.join('|')) return;
    const rename = new Map<string, string>();
    if (a.length === b.length) a.forEach((p, i) => p !== b[i] && rename.set(p, b[i]));
    const keep = new Set(b);
    edges = edges
      .map((e) => {
        if (e.source !== id || !e.sourceHandle || !rename.has(e.sourceHandle)) return e;
        const np = rename.get(e.sourceHandle)!;
        return { ...e, sourceHandle: np, data: { edge: { ...e.data!.edge, fromPort: np } } };
      })
      .filter((e) => e.source !== id || keep.has(e.sourceHandle ?? ''));
  }

  // Tables leaving a node: its schema output for sources, its input otherwise
  // (transforms keep table names).
  async function edgeTables(nodeId: string): Promise<string[] | null> {
    try {
      const r = await api.schema(getGraph(), nodeId);
      return (r.tables ?? []).map((t) => t.table);
    } catch {
      return null;
    }
  }

  function updateEdge(id: string, patch: Partial<GraphEdge>) {
    edges = edges.map((e) => (e.id === id ? { ...e, data: { edge: { ...e.data!.edge, ...$state.snapshot(patch) } } } : e));
  }

  function deleteNode(id: string) {
    nodes = nodes.filter((n) => n.id !== id);
    edges = edges.filter((e) => e.source !== id && e.target !== id);
  }
  function deleteEdge(id: string) {
    edges = edges.filter((e) => e.id !== id);
  }

  function addNode(type: string, pos?: { x: number; y: number }) {
    const spec = catalog.byType.get(type);
    if (!spec) return;
    if (!pos) {
      const r = wrap?.getBoundingClientRect();
      pos = r ? screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 };
      pos = { x: pos.x - 165 + (nodes.length % 5) * 16, y: pos.y - 40 + (nodes.length % 5) * 16 };
    }
    const g = newNode(spec, { x: Math.round(pos.x), y: Math.round(pos.y) }, nodes.map((n) => n.data.node.name));
    nodes = [...nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), { ...toFlowNode(g), selected: true }];
    edges = edges.map((e) => (e.selected ? { ...e, selected: false } : e));
  }

  function isValidConnection(c: FEdge | Connection) {
    if (c.source === c.target) return false;
    if (c.targetHandle && c.targetHandle !== 'in') return false;
    return !edges.some((e) => e.source === c.source && e.sourceHandle === c.sourceHandle && e.target === c.target);
  }

  function onbeforeconnect(c: Connection): FEdge | false {
    if (!isValidConnection(c)) return false;
    const id = uid('e');
    const fromPort = c.sourceHandle ?? 'success';
    return withMarker(toFlowEdge({ id, from: c.source, fromPort, to: c.target }));
  }

  // ---------- drag & drop from palette ----------

  let wrap = $state<HTMLDivElement>();
  let dropHover = $state(false);

  function ondragover(e: DragEvent) {
    if (!canEdit) return;
    if (!e.dataTransfer?.types.includes('application/nifi-processor')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropHover = true;
  }
  function ondrop(e: DragEvent) {
    dropHover = false;
    if (!canEdit) return;
    const type = e.dataTransfer?.getData('application/nifi-processor');
    if (!type) return;
    e.preventDefault();
    const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addNode(type, { x: p.x - 165, y: p.y - 30 });
  }

  // ---------- validation ----------

  let issues = $state<Issue[]>([]);
  let validated = $state(false);
  let validating = $state(false);
  let issuesByNode = $derived.by(() => {
    const m = new Map<string, Issue[]>();
    for (const i of issues) if (i.nodeId) m.set(i.nodeId, [...(m.get(i.nodeId) ?? []), i]);
    return m;
  });
  let issuesByEdge = $derived.by(() => {
    const m = new Map<string, Issue[]>();
    for (const i of issues) if (i.edgeId) m.set(i.edgeId, [...(m.get(i.edgeId) ?? []), i]);
    return m;
  });
  let errorCount = $derived(issues.filter((i) => i.level === 'error').length);

  async function validate(show = true) {
    validating = true;
    try {
      issues = (await api.validate(getGraph())) ?? [];
      validated = true;
      if (show) {
        bottomTab = 'issues';
        bottomOpen = true;
        if (!issues.length) toast.success('Flow is valid');
      }
    } catch (e) {
      if (show) toast.error(e);
    } finally {
      validating = false;
    }
  }
  let validateTimer: ReturnType<typeof setTimeout> | undefined;
  function autoValidate() {
    clearTimeout(validateTimer);
    validateTimer = setTimeout(() => validate(false), 200);
  }

  // ---------- runs ----------

  const live = new LiveRun();
  let latestRun = $state<RunSummary | null>(null);
  let endedHere = $state(false);
  let histKey = $state(0);
  let starting = $state(false);
  let runStatus = $derived(live.detail?.id === latestRun?.id ? (live.detail?.status ?? latestRun?.status) : latestRun?.status);
  let runLive = $derived(live.detail?.id === latestRun?.id ? (live.detail?.live ?? latestRun?.live) : latestRun?.live);
  let canResume = $derived(runStatus === 'stopped' || runStatus === 'failed');
  let runActive = $derived(isActive(runStatus));

  live.onEnd = (s) => {
    latestRun = s;
    endedHere = true;
    histKey++;
    if (s.status === 'completed') toast.success(`Run completed · ${s.rowsWritten.toLocaleString()} rows written`);
    else if (s.status === 'failed') toast.error(`Run failed${s.error ? `: ${s.error}` : ''}`);
    else toast.info(`Run ${s.status}`);
  };

  async function loadLatest() {
    try {
      const runs = await api.flowRuns(flowId);
      if (runs?.length) {
        latestRun = runs[0];
        live.start(runs[0].id);
      }
    } catch {
      /* no runs endpoint yet — ignore */
    }
  }

  async function startRun(resume = false, withDependencies = true) {
    runMenu = false;
    if (!canRun) return;
    if (errorCount && !resume) {
      bottomTab = 'issues';
      bottomOpen = true;
    }
    starting = true;
    try {
      if (canEdit && dirty && !(await save())) return;
      const r = await api.startRun(flowId, resume, withDependencies);
      latestRun = r;
      endedHere = false;
      histKey++;
      live.start(r.id);
      bottomTab = 'run';
      bottomOpen = true;
      toast.info(
        resume ? 'Run resumed' : r.status === 'pending' ? 'Run queued — waiting for prerequisites' : withDependencies && dependsOn.length ? 'Run started (with dependencies)' : 'Run started',
      );
    } catch (e) {
      toast.error(e);
    } finally {
      starting = false;
    }
  }

  // While our run is pending, show which prerequisites it waits for (polled).
  let waitNames = $state<string[]>([]);
  $effect(() => {
    if (runStatus !== 'pending') {
      waitNames = [];
      return;
    }
    let stop = false;
    const tick = async () => {
      try {
        const [fl, act] = await Promise.all([api.flows(), api.activeRuns()]);
        if (stop) return;
        const me = fl.find((f) => f.id === flowId);
        const runsBy = latestRuns(fl, act);
        waitNames = me ? waitingFor({ ...me, dependsOn }, new Map(fl.map((f) => [f.id, f])), runsBy) : [];
      } catch {}
    };
    tick();
    const iv = setInterval(tick, 2000);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  });

  function onRunControl(s: RunSummary) {
    latestRun = s;
    live.patch(s);
    if (isActive(s.status) && live.connection !== 'open') live.start(s.id);
  }

  // Detect runs started elsewhere (host code, another tab).
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  onMount(() => {
    loadLatest();
    autoValidate();
    pollTimer = setInterval(checkActive, 8000);
    document.addEventListener('visibilitychange', checkActive);
    return () => document.removeEventListener('visibilitychange', checkActive);
  });

  async function checkActive() {
    if (live.active || document.hidden) return;
    try {
      const act = (await api.activeRuns()) ?? [];
      const mine = act.find((r) => r.flowId === flowId);
      if (mine && mine.id !== live.runId) {
        latestRun = mine;
        endedHere = false;
        live.start(mine.id);
      }
    } catch {}
  }
  onDestroy(() => {
    live.stop();
    clearInterval(pollTimer);
    clearTimeout(saveTimer);
    clearTimeout(histTimer);
    clearTimeout(validateTimer);
    clearTimeout(schemaTimer);
    // best-effort flush of unsaved changes on navigation
    if (canEdit && dirty) api.updateFlow(flowId, { name: name.trim() || 'Untitled flow', graph: getGraph() }).catch(() => {});
  });

  // ---------- sample rows (for expr/script tests) ----------

  let previewTable = '';
  const sampleCache = new Map<string, Sample>();

  // Rows arriving at nodeId, exactly as the node receives them (after every
  // upstream step, e.g. a Lookup's added columns, and per-connection table
  // routing). Falls back to a table that actually reaches the node.
  async function sampleFor(nodeId: string): Promise<Sample> {
    if (!edges.some((e) => e.target === nodeId)) return null;
    const g = getGraph();
    const ck = `${graphKey(g)}|${nodeId}|${previewTable}`;
    if (sampleCache.has(ck)) return sampleCache.get(ck)!;
    let r = await api.preview(g, nodeId, previewTable || undefined, 20);
    if (!r.input && previewTable) r = await api.preview(g, nodeId, undefined, 20);
    const s: Sample = r.input ? { columns: r.input.columns ?? [], rows: r.input.rows ?? [], table: r.input.table ?? r.table } : null;
    if (sampleCache.size > 20) sampleCache.clear();
    sampleCache.set(ck, s);
    return s;
  }

  function onpreviewresult(_id: string, r: PreviewResponse) {
    previewTable = r.table ?? '';
  }

  // ---------- input schema for the selected node ----------

  let schemaGroups = $state<{ table: string; columns: import('../api/types').Column[] }[]>([]);
  let schemaState = $state({ loading: false, error: '' });
  let schemaFor = '';
  let schemaTimer: ReturnType<typeof setTimeout> | undefined;
  let schemaCtrl: AbortController | null = null;

  /** Key over the selected node's ancestors — schema only changes when these do. */
  let upstreamKey = $derived.by(() => {
    if (!selectedId) return '';
    const seen = new Set<string>([selectedId]);
    const stack = [selectedId];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const e of edges) if (e.target === cur && !seen.has(e.source)) (seen.add(e.source), stack.push(e.source));
    }
    const ns = nodes
      .filter((n) => seen.has(n.id) && n.id !== selectedId)
      .map((n) => [n.id, n.data.node.type, n.data.node.config, n.data.node.disabled]);
    const es = edges.filter((e) => seen.has(e.target)).map((e) => [e.source, e.sourceHandle, e.target]);
    const self = nodes.find((n) => n.id === selectedId);
    const selfSrc = catalog.byType.get(self?.data.node.type ?? '')?.inputs === 0 ? self?.data.node.config : null;
    return selectedId + JSON.stringify([ns, es, selfSrc]);
  });

  async function loadSchema(id: string) {
    schemaCtrl?.abort();
    schemaCtrl = new AbortController();
    schemaState = { loading: true, error: '' };
    try {
      const r = await api.schema(getGraph(), id, schemaCtrl.signal);
      if (selectedId !== id) return;
      schemaGroups = (r.tables ?? []).map((t) => ({ table: t.table, columns: t.columns ?? [] }));
      schemaState = { loading: false, error: r.error ?? '' };
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      schemaState = { loading: false, error: (e as Error).message };
    }
  }

  $effect(() => {
    const k = upstreamKey;
    const id = selectedId;
    clearTimeout(schemaTimer);
    if (!id) {
      schemaGroups = [];
      schemaFor = '';
      return;
    }
    if (!canData) {
      schemaGroups = [];
      return;
    }
    const immediate = untrack(() => schemaFor) !== id;
    if (immediate) schemaGroups = [];
    schemaFor = id;
    schemaTimer = setTimeout(() => loadSchema(id), immediate ? 0 : 800);
    void k;
  });

  // ---------- context for nodes / edges / fields ----------

  setCanvasCtx({
    specs: () => catalog.byType,
    live,
    issues: () => issuesByNode,
    edgeIssues: () => issuesByEdge,
    showStats: () => !!live.detail && (live.active || endedHere),
    readOnly: () => !canEdit,
    opennode: (id: string) => openNode(id),
    portsOf: (nodeId: string) => {
      const n = nodes.find((x) => x.id === nodeId);
      return n ? outputPorts(catalog.byType.get(n.data.node.type), n.data.node.config) : [];
    },
    sampleFor,
  });

  // ---------- bottom panel ----------

  let bottomTab = $state<BottomTab>(untrack(() => auth.can.data) ? 'preview' : 'run');
  let bottomOpen = $state(true);
  let bottomHeight = $state(
    (() => {
      try {
        return Number(localStorage.getItem('nifi.bottomHeight')) || 300;
      } catch {
        return 300;
      }
    })(),
  );
  let previewTrigger = $state(0);
  function previewSelected() {
    if (!canData) return;
    bottomTab = 'preview';
    bottomOpen = true;
    previewTrigger++;
  }

  let names = $derived(new Map(nodes.map((n) => [n.id, n.data.node.name])));

  // ---------- keyboard ----------

  function editable(t: EventTarget | null) {
    const el = t as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable || !!el.closest?.('.cm-editor'));
  }

  function onkeydown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (canEdit) save(true);
      return;
    }
    if (!canEdit && mod && ['z', 'y'].includes(e.key.toLowerCase())) return;
    if (document.querySelector('[aria-modal="true"]')) return;
    if (mod && e.key.toLowerCase() === 'z' && !editable(e.target)) {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y' && !editable(e.target)) {
      e.preventDefault();
      redo();
      return;
    }
    if (e.key === 'Escape' && !editable(e.target)) {
      if (selectedNode || selectedEdge) clearSelection();
    }
  }

  function onbeforeunload(e: BeforeUnloadEvent) {
    if (dirty) e.preventDefault();
  }

  let saveLabel = $derived(saving ? 'Saving…' : saveError && dirty ? 'Save failed' : dirty ? 'Unsaved' : 'Saved');
</script>

<svelte:window {onkeydown} {onbeforeunload} />

{#if sinkPlanFor}
  {@const sp = nodes.find((n) => n.id === sinkPlanFor)}
  {#if sp}
    <SinkPlanModal
      node={sp.data.node}
      {getGraph}
      readOnly={!canEdit}
      onclose={() => (sinkPlanFor = null)}
      onapply={(m) => {
        if (canEdit && sinkPlanFor) updateNode(sinkPlanFor, { config: { ...sp.data.node.config, table_map: m.table_map, column_map: m.column_map, expressions: m.expressions } });
        sinkPlanFor = null;
      }}
    />
  {/if}
{/if}

{#if showHistory}
  <HistoryModal
    {flowId}
    current={getGraph()}
    readOnly={!canEdit}
    onclose={() => (showHistory = false)}
    onrestored={(f) => {
      showHistory = false;
      toast.success('Version restored — reloading the flow');
      location.reload();
    }}
  />
{/if}

{#if showSchedule}
  <ScheduleModal
    flow={{ ...initial, ...schedule }}
    readOnly={!canEdit}
    onclose={() => (showSchedule = false)}
    onsaved={(f) => {
      schedule = { schedule: f.schedule, scheduleEnabled: f.scheduleEnabled, lastFire: f.lastFire, nextRun: f.nextRun };
      showSchedule = false;
      toast.success(f.schedule ? (f.scheduleEnabled ? `Scheduled: ${f.schedule}` : 'Schedule saved (off)') : 'Schedule removed');
    }}
  />
{/if}

{#if showDeps}
  <DependenciesModal
    {flowId}
    current={dependsOn}
    readOnly={!canEdit}
    onclose={() => (showDeps = false)}
    onsaved={(d) => {
      dependsOn = d;
      showDeps = false;
      toast.success(d.length ? `Depends on ${d.length} flow${d.length === 1 ? '' : 's'}` : 'Dependencies cleared');
    }}
  />
{/if}

<div class="editor">
  <div class="toolbar">
    <a class="btn ghost icon" href={href('/flows')} title="All flows"><ArrowLeft size={16} /></a>
    <input class="fname" bind:value={name} readonly={!canEdit} size={Math.max(8, Math.min(48, name.length + 1))} aria-label="Flow name" spellcheck="false" />
    {#if !canEdit}
      <span class="badge" title="Your account can view this flow but not change it"><Eye size={11} /> Read-only</span>
    {:else}
    <span class="save {saving ? 'saving' : saveError && dirty ? 'err' : dirty ? 'dirty' : 'ok'}" title={saveError || 'Autosaves ~1s after changes · ⌘/Ctrl+S'}>
      {#if saving}<LoaderCircle size={12} class="spin" />{:else if saveError && dirty}<CircleAlert size={12} />{:else if !dirty}<Check size={12} />{/if}
      {saveLabel}
    </span>
    <div class="sep"></div>
    <button class="btn ghost icon" title="Undo (⌘Z)" onclick={undo} disabled={hIdx <= 0 && history[hIdx]?.key === key}><Undo2 size={15} /></button>
    <button class="btn ghost icon" title="Redo (⇧⌘Z)" onclick={redo} disabled={hIdx >= history.length - 1}><Redo2 size={15} /></button>
    <button class="btn ghost icon" title="Save (⌘S)" onclick={() => save(true)} disabled={saving}><Save size={15} /></button>
    {/if}
    <span class="spacer"></span>

    {#if live.connection === 'reconnecting'}<span class="badge warn"><WifiOff size={11} /> reconnecting</span>{/if}
    <button class="btn" onclick={() => (showDeps = true)} title={canEdit ? 'Flows that must complete before this one runs' : 'Prerequisite flows'}>
      <Link2 size={14} /> Depends on{#if dependsOn.length}<span class="badge accent">{dependsOn.length}</span>{/if}
    </button>
    <button class="btn ghost icon" title="History of saved edits" onclick={() => (showHistory = true)}><History size={15} /></button>
    <button
      class="btn"
      onclick={() => (showSchedule = true)}
      title={schedule.schedule ? `${schedule.scheduleEnabled ? 'Runs' : 'Paused'}: ${schedule.schedule}` : 'Run this flow automatically'}
    >
      <Clock size={14} /> Schedule{#if schedule.schedule && schedule.scheduleEnabled}<span class="badge accent mono">{schedule.schedule}</span>{:else if schedule.schedule}<span class="badge mono">off</span>{/if}
    </button>
    {#if latestRun}
      <a class="runpill" href={href(`/runs/${latestRun.id}`)} title={runStatus === 'pending' && waitNames.length ? `Waiting for: ${waitNames.join(', ')}` : 'Open latest run'}>
        <StatusPill status={runStatus} live={runLive} />
        {#if runStatus === 'pending'}
          <span class="wait ellipsis">{waitNames.length ? `Waiting for: ${waitNames.join(', ')}` : 'Queued'}</span>
        {/if}
      </a>
    {/if}
    <button class="btn" onclick={() => validate(true)} disabled={validating}>
      {#if validating}<LoaderCircle size={14} class="spin" />{:else}<ShieldCheck size={14} />{/if} Validate
      {#if validated && issues.length}<span class="badge {errorCount ? 'err' : 'warn'}">{issues.length}</span>{/if}
    </button>
    {#if !canRun}
      <!-- no run permission: status only -->
    {:else if runActive && live.detail}
      <RunControls run={live.detail} onchange={onRunControl} />
    {:else}
      {#if canResume}
        <button class="btn" onclick={() => startRun(true)} disabled={starting} title="Continue the latest run, skipping committed chunks">
          <RotateCcw size={14} /> Resume
        </button>
      {/if}
      <div class="split">
        <button
          class="btn primary"
          onclick={() => startRun(false, true)}
          disabled={starting || nodes.length === 0}
          title={dependsOn.length ? 'Runs unfinished prerequisites first, then this flow' : 'Run this flow'}
        >
          {#if starting}<LoaderCircle size={14} class="spin" />{:else}<Play size={14} />{/if} Run
        </button>
        <button class="btn primary caret" onclick={() => (runMenu = !runMenu)} disabled={starting || nodes.length === 0} aria-label="Run options" aria-haspopup="menu">
          <ChevronDown size={14} />
        </button>
        {#if runMenu}
          <button class="scrim" aria-label="Close menu" onclick={() => (runMenu = false)}></button>
          <div class="menu" role="menu">
            <button role="menuitem" onclick={() => startRun(false, true)}>
              <Play size={13} /> Run with dependencies <span class="muted tiny">{dependsOn.length ? `${dependsOn.length} prerequisite${dependsOn.length === 1 ? '' : 's'}` : 'none set'}</span>
            </button>
            <button role="menuitem" onclick={() => startRun(false, false)}><Play size={13} /> Run this flow only <span class="muted tiny">ignore prerequisites</span></button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="main">
    {#if canEdit}
      <Palette processors={catalog.processors} loaded={catalog.processorsLoaded} onadd={(t) => addNode(t)} />
    {/if}

    <div class="center">
      <div class="canvas" class:drop={dropHover} bind:this={wrap} {ondragover} ondragleave={() => (dropHover = false)} {ondrop} role="application">
        <SvelteFlow
          bind:nodes
          bind:edges
          {nodeTypes}
          {edgeTypes}
          colorMode={theme.resolved}
          {initialViewport}
          fitView={!initialViewport && nodes.length > 0}
          fitViewOptions={{ maxZoom: 1.1, padding: 0.25 }}
          minZoom={0.1}
          maxZoom={2}
          snapGrid={[8, 8]}
          deleteKey={canEdit ? ['Delete', 'Backspace'] : null}
          nodesDraggable={canEdit}
          zoomOnDoubleClick={false}
          nodesConnectable={canEdit}
          {isValidConnection}
          {onbeforeconnect}
          onmoveend={(_e, vp) => (viewport = vp)}
          onpaneclick={() => clearSelection()}
          oninit={() => !initialViewport && nodes.length && setTimeout(() => fitView({ maxZoom: 1.1, padding: 0.2 }), 50)}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={14} size={1} />
          <CanvasPalettes
            node={selectedNode?.data.node ?? null}
            edge={selectedEdge?.data?.edge ?? null}
            readOnly={!canEdit}
            onconfigure={() => {
              if (selectedNode) openNode(selectedNode.id);
              else if (selectedEdge) selectEdge(selectedEdge.id);
            }}
            ontoggle={() => selectedNode && updateNode(selectedNode.id, { disabled: !selectedNode.data.node.disabled })}
            ondelete={() => {
              if (selectedNode) deleteNode(selectedNode.id);
              else if (selectedEdge) deleteEdge(selectedEdge.id);
            }}
          />
        </SvelteFlow>
        {#if nodes.length === 0}
          <div class="blank">
            <MousePointerClick size={28} />
            <h3>{canEdit ? 'Start your flow' : 'Empty flow'}</h3>
            {#if canEdit}
              <p>Drag a <strong>Source</strong> from the palette onto the canvas, then add transforms and a <strong>Sink</strong>. Connect an output port (right) to the next node's input (left).</p>
            {:else}
              <p>This flow is empty.</p>
            {/if}
          </div>
        {/if}
      </div>
      <BottomPanel
        bind:tab={bottomTab}
        bind:open={bottomOpen}
        bind:height={bottomHeight}
        {live}
        {flowId}
        nodeId={selectedNode?.id ?? null}
        nodeName={selectedNode?.data.node.name}
        {getGraph}
        {previewTrigger}
        {issues}
        {validated}
        {histKey}
        {names}
        onselectnode={(id) => selectNode(id)}
        onselectedge={(id) => selectEdge(id)}
        {onpreviewresult}
        {canData}
      />
    </div>

    {#if selectedNode}
      {#key selectedNode.id}
        <ConfigPanel
          node={selectedNode.data.node}
          spec={catalog.byType.get(selectedNode.data.node.type)}
          issues={issuesByNode.get(selectedNode.id) ?? []}
          groups={schemaGroups}
          {schemaState}
          onchange={(p) => selectedNode && updateNode(selectedNode.id, p)}
          onclose={() => clearSelection()}
          ondelete={() => selectedNode && deleteNode(selectedNode.id)}
          onpreview={previewSelected}
          onreloadschema={() => selectedId && canData && loadSchema(selectedId)}
          readOnly={!canEdit}
          {canData}
          onmapping={selectedNode.data.node.type === 'sink.postgres' ? () => selectedNode && openSinkPlan(selectedNode.id) : undefined}
        />
      {/key}
    {:else if selectedEdge}
      <EdgePanel
        edge={selectedEdge.data!.edge}
        fromName={names.get(selectedEdge.source) ?? selectedEdge.source}
        toName={names.get(selectedEdge.target) ?? selectedEdge.target}
        stats={live.edgeStats.get(selectedEdge.id)}
        issues={issuesByEdge.get(selectedEdge.id) ?? []}
        onchange={(p) => selectedEdge && updateEdge(selectedEdge.id, p)}
        onclose={() => clearSelection()}
        ondelete={() => selectedEdge && deleteEdge(selectedEdge.id)}
        readOnly={!canEdit}
        loadTables={canData ? () => edgeTables(selectedEdge!.source) : undefined}
        siblings={edges
          .filter((e) => selectedEdge && e.id !== selectedEdge.id && e.source === selectedEdge.source && (e.sourceHandle ?? 'success') === (selectedEdge.sourceHandle ?? 'success'))
          .map((e) => ({ toName: names.get(e.target) ?? e.target, tables: e.data?.edge.tables }))}
      />
    {/if}
  </div>
</div>

<style>
  .editor {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
  }
  .toolbar {
    flex: none;
    height: 44px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px 0 6px;
    background: var(--bg-elev);
    border-bottom: 1px solid var(--border);
  }
  .fname {
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius);
    padding: 3px 6px;
    min-width: 0;
    max-width: 420px;
  }
  .fname:hover {
    border-color: var(--border);
  }
  .fname:focus {
    outline: none;
    border-color: var(--accent);
    background: var(--bg-elev);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .save {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-3);
    white-space: nowrap;
  }
  .save.ok {
    color: var(--ok);
  }
  .save.dirty {
    color: var(--warn);
  }
  .save.err {
    color: var(--err);
  }
  .sep {
    width: 1px;
    height: 20px;
    background: var(--border);
    margin: 0 4px;
  }
  .runpill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 360px;
    text-decoration: none;
  }
  .wait {
    font-size: 12px;
    color: var(--warn);
    min-width: 0;
  }
  .split {
    position: relative;
    display: inline-flex;
  }
  .split > .btn:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .split .caret {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid color-mix(in srgb, #fff 35%, var(--accent));
    padding: 0 6px;
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: transparent;
    border: none;
  }
  .menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 41;
    min-width: 270px;
    padding: 4px;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    color: var(--text);
    font: inherit;
    cursor: pointer;
    text-align: left;
  }
  .menu button:hover {
    background: var(--bg-hover);
  }
  .menu .tiny {
    margin-left: auto;
  }
  .main {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .center {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .canvas {
    position: relative;
    flex: 1;
    min-height: 120px;
  }
  .canvas.drop::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 2px dashed var(--accent);
    border-radius: var(--radius-lg);
    pointer-events: none;
  }
  .blank {
    position: absolute;
    left: 50%;
    top: 45%;
    transform: translate(-50%, -50%);
    max-width: 380px;
    text-align: center;
    color: var(--text-3);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .blank h3 {
    color: var(--text);
    font-size: 15px;
  }
  .blank p {
    margin: 0;
  }
</style>
