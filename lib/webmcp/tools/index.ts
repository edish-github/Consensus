import { getDecisionState } from './getDecisionState';
import { listDocuments } from './listDocuments';
import { locateEvidence } from './locateEvidence';
import { requestDisclosure } from './requestDisclosure';
import { readSnippet } from './readSnippet';
import { explainRanking } from './explainRanking';
import type { AnyToolDefinition } from '../types';
import type { Capabilities } from '@/lib/store/selectors';

/**
 * The tool catalogue.
 *
 * BATCH 4: six tools, all running against real state. No fixtures remain.
 * The proposal and challenge tools land in B2-07 through B2-09.
 *
 * Registration is capability-gated: each tool declares what it actually needs.
 * Remove every document and the four document tools unregister, because
 * `documents` stops being satisfied and the registry diffs against the new set.
 */
export const ALL_TOOLS: AnyToolDefinition[] = [
  getDecisionState,
  listDocuments,
  locateEvidence,
  requestDisclosure,
  readSnippet,
  explainRanking,
];

export function toolsFor(caps: Capabilities): AnyToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.requires.every((cap) => caps[cap]));
}

export {
  getDecisionState, listDocuments, locateEvidence,
  requestDisclosure, readSnippet, explainRanking,
};
