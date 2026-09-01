import type { WebMCPModelContext } from '@/types/webmcp';

/**
 * Feature detection and a thin, drift-tolerant wrapper over the WebMCP host.
 *
 * Two things this file exists to guarantee:
 *
 *  1. Consensus works with no agent present. If `document.modelContext` is
 *     absent the app is a perfectly good human decision tool; only the agent
 *     panels disappear. This matters beyond politeness — if the agent fails
 *     during the demo, there is still a working product on screen.
 *
 *  2. Spec drift cannot crash the page. WebMCP is a draft. We bind only to
 *     `document.modelContext` (Chrome 150 deprecated the `navigator` alias)
 *     and we tolerate both unregistration styles seen in the wild.
 */

export type WebMCPAvailability =
  | { available: true; ctx: WebMCPModelContext }
  | { available: false; reason: 'ssr' | 'unsupported' | 'insecure-context' };

export function detectModelContext(): WebMCPAvailability {
  if (typeof document === 'undefined') {
    return { available: false, reason: 'ssr' };
  }

  // The spec requires a secure context. Surfacing this explicitly saves a
  // confusing debugging session when someone tests over plain http.
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return { available: false, reason: 'insecure-context' };
  }

  const ctx = document.modelContext;
  if (!ctx || typeof ctx.registerTool !== 'function') {
    return { available: false, reason: 'unsupported' };
  }

  return { available: true, ctx };
}

export function getModelContext(): WebMCPModelContext | null {
  const result = detectModelContext();
  return result.available ? result.ctx : null;
}

/**
 * Register a tool and return a disposer that works across builds.
 *
 * Some builds return an unregister thunk from registerTool(); others expose
 * unregisterTool(name). Chrome 153 made unregistration safe while an execute
 * is still in flight. We prefer the returned thunk when present because it
 * cannot be confused by a name collision.
 */
export function registerWithDisposer(
  ctx: WebMCPModelContext,
  descriptor: Parameters<WebMCPModelContext['registerTool']>[0]
): () => void {
  const returned = ctx.registerTool(descriptor);

  if (typeof returned === 'function') {
    return returned;
  }

  return () => {
    try {
      ctx.unregisterTool?.(descriptor.name);
    } catch {
      // Unregistration failing is not worth breaking teardown over. The page
      // is going away; the tools go with it.
    }
  };
}

/** Human-readable status for the detection banner. */
export function availabilityLabel(a: WebMCPAvailability): string {
  if (a.available) return 'WebMCP available';
  switch (a.reason) {
    case 'ssr':
      return 'Checking…';
    case 'insecure-context':
      return 'WebMCP needs HTTPS — this page is not a secure context';
    case 'unsupported':
      return 'WebMCP not detected — open in the ChatGPT desktop browser, or Chrome with chrome://flags/#enable-webmcp-testing';
  }
}
