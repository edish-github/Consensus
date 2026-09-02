import { ok, err, HINTS } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { scoreKey, type EvidenceRef, type Id } from '@/lib/types';

/**
 * CLASS C · annotation · requires: matrix, humanScore
 *
 * ★ THE CLIMAX TOOL. This renders the 1:30 moment.
 *
 * Raises a visible challenge against a score the HUMAN entered. It changes
 * nothing. The agent's only power here is persuasion.
 *
 * ── WHY unreadRefs EXISTS ──
 *
 * Most agent tools let the model assert things it has verified. This one also
 * lets it point at pages it has located but has NOT been permitted to read,
 * rendered to the human as "I have not read these. May I?"
 *
 * That is a strange capability to give a model, and it is the most interesting
 * thing in the product. It means the agent can say: your score looks wrong,
 * here is where the evidence probably is, and I am telling you I have not seen
 * it. An agent that admits the limits of what it knows while still making the
 * case is more useful and more trustworthy than one that either stays silent
 * or guesses.
 *
 * It is also only possible because search and disclosure are separate
 * capabilities — which is only possible because execute() runs inside the page
 * that holds the plaintext.
 *
 * Requires `humanScore` because there is nothing to argue with until a person
 * has committed a judgement. Challenging the agent's own proposal would be
 * theatre.
 */
interface Input {
  optionId: string;
  criterionId: string;
  argument: string;
  evidenceRefs?: { documentId: string; page: number }[];
  unreadRefs?: { documentId: string; page: number }[];
}

export const flagInconsistency: ToolDefinition<Input, unknown> = {
  name: 'flag_inconsistency',
  description: DESCRIPTIONS.flag_inconsistency,
  requires: ['matrix', 'humanScore'],
  klass: 'C',
  annotations: { title: 'Challenge a score' },
  inputSchema: {
    type: 'object',
    properties: {
      optionId: { type: 'string' },
      criterionId: { type: 'string' },
      argument: {
        type: 'string',
        maxLength: 300,
        description: 'Why the score may be wrong. The user reads this and decides.',
      },
      evidenceRefs: {
        type: 'array', maxItems: 4,
        items: {
          type: 'object',
          properties: { documentId: { type: 'string' }, page: { type: 'integer', minimum: 1 } },
          required: ['documentId', 'page'], additionalProperties: false,
        },
        description: 'Pages you have read that support your argument.',
      },
      unreadRefs: {
        type: 'array', maxItems: 4,
        items: {
          type: 'object',
          properties: { documentId: { type: 'string' }, page: { type: 'integer', minimum: 1 } },
          required: ['documentId', 'page'], additionalProperties: false,
        },
        description: 'Pages you located but were not allowed to read. Shown as "I have not read these. May I?"',
      },
    },
    required: ['optionId', 'criterionId', 'argument'],
    additionalProperties: false,
  },

  async execute(input) {
    const s = store.getState();
    const optionId = String(input?.optionId);
    const criterionId = String(input?.criterionId);

    const score = s.scores[scoreKey(optionId, criterionId)];
    if (!score) {
      return err('NOT_FOUND', 'That cell has no score to challenge', {
        hint: HINTS.CALL_STATE_FOR_IDS,
      });
    }
    if (score.source !== 'human') {
      return err('VALIDATION_FAILED', 'That score came from your own accepted proposal', {
        hint: 'Only challenge scores the user entered themselves. Propose a revision instead.',
      });
    }

    const argument = typeof input?.argument === 'string' ? input.argument.trim() : '';
    if (!argument) {
      return err('VALIDATION_FAILED', 'argument is required', {
        hint: 'State your case. This is the only thing the user has to judge it on.',
      });
    }

    // Cited evidence must have been released — same rule as propose_score.
    const evidenceRefs: EvidenceRef[] = [];
    for (const ref of input?.evidenceRefs ?? []) {
      if (s.sealStateFor(ref.documentId, ref.page) !== 'released') {
        const filename = s.documents.find((d) => d.id === ref.documentId)?.filename ?? ref.documentId;
        return err(
          'BOUNDARY_VIOLATION',
          `Cannot cite ${filename} page ${ref.page}: it was never released to you`,
          { hint: 'Move it to unreadRefs instead, and say you have not read it.' }
        );
      }
      evidenceRefs.push({ documentId: ref.documentId, page: ref.page });
    }

    /**
     * For each unread page, create a real pending disclosure request so the
     * human can release it straight from the challenge card. The agent is not
     * granted anything — it is queueing a question, and the card gives the
     * human one gesture to answer it.
     */
    const unreadRefs: EvidenceRef[] = [];
    const pendingIds: Id[] = [];
    for (const ref of input?.unreadRefs ?? []) {
      const seal = s.sealStateFor(ref.documentId, ref.page);
      if (seal === 'released') continue; // already readable; not "unread"
      if (seal === 'blocked') continue;  // the user has settled this twice

      const filename = s.documents.find((d) => d.id === ref.documentId)?.filename ?? ref.documentId;
      const created = s.createRequest(
        ref.documentId,
        ref.page,
        `Challenging a score: ${argument.slice(0, 120)}`
      );
      if (created.ok) pendingIds.push(created.requestId);
      unreadRefs.push({ documentId: ref.documentId, page: ref.page });
      void filename;
    }

    const challengeId = s.addChallenge({
      optionId,
      criterionId,
      disputedValue: score.value,
      argument,
      evidenceRefs,
      unreadRefs,
      pendingRequestIds: pendingIds,
    });

    return ok({
      status: 'challenged',
      challengeId,
      disputedValue: score.value,
      citedPages: evidenceRefs.length,
      unreadPages: unreadRefs.length,
      note:
        unreadRefs.length > 0
          ? 'A challenge card is anchored to that cell, showing your argument and the pages you have not read. The user can release them from the card. The score is unchanged and only they can change it.'
          : 'A challenge card is anchored to that cell. The score is unchanged and only the user can change it.',
    });
  },
};
