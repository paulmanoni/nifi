// What the status bar shows: how the whole instance is doing, refreshed on a
// timer and after anything that starts or stops a run.
//
// Apache NiFi keeps this strip under the header because an operator watching a
// hundred flows needs the totals in view at all times, not a page away.
import { api } from '../api/client';
import type { Flow, RunSummary } from '../api/types';

export type Counts = {
  flows: number;
  running: number;
  live: number;
  completed: number;
  failed: number;
  stopped: number;
  neverRun: number;
  rowsWritten: number;
  rowsFailed: number;
};

const zero: Counts = {
  flows: 0, running: 0, live: 0, completed: 0, failed: 0,
  stopped: 0, neverRun: 0, rowsWritten: 0, rowsFailed: 0,
};

class Summary {
  counts = $state<Counts>({ ...zero });
  loaded = $state(false);
  error = $state('');
  private timer: ReturnType<typeof setInterval> | undefined;
  private watchers = 0;

  /** Start refreshing while anything is on screen that shows the bar. */
  watch() {
    this.watchers++;
    if (this.watchers === 1) {
      this.refresh();
      this.timer = setInterval(() => this.refresh(), 5000);
    }
    return () => {
      this.watchers--;
      if (this.watchers === 0) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  }

  async refresh() {
    try {
      const [flows, active] = await Promise.all([api.flows(), api.activeRuns()]);
      this.counts = tally(flows ?? [], active ?? []);
      this.loaded = true;
      this.error = '';
    } catch (e) {
      this.error = (e as Error).message;
    }
  }
}

function tally(flows: Flow[], active: RunSummary[]): Counts {
  const c: Counts = { ...zero, flows: flows.length };
  const live = new Map(active.map((r) => [r.flowId, r]));
  for (const f of flows) {
    const run = live.get(f.id) ?? f.lastRun;
    if (!run) {
      c.neverRun++;
      continue;
    }
    c.rowsWritten += run.rowsWritten ?? 0;
    c.rowsFailed += run.rowsFailed ?? 0;
    switch (run.status) {
      case 'running':
      case 'paused':
      case 'stopping':
      case 'pending':
        c.running++;
        if (run.live) c.live++;
        break;
      case 'completed':
        c.completed++;
        break;
      case 'failed':
        c.failed++;
        break;
      default:
        c.stopped++;
    }
  }
  return c;
}

export const summary = new Summary();
