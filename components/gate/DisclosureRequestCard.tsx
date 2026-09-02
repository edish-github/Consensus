'use client';

import { motion } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { releaseByHumanAction, denyByHumanAction } from '@/lib/gate/humanRelease';
import { SPRING } from '@/components/ui/tokens';
import type { DisclosureRequest } from '@/lib/types';

/**
 * One pending request.
 *
 * Release goes through lib/gate/humanRelease.ts, which is the single
 * human-authored path to `approveRequest`. The challenge card uses the same
 * helper, so there remain exactly two references to approveRequest in the
 * codebase: the slice that defines it, and that one module.
 *
 * Two deliberate UX decisions:
 *
 *  1. Deny comes first in the tab order. Someone tabbing through a queue should
 *     not release a confidential page by pressing space out of habit.
 *
 *  2. The agent's reason is shown verbatim. It is the only basis the human has
 *     for the decision, and paraphrasing would put our words in the agent's
 *     mouth at exactly the moment that matters.
 */
export function DisclosureRequestCard({ request }: { request: DisclosureRequest }) {
  const filename = useConsensusStore(
    (s) => s.documents.find((d) => d.id === request.documentId)?.filename ?? request.documentId
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SPRING}
      className="rounded-lg border border-blue-200 bg-blue-50/60 p-3"
    >
      <div className="flex items-baseline gap-2">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-800">
          wants to read
        </span>
        <code className="min-w-0 flex-1 truncate text-xs font-semibold text-neutral-900" title={filename}>
          {filename}
        </code>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-700">
          p.{request.page}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-neutral-700">
        <span className="text-neutral-400">Reason: </span>
        {request.reason}
      </p>

      {request.reRequestCount > 0 && (
        <p className="mt-1.5 text-[10px] text-amber-700">
          Asked again after you declined. A second refusal is final for this session.
        </p>
      )}

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => denyByHumanAction(request.id)}
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Deny
        </button>
        <button
          type="button"
          onClick={() => releaseByHumanAction(request.id)}
          className="rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-neutral-700"
        >
          Release page {request.page}
        </button>
      </div>
    </motion.li>
  );
}
