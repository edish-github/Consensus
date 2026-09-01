/**
 * Ambient types for the WebMCP browser API.
 *
 * WebMCP is a W3C Web Machine Learning Community Group draft, not a ratified
 * standard, and the surface has moved during 2026:
 *   window.agent  →  navigator.modelContext  →  document.modelContext
 * Chrome 150 deprecated `navigator.modelContext`. We bind only to
 * `document.modelContext` and feature-detect at runtime. See lib/webmcp/client.ts.
 *
 * These declarations describe what we actually call. They are deliberately
 * narrow: anything we do not use is not declared, so a spec change in an
 * unused corner cannot silently typecheck.
 */

/** A content block returned from a tool's execute(). */
export interface WebMCPTextContent {
  type: 'text';
  text: string;
}

export type WebMCPContent = WebMCPTextContent;

/** The value a tool's execute() must resolve to. */
export interface WebMCPToolResponse {
  content: WebMCPContent[];
  /** Optional structured payload. Support varies; we always populate `content`. */
  structuredContent?: unknown;
  isError?: boolean;
}

/**
 * Behavioural hints the agent uses to decide how much scrutiny a tool needs.
 *
 * Chrome's guidance: "Assume WebMCP tools mutate state, unless the tool
 * description or annotations (readOnlyHint) clearly state otherwise."
 */
export interface WebMCPToolAnnotations {
  /** True for tools that cannot change state. Lets the agent skip confirmations. */
  readOnlyHint?: boolean;
  /** True when output may contain user- or third-party-supplied content. */
  untrustedContentHint?: boolean;
  /** Advisory title for UI surfaces that render the tool list. */
  title?: string;
}

export interface WebMCPToolDescriptor {
  name: string;
  description: string;
  /** JSON Schema (draft-07 style) describing the argument object. */
  inputSchema: Record<string, unknown>;
  annotations?: WebMCPToolAnnotations;
  execute: (
    input: unknown,
    options?: { signal?: AbortSignal }
  ) => Promise<WebMCPToolResponse>;
}

/**
 * Some builds return an unregister thunk from registerTool(); others expose
 * unregisterTool(name). We handle both — see lib/webmcp/registry.ts.
 */
export type WebMCPUnregister = (() => void) | void;

export interface WebMCPModelContext extends EventTarget {
  registerTool(descriptor: WebMCPToolDescriptor): WebMCPUnregister;
  unregisterTool?(name: string): void;
  /** Present in some builds; we never rely on it. */
  getTools?(): unknown;
}

declare global {
  interface Document {
    modelContext?: WebMCPModelContext;
  }
}

export {};
