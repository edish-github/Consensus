import { ok, err, HINTS } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { scoreKey } from '@/lib/types';

/**
 * CLASS C · annotation · requires: matrix
 *
 * Attaches an already-released page as a citation on an existing score.
 *
 * This writes directly rather than creating a proposal, and the distinction is
 * principled: the capability boundary is about VALUES, not bookkeeping. The
 * human already authorised the underlying disclosure, and recording which page
 * supports which cell changes no judgement — it only makes an existing one
 * traceable.
 *
 * Citing a page that was never released returns BOUNDARY_VIOLATION.
 */
interface Input {
  optionId: string;
  criterionId: string;
  documentId: string;
  page: number;
}

export const attachEvidence: ToolDefinition<Input, unknown> = {
  name: 'attach_evidence',
  description: DESCRIPTIONS.attach_evidence,
  requires: ['matrix'],
  klass: 'C',
  annotations: { title: 'Cite a released page' },
  inputSchema: {
    type: 'object',
    properties: {
      optionId: { type: 'string' },
      criterionId: { type: 'string' },
      documentId: { type: 'string' },
      page: { type: 'integer', minimum: 1 },
    },
    required: ['optionId', 'criterionId', 'documentId', 'page'],
    additionalProperties: false,
  },

  async execute(input) {
    const s = store.getState();
    const { optionId, criterionId, documentId, page } = input ?? {};

    if (!s.scores[scoreKey(String(optionId), String(criterionId))]) {
      return err('NOT_FOUND', 'That cell has no score to attach evidence to', {
        hint: 'Propose a score first, or ask the user to enter one.',
      });
    }

    const seal = s.sealStateFor(String(documentId), Number(page));
    if (seal !== 'released') {
      const filename = s.documents.find((d) => d.id === documentId)?.filename ?? String(documentId);
      return err(
        'BOUNDARY_VIOLATION',
        `Cannot cite ${filename} page ${page}: it was never released to you`,
        { hint: HINTS.REQUEST_FIRST }
      );
    }

    s.attachEvidenceToScore(String(optionId), String(criterionId), {
      documentId: String(documentId),
      page: Number(page),
    });

    return ok({ status: 'attached', documentId, page });
  },
};
