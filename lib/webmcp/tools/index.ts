import { getDecisionState } from './getDecisionState';
import { listDocuments } from './listDocuments';
import { locateEvidence } from './locateEvidence';
import { explainRanking } from './explainRanking';
import { requestDisclosure } from './requestDisclosure';
import { readSnippet } from './readSnippet';
import { proposeCriterion } from './proposeCriterion';
import { proposeScore } from './proposeScore';
import { attachEvidence } from './attachEvidence';
import { flagInconsistency } from './flagInconsistency';
import type { AnyToolDefinition } from '../types';
import type { Capabilities } from '@/lib/store/selectors';

/**
 * THE COMPLETE TOOL SURFACE — ten tools, three capability classes.
 *
 *   A · read-only    get_decision_state, list_documents, locate_evidence, explain_ranking
 *   B · gated        request_disclosure, read_snippet
 *   C · proposal     propose_criterion, propose_score, attach_evidence, flag_inconsistency
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  TOOLS THAT DELIBERATELY DO NOT EXIST
 *
 *      set_score          set_weight         add_option
 *      delete_option      finalize_decision  read_document
 *
 *  Their absence is the product. The agent can find, cite, argue and propose;
 *  it cannot move a number. That is enforced here, in code, not in a system
 *  prompt — and asserted by evals/gate.spec.ts, which fails the build if any
 *  of these names ever appears.
 * ══════════════════════════════════════════════════════════════════════════
 */
export const ALL_TOOLS: AnyToolDefinition[] = [
  getDecisionState,
  listDocuments,
  locateEvidence,
  explainRanking,
  requestDisclosure,
  readSnippet,
  proposeCriterion,
  proposeScore,
  attachEvidence,
  flagInconsistency,
];

export function toolsFor(caps: Capabilities): AnyToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.requires.every((cap) => caps[cap]));
}

export {
  getDecisionState, listDocuments, locateEvidence, explainRanking,
  requestDisclosure, readSnippet,
  proposeCriterion, proposeScore, attachEvidence, flagInconsistency,
};
