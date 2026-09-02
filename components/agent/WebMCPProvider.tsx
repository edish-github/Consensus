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
  return (
    <div
      role="status"
      className={[
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        good
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : 'border-amber-300 bg-amber-50 text-amber-900',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={['h-2 w-2 shrink-0 rounded-full', good ? 'bg-emerald-500' : 'bg-amber-500'].join(' ')}
      />
      <span>{availabilityLabel(availability)}</span>
    </div>
  );
}
