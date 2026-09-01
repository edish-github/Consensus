import { getDecisionState } from './getDecisionState';
import { locateEvidence } from './locateEvidence';
import { readSnippet } from './readSnippet';
import type { AnyToolDefinition, ToolPhase } from '../types';

/**
 * The tool catalogue.
 *
 * BLOCK 0: three tools. The full ten arrive in B2-05 through B2-08.
 *
 * Block 0 registers everything regardless of phase so the permission protocol
 * can be exercised immediately. Phase gating goes live in B2-11, at which
 * point toolsForPhase() starts doing real work.
 */
export const ALL_TOOLS: AnyToolDefinition[] = [
  getDecisionState,
  locateEvidence,
  readSnippet,
];

export function toolsForPhase(phase: ToolPhase): AnyToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.minPhase <= phase);
}

export { getDecisionState, locateEvidence, readSnippet };
