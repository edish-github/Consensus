import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createMatrixSlice, type MatrixSlice } from './matrixSlice';
import { createVaultSlice, type VaultSlice } from './vaultSlice';
import { createDisclosureSlice, type DisclosureSlice } from './disclosureSlice';
import { createProposalSlice, type ProposalSlice } from './proposalSlice';

export type ConsensusStore = MatrixSlice & VaultSlice & DisclosureSlice & ProposalSlice;

/**
 * One store, four slices.
 *
 * ⚠ THE ARCHITECTURAL REASON FOR ZUSTAND:
 *
 * A tool's execute() runs from the WebMCP host, not from a React render. It
 * cannot use hooks. Every tool therefore imports `store` and calls
 * `store.getState()` directly:
 *
 *     import { store } from '@/lib/store';
 *     const state = store.getState();
 *
 * React Context cannot do this. That single constraint is why the store is
 * Zustand and why it is created at module scope rather than in a provider.
 *
 * The consequence is the thing the product claims: the state the agent's tools
 * mutate is literally the same object the UI renders. Human and agent are
 * demonstrably looking at one artifact, not two synchronised copies.
 *
 * immer is used so mutations preserve object identity where possible, which is
 * what lets Motion's `layout` prop animate a reorder instead of remounting rows.
 */
export const useConsensusStore = create<ConsensusStore>()(
  immer((...args) => ({
    ...createMatrixSlice(...args),
    ...createVaultSlice(...args),
    ...createDisclosureSlice(...args),
    ...createProposalSlice(...args),
  }))
);

/** Vanilla handle for tool execute() functions and tests. Same store. */
export const store = useConsensusStore;

/** Reset everything. Used by tests and the workspace reset control. */
export function resetAll(): void {
  const s = store.getState();
  s.resetMatrix();
  s.resetVault();
  s.resetDisclosure();
  s.resetProposals();
}
