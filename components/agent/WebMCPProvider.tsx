'use client';

import { useEffect, useState } from 'react';
import { detectModelContext, availabilityLabel, type WebMCPAvailability } from '@/lib/webmcp/client';
import { syncRegistration, teardownRegistration } from '@/lib/webmcp/registry';
import { toolsFor, toolsForPhase } from '@/lib/webmcp/tools';
import type { ToolPhase } from '@/lib/webmcp/types';
import type { Capabilities } from '@/lib/store/selectors';

/**
 * Owns the registration lifecycle for the workspace.
 *
 * Registration happens in a mount effect, never at module scope. Module-scope
 * registration is a common and quiet failure: the tools exist before the DOM
 * they map to, so the agent can call a tool that operates on a view the human
 * cannot see.
 *
 * Mounted once, at the top level of the workspace route. Never inside an
 * iframe — ChatGPT's built-in browser does not discover tools registered in
 * frames, same-origin or otherwise.
 */

interface Props {
  capabilities?: Capabilities;
  phase?: ToolPhase;
  children: React.ReactNode;
  onAvailability?: (a: WebMCPAvailability) => void;
}

export function WebMCPProvider({ capabilities, phase, children, onAvailability }: Props) {
  const [availability, setAvailability] = useState<WebMCPAvailability>({
    available: false,
    reason: 'ssr',
  });

  useEffect(() => {
    const a = detectModelContext();
    setAvailability(a);
    onAvailability?.(a);

    if (!a.available) return;

    const tools = capabilities ? toolsFor(capabilities) : toolsForPhase(phase ?? 3);

    // Idempotent: StrictMode's double-invoke produces one registration per tool.
    syncRegistration(tools);

    return () => {
      teardownRegistration();
    };
  }, [capabilities, phase, onAvailability]);

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
        className={[
          'h-2 w-2 shrink-0 rounded-full',
          good ? 'bg-emerald-500' : 'bg-amber-500',
        ].join(' ')}
      />
      <span>{availabilityLabel(availability)}</span>
    </div>
  );
}
