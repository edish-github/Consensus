/**
 * The shape every Consensus tool conforms to.
 *
 * Design note that matters for testability: a tool's `execute` returns our
 * domain envelope (`ToolResult`), NOT the WebMCP content-block shape. The
 * registry's wrapExecute() does that translation. This means evals can call
 * execute() directly and assert on a plain object — no browser, no agent, no
 * serialisation in the way.
 */

/**
 * What a tool needs in order to make sense.
 *
 * Registration is gated on capabilities rather than sequenced through phases,
 * because a linear order cannot express the real states. A workspace can have
 * a matrix and no documents (explain_ranking applies, locate_evidence does
 * not) or documents and no matrix (the reverse). Forcing those onto one axis
 * means one of them is always wrong.
 *
 *   documents   at least one indexed document
 *   matrix      at least one option AND one criterion
 *   humanScore  a human has entered a judgement there is something to argue with
 */
export interface Capabilities {
  documents: boolean;
  matrix: boolean;
  humanScore: boolean;
}

export type CapabilityKey = keyof Capabilities;

/**
 * Capability class. Shown to the human in ToolSurfacePanel and to the agent
 * through annotations.
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
  /** Capabilities that must all be satisfied for this tool to be registered. */
  requires: CapabilityKey[];
  klass: ToolClass;
  /** True when the human must approve something before this can succeed. */
  gated?: boolean;
  execute: (input: TInput, ctx: ExecuteContext) => Promise<ToolResult<TOutput>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any, any>;
