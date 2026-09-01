import type { ErrorCode } from './types';

/**
 * A minimal, dependency-free event log of every tool call.
 *
 * This exists in Block 0 rather than Block 2 for one reason: during the
 * permission test you need to see exactly what the agent called and in what
 * order. Reading that off the ChatGPT transcript is unreliable — the agent
 * summarises, and summaries are where fabrication hides.
 *
 * SECURITY: this log records the tool name, the arguments, the result CODE
 * and the duration. It never stores a result body. A released snippet must
 * not end up in a UI list that someone screenshots.
 */

export interface ToolCallRecord {
  id: string;
  tool: string;
  args: unknown;
  outcome: 'ok' | 'error';
  code?: ErrorCode;
  durationMs: number;
  at: number;
}

const MAX_RECORDS = 200;

let records: ToolCallRecord[] = [];
const listeners = new Set<() => void>();
let counter = 0;

export function recordToolCall(r: Omit<ToolCallRecord, 'id' | 'at'>): void {
  const record: ToolCallRecord = {
    ...r,
    id: `c${++counter}`,
    at: Date.now(),
  };
  // New array identity so useSyncExternalStore sees the change.
  records = [record, ...records].slice(0, MAX_RECORDS);
  for (const l of listeners) l();
}

export function getActivitySnapshot(): ToolCallRecord[] {
  return records;
}

export function subscribeActivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearActivity(): void {
  records = [];
  for (const l of listeners) l();
}

/** Server snapshot for useSyncExternalStore — stable identity, no hydration mismatch. */
const EMPTY: ToolCallRecord[] = [];
export function getActivityServerSnapshot(): ToolCallRecord[] {
  return EMPTY;
}
