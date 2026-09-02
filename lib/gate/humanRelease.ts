import { store } from '@/lib/store';
import type { Id } from '@/lib/types';

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  THE SINGLE HUMAN-AUTHORED RELEASE PATH.
 *
 *  `approveRequest` is called from exactly two places in the codebase: the
 *  slice that defines it, and this file. Nothing else may call it.
 *
 *  This module exists because two pieces of UI need to release a page — the
 *  approval queue and the challenge card's inline control — and duplicating
 *  the call would create two places the invariant could quietly drift.
 *  Funnelling both through here keeps the audit trivial:
 *
 *      grep -rn "approveRequest"       → 2 hits: the slice, and this file
 *      grep -rn "releaseByHumanAction" → this file, and click handlers only
 *
 *  ⚠ CALL ONLY FROM DIRECT HUMAN INTERACTION — an onClick, an onKeyDown.
 *  Never from an effect, never from a tool execute(), never from anything the
 *  agent can trigger. The entire security model is that a page crosses the
 *  boundary because a person decided it should.
 * ══════════════════════════════════════════════════════════════════════════
 */

export function releaseByHumanAction(requestId: Id): void {
  store.getState().approveRequest(requestId);
}

export function denyByHumanAction(requestId: Id): void {
  store.getState().denyRequest(requestId);
}

/**
 * Used by the challenge card: the agent has pointed at pages it has not read,
 * and the human releases them in one gesture rather than hunting the queue.
 *
 * Still a human decision. The requests already exist — the agent created them
 * through flag_inconsistency — and this only marks them released. It cannot
 * invent permission the agent never asked for.
 */
export function releaseManyByHumanAction(requestIds: Id[]): void {
  for (const id of requestIds) releaseByHumanAction(id);
}
