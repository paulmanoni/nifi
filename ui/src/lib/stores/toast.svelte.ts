export type Toast = {
  id: number;
  kind: 'info' | 'success' | 'error' | 'warn';
  message: string;
  /** Optional expandable lines (e.g. skipped flows and why). */
  details?: { title: string; lines: string[] };
};

let nextId = 1;

class Toasts {
  items = $state<Toast[]>([]);
  push(kind: Toast['kind'], message: string, ttl = kind === 'error' ? 7000 : 3500, details?: Toast['details']) {
    const id = nextId++;
    this.items.push({ id, kind, message, details });
    setTimeout(() => this.dismiss(id), ttl);
  }
  dismiss(id: number) {
    this.items = this.items.filter((t) => t.id !== id);
  }
}

export const toasts = new Toasts();
export const toast = {
  info: (m: string) => toasts.push('info', m),
  success: (m: string) => toasts.push('success', m),
  warn: (m: string) => toasts.push('warn', m),
  error: (e: unknown) => {
    if (e && typeof e === 'object' && (e as { handled?: boolean }).handled) return;
    toasts.push('error', e instanceof Error ? e.message : String(e));
  },
};
