import { getModelContext, registerWithDisposer } from './client';
import { err, toToolResponse } from './envelope';
import { recordToolCall } from './activity';
import type { AnyToolDefinition, ToolPhase, ToolResult } from './types';
import type { WebMCPToolResponse } from '@/types/webmcp';

/**
 * Registration orchestration.
 *
 * Three problems this file solves, all of which produce demo-day failures if
 * you solve them naively:
 *
 *  1. GHOST TOOLS. A tool registered against a view that no longer exists.
 *     The agent calls it, it operates on stale state, and the human sees
 *     nothing happen. Fixed by deriving the desired tool set from page state
 *     and diffing on every change.
 *
 *  2. DOUBLE REGISTRATION. React StrictMode invokes effects twice in
 *     development. A registry that blindly registers ends up with two copies
 *     of every tool and an agent that sees duplicates. Fixed by keying on
 *     tool name and making sync() idempotent.
 *
 *  3. TEARDOWN DURING EXECUTION. A phase change can unregister a tool while
 *     one of its executes is still in flight. Each registration owns an
 *     AbortController; the signal is passed to execute so long work can bail.
 *     Chrome 153+ makes the unregister itself safe mid-execution.
 */

interface RegisteredEntry {
  def: AnyToolDefinition;
  dispose: () => void;
  controller: AbortController;
  epoch: number;
}

const registered = new Map<string, RegisteredEntry>();
let epoch = 0;

/* ------------------------------------------------------------------ *
 * Subscribable snapshot — powers ToolSurfacePanel                     *
 * ------------------------------------------------------------------ */

import type { CapabilityKey } from './types';

export interface RegisteredToolView {
  name: string;
  description: string;
  klass: 'A' | 'B' | 'C';
  readOnly: boolean;
  gated: boolean;
  requires: CapabilityKey[];
  minPhase?: ToolPhase;
}

let snapshot: RegisteredToolView[] = [];
const listeners = new Set<() => void>();

function publish(): void {
  snapshot = [...registered.values()]
    .map((e) => ({
      name: e.def.name,
      description: e.def.description,
      klass: e.def.klass,
      readOnly: e.def.annotations?.readOnlyHint === true,
      gated: e.def.gated === true,
      requires: e.def.requires ?? [],
      minPhase: e.def.minPhase,
    }))
    .sort((a, b) => a.klass.localeCompare(b.klass) || a.name.localeCompare(b.name));
  for (const l of listeners) l();
}

export function getRegisteredSnapshot(): RegisteredToolView[] {
  return snapshot;
}

const EMPTY_SNAPSHOT: RegisteredToolView[] = [];
export function getRegisteredServerSnapshot(): RegisteredToolView[] {
  return EMPTY_SNAPSHOT;
}

export function subscribeRegistry(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ *
 * execute wrapper — validation, timing, logging, error containment    *
 * ------------------------------------------------------------------ */

/**
 * Cross-cutting concerns live here so no individual tool has to remember them.
 *
 * The critical guarantee: this never rejects. A tool that throws produces a
 * structured INTERNAL envelope. An agent that receives a rejected promise
 * gets an opaque transport failure and typically retries blindly or invents
 * a result; an agent that receives `{ok:false, code, hint}` self-corrects.
 */
function wrapExecute(
  def: AnyToolDefinition,
  signal: AbortSignal
): (input: unknown, options?: { signal?: AbortSignal }) => Promise<WebMCPToolResponse> {
  return async (input: unknown, options): Promise<WebMCPToolResponse> => {
    const started = performance.now();
    // Prefer the host's signal when it supplies one; fall back to ours.
    const ctx = { signal: options?.signal ?? signal };

    let result: ToolResult<unknown>;
    try {
      result = await def.execute(input ?? {}, ctx);
    } catch (e) {
      // Never let a raw exception reach the agent, and never let an exception
      // message carry document text — envelope.err() truncates.
      const message = e instanceof Error ? e.message : 'Unknown error';
      result = err('INTERNAL', message, {
        hint: 'This tool failed unexpectedly. Try a different approach or tell the user.',
        retryable: false,
      });
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(`[webmcp] ${def.name} threw`, e);
      }
    }

    recordToolCall({
      tool: def.name,
      args: input ?? {},
      outcome: result.ok ? 'ok' : 'error',
      code: result.ok ? undefined : result.code,
      durationMs: Math.round(performance.now() - started),
    });

    return toToolResponse(result);
  };
}

/* ------------------------------------------------------------------ *
 * Sync                                                                *
 * ------------------------------------------------------------------ */

/**
 * Make the registered set match `desired`, exactly.
 *
 * Idempotent: calling it twice with the same input is a no-op, which is what
 * makes StrictMode's double-mount harmless.
 */
export function syncRegistration(desired: AnyToolDefinition[]): void {
  const ctx = getModelContext();
  if (!ctx) return;

  const wanted = new Map(desired.map((d) => [d.name, d]));

  // Remove anything no longer wanted.
  for (const [name, entry] of registered) {
    if (!wanted.has(name)) {
      entry.controller.abort();
      entry.dispose();
      registered.delete(name);
    }
  }

  // Add anything missing. Existing entries are left alone — re-registering an
  // identical tool would churn the agent's tool list for no reason.
  for (const def of desired) {
    if (registered.has(def.name)) continue;

    const controller = new AbortController();
    const dispose = registerWithDisposer(ctx, {
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: def.annotations,
      execute: wrapExecute(def, controller.signal),
    });

    registered.set(def.name, { def, dispose, controller, epoch });
  }

  publish();
}

/** Unregister everything. Called on workspace unmount. */
export function teardownRegistration(): void {
  epoch += 1;
  for (const entry of registered.values()) {
    entry.controller.abort();
    entry.dispose();
  }
  registered.clear();
  publish();
}

/** Test seam — evals assert on this without touching the DOM. */
export function registeredToolNames(): string[] {
  return [...registered.keys()];
}
