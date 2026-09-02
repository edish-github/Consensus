import { ok } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { explainRanking as buildExplanation } from '@/lib/scoring/explain';

/**
 * CLASS A · read-only · phase 2
 *
 * Returns the arithmetic, plus flipAnalysis — the smallest single weight change
 * that would invert the top two. That field is what lets the agent say
 * something useful about robustness rather than just restating the totals.
 */
export const explainRanking: ToolDefinition<Record<string, never>, unknown> = {
  name: 'explain_ranking',
  description: DESCRIPTIONS.explain_ranking,
  requires: ['matrix'],
  klass: 'A',
  annotations: { readOnlyHint: true, title: 'Explain the ranking' },
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },

  async execute() {
    const s = store.getState();
    return ok(buildExplanation(s.options, s.criteria, s.scores));
  },
};
