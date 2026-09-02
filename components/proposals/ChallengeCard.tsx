'use client';

import { motion } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { releaseManyByHumanAction } from '@/lib/gate/humanRelease';
import { SPRING } from '@/components/ui/tokens';
import type { Challenge } from '@/lib/types';

/**
 * ★ THE 1:30 DEMO MOMENT.
 *
 * The agent disagrees with a score the human entered, and can only say so.
 *
 * Three things are deliberate about this card:
 *
 *  1. It is ANCHORED. It names the exact cell, and the cell itself carries a
 *     matching ring. A challenge floating in a sidebar reads as a notification;
 *     a challenge attached to the number it disputes reads as an argument.
 *
 *  2. Read and unread evidence are visually SEPARATE. What the agent has
 *     verified and what it merely suspects are different claims, and collapsing
 *     them would be the exact dishonesty the product exists to avoid.
 *
 *  3. There is no "accept" that changes the score. The human can release the
 *     unread pages, dismiss the challenge, or go and change the number
 *     themselves. The agent never gets a button that moves a value.
 */
export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const optionName = useConsensusStore(
    (s) => s.options.find((o) => o.id === challenge.optionId)?.name ?? challenge.optionId
  );
  const criterionName = useConsensusStore(
    (s) => s.criteria.find((c) => c.id === challenge.criterionId)?.name ?? challenge.criterionId
  );
  const documents = useConsensusStore((s) => s.documents);
  const resolve = useConsensusStore((s) => s.resolveChallenge);

  const requests = useConsensusStore((s) => s.requests);
  const stillPending = challenge.pendingRequestIds.filter(
    (id) => requests.find((r) => r.id === id)?.state === 'requested'
  );

  const filename = (documentId: string) =>
    documents.find((d) => d.id === documentId)?.filename ?? documentId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="rounded-xl border-2 border-red-300 bg-red-50/50 p-4"
    >
      <div className="flex items-baseline gap-2">
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-800">
          challenge
        </span>
        <span className="text-xs font-semibold text-neutral-900">
          {optionName} · {criterionName}
        </span>
        <span className="ml-auto text-xs text-neutral-600">
          you scored{' '}
          <span className="font-semibold tabular-nums text-neutral-900">
            {challenge.disputedValue}
          </span>
        </span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-neutral-800">{challenge.argument}</p>

      {challenge.evidenceRefs.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
            Read and verified
          </p>
          <ul className="mt-1 space-y-0.5">
            {challenge.evidenceRefs.map((ref) => (
              <li key={`${ref.documentId}:${ref.page}`} className="text-[11px] text-neutral-700">
                <code>{filename(ref.documentId)}</code> p.{ref.page}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── The unusual part. The agent admits what it has not seen. ── */}
      {challenge.unreadRefs.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-white p-2.5">
          <p className="text-xs font-medium text-neutral-900">
            &ldquo;I have not read these. May I?&rdquo;
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {challenge.unreadRefs.map((ref) => (
              <li key={`${ref.documentId}:${ref.page}`} className="text-[11px] text-neutral-600">
                <code>{filename(ref.documentId)}</code> p.{ref.page}
              </li>
            ))}
          </ul>

          {stillPending.length > 0 && (
            <button
              type="button"
              onClick={() => releaseManyByHumanAction(stillPending)}
              className="mt-2.5 w-full rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
            >
              Release {stillPending.length} {stillPending.length === 1 ? 'page' : 'pages'}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => resolve(challenge.id, 'dismissed')}
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Dismiss
        </button>
        <p className="text-[10px] leading-snug text-neutral-500">
          The agent cannot change this score. If you agree, edit the cell yourself.
        </p>
      </div>
    </motion.div>
  );
}
