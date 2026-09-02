/**
 * The shape every Consensus tool conforms to.
 *
 * Design note that matters for testability: a tool's `execute` returns our
 * domain envelope (`ToolResult`), NOT the WebMCP content-block shape. The
 * registry's wrapExecute() does that translation. This means evals/tools.spec.ts
 * can call execute() directly and assert on a plain object, with no browser,
 * no agent, and no serialisation in the way.
 */

/**
 * Registration phase. Tools appear and disappear as the workspace changes
 * state, so the agent is only ever offered actions that currently make sense.
 *
 *   0  empty workspace
 *   1  at least one document indexed
 *   2  matrix has at least one option and one criterion
 *   3  the human has entered at least one score by hand
 *
 * Phases are cumulative and reversible. Remove the documents and the
 * disclosure tools unregister. See lib/webmcp/phases.ts (Block 2).
 */
export type ToolPhase = 0 | 1 | 2 | 3;

/**
 * Capability class. Surfaced to the human in ToolSurfacePanel and to the
 * agent through annotations.
 *
 *   A  read-only, no friction
 *   B  gated, requires a human page release
 *   C  proposal or annotation — can suggest and argue, never commits a value
 */
export type ToolClass = 'A' | 'B' | 'C';

/** Structured error codes. Every one carries an actionable hint at the call site. */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'PERMISSION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'BOUNDARY_VIOLATION'
  | 'INDEX_NOT_READY'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export type ToolResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      /** What the agent should do next. Behavioural steering, not decoration. */
      hint?: string;
      retryable: boolean;
    };

export interface ExecuteContext {
  signal?: AbortSignal;
}

export type CapabilityKey = 'documents' | 'matrix' | 'humanScore';

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  /** ≤500 chars — Chrome's published budget. Linted by evals/descriptions.spec.ts. */
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    title?: string;
  };
  /** Capabilities required for this tool to be registered. */
  requires: CapabilityKey[];
  /** Lowest phase at which this tool is registered (legacy/progress indicator). */
  minPhase?: ToolPhase;
  klass: ToolClass;
  /** True when the human must approve something before this can succeed. */
  gated?: boolean;
  execute: (input: TInput, ctx: ExecuteContext) => Promise<ToolResult<TOutput>>;
}

/** Convenience alias for the heterogeneous array in tools/index.ts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any, any>;

