import { getDecisionState } from './getDecisionState';
import { locateEvidence } from './locateEvidence';
import { readSnippet } from './readSnippet';
import { explainRanking } from './explainRanking';
import type { AnyToolDefinition, ToolPhase } from '../types';

/**
 * The tool catalogue.
 *
 * BLOCK 2: four tools. get_decision_state and explain_ranking now read the real
 * store; locate_evidence and read_snippet remain on fixtures until the vault
 * and gate land in B1-07 and B2-01.
 *
 * Phase gating is live from here. toolsForPhase is what the registry diffs
 * against, so removing every document really does unregister the search tools.
 */
export const ALL_TOOLS: AnyToolDefinition[] = [
  getDecisionState,
  locateEvidence,
  readSnippet,
  explainRanking,
];

export function toolsForPhase(phase: ToolPhase): AnyToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.minPhase <= phase);
}

export { getDecisionState, locateEvidence, readSnippet, explainRanking };
