'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { DisclosureRequestCard } from './DisclosureRequestCard';

/**
 * The approval queue.
 *
 * Renders nothing when empty, and interrupts when it isn't.
 *
 * BATCH 5 FIX: it now scrolls itself into view and stays pinned.
 *
 * The first version rendered above the matrix and was correct but invisible —
 * during testing the agent asked for a page, the card appeared off-screen, and
 * the session stalled with the human unaware anything was waiting. A permission
 * request nobody sees is a permission request that silently fails, and on
 * camera it would have looked like the gate was broken.
 *
 * This is the only thing Consensus ever asks you to approve. That scarcity is
 * the point: most agent products put confirmations in front of low-stakes
 * writes and train people to click through. Here the only prompt is releasing
 * a specific page of a confidential document to a third-party model.
 */
export function DisclosureQueue() {
  const requests = useConsensusStore((s) => s.requests);
  const pending = requests.filter((r) => r.state === 'requested');
  const ref = useRef<HTMLElement>(null);
  const count = pending.length;

  useEffect(() => {
    if (count > 0) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [count]);

  if (count === 0) return null;

  return (
    <section
      ref={ref}
      className="sticky top-4 z-10 rounded-xl border-2 border-blue-300 bg-white p-4 shadow-lg"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">
          Your agent is asking for permission
        </h2>
        <span className="text-[11px] text-neutral-500">{count} pending</span>
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {pending.map((request) => (
            <DisclosureRequestCard key={request.id} request={request} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
