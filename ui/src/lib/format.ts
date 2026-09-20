export function fmtNum(n: number | undefined | null): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString();
}

export function fmtCompact(n: number | undefined | null): string {
  if (n == null || !isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
  if (a >= 1e4) return (n / 1e3).toFixed(0) + 'k';
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}

export function fmtBytes(b: number | undefined | null): string {
  if (b == null || !isFinite(b)) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`;
}

export function fmtTime(s?: string): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(+d)) return s;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function fmtClock(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(+d)) return s;
  return d.toLocaleTimeString(undefined, { hour12: false });
}

/** "5m ago" for the past, "in 5m" for the future. */
export function fmtRelative(s?: string): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(+d)) return s;
  const sec = (Date.now() - +d) / 1000;
  const ahead = sec < 0;
  const abs = Math.abs(sec);
  const say = (v: string) => (ahead ? `in ${v}` : `${v} ago`);
  if (abs < 45) return ahead ? 'in a moment' : 'just now';
  if (abs < 3600) return say(`${Math.round(abs / 60)}m`);
  if (abs < 86400) return say(`${Math.round(abs / 3600)}h`);
  if (abs < 86400 * 30) return say(`${Math.round(abs / 86400)}d`);
  return d.toLocaleDateString();
}

export function fmtDuration(start?: string, end?: string): string {
  if (!start) return '—';
  const a = +new Date(start);
  const b = end ? +new Date(end) : Date.now();
  if (isNaN(a) || isNaN(b)) return '—';
  let s = Math.max(0, Math.round((b - a) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function pct(a: number, b: number): number {
  if (!b || b <= 0) return a > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, (a / b) * 100));
}

/** Renders a cell value for grids: returns display text + whether it's null/json. */
export function cellText(v: unknown): { text: string; kind: 'null' | 'json' | 'bool' | 'num' | 'str' } {
  if (v === null || v === undefined) return { text: 'NULL', kind: 'null' };
  if (typeof v === 'boolean') return { text: String(v), kind: 'bool' };
  if (typeof v === 'number' || typeof v === 'bigint') return { text: String(v), kind: 'num' };
  if (typeof v === 'object') return { text: JSON.stringify(v), kind: 'json' };
  return { text: String(v), kind: 'str' };
}

export function prettyValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  if (typeof v === 'string') {
    const t = v.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
        return JSON.stringify(JSON.parse(t), null, 2);
      } catch {}
    }
  }
  return String(v);
}

export const uid = (prefix = 'n') => `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

/** Deep copy of JSON data (works on Svelte state proxies, unlike structuredClone). */
export const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
