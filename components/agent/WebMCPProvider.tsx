'use client';

import { useEffect, useState } from 'react';
import { detectModelContext, availabilityLabel, type WebMCPAvailability } from '@/lib/webmcp/client';
import { syncRegistration, teardownRegistration } from '@/lib/webmcp/registry';
import { toolsFor } from '@/lib/webmcp/tools';
import type { Capabilities } from '@/lib/webmcp/types';

/**
 * Owns the registration lifecycle for the workspace.
 *
 * Registration happens in a mount effect, never at module scope. Module-scope
 * registration is a common and quiet failure: the tools exist before the DOM
 * they map to, so the agent can call a tool that operates on a view the human
 * cannot see.
 *
 * The effect re-runs whenever a capability flips, and syncRegistration diffs
 * against the desired set. That is what makes registration genuinely dynamic
 * in both directions — adding documents registers the search tools, removing
 * them unregisters again.
 *
 * Mounted once, at the top level of the workspace route. Never inside an
 * iframe: ChatGPT's built-in browser does not discover tools registered in
 * frames, same-origin or otherwise.
 */
interface Props {
  capabilities: Capabilities;
  children: React.ReactNode;
}

export function WebMCPProvider({ capabilities, children }: Props) {
  const [availability, setAvailability] = useState<WebMCPAvailability>({
    available: false,
    reason: 'ssr',
  });

  const { documents, matrix, humanScore } = capabilities;

  useEffect(() => {
    const a = detectModelContext();
    setAvailability(a);
    if (!a.available) return;

    // Idempotent: StrictMode's double-invoke produces one registration per tool.
    syncRegistration(toolsFor({ documents, matrix, humanScore }));
  }, [documents, matrix, humanScore]);

  // Teardown is separate so a capability change does not unregister everything
  // and immediately re-register it — that would churn the agent's tool list on
  // every score entry.
  useEffect(() => () => teardownRegistration(), []);

  return (
    <>
      <AvailabilityBanner availability={availability} />
      {children}
    </>
  );
}

function AvailabilityBanner({ availability }: { availability: WebMCPAvailability }) {
  const good = availability.available;
  const [expanded, setExpanded] = useState(false);

  if (good) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
      >
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <span className="font-medium">WebMCP available</span>
        <span className="text-xs text-emerald-700">— tools registered with your browser agent</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
          <span className="font-medium">WebMCP not detected</span>
          <span className="text-xs text-amber-700">(Consensus works as a standalone matrix, or enable agent tools below)</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950"
        >
          {expanded ? 'Hide setup instructions' : 'How to enable site tools'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-1.5 border-t border-amber-200/80 pt-2 text-xs leading-relaxed text-amber-950">
          <p>
            • <strong>ChatGPT Desktop:</strong> Open this URL in the built-in browser → Settings → Browser → Permissions → <strong>Enable site tools</strong> (model must be <strong>Sol</strong> or <strong>Terra</strong>).
          </p>
          <p>
            • <strong>Chrome 146+:</strong> Navigate to <code className="rounded bg-amber-100 px-1 font-mono">chrome://flags/#enable-webmcp-testing</code> → set to <strong>Enabled</strong> → restart browser.
          </p>
        </div>
      )}
    </div>
  );
}
