'use client';

import { motion } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { SPRING } from '@/components/ui/tokens';
import type { DisclosureRequest } from '@/lib/types';

/**
 * ★ THE ONLY PLACE IN THE CODEBASE THAT CAN RELEASE A PAGE.
 *
 * `approveRequest` is called here, from a click handler, and nowhere else.
 * That single fact is the product's security model. If a future change adds a
 * second call site, the claim in the README becomes false — so don't.
 *
 * Two deliberate UX decisions:
 *
 *  1. Approve is NOT the default focus target. A person tabbing through a
 *     queue should not release a confidential page by pressing space out of
 *     habit. Deny comes first in the tab order.
 *
 *  2. The agent's stated reason is shown verbatim and prominently. It is the
 *     only basis the human has for the decision, and paraphrasing it would put
 *     our words in the agent's mouth at exactly the moment that matters.
 */
export function DisclosureRequestCard({ request }: { request: DisclosureRequest }) {
  const filename = useConsensusStore(
    (s) => s.documents.find((d) => d.id === request.documentId)?.filename ?? request.documentId
  );
  const approve = useConsensusStore((s) => s.approveRequest);
  const deny = useConsensusStore((s) => s.denyRequest);

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

      {/* Deny first in the tab order — releasing a confidential page should
          never be something you do by pressing space out of habit. */}
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => deny(request.id)}
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Deny
        </button>
        <button
          type="button"
          onClick={() => approve(request.id)}
          className="rounded-lg bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-neutral-700"
        >
          Release page {request.page}
        </button>
      </div>
    </motion.li>
  );
}
