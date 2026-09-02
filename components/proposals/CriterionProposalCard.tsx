'use client';

import { motion } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { SPRING } from '@/components/ui/tokens';
import type { CriterionProposal } from '@/lib/types';

export function CriterionProposalCard({ proposal }: { proposal: CriterionProposal }) {
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
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-800">
          new criterion
        </span>
        <span className="text-xs font-medium text-neutral-900">{proposal.name}</span>
        <span className="ml-auto text-[11px] text-neutral-600">
          weight {proposal.suggestedWeight}
        </span>
      </div>

      {proposal.description && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-700">{proposal.description}</p>
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
