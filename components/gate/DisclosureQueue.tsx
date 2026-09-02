'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { DisclosureRequestCard } from './DisclosureRequestCard';

/**
 * The approval queue.
 *
 * Renders nothing when empty, and interrupts when it isn't — it sits above the
 * matrix rather than in a sidebar, because a pending request is the one thing
 * on screen that is genuinely waiting on the human.
 *
 * This is the only thing Consensus ever asks you to approve. That scarcity is
 * the point: most agent products put confirmations in front of low-stakes
 * writes and train people to click through. Here the only prompt is the
 * release of a specific page of a confidential document to a third-party
 * model, so when it appears, you read it.
 */
export function DisclosureQueue() {
  const requests = useConsensusStore((s) => s.requests);
  const pending = requests.filter((r) => r.state === 'requested');
  const count = pending.length;
  const ref = useRef<HTMLElement>(null);

  // A permission request the human never sees is a permission request that
  // silently fails. The agent has stopped and is waiting; make that visible
  // wherever they happen to be scrolled.
  useEffect(() => {
    if (count > 0) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <section ref={ref} className="sticky top-4 z-20 rounded-xl border-2 border-blue-400 bg-white p-4 shadow-lg ring-4 ring-blue-50">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">
          Your agent is asking for permission
        </h2>
        <span className="text-[11px] font-medium text-blue-600">
          {count} pending
        </span>
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
