import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import type { Challenge, EvidenceRef, Id, Proposal, Rating } from '@/lib/types';
import { scoreKey } from '@/lib/types';
import type { ConsensusStore } from './index';

/**
 * Proposals and challenges — the capability boundary in structural form.
 *
 * Agent output enters as a Proposal and becomes a Score only when a human
 * accepts it. There is no path from a tool call to a committed value that does
 * not pass through this queue.
 *
 * That is what "the agent owns evidence, the human owns values" means in code
 * rather than in a system prompt. The agent can propose a 2, argue for a 2, and
 * cite three pages supporting a 2. The number in the cell changes when a person
 * decides it should.
 */
export interface ProposalSlice {
  proposals: Proposal[];
  challenges: Challenge[];

  addProposal: (proposal: Proposal) => void;
  /** ⚠ HUMAN ONLY. Commits a proposal into the matrix. */
  acceptProposal: (id: Id) => void;
  /** ⚠ HUMAN ONLY. */
  rejectProposal: (id: Id) => void;

  addChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'state'>) => Id;
  /** ⚠ HUMAN ONLY. */
  resolveChallenge: (id: Id, state: 'accepted' | 'dismissed') => void;
  openChallengeFor: (optionId: Id, criterionId: Id) => Challenge | undefined;

  resetProposals: () => void;
}

export const createProposalSlice: StateCreator<
  ConsensusStore,
  [['zustand/immer', never]],
  [],
  ProposalSlice
> = (set, get) => ({
  proposals: [],
  challenges: [],

  addProposal: (proposal) =>
    set((s) => {
      // One live proposal per cell. A second proposal for the same cell
      // replaces the first rather than stacking — otherwise an agent working
      // through a matrix buries the human in near-duplicate cards.
      if (proposal.kind === 'score') {
        s.proposals = s.proposals.filter(
          (p) =>
            p.kind !== 'score' ||
            p.optionId !== proposal.optionId ||
            p.criterionId !== proposal.criterionId
        );
      }
      s.proposals.push(proposal);
    }),

  /**
   * ⚠ HUMAN ONLY. The only path from agent output to a committed value.
   *
   * Writes across slices, which is why it lives here rather than in
   * matrixSlice: it needs the proposal and the matrix in one atomic update,
   * and `set` receives the whole composed store.
   */
  acceptProposal: (id) =>
    set((s) => {
      const proposal = s.proposals.find((p) => p.id === id);
      if (!proposal) return;

      if (proposal.kind === 'criterion') {
        s.criteria.push({
          id: nanoid(8),
          name: proposal.name,
          description: proposal.description,
          weight: proposal.suggestedWeight,
          createdBy: 'agent-proposed-human-accepted',
          createdAt: Date.now(),
        });
      } else {
        s.scores[scoreKey(proposal.optionId, proposal.criterionId)] = {
          optionId: proposal.optionId,
          criterionId: proposal.criterionId,
          value: proposal.value,
          rationale: proposal.rationale,
          evidenceRefs: proposal.evidenceRefs,
          source: 'agent-proposed-human-accepted',
          updatedAt: Date.now(),
        };
      }

      s.proposals = s.proposals.filter((p) => p.id !== id);
    }),

  rejectProposal: (id) =>
    set((s) => {
      s.proposals = s.proposals.filter((p) => p.id !== id);
    }),

  addChallenge: (challenge) => {
    const id = nanoid(8);
    set((s) => {
      // One open challenge per cell. The agent restating its case updates the
      // card rather than stacking a second one on top of it.
      s.challenges = s.challenges.filter(
        (c) =>
          c.state !== 'open' ||
          c.optionId !== challenge.optionId ||
          c.criterionId !== challenge.criterionId
      );
      s.challenges.push({ ...challenge, id, state: 'open', createdAt: Date.now() });
    });
    return id;
  },

  resolveChallenge: (id, state) =>
    set((s) => {
      const challenge = s.challenges.find((c) => c.id === id);
      if (challenge) challenge.state = state;
    }),

  openChallengeFor: (optionId, criterionId) =>
    get().challenges.find(
      (c) => c.state === 'open' && c.optionId === optionId && c.criterionId === criterionId
    ),

  resetProposals: () =>
    set((s) => {
      s.proposals = [];
      s.challenges = [];
    }),
});

/** Shape helpers so the tools construct proposals consistently. */
export function makeScoreProposal(
  optionId: Id, criterionId: Id, value: Rating,
  rationale: string, evidenceRefs: EvidenceRef[]
): Proposal {
  return { kind: 'score', id: nanoid(8), optionId, criterionId, value, rationale, evidenceRefs, createdAt: Date.now() };
}

export function makeCriterionProposal(
  name: string, suggestedWeight: Rating, description?: string
): Proposal {
  return { kind: 'criterion', id: nanoid(8), name, description, suggestedWeight, createdAt: Date.now() };
}
