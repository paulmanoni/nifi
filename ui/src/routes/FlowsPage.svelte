<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import { api, ApiError } from '../lib/api/client';
  import type { Flow, RunAllResult, RunSummary } from '../lib/api/types';
  import { isActive } from '../lib/api/types';
  import { href, navigate } from '../lib/router.svelte';
  import { toast, toasts } from '../lib/stores/toast.svelte';
  import { confirm } from '../lib/stores/confirm.svelte';
  import { auth } from '../lib/stores/auth.svelte';
  import { fmtCompact, fmtNum, fmtRelative } from '../lib/format';
  import { latestRuns, waitingFor } from '../lib/flows/status';
  import Skeleton from '../lib/components/Skeleton.svelte';
  import Modal from '../lib/components/Modal.svelte';
  import MigrationWizard from '../lib/wizard/MigrationWizard.svelte';
  import FlowRunCell from '../lib/flows/FlowRunCell.svelte';
  import DepGraph from '../lib/flows/DepGraph.svelte';
  import {
    Plus,
    Copy,
    Trash2,
    DatabaseZap,
    Workflow,
    Search,
    History,
    Play,
    Square,
    ChevronDown,
    RotateCcw,
    Table2,
    Network,
    LoaderCircle,
    Link2,
    LayoutGrid,
    Clock,
    FolderTree,
    Folder,
    FolderOpen,
  } from 'lucide-svelte';

  let flows = $state<Flow[] | null>(null);
  let active = $state<RunSummary[]>([]);
  let estimates = $state<Record<string, number>>({});
  let q = $state('');
  let selected = $state(new Set<string>());
  let showNew = $state(false);
  let showWizard = $state(false);
  let newName = $state('');
  let newDesc = $state('');
  let creating = $state(false);
  let runMenu = $state(false);
  let busy = $state<'' | 'all' | 'selected' | 'stop'>('');

  const VIEW_KEY = 'nifi.flowsView';
  type View = 'cards' | 'table' | 'graph';
  let view = $state<View>(
    (() => {
      try {
        const v = localStorage.getItem(VIEW_KEY);
        return v === 'graph' || v === 'table' ? v : 'cards';
      } catch {
        return 'cards';
      }
    })(),
  );
  const SORT_KEY = 'nifi.flowsSort';
  let sort = $state<'updated' | 'name' | 'status'>(
    (() => {
      try {
        const v = localStorage.getItem(SORT_KEY);
        return v === 'name' || v === 'status' ? v : 'updated';
      } catch {
        return 'updated';
      }
    })(),
  );
  $effect(() => {
    try {
      localStorage.setItem(SORT_KEY, sort);
    } catch {}
  });
  const statusRank: Record<string, number> = { running: 0, paused: 1, stopping: 1, pending: 2, failed: 3, stopped: 4, completed: 5 };
  function setView(v: View) {
    view = v;
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  }

  // ---------- polling: 2s while anything is active, 15s otherwise ----------
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  async function poll() {
    clearTimeout(timer);
    try {
      const [f, a] = await Promise.all([api.flows(), api.activeRuns()]);
      flows = f ?? [];
      active = a ?? [];
      // Estimated totals for the progress bars of running runs (one detail fetch per run).
      for (const r of active) {
        if (r.status === 'pending' || estimates[r.id]) continue;
        api
          .run(r.id)
          .then((d) => {
            const est = (d.tables ?? []).reduce((s, t) => s + (t.estimatedRows || 0), 0);
            if (est) estimates[r.id] = est;
          })
          .catch(() => {});
      }
    } catch (e) {
      toast.error(e);
      flows ??= [];
    }
    if (!destroyed) timer = setTimeout(poll, active.some((r) => isActive(r.status)) ? 2000 : 15000);
  }
  poll();
  onDestroy(() => {
    destroyed = true;
    clearTimeout(timer);
  });

  let runs = $derived(latestRuns(flows ?? [], active));
  let byId = $derived(new Map((flows ?? []).map((f) => [f.id, f])));
  let anyActive = $derived(active.some((r) => isActive(r.status)));
  let running = $derived(active.filter((r) => r.status === 'running').length);
  let pending = $derived(active.filter((r) => r.status === 'pending').length);

  let filtered = $derived(
    (flows ?? [])
      .filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.description?.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'status') {
          const ra = statusRank[runs.get(a.id)?.status ?? ''] ?? 6;
          const rb = statusRank[runs.get(b.id)?.status ?? ''] ?? 6;
          return ra - rb || a.name.localeCompare(b.name);
        }
        return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }),
  );
  let allShownSelected = $derived(filtered.length > 0 && filtered.every((f) => selected.has(f.id)));

  // ---------- folders ----------
  const FOLD_KEY = 'nifi.flowsFolded';
  let folded = $state(new Set<string>((() => { try { return JSON.parse(localStorage.getItem(FOLD_KEY) ?? '[]'); } catch { return []; } })()));
  let folderFilter = $state('');
  let moving = $state(false);
  let folders = $derived([...new Set((flows ?? []).map((f) => f.folder ?? '').filter(Boolean))].sort());
  let grouped = $derived.by(() => {
    const by = new Map<string, Flow[]>();
    for (const f of filtered) {
      if (folderFilter && (f.folder ?? '') !== folderFilter) continue;
      const k = f.folder ?? '';
      (by.get(k) ?? by.set(k, []).get(k)!).push(f);
    }
    return [...by.entries()].sort((a, b) => (a[0] === '' ? 1 : b[0] === '' ? -1 : a[0].localeCompare(b[0])));
  });
  function toggleFold(name: string) {
    const s = new Set(folded);
    s.has(name) ? s.delete(name) : s.add(name);
    folded = s;
    try {
      localStorage.setItem(FOLD_KEY, JSON.stringify([...s]));
    } catch {}
  }
  function selectFolder(items: Flow[], on: boolean) {
    const s = new Set(selected);
    for (const f of items) (on ? s.add(f.id) : s.delete(f.id));
    selected = s;
  }
  async function moveSelected() {
    if (!selected.size) return;
    const to = prompt(`Move ${selected.size} flow${selected.size === 1 ? '' : 's'} to which folder?\nLeave empty to ungroup. Use "/" to nest, e.g. migrations/shortlisting.`,
      (flows ?? []).find((f) => selected.has(f.id))?.folder ?? '');
    if (to === null) return;
    moving = true;
    try {
      await api.setFolder([...selected], to.trim());
      selected = new Set();
      await poll();
      toast.success(to.trim() ? `Moved to ${to.trim()}` : 'Ungrouped');
    } catch (e) {
      toast.error(e);
    } finally {
      moving = false;
    }
  }

  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    selected = s;
  }
  function toggleAll() {
    selected = allShownSelected ? new Set() : new Set(filtered.map((f) => f.id));
  }

  // ---------- orchestration ----------

  function summarize(r: RunAllResult) {
    const started = r.started?.length ?? 0;
    const skipped = r.skipped ?? [];
    const msg = `Started ${started}${skipped.length ? ` · skipped ${skipped.length}` : ''}`;
    toasts.push(
      skipped.length ? (started ? 'warn' : 'error') : 'success',
      msg,
      skipped.length ? 12000 : 4000,
      skipped.length ? { title: `${skipped.length} skipped`, lines: skipped.map((s) => `${s.name}: ${s.reason}`) } : undefined,
    );
  }

  async function runAll(resume = false) {
    runMenu = false;
    busy = 'all';
    try {
      summarize(await api.runAll([], resume));
      poll();
    } catch (e) {
      toast.error(e);
    } finally {
      busy = '';
    }
  }

  async function runSelected() {
    if (!selected.size) return;
    busy = 'selected';
    try {
      summarize(await api.runAll([...selected], false));
      selected = new Set();
      poll();
    } catch (e) {
      toast.error(e);
    } finally {
      busy = '';
    }
  }

  let starting = $state<string | null>(null);
  async function runOne(f: Flow) {
    starting = f.id;
    try {
      summarize(await api.runAll([f.id], false));
      poll();
    } catch (e) {
      toast.error(e);
    } finally {
      starting = null;
    }
  }

  async function stopAll() {
    const ok = await confirm({
      title: 'Stop all runs',
      message: `Stop every running, paused and pending run (${active.length})? Committed chunks are kept; stopped runs can be resumed.`,
      confirmLabel: 'Stop all',
      danger: true,
    });
    if (!ok) return;
    busy = 'stop';
    try {
      const r = await api.stopAll([]);
      toast.info(`Stopped ${r.stopped?.length ?? 0} run${r.stopped?.length === 1 ? '' : 's'}`);
      poll();
    } catch (e) {
      toast.error(e);
    } finally {
      busy = '';
    }
  }

  // ---------- flow CRUD ----------

  async function create() {
    if (!newName.trim()) return;
    creating = true;
    try {
      const f = await api.createFlow({ name: newName.trim(), description: newDesc.trim(), graph: { nodes: [], edges: [] } });
      navigate(`/flows/${f.id}`);
    } catch (e) {
      toast.error(e);
    } finally {
      creating = false;
    }
  }

  async function dup(f: Flow) {
    try {
      const d = await api.duplicateFlow(f.id);
      toast.success(`Duplicated as “${d.name}”`);
      poll();
    } catch (e) {
      toast.error(e);
    }
  }

  async function remove(f: Flow) {
    const dependents = (flows ?? []).filter((x) => x.dependsOn?.includes(f.id));
    if (dependents.length) {
      const who = dependents.map((d) => `“${d.name}”`).join(', ');
      toasts.push('error', `Can't delete “${f.name}”: ${who} ${dependents.length === 1 ? 'depends' : 'depend'} on it. Remove the dependency first.`, 9000);
      return;
    }
    const ok = await confirm({
      title: 'Delete flow',
      message: `Delete “${f.name}”? Its run history, bulletins and dead letters are removed too. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteFlow(f.id);
      flows = (flows ?? []).filter((x) => x.id !== f.id);
      toast.success('Flow deleted');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) toasts.push('error', `Can't delete “${f.name}”: ${e.message}`, 9000);
      else toast.error(e);
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (runMenu = false)} />

<div class="page" class:wide={view === 'graph'}>
  <div class="page-head">
    <h1>Flows</h1>
    <span class="badge">{flows?.length ?? 0}</span>
    {#if anyActive}
      <span class="badge accent"><LoaderCircle size={11} class="spin" /> {running} running{pending ? ` · ${pending} pending` : ''}</span>
    {/if}
    {#if auth.meta?.maxParallelRuns}<span class="badge" title="Runs beyond this wait as pending">max {auth.meta.maxParallelRuns} in parallel</span>{/if}
    <span class="spacer"></span>
    <div class="seg" role="tablist" aria-label="View">
      <button role="tab" aria-selected={view === 'cards'} class:on={view === 'cards'} onclick={() => setView('cards')}><LayoutGrid size={13} /> Cards</button>
      <button role="tab" aria-selected={view === 'table'} class:on={view === 'table'} onclick={() => setView('table')}><Table2 size={13} /> Table</button>
      <button role="tab" aria-selected={view === 'graph'} class:on={view === 'graph'} onclick={() => setView('graph')}><Network size={13} /> Graph</button>
    </div>
    {#if view !== 'graph'}
      <div class="search">
        <Search size={14} />
        <input class="input" placeholder="Filter flows…" bind:value={q} />
      </div>
      {#if folders.length}
        <select class="select sortsel" bind:value={folderFilter} aria-label="Filter by folder">
          <option value="">All folders</option>
          {#each folders as f}<option value={f}>{f}</option>{/each}
        </select>
      {/if}
      <select class="select sortsel" bind:value={sort} aria-label="Sort flows">
        <option value="updated">Recently updated</option>
        <option value="name">Name</option>
        <option value="status">Run status</option>
      </select>
    {/if}
    {#if auth.can.edit}
      <button class="btn" onclick={() => (showWizard = true)}><DatabaseZap size={14} /> Migrate a database</button>
      <button class="btn" onclick={() => ((newName = ''), (newDesc = ''), (showNew = true))}><Plus size={14} /> New flow</button>
    {/if}
  </div>

  {#if auth.can.run && flows?.length}
    <div class="orch">
      <div class="split">
        <button class="btn primary" onclick={() => runAll(false)} disabled={!!busy} title="Start every flow in dependency order">
          {#if busy === 'all'}<LoaderCircle size={14} class="spin" />{:else}<Play size={14} />{/if} Run all
        </button>
        <button class="btn primary caret" onclick={() => (runMenu = !runMenu)} disabled={!!busy} aria-label="More run options" aria-haspopup="menu"><ChevronDown size={14} /></button>
        {#if runMenu}
          <button class="scrim" aria-label="Close menu" onclick={() => (runMenu = false)}></button>
          <div class="menu" role="menu">
            <button role="menuitem" onclick={() => runAll(false)}><Play size={13} /> Run all <span class="muted tiny">fresh runs</span></button>
            <button role="menuitem" onclick={() => runAll(true)}><RotateCcw size={13} /> Resume unfinished <span class="muted tiny">skip committed chunks</span></button>
          </div>
        {/if}
      </div>
      <button class="btn" onclick={runSelected} disabled={!selected.size || !!busy} title={view === 'graph' ? 'Select flows in the cards or table view' : ''}>
        {#if busy === 'selected'}<LoaderCircle size={14} class="spin" />{:else}<Play size={14} />{/if} Run selected{selected.size ? ` (${selected.size})` : ''}
      </button>
      {#if auth.can.edit}
        <button class="btn" onclick={moveSelected} disabled={!selected.size || moving} title="Put the selected flows in a folder">
          <FolderTree size={14} /> Move to folder
        </button>
      {/if}
      <button class="btn danger" onclick={stopAll} disabled={!anyActive || !!busy}>
        {#if busy === 'stop'}<LoaderCircle size={14} class="spin" />{:else}<Square size={13} />{/if} Stop all
      </button>
      <span class="spacer"></span>
      <span class="muted small">Runs start in dependency order; dependents wait until their prerequisites complete.</span>
    </div>
  {/if}

  <div class:card={view !== 'cards' || !flows?.length} class:graphcard={view === 'graph'}>
    {#if flows === null}
      <Skeleton rows={6} />
    {:else if flows.length === 0}
      <div class="empty">
        <Workflow size={32} />
        <h3>No flows yet</h3>
        {#if auth.can.edit}
          <p>Draw a flow from scratch, or let the wizard build a whole-database migration for you.</p>
          <div class="row">
            <button class="btn" onclick={() => (showWizard = true)}><DatabaseZap size={14} /> Migrate a database</button>
            <button class="btn primary" onclick={() => (showNew = true)}><Plus size={14} /> New flow</button>
          </div>
        {:else}
          <p>Nobody has created a flow yet, and your account can't create one.</p>
        {/if}
      </div>
    {:else if view === 'graph'}
      <SvelteFlowProvider>
        <DepGraph {flows} {runs} />
      </SvelteFlowProvider>
      <div class="legend tiny">
        <span><i class="l never"></i>never run</span>
        <span><i class="l pending"></i>pending</span>
        <span><i class="l running"></i>running</span>
        <span><i class="l completed"></i>completed</span>
        <span><i class="l failed"></i>failed</span>
        <span><i class="l stopped"></i>stopped</span>
        <span class="muted">arrows point from prerequisite → dependent · click a flow to open it</span>
      </div>
    {:else if view === 'cards'}
      {#if auth.can.run && filtered.length}
        <label class="selall small muted">
          <input type="checkbox" checked={allShownSelected} indeterminate={!allShownSelected && selected.size > 0} onchange={toggleAll} />
          Select all {filtered.length}{q ? ' shown' : ''}
        </label>
      {/if}
      {#each grouped as [name, items] (name)}
        {#if grouped.length > 1 || name}
          <button class="fhead" onclick={() => toggleFold(name)}>
            {#if folded.has(name)}<Folder size={14} />{:else}<FolderOpen size={14} />{/if}
            <b>{name || 'Ungrouped'}</b>
            <span class="badge">{items.length}</span>
            {#if auth.can.run && !folded.has(name)}
              <span
                class="pick tiny"
                role="button"
                tabindex="0"
                onclick={(e) => (e.stopPropagation(), selectFolder(items, !items.every((f) => selected.has(f.id))))}
                onkeydown={(e) => e.key === 'Enter' && (e.stopPropagation(), selectFolder(items, true))}
              >
                {items.every((f) => selected.has(f.id)) ? 'deselect all' : 'select all'}
              </span>
            {/if}
          </button>
        {/if}
        {#if !folded.has(name)}
      <div class="grid">
        {#each items as f (f.id)}
          {@const run = runs.get(f.id)}
          {@const deps = f.dependsOn ?? []}
          <div
            class="fcard {run?.status ?? 'never'}"
            class:sel={selected.has(f.id)}
            role="link"
            tabindex="0"
            onclick={() => navigate(`/flows/${f.id}`)}
            onkeydown={(e) => e.key === 'Enter' && navigate(`/flows/${f.id}`)}
          >
            <div class="fh">
              {#if auth.can.run}
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onclick={(e) => e.stopPropagation()}
                  onchange={() => toggle(f.id)}
                  aria-label="Select {f.name}"
                />
              {/if}
              <a class="fname ellipsis" href={href(`/flows/${f.id}`)} onclick={(e) => e.stopPropagation()} title={f.name}>{f.name}</a>
              <span class="spacer"></span>
              <div class="row actions hov">
                {#if run}
                  <a class="btn ghost sm icon" title="Latest run" href={href(`/runs/${run.id}`)} onclick={(e) => e.stopPropagation()}><History size={14} /></a>
                {/if}
                {#if auth.can.edit}
                  <button class="btn ghost sm icon" title="Duplicate" onclick={(e) => (e.stopPropagation(), dup(f))}><Copy size={14} /></button>
                  <button class="btn ghost sm icon danger" title="Delete" onclick={(e) => (e.stopPropagation(), remove(f))}><Trash2 size={14} /></button>
                {/if}
              </div>
              {#if auth.can.run}
                <button
                  class="btn ghost sm icon"
                  title="Run this flow (waits for its prerequisites)"
                  disabled={starting === f.id || (!!run && isActive(run.status))}
                  onclick={(e) => (e.stopPropagation(), runOne(f))}
                >
                  {#if starting === f.id}<LoaderCircle size={14} class="spin" />{:else}<Play size={14} />{/if}
                </button>
              {/if}
            </div>
            {#if f.description}<p class="fdesc" title={f.description}>{f.description}</p>{/if}
            <div class="frun"><FlowRunCell {run} waiting={waitingFor(f, byId, runs)} estimated={run ? (estimates[run.id] ?? 0) : 0} /></div>
            <div class="fstats">
              <div><span class="k">Written</span><b class="num" title={fmtNum(run?.rowsWritten)}>{run ? fmtCompact(run.rowsWritten) : '—'}</b></div>
              <div><span class="k">Failed</span><b class="num" class:errtxt={!!run?.rowsFailed}>{run ? fmtCompact(run.rowsFailed) : '—'}</b></div>
              <div><span class="k">Updated</span><b title={f.updatedAt}>{fmtRelative(f.updatedAt)}</b></div>
            </div>
            {#if f.schedule}
              <div class="fsched" class:off={!f.scheduleEnabled} title={f.scheduleEnabled ? `Runs on ${f.schedule}${f.nextRun ? ` · next ${new Date(f.nextRun).toLocaleString()}` : ''}` : `Schedule off: ${f.schedule}`}>
                <Clock size={11} />
                <span class="mono">{f.schedule}</span>
                {#if f.scheduleEnabled && f.nextRun}<span class="muted">· next {fmtRelative(f.nextRun)}</span>{:else if !f.scheduleEnabled}<span class="muted">· off</span>{/if}
              </div>
            {/if}
            <div class="fdeps">
              {#if deps.length}
                <span class="k">Depends on</span>
                {#each deps.slice(0, 4) as d}
                  {@const dep = byId.get(d)}
                  {@const ds = runs.get(d)?.status}
                  <a class="chip {ds ?? ''}" href={href(`/flows/${d}`)} onclick={(e) => e.stopPropagation()} title={dep ? `${dep.name} — ${ds ?? 'never run'}` : d}>
                    <Link2 size={10} />{dep?.name ?? d}
                  </a>
                {/each}
                {#if deps.length > 4}<span class="chip more" title={deps.slice(4).map((d) => byId.get(d)?.name ?? d).join(', ')}>+{deps.length - 4}</span>{/if}
              {:else}
                <span class="k">No dependencies</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
        {/if}
      {:else}
        <div class="card nomatch muted">No flows match “{q}”.</div>
      {/each}
    {:else}
      <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            {#if auth.can.run}
              <th class="ck"><input type="checkbox" checked={allShownSelected} indeterminate={!allShownSelected && selected.size > 0} onchange={toggleAll} aria-label="Select all" /></th>
            {/if}
            <th>Name</th>
            <th>Folder</th>
            <th>Schedule</th>
            <th>Depends on</th>
            <th>Latest run</th>
            <th class="right">Written</th>
            <th class="right">Failed</th>
            <th>Updated</th>
            <th style="width:1%"></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as f (f.id)}
            {@const run = runs.get(f.id)}
            <tr class="clickable" class:sel={selected.has(f.id)} onclick={() => navigate(`/flows/${f.id}`)}>
              {#if auth.can.run}
                <td class="ck" onclick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(f.id)} onchange={() => toggle(f.id)} aria-label="Select {f.name}" />
                </td>
              {/if}
              <td class="namecell">
                <a class="fname" href={href(`/flows/${f.id}`)} onclick={(e) => e.stopPropagation()}>{f.name}</a>
                {#if f.description}<div class="muted small ellipsis desc">{f.description}</div>{/if}
              </td>
              <td class="muted">{f.folder || '—'}</td>
              <td class="schedcell">
                {#if f.schedule}
                  <span class="sched" class:off={!f.scheduleEnabled} title={f.nextRun ? `Next ${new Date(f.nextRun).toLocaleString()}` : ''}>
                    <Clock size={11} /><span class="mono">{f.schedule}</span>
                  </span>
                  {#if f.scheduleEnabled && f.nextRun}<div class="muted tiny">next {fmtRelative(f.nextRun)}</div>{:else if !f.scheduleEnabled}<div class="muted tiny">off</div>{/if}
                {:else}
                  <span class="muted">—</span>
                {/if}
              </td>
              <td>
                {#if f.dependsOn?.length}
                  <div class="chips">
                    {#each f.dependsOn as d}
                      {@const dep = byId.get(d)}
                      {@const ds = runs.get(d)?.status}
                      <a class="chip {ds ?? ''}" href={href(`/flows/${d}`)} onclick={(e) => e.stopPropagation()} title={dep ? `${dep.name} — ${ds ?? 'never run'}` : d}>
                        <Link2 size={10} />{dep?.name ?? d}
                      </a>
                    {/each}
                  </div>
                {:else}
                  <span class="muted">—</span>
                {/if}
              </td>
              <td><FlowRunCell {run} waiting={waitingFor(f, byId, runs)} estimated={run ? (estimates[run.id] ?? 0) : 0} /></td>
              <td class="right num" title={fmtNum(run?.rowsWritten)}>{run ? fmtCompact(run.rowsWritten) : '—'}</td>
              <td class="right num" class:errtxt={!!run?.rowsFailed}>{run ? fmtCompact(run.rowsFailed) : '—'}</td>
              <td class="muted" title={f.updatedAt}>{fmtRelative(f.updatedAt)}</td>
              <td>
                <div class="row actions">
                  {#if run}
                    <a class="btn ghost sm icon" title="Latest run" href={href(`/runs/${run.id}`)} onclick={(e) => e.stopPropagation()}><History size={14} /></a>
                  {/if}
                  {#if auth.can.edit}
                    <button class="btn ghost sm icon" title="Duplicate" onclick={(e) => (e.stopPropagation(), dup(f))}><Copy size={14} /></button>
                    <button class="btn ghost sm icon danger" title="Delete" onclick={(e) => (e.stopPropagation(), remove(f))}><Trash2 size={14} /></button>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr><td colspan="10" class="muted" style="text-align:center;padding:24px">No flows match “{q}”.</td></tr>
          {/each}
        </tbody>
      </table>
      </div>
    {/if}
  </div>
</div>

{#if showNew && auth.can.edit}
  <Modal title="New flow" width="440px" onclose={() => (showNew = false)}>
    <form id="newflow" onsubmit={(e) => (e.preventDefault(), create())}>
      <div class="field">
        <label for="nf-name">Name <span class="req">*</span></label>
        <!-- svelte-ignore a11y_autofocus -->
        <input id="nf-name" class="input" bind:value={newName} autofocus placeholder="e.g. Orders MySQL → Postgres" />
      </div>
      <div class="field">
        <label for="nf-desc">Description</label>
        <textarea id="nf-desc" class="textarea" bind:value={newDesc} rows="3"></textarea>
      </div>
    </form>
    {#snippet footer()}
      <span class="spacer"></span>
      <button class="btn" onclick={() => (showNew = false)}>Cancel</button>
      <button class="btn primary" form="newflow" type="submit" disabled={!newName.trim() || creating}>Create</button>
    {/snippet}
  </Modal>
{/if}

{#if showWizard && auth.can.edit}
  <MigrationWizard onclose={() => (showWizard = false)} />
{/if}

<style>
  .fhead {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin: 10px 2px 6px;
    padding: 0;
    border: none;
    background: none;
    color: var(--text);
    font: inherit;
    cursor: pointer;
    text-align: left;
  }
  .fhead:first-child {
    margin-top: 0;
  }
  .fhead b {
    font-size: 13px;
  }
  .pick {
    margin-left: auto;
    color: var(--text-3);
    text-decoration: underline;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 12px;
  }
  .selall {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px 2px;
    cursor: pointer;
  }
  .selall input,
  .fh input {
    accent-color: var(--accent);
  }
  .sortsel {
    width: auto;
    height: 28px;
  }
  .fcard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 12px 12px 10px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-left: 3px solid var(--border-strong);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  .fcard:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.06));
  }
  .fcard:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .fcard.sel {
    background: color-mix(in srgb, var(--accent-soft) 55%, var(--bg-elev));
  }
  .fcard.running,
  .fcard.paused,
  .fcard.stopping {
    border-left-color: var(--accent);
  }
  .fcard.pending {
    border-left-color: var(--warn);
  }
  .fcard.completed {
    border-left-color: var(--ok);
  }
  .fcard.failed {
    border-left-color: var(--err);
  }
  .fcard.stopped {
    border-left-color: var(--text-2);
  }
  .fh {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .fdesc {
    margin: 0;
    color: var(--text-2);
    font-size: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .frun {
    min-height: 22px;
  }
  .fstats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 6px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .fstats div {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .fstats b {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fsched {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--accent-text);
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fsched.off {
    color: var(--text-3);
  }
  .fdeps {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-height: 20px;
  }
  .fdeps .k,
  .fstats .k {
    font-size: 10.5px;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .fdeps .k {
    margin-right: 2px;
  }
  .hov {
    gap: 0;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .fcard:hover .hov,
  .fcard:focus-within .hov {
    opacity: 1;
  }
  .fh .fname {
    min-width: 0;
  }
  .chip.more {
    cursor: default;
  }
  .nomatch {
    grid-column: 1 / -1;
    text-align: center;
    padding: 24px;
  }
  .page-head {
    flex-wrap: wrap;
  }
  .page.wide {
    max-width: 1500px;
  }
  .search {
    position: relative;
    width: 220px;
  }
  .search :global(svg) {
    position: absolute;
    left: 8px;
    top: 7px;
    color: var(--text-3);
  }
  .search .input {
    padding-left: 28px;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .seg button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 10px;
    border: none;
    background: var(--bg-elev);
    color: var(--text-2);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1px solid var(--border-strong);
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .orch {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 10px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
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
    left: 0;
    z-index: 41;
    min-width: 260px;
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
  .graphcard {
    height: calc(100vh - 230px);
    min-height: 420px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .graphcard > :global(.dag) {
    flex: 1;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding: 8px 12px;
    border-top: 1px solid var(--border);
    color: var(--text-2);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .l {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    background: var(--text-3);
  }
  .l.never {
    background: transparent;
    border: 1.5px solid var(--text-3);
  }
  .l.pending {
    background: var(--warn);
  }
  .l.running {
    background: var(--accent);
  }
  .l.completed {
    background: var(--ok);
  }
  .l.failed {
    background: var(--err);
  }
  .l.stopped {
    background: var(--text-2);
  }
  .ck {
    width: 1%;
    padding-right: 0 !important;
  }
  .ck input {
    accent-color: var(--accent);
  }
  tr.sel td {
    background: color-mix(in srgb, var(--accent-soft) 60%, transparent);
  }
  .table {
    min-width: 900px;
  }
  .schedcell {
    white-space: nowrap;
  }
  .sched {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--accent-text);
  }
  .sched.off {
    color: var(--text-3);
  }
  .namecell {
    width: 26%;
    min-width: 200px;
    max-width: 0;
  }
  .namecell .fname {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fname {
    font-weight: 600;
    color: var(--text);
  }
  .desc {
    max-width: 100%;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 240px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: 20px;
    padding: 0 7px;
    border-radius: 999px;
    border: 1px solid var(--border-strong);
    background: var(--bg-elev);
    color: var(--text-2);
    font-size: 11.5px;
    text-decoration: none;
    white-space: nowrap;
  }
  .chip:hover {
    border-color: var(--accent);
    color: var(--accent-text);
    text-decoration: none;
  }
  .chip.completed {
    border-color: color-mix(in srgb, var(--ok) 45%, var(--border));
  }
  .chip.failed,
  .chip.stopped {
    border-color: color-mix(in srgb, var(--err) 45%, var(--border));
  }
  .chip.running,
  .chip.pending {
    border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  }
  .actions {
    gap: 2px;
    justify-content: flex-end;
  }
  .errtxt {
    color: var(--err);
  }
  .empty p {
    max-width: 360px;
    margin: 0 0 8px;
  }
</style>
