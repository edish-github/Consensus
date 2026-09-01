import { ok } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { STUB_STATE } from './_stubData';

/**
 * CLASS A · read-only · phase 0
 *
 * The agent's orientation tool. Called first in almost every session, so its
 * output shape does more to steer behaviour than any prompt we could write.
 *
 * The `gaps` array is the important part: it tells the agent what is missing
 * rather than only what exists, which reliably turns "what is this?" into
 * "let me find evidence for the empty cells".
 *
 * BLOCK 0 STUB — returns fixture data. Replaced in B2-05 with a read of the
 * real Zustand store.
 */

interface Output {
  decisionTitle: string;
  options: { id: string; name: string }[];
  criteria: { id: string; name: string; weight: number }[];
  scores: {
    optionId: string;
    criterionId: string;
    value: number;
    source: string;
    hasEvidence: boolean;
  }[];
  ranking: { rank: number; optionId: string; name: string; weightedTotal: number; completeness: number }[];
  gaps: {
    unscoredCells: { optionId: string; criterionId: string }[];
    scoresWithoutEvidence: { optionId: string; criterionId: string }[];
  };
}

export const getDecisionState: ToolDefinition<Record<string, never>, Output> = {
  name: 'get_decision_state',
  description: DESCRIPTIONS.get_decision_state,
  minPhase: 0,
  klass: 'A',
  annotations: { readOnlyHint: true, title: 'Read decision state' },
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  async execute() {
    return ok(STUB_STATE);
  },
};
