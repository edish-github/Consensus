'use client';

import { useEffect, useState } from 'react';
import { detectModelContext, availabilityLabel, type WebMCPAvailability } from '@/lib/webmcp/client';
import { syncRegistration, teardownRegistration } from '@/lib/webmcp/registry';
import { toolsForPhase } from '@/lib/webmcp/tools';
import type { ToolPhase } from '@/lib/webmcp/types';

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
  /** In Block 0 this is fixed at 3. From B2-11 it comes from selectPhase(). */
  phase?: ToolPhase;
  children: React.ReactNode;
  onAvailability?: (a: WebMCPAvailability) => void;
}

export function WebMCPProvider({ phase = 3, children, onAvailability }: Props) {
  const [availability, setAvailability] = useState<WebMCPAvailability>({
    available: false,
    reason: 'ssr',
  });

  useEffect(() => {
    const a = detectModelContext();
    setAvailability(a);
    onAvailability?.(a);

    if (!a.available) return;

    // Idempotent: StrictMode's double-invoke produces one registration per tool.
    syncRegistration(toolsForPhase(phase));

    return () => {
      teardownRegistration();
    };
  }, [phase, onAvailability]);

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
