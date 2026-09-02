'use client';

import { motion } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { SPRING } from '@/components/ui/tokens';
import type { ScoreProposal } from '@/lib/types';

export function ScoreProposalCard({ proposal }: { proposal: ScoreProposal }) {
  const optionName = useConsensusStore(
    (s) => s.options.find((o) => o.id === proposal.optionId)?.name ?? proposal.optionId
  );
  const criterionName = useConsensusStore(
    (s) => s.criteria.find((c) => c.id === proposal.criterionId)?.name ?? proposal.criterionId
  );
  const documents = useConsensusStore((s) => s.documents);
  const accept = useConsensusStore((s) => s.acceptProposal);
  const reject = useConsensusStore((s) => s.rejectProposal);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={SPRING}
      className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-neutral-900">
          {optionName} · {criterionName}
        </span>
        <span className="ml-auto text-sm font-semibold tabular-nums text-neutral-900">
          {proposal.value}
        </span>
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-700">{proposal.rationale}</p>

      {proposal.evidenceRefs.length > 0 ? (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {proposal.evidenceRefs.map((ref) => (
            <li
              key={`${ref.documentId}:${ref.page}`}
              className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-800"
            >
              {(documents.find((d) => d.id === ref.documentId)?.filename ?? ref.documentId).replace(/\.pdf$/, '')} p.{ref.page}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[10px] text-neutral-500">No supporting document cited.</p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => reject(proposal.id)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => accept(proposal.id)}
          className="rounded-lg bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white transition hover:bg-neutral-700"
        >
          Accept
        </button>
      </div>
    </motion.li>
  );
}
