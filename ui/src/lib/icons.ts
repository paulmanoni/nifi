import {
  Activity, ArrowRightLeft, ArrowUpDown, Binary, Blocks, Box, Braces, Calculator, Calendar, Code, CodeXml,
  Columns3, Copy, Database, DatabaseZap, FileCode, FileJson, FileText, Filter, Funnel, GitBranch, GitFork,
  GitMerge, Hash, HardDriveDownload, HardDriveUpload, KeyRound, Layers, Link, ListChecks, ListFilter, Merge,
  Pencil, Replace, Route, Rows3, Scissors, Search, Server, Shuffle, Sigma, Signpost, Sparkles, Split, Table,
  Table2, Tag, Tags, Terminal, TextCursorInput, Type, Variable, WandSparkles, Wrench, Zap, Ban, Eye, EyeOff,
  SquareFunction, Trash2, Upload, Download, Workflow, Cable, Clock, Globe, Inbox,
} from 'lucide-svelte';
import type { Category } from './api/types';

// lucide icon names (kebab-case, as the API sends them) → component.
const map: Record<string, any> = {
  activity: Activity, 'arrow-right-left': ArrowRightLeft, 'arrow-up-down': ArrowUpDown, binary: Binary,
  blocks: Blocks, box: Box, braces: Braces, calculator: Calculator, calendar: Calendar, code: Code,
  'code-xml': CodeXml, 'code-2': CodeXml, columns: Columns3, 'columns-3': Columns3, copy: Copy,
  database: Database, 'database-zap': DatabaseZap, 'file-code': FileCode, 'file-json': FileJson,
  'file-text': FileText, filter: Filter, funnel: Funnel, 'git-branch': GitBranch, 'git-fork': GitFork,
  'git-merge': GitMerge, hash: Hash, 'hard-drive-download': HardDriveDownload,
  'hard-drive-upload': HardDriveUpload, key: KeyRound, 'key-round': KeyRound, layers: Layers, link: Link,
  'list-checks': ListChecks, 'list-filter': ListFilter, merge: Merge, pencil: Pencil, replace: Replace,
  route: Route, rows: Rows3, 'rows-3': Rows3, scissors: Scissors, search: Search, server: Server,
  shuffle: Shuffle, sigma: Sigma, signpost: Signpost, sparkles: Sparkles, split: Split, table: Table,
  'table-2': Table2, tag: Tag, tags: Tags, terminal: Terminal, 'text-cursor-input': TextCursorInput,
  type: Type, variable: Variable, 'wand-sparkles': WandSparkles, wand: WandSparkles, wrench: Wrench, zap: Zap,
  ban: Ban, eye: Eye, 'eye-off': EyeOff, function: SquareFunction, 'square-function': SquareFunction, 'function-square': SquareFunction,
  trash: Trash2, 'trash-2': Trash2,
  upload: Upload, download: Download, workflow: Workflow, cable: Cable, clock: Clock, globe: Globe, inbox: Inbox,
};

const categoryFallback: Record<Category, any> = {
  Source: Database,
  Transform: WandSparkles,
  Route: GitBranch,
  Script: Code,
  Sink: HardDriveUpload,
};

export function iconFor(name?: string, category?: Category): any {
  if (name) {
    const k = name.trim().toLowerCase().replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-');
    if (map[k]) return map[k];
  }
  return (category && categoryFallback[category]) || Box;
}

export const categoryOrder: Category[] = ['Source', 'Transform', 'Route', 'Script', 'Sink'];

export const categoryColor: Record<string, string> = {
  Source: 'var(--cat-source)',
  Transform: 'var(--cat-transform)',
  Route: 'var(--cat-route)',
  Script: 'var(--cat-script)',
  Sink: 'var(--cat-sink)',
};
