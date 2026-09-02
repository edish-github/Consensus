import type { StateCreator } from 'zustand';
import type { DisclosureRequest, Id, LedgerEntry, PageSealState } from '@/lib/types';
import type { ConsensusStore } from './index';

/**
 * BLOCK 1: shape only. The full gate lands in B2-01.
 *
 * ⚠ THE INVARIANT THAT MATTERS, stated here so it is stated before the code
 * that could violate it exists:
 *
 *   The transition to 'released' is callable from exactly ONE place —
 *   the approval card's click handler. No tool execute() may reach it.
 *
 * Enforced by evals/security.spec.ts and restated in docs/SECURITY.md.
 */
export interface DisclosureSlice {
  requests: DisclosureRequest[];
  ledger: LedgerEntry[];

  createRequest: (documentId: Id, page: number, reason: string) => Id;
  /** HUMAN ONLY. */
  approveRequest: (requestId: Id) => void;
  /** HUMAN ONLY. */
  denyRequest: (requestId: Id) => void;
  sealStateFor: (documentId: Id, page: number) => PageSealState;
  resetDisclosure: () => void;
}

export const createDisclosureSlice: StateCreator<
  ConsensusStore,
  [['zustand/immer', never]],
  [],
  DisclosureSlice
> = (set, get) => ({
  requests: [],
  ledger: [],

  createRequest: () => {
    // Implemented in B2-01.
    return '';
  },
  approveRequest: () => {},
  denyRequest: () => {},

  sealStateFor: (documentId, page) => {
    const request = get().requests.find(
      (r) => r.documentId === documentId && r.page === page
    );
    return request?.state ?? 'sealed';
  },

  resetDisclosure: () =>
    set((s) => {
      s.requests = [];
      s.ledger = [];
    }),
});
