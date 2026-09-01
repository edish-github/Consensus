import type { ErrorCode, ToolResult } from './types';
import type { WebMCPToolResponse } from '@/types/webmcp';

/**
 * The result envelope.
 *
 * Every tool returns the same shape whether it succeeds or fails. Agents
 * recover from structured errors with hints far better than from thrown
 * exceptions, which surface to them as opaque transport failures.
 */

export function ok<T>(data: T): ToolResult<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCode,
  message: string,
  opts: { hint?: string; retryable?: boolean } = {}
): ToolResult<never> {
  return {
    ok: false,
    code,
    message: scrub(message),
    hint: opts.hint ? scrub(opts.hint) : undefined,
    retryable: opts.retryable ?? false,
  };
}

/**
 * SECURITY: error paths must never become a content leak.
 *
 * A caught exception can carry a chunk of document text in its message
 * (a parse error quoting the input, a validation error echoing a value).
 * Anything longer than MAX_ERROR_STRING is truncated before it can reach
 * the agent's context.
 *
 * Covered by evals/security.spec.ts. Do not remove.
 */
const MAX_ERROR_STRING = 80;

function scrub(s: string): string {
  if (s.length <= MAX_ERROR_STRING) return s;
  return `${s.slice(0, MAX_ERROR_STRING)}… [truncated]`;
}

/**
 * Translate our domain envelope into the shape WebMCP expects.
 *
 * We always populate `content` with JSON text. Structured-content support
 * varies across builds and the spec is still moving, so text is the reliable
 * channel — and it is what the agent reads regardless.
 */
export function toToolResponse<T>(result: ToolResult<T>): WebMCPToolResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
    isError: !result.ok,
  };
}

/** Standard hints, kept in one place so wording stays consistent across tools. */
export const HINTS = {
  CALL_STATE_FOR_IDS:
    'Call get_decision_state for the valid option and criterion ids.',
  WAIT_FOR_USER:
    'The user has not responded yet. Continue with other work, or tell them what you are waiting for. Do not guess the contents.',
  DO_NOT_REREQUEST:
    'The user declined. Do not request this page again. Say what you could not verify and continue.',
  REQUEST_FIRST:
    'You have not been permitted to read that page. Call request_disclosure first.',
  INDEX_PARSING:
    'Documents are still parsing. Call list_documents to check status, then retry.',
  TOO_MANY_PENDING:
    'Twelve requests are already pending. Wait for the user to respond before requesting more.',
} as const;
