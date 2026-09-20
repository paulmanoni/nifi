import { getContext, setContext } from 'svelte';
import type { Column, Issue, ProcessorSpec } from '../api/types';
import type { LiveRun } from '../run/live.svelte';

export type Sample = { columns: Column[]; rows: any[][]; table: string } | null;

export type CanvasCtx = {
  specs: () => Map<string, ProcessorSpec>;
  live: LiveRun;
  issues: () => Map<string, Issue[]>;
  edgeIssues: () => Map<string, Issue[]>;
  showStats: () => boolean;
  /** True when the user lacks the `edit` permission. */
  readOnly: () => boolean;
  /** Output relationships of a node (static + dynamic). */
  portsOf: (nodeId: string) => string[];
  /** Double-click on a node: open its editor (table mapping for PostgreSQL sinks). */
  opennode: (nodeId: string) => void;
  /** Rows arriving at a node (last stage of a preview of its upstream node). */
  sampleFor: (nodeId: string) => Promise<Sample>;
};

const KEY = Symbol('canvas');
export const setCanvasCtx = (c: CanvasCtx) => setContext(KEY, c);
export const getCanvasCtx = () => getContext<CanvasCtx>(KEY);
