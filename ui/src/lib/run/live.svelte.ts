import { api, streamRun } from '../api/client';
import type { Bulletin, EdgeStats, NodeStats, RunDetail, RunSummary } from '../api/types';
import { isActive } from '../api/types';

const MAX_BULLETINS = 2000;

/** Live view of one run: initial fetch + SSE detail/bulletin/end with auto-reconnect. */
export class LiveRun {
  runId = $state<string | null>(null);
  detail = $state<RunDetail | null>(null);
  bulletins = $state<Bulletin[]>([]);
  connection = $state<'idle' | 'open' | 'reconnecting' | 'closed'>('idle');
  error = $state('');

  active = $derived(isActive(this.detail?.status));
  nodeStats = $derived(new Map<string, NodeStats>((this.detail?.nodes ?? []).map((n) => [n.nodeId, n])));
  edgeStats = $derived(new Map<string, EdgeStats>((this.detail?.edges ?? []).map((e) => [e.edgeId, e])));

  private close?: () => void;
  private lastSeq = 0;
  onEnd?: (s: RunSummary) => void;

  async start(runId: string) {
    this.stop();
    this.runId = runId;
    this.detail = null;
    this.bulletins = [];
    this.lastSeq = 0;
    this.error = '';
    try {
      const d = await api.run(runId);
      if (this.runId !== runId) return;
      this.detail = d;
    } catch (e) {
      this.error = (e as Error).message;
      return;
    }
    await this.fetchBulletins(runId);
    if (this.runId !== runId) return;
    if (!isActive(this.detail?.status)) {
      this.connection = 'closed';
      return;
    }
    this.close = streamRun(runId, {
      detail: (d) => {
        if (this.runId === runId) this.detail = d;
      },
      bulletin: (b) => this.addBulletins([b]),
      end: (s) => {
        if (this.runId !== runId) return;
        this.connection = 'closed';
        if (this.detail) this.detail = { ...this.detail, ...s };
        // one last full fetch so final table/node stats are exact
        api.run(runId).then((d) => this.runId === runId && (this.detail = d)).catch(() => {});
        this.onEnd?.(s);
      },
      connection: (st) => {
        if (this.runId !== runId) return;
        const was = this.connection;
        this.connection = st;
        if (st === 'open' && was === 'reconnecting') this.fetchBulletins(runId);
      },
    });
  }

  private async fetchBulletins(runId: string) {
    try {
      const b = await api.bulletins(runId, this.lastSeq);
      if (this.runId === runId) this.addBulletins(b ?? []);
    } catch {
      /* non-fatal */
    }
  }

  private addBulletins(bs: Bulletin[]) {
    const fresh = bs.filter((b) => b.seq > this.lastSeq);
    if (!fresh.length) return;
    this.lastSeq = Math.max(this.lastSeq, ...fresh.map((b) => b.seq));
    const next = this.bulletins.concat(fresh);
    this.bulletins = next.length > MAX_BULLETINS ? next.slice(next.length - MAX_BULLETINS) : next;
  }

  /** Patch status after a control action (pause/resume/stop) without waiting for SSE. */
  patch(s: RunSummary) {
    if (this.detail && this.detail.id === s.id) this.detail = { ...this.detail, ...s };
  }

  stop() {
    this.close?.();
    this.close = undefined;
    this.connection = 'idle';
  }
}
