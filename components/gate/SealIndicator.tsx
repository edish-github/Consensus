'use client';

import { useConsensusStore } from '@/lib/store';

/**
 * Persistent count of what has crossed the boundary this session.
 *
 * Small, but it is the running total of a claim the product makes constantly.
 * At 2:10 in the demo this is what the camera lands on before the ledger opens.
 */
export function SealIndicator({ onClick }: { onClick?: () => void }) {
  const released = useConsensusStore((s) => s.requests.filter((r) => r.state === 'released').length);
  const denied = useConsensusStore((s) =>
    s.requests.filter((r) => r.state === 'denied' || r.state === 'blocked').length
  );

  if (released === 0 && denied === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-left transition hover:border-neutral-400"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
      <span className="text-[11px] text-neutral-700">
        <span className="font-semibold tabular-nums">{released}</span>{' '}
        {released === 1 ? 'page' : 'pages'} released this session
        {denied > 0 && <span className="text-neutral-400"> · {denied} declined</span>}
      </span>
    </button>
  );
}
