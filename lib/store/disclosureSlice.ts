import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import type { DisclosureRequest, Id, LedgerEntry, PageSealState } from '@/lib/types';
import type { ConsensusStore } from './index';

/**
 * THE DISCLOSURE GATE — the security kernel.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  THE INVARIANT THAT MATTERS
 *
 *  `approveRequest` is the ONLY transition to 'released', and it is called
 *  from exactly one place in the entire codebase: the Approve button's click
 *  handler in DisclosureRequestCard.tsx.
 *
 *  No tool execute() can reach it. request_disclosure creates a request and
 *  returns; read_snippet checks the seal and returns text or a refusal. The
 *  path from "agent wants a page" to "agent has a page" runs through a human
 *  pressing a button, with no exceptions and no bypass.
 *
 *  evals/security.spec.ts asserts this. docs/SECURITY.md restates it.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * State machine:
 *
 *   sealed ──request_disclosure──► requested ──HUMAN approves──► released
 *                                      │
 *                                      └──HUMAN denies──────────► denied
 *                                                                    │
 *                                              one re-request allowed ┤
 *                                                                    ▼
 *                                                                 blocked
 *
 * `released` never survives a reload: the store is created fresh, so every
 * page reseals. A session boundary is a permission boundary.
 */

/** Beyond this many pending requests the agent is told to wait rather than queue more. */
const MAX_PENDING = 12;

/** A denied page may be asked for once more. A second refusal is final. */
const MAX_REREQUESTS = 1;

export interface DisclosureSlice {
  requests: DisclosureRequest[];
  ledger: LedgerEntry[];

  /** Called by request_disclosure. Creates a pending request; grants nothing. */
  createRequest: (
    documentId: Id,
    page: number,
    reason: string
  ) => { ok: true; requestId: Id; reRequest: boolean } | { ok: false; code: 'RATE_LIMITED' | 'BLOCKED' };

  /** ⚠ HUMAN ONLY. The only path to 'released'. One call site. */
  approveRequest: (requestId: Id) => void;
  /** ⚠ HUMAN ONLY. */
  denyRequest: (requestId: Id) => void;

  /** Records what was actually released once read_snippet hands text over. */
  recordRelease: (requestId: Id, charactersReleased: number, textHash: string) => void;

  sealStateFor: (documentId: Id, page: number) => PageSealState;
  requestById: (requestId: Id) => DisclosureRequest | undefined;
  pendingCount: () => number;
  releasedCount: () => number;

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

  createRequest: (documentId, page, reason) => {
    const state = get();

    const existing = state.requests.find(
      (r) => r.documentId === documentId && r.page === page
    );

    if (existing) {
      if (existing.state === 'released' || existing.state === 'requested') {
        return { ok: true, requestId: existing.id, reRequest: false };
      }
      if (existing.state === 'blocked') {
        return { ok: false, code: 'BLOCKED' };
      }
      if (existing.state === 'denied') {
        if (existing.reRequestCount >= MAX_REREQUESTS) {
          set((s) => {
            const r = s.requests.find((x) => x.id === existing.id);
            if (r) r.state = 'blocked';
          });
          return { ok: false, code: 'BLOCKED' };
        }
        set((s) => {
          const r = s.requests.find((x) => x.id === existing.id);
          if (!r) return;
          r.state = 'requested';
          r.reason = reason;
          r.reRequestCount += 1;
          r.requestedAt = Date.now();
          r.resolvedAt = undefined;
        });
        return { ok: true, requestId: existing.id, reRequest: true };
      }
    }

    if (state.pendingCount() >= MAX_PENDING) {
      return { ok: false, code: 'RATE_LIMITED' };
    }

    const id = nanoid(8);
    set((s) => {
      s.requests.push({
        id,
        documentId,
        page,
        reason,
        state: 'requested',
        requestedAt: Date.now(),
        reRequestCount: 0,
      });
    });
    return { ok: true, requestId: id, reRequest: false };
  },

  /**
   * ⚠ THE ONLY TRANSITION TO 'released'.
   * Called from DisclosureRequestCard's Approve handler and nowhere else.
   */
  approveRequest: (requestId) =>
    set((s) => {
      const request = s.requests.find((r) => r.id === requestId);
      if (!request || request.state !== 'requested') return;

      request.state = 'released';
      request.resolvedAt = Date.now();

      const filename = s.documents.find((d) => d.id === request.documentId)?.filename ?? request.documentId;
      s.ledger.unshift({
        id: nanoid(8),
        requestId: request.id,
        documentId: request.documentId,
        filename,
        page: request.page,
        reason: request.reason,
        decision: 'approved',
        decidedAt: Date.now(),
        charactersReleased: 0, // filled by recordRelease when the text is read
        textHash: '',
      });
    }),

  /** ⚠ HUMAN ONLY. Denials are logged too — the ledger records decisions, not just releases. */
  denyRequest: (requestId) =>
    set((s) => {
      const request = s.requests.find((r) => r.id === requestId);
      if (!request || request.state !== 'requested') return;

      request.state = request.reRequestCount >= MAX_REREQUESTS ? 'blocked' : 'denied';
      request.resolvedAt = Date.now();

      const filename = s.documents.find((d) => d.id === request.documentId)?.filename ?? request.documentId;
      s.ledger.unshift({
        id: nanoid(8),
        requestId: request.id,
        documentId: request.documentId,
        filename,
        page: request.page,
        reason: request.reason,
        decision: 'denied',
        decidedAt: Date.now(),
        charactersReleased: 0,
        textHash: '',
      });
    }),

  recordRelease: (requestId, charactersReleased, textHash) =>
    set((s) => {
      const entry = s.ledger.find((e) => e.requestId === requestId && e.decision === 'approved');
      if (!entry || entry.textHash) return; // record once
      entry.charactersReleased = charactersReleased;
      entry.textHash = textHash;
    }),

  sealStateFor: (documentId, page) =>
    get().requests.find((r) => r.documentId === documentId && r.page === page)?.state ?? 'sealed',

  requestById: (requestId) => get().requests.find((r) => r.id === requestId),

  pendingCount: () => get().requests.filter((r) => r.state === 'requested').length,

  releasedCount: () => get().requests.filter((r) => r.state === 'released').length,

  resetDisclosure: () =>
    set((s) => {
      s.requests = [];
      s.ledger = [];
    }),
});
