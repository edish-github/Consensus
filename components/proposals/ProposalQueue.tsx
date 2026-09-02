'use client';

import { AnimatePresence } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { ScoreProposalCard } from './ScoreProposalCard';
import { CriterionProposalCard } from './CriterionProposalCard';
import { ChallengeCard } from './ChallengeCard';

/**
 * Everything the agent is waiting on the human for, in one place.
 *
 * Challenges come first: a disputed score is more urgent than a suggested one,
 * because it means something already in the matrix may be wrong.
 */
export function ProposalQueue() {
  const proposals = useConsensusStore((s) => s.proposals);
  const challenges = useConsensusStore((s) => s.challenges);
  const openChallenges = challenges.filter((c) => c.state === 'open');

  if (proposals.length === 0 && openChallenges.length === 0) return null;

  return (
    <section className="space-y-3">
      {openChallenges.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {openChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Your agent suggests</h2>
            <span className="text-[11px] text-neutral-500">
              {proposals.length} awaiting you
            </span>
          </div>

          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {proposals.map((proposal) =>
                proposal.kind === 'score' ? (
                  <ScoreProposalCard key={proposal.id} proposal={proposal} />
                ) : (
                  <CriterionProposalCard key={proposal.id} proposal={proposal} />
                )
              )}
            </AnimatePresence>
          </ul>

          <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">
            Nothing here is in the matrix yet. The agent cannot commit a value.
          </p>
        </div>
      )}
    </section>
  );
}
