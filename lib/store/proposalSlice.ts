import type { StateCreator } from 'zustand';
import type { Challenge, Id, Proposal } from '@/lib/types';
import type { ConsensusStore } from './index';

/**
 * BLOCK 1: shape only. Queue UI and the challenge card land in B2-07 and B2-09.
 *
 * The capability boundary lives here in structural form: agent output enters
 * as a Proposal and only becomes a Score when a human accepts it. There is no
 * path from a tool call to a committed value that does not pass through this
 * queue.
 */
export interface ProposalSlice {
  proposals: Proposal[];
  challenges: Challenge[];

  addProposal: (proposal: Proposal) => void;
  /** HUMAN ONLY. Commits the proposal to the matrix. */
  acceptProposal: (id: Id) => void;
  /** HUMAN ONLY. */
  rejectProposal: (id: Id) => void;

  addChallenge: (challenge: Challenge) => void;
  resolveChallenge: (id: Id, state: 'accepted' | 'dismissed') => void;
  resetProposals: () => void;
}

export const createProposalSlice: StateCreator<
  ConsensusStore,
  [['zustand/immer', never]],
  [],
  ProposalSlice
> = (set) => ({
  proposals: [],
  challenges: [],

  addProposal: (proposal) =>
    set((s) => {
      s.proposals.push(proposal);
    }),

  // acceptProposal needs to write into the matrix slice, so it is composed in
  // store/index.ts where both slices are in scope. B2-07.
  acceptProposal: () => {},

  rejectProposal: (id) =>
    set((s) => {
      s.proposals = s.proposals.filter((p) => p.id !== id);
    }),

  addChallenge: (challenge) =>
    set((s) => {
      s.challenges.push(challenge);
    }),

  resolveChallenge: (id, state) =>
    set((s) => {
      const challenge = s.challenges.find((c) => c.id === id);
      if (challenge) challenge.state = state;
    }),

  resetProposals: () =>
    set((s) => {
      s.proposals = [];
      s.challenges = [];
    }),
});
