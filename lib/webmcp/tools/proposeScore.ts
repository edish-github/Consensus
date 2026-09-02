import { ok, err, HINTS } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { makeScoreProposal } from '@/lib/store/proposalSlice';
import { isRating, type EvidenceRef, type Rating } from '@/lib/types';

/**
 * CLASS C · proposal · requires: matrix
 *
 * Suggests a cell score with reasoning and the evidence it rests on. Sets nothing.
 *
 * ⚠ EVIDENCE IS VALIDATED, NOT TAKEN ON TRUST.
 *
 * Every cited page must actually have been released. An agent that cites a
 * page it has not read gets BOUNDARY_VIOLATION, not a warning.
 *
 * The alternative — accepting citations at face value — would make the
 * provenance chips decorative. A chip that might point at a page nobody
 * released is worse than no chip, because it looks like verification.
 *
 * An agent that genuinely wants to propose without evidence can: pass no
 * evidenceRefs and say so in the rationale. That score then shows up in
 * gaps.scoresWithoutEvidence and renders with a "no source" marker, which is
 * the honest outcome.
 */
interface Input {
  optionId: string;
  criterionId: string;
  value: number;
  rationale: string;
  evidenceRefs?: { documentId: string; page: number }[];
}

export const proposeScore: ToolDefinition<Input, unknown> = {
  name: 'propose_score',
  description: DESCRIPTIONS.propose_score,
  requires: ['matrix'],
  klass: 'C',
  annotations: { title: 'Propose a score' },
  inputSchema: {
    type: 'object',
    properties: {
      optionId: { type: 'string' },
      criterionId: { type: 'string' },
      value: { type: 'integer', minimum: 1, maximum: 5 },
      rationale: { type: 'string', maxLength: 200 },
      evidenceRefs: {
        type: 'array',
        maxItems: 4,
        items: {
          type: 'object',
          properties: { documentId: { type: 'string' }, page: { type: 'integer', minimum: 1 } },
          required: ['documentId', 'page'],
          additionalProperties: false,
        },
        description: 'Pages you have actually read. Omit and say so in the rationale if you have none.',
      },
    },
    required: ['optionId', 'criterionId', 'value', 'rationale'],
    additionalProperties: false,
  },

  async execute(input) {
    const s = store.getState();

    if (!s.options.some((o) => o.id === input?.optionId)) {
      return err('NOT_FOUND', `No option with id ${String(input?.optionId)}`, {
        hint: HINTS.CALL_STATE_FOR_IDS,
      });
    }
    if (!s.criteria.some((c) => c.id === input?.criterionId)) {
      return err('NOT_FOUND', `No criterion with id ${String(input?.criterionId)}`, {
        hint: HINTS.CALL_STATE_FOR_IDS,
      });
    }
    if (!isRating(input?.value)) {
      return err('VALIDATION_FAILED', 'value must be an integer from 1 to 5', {
        hint: 'Scores run 1 to 5, where 5 is best.',
      });
    }
    const rationale = typeof input?.rationale === 'string' ? input.rationale.trim() : '';
    if (!rationale) {
      return err('VALIDATION_FAILED', 'rationale is required', {
        hint: 'Say why. The user reads this before accepting or rejecting.',
      });
    }

    // ── Evidence validation. Citations must be earned. ──
    const refs: EvidenceRef[] = [];
    for (const ref of input?.evidenceRefs ?? []) {
      const seal = s.sealStateFor(ref.documentId, ref.page);
      if (seal !== 'released') {
        const filename = s.documents.find((d) => d.id === ref.documentId)?.filename ?? ref.documentId;
        return err(
          'BOUNDARY_VIOLATION',
          `Cannot cite ${filename} page ${ref.page}: it was never released to you`,
          { hint: HINTS.REQUEST_FIRST }
        );
      }
      refs.push({ documentId: ref.documentId, page: ref.page });
    }

    s.addProposal(
      makeScoreProposal(input.optionId, input.criterionId, input.value as Rating, rationale, refs)
    );

    return ok({
      status: 'proposed',
      value: input.value,
      citedPages: refs.length,
      note:
        refs.length > 0
          ? 'A proposal card is in front of the user with your citations attached. The score changes only if they accept.'
          : 'A proposal card is in front of the user. It carries no citations, so if accepted it will be marked "no source" in the matrix.',
    });
  },
};
