import { getDecisionState } from './getDecisionState';
import { listDocuments } from './listDocuments';
import { locateEvidence } from './locateEvidence';
import { readSnippet } from './readSnippet';
import { explainRanking } from './explainRanking';
import type { AnyToolDefinition } from '../types';
import type { Capabilities } from '@/lib/store/selectors';

/**
 * The tool catalogue.
 *
 * BATCH 3: five tools. locate_evidence and list_documents now run against the
 * real local index; read_snippet remains on fixtures until the disclosure gate
 * lands in B2-01.
 *
 * Registration is capability-gated rather than sequenced: each tool declares
 * what it actually needs. Remove every document and locate_evidence
 * unregisters, because `documents` stops being satisfied and the registry
 * diffs against the new set.
 */
export const ALL_TOOLS: AnyToolDefinition[] = [
  getDecisionState,
  listDocuments,
  locateEvidence,
  readSnippet,
  explainRanking,
];

export function toolsFor(caps: Capabilities): AnyToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.requires.every((cap) => caps[cap]));
}

export { getDecisionState, listDocuments, locateEvidence, readSnippet, explainRanking };
