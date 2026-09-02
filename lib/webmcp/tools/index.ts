import { getDecisionState } from './getDecisionState';
import { locateEvidence } from './locateEvidence';
import { readSnippet } from './readSnippet';
import { explainRanking } from './explainRanking';
import type { Capabilities } from '@/lib/store/selectors';
import type { AnyToolDefinition, ToolPhase } from '../types';

/**
 * The tool catalogue.
 *
 * Each tool declares the capabilities it requires (requires: (keyof Capabilities)[]).
 * toolsFor(caps) filters tools against the workspace's live capabilities.
 */
export const ALL_TOOLS: AnyToolDefinition[] = [
  getDecisionState,
  locateEvidence,
  readSnippet,
  explainRanking,
];

export function toolsFor(caps: Capabilities): AnyToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.requires.every((req) => caps[req]));
}

export function toolsForPhase(phase: ToolPhase): AnyToolDefinition[] {
  const caps: Capabilities = {
    documents: phase >= 1,
    matrix: phase >= 2,
    humanScore: phase >= 3,
  };
  return toolsFor(caps);
}

export { getDecisionState, locateEvidence, readSnippet, explainRanking };
