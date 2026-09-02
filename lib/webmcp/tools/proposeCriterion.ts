import { ok, err } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { makeCriterionProposal } from '@/lib/store/proposalSlice';
import { isRating, type Rating } from '@/lib/types';

/**
 * CLASS C · proposal · requires: nothing
 *
 * Suggests a criterion. Adds nothing.
 *
 * Registered with no capability requirement because an empty workspace is
 * exactly where this is most useful — "what should I be comparing on?" is the
 * first question, and an agent that cannot answer it until the human has
 * already built the matrix is answering it too late.
 */
interface Input {
  name: string;
  description?: string;
  suggestedWeight: number;
}

export const proposeCriterion: ToolDefinition<Input, unknown> = {
  name: 'propose_criterion',
  description: DESCRIPTIONS.propose_criterion,
  requires: [],
  klass: 'C',
  annotations: { title: 'Propose a criterion' },
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 40 },
      description: { type: 'string', maxLength: 140 },
      suggestedWeight: { type: 'integer', minimum: 1, maximum: 5 },
    },
    required: ['name', 'suggestedWeight'],
    additionalProperties: false,
  },

  async execute(input) {
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    if (!name) {
      return err('VALIDATION_FAILED', 'name is required', {
        hint: 'Give the criterion a short name, for example "SOC 2 coverage".',
      });
    }
    if (!isRating(input?.suggestedWeight)) {
      return err('VALIDATION_FAILED', 'suggestedWeight must be an integer from 1 to 5', {
        hint: 'Weights run 1 to 5. The user can change it after accepting.',
      });
    }

    const s = store.getState();
    if (s.criteria.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return err('VALIDATION_FAILED', `A criterion named "${name}" already exists`, {
        hint: 'Call get_decision_state to see the current criteria.',
      });
    }

    s.addProposal(
      makeCriterionProposal(name, input.suggestedWeight as Rating, input?.description?.trim())
    );

    return ok({
      status: 'proposed',
      name,
      note: 'A suggestion card is now in front of the user. Nothing has been added to the matrix. Only the user can add a criterion or set its weight.',
    });
  },
};
