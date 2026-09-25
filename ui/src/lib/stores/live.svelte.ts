// One stream of instance state for the whole app.
//
// The flow list and the status bar used to ask for /api/flows and
// /api/runs/active on their own timers, so two pollers hit the same two
// endpoints seconds apart — and listing flows costs the server a query per
// flow. The server pushes both over SSE instead (GET /api/live), and gathers
// them only while something is connected.
//
// Ref-counted like the summary store it feeds: the connection opens for the
// first watcher and closes behind the last.
import { base } from '../api/client';
import type { Flow, RunSummary } from '../api/types';

class Live {
  flows = $state<Flow[] | undefined>(undefined);
  runs = $state<RunSummary[]>([]);
  /** False while reconnecting, so a view can say the numbers may be stale. */
  connected = $state(false);
  error = $state('');

  private es: EventSource | undefined;
  private watchers = 0;
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  watch() {
    this.watchers++;
    if (this.watchers === 1) this.open();
    return () => {
      this.watchers--;
      if (this.watchers === 0) this.close();
    };
  }

  private open() {
    this.es = new EventSource(`${base}/api/live`);
    this.es.onopen = () => {
      this.retry = 0;
      this.connected = true;
      this.error = '';
    };
    this.es.addEventListener('flows', (e) => {
      const v = this.parse<Flow[]>(e as MessageEvent);
      if (v) this.flows = v;
    });
    this.es.addEventListener('runs', (e) => {
      const v = this.parse<RunSummary[]>(e as MessageEvent);
      if (v) this.runs = v;
    });
    this.es.onerror = () => {
      this.connected = false;
      this.es?.close();
      this.es = undefined;
      if (this.watchers === 0) return;
      const delay = Math.min(10000, 500 * 2 ** this.retry++);
      this.timer = setTimeout(() => this.open(), delay);
    };
  }

  private close() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.es?.close();
    this.es = undefined;
    this.connected = false;
  }

  private parse<T>(e: MessageEvent): T | null {
    try {
      return JSON.parse(e.data) as T;
    } catch {
      this.error = 'bad event';
      return null;
    }
  }
}

export const live = new Live();
