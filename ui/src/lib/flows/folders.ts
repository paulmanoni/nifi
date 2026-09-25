// Folder paths are stored on a flow as one string, with "/" separating levels
// ("migrations/people"). That string is the whole model — there is no folder
// record to create or delete, a folder exists exactly as long as a flow names
// it. These helpers turn the flat strings into the tree the sidebar draws.
import type { Flow } from '../api/types';

/** The scope value standing for flows with no folder at all. */
export const UNGROUPED = '\u0000ungrouped';

export type FolderNode = {
  /** The last segment, which is what the tree shows. */
  name: string;
  /** The full path, which is what a flow stores and what scoping compares. */
  path: string;
  children: FolderNode[];
  /** Flows filed directly here. */
  own: number;
  /** Flows here and anywhere beneath — what the count in the tree means. */
  total: number;
};

export function normalizeFolder(raw: string): string {
  return raw
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/');
}

/** Every folder path a set of flows mentions, each level included. */
export function folderPaths(flows: Flow[]): string[] {
  const seen = new Set<string>();
  for (const f of flows) {
    const path = normalizeFolder(f.folder ?? '');
    if (!path) continue;
    const parts = path.split('/');
    for (let i = 1; i <= parts.length; i++) seen.add(parts.slice(0, i).join('/'));
  }
  return [...seen].sort();
}

export function buildFolderTree(flows: Flow[]): FolderNode[] {
  const roots: FolderNode[] = [];
  const byPath = new Map<string, FolderNode>();

  const node = (path: string): FolderNode => {
    let n = byPath.get(path);
    if (n) return n;
    const cut = path.lastIndexOf('/');
    n = { name: cut < 0 ? path : path.slice(cut + 1), path, children: [], own: 0, total: 0 };
    byPath.set(path, n);
    if (cut < 0) roots.push(n);
    else node(path.slice(0, cut)).children.push(n);
    return n;
  };

  for (const path of folderPaths(flows)) node(path);
  for (const f of flows) {
    const path = normalizeFolder(f.folder ?? '');
    if (!path) continue;
    byPath.get(path)!.own++;
    // A flow counts towards every folder above it, so a parent's number says
    // how much is filed under it, not just at it.
    const parts = path.split('/');
    for (let i = 1; i <= parts.length; i++) byPath.get(parts.slice(0, i).join('/'))!.total++;
  }

  const sort = (ns: FolderNode[]) => {
    ns.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of ns) sort(n.children);
  };
  sort(roots);
  return roots;
}

/**
 * Whether a flow belongs in the given scope. "" is everything; a folder path
 * takes what is filed there AND everything beneath it, which is the whole
 * point of selecting a parent.
 */
export function inScope(flow: Flow, scope: string): boolean {
  if (!scope) return true;
  const path = normalizeFolder(flow.folder ?? '');
  if (scope === UNGROUPED) return path === '';
  return path === scope || path.startsWith(scope + '/');
}

export function countUngrouped(flows: Flow[]): number {
  return flows.filter((f) => !normalizeFolder(f.folder ?? '')).length;
}

/** The trail shown above the list: [["migrations","migrations"], ["jobs","migrations/jobs"]]. */
export function breadcrumb(scope: string): { name: string; path: string }[] {
  if (!scope || scope === UNGROUPED) return [];
  const parts = scope.split('/');
  return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
}
