import type { ConsensusStore } from './index';
import type { Gaps, RankedOption, Id } from '@/lib/types';
import { computeRanking, analyseFlip } from '@/lib/scoring/rank';
import { computeGaps } from '@/lib/scoring/gaps';
import type { ToolPhase } from '@/lib/webmcp/types';

/**
 * Derived state.
 *
 * These are plain functions over a snapshot rather than hooks, so both React
 * components and tool execute() functions can call them. Same inputs, same
 * outputs, no duplicated logic between what the human sees and what the agent
 * is told.
 */

let lastRankingArgs: [unknown, unknown, unknown] | null = null;
let cachedRanking: RankedOption[] = [];

export function selectRanking(s: ConsensusStore): RankedOption[] {
  if (
    lastRankingArgs &&
    lastRankingArgs[0] === s.options &&
    lastRankingArgs[1] === s.criteria &&
    lastRankingArgs[2] === s.scores
  ) {
    return cachedRanking;
  }
  cachedRanking = computeRanking(s.options, s.criteria, s.scores);
  lastRankingArgs = [s.options, s.criteria, s.scores];
  return cachedRanking;
}

let lastGapsArgs: [unknown, unknown, unknown] | null = null;
let cachedGaps: Gaps | null = null;

export function selectGaps(s: ConsensusStore): Gaps {
  if (
    lastGapsArgs &&
    lastGapsArgs[0] === s.options &&
    lastGapsArgs[1] === s.criteria &&
    lastGapsArgs[2] === s.scores
  ) {
    return cachedGaps!;
  }
  cachedGaps = computeGaps(s.options, s.criteria, s.scores);
  lastGapsArgs = [s.options, s.criteria, s.scores];
  return cachedGaps;
}

let lastFlipArgs: [unknown, unknown, unknown] | null = null;
let cachedFlip: ReturnType<typeof analyseFlip> | null = null;

export function selectFlip(s: ConsensusStore): ReturnType<typeof analyseFlip> {
  if (
    lastFlipArgs &&
    lastFlipArgs[0] === s.options &&
    lastFlipArgs[1] === s.criteria &&
    lastFlipArgs[2] === s.scores
  ) {
    return cachedFlip!;
  }
  cachedFlip = analyseFlip(s.options, s.criteria, s.scores);
  lastFlipArgs = [s.options, s.criteria, s.scores];
  return cachedFlip;
}

/**
 * The registration phase.
 *
 * Cumulative and reversible. This is the function that makes tool registration
 * dynamic — remove every document and the disclosure tools unregister, because
 * this drops back to 0 and the registry diffs against it.
 *
 *   0  empty workspace
 *   1  at least one document indexed
 *   2  matrix has at least one option AND one criterion
 *   3  the human has entered at least one score by hand
 *      (this is what makes flag_inconsistency meaningful — there is now a
 *       human judgement for the agent to argue with)
 */
export function selectPhase(s: ConsensusStore): ToolPhase {
  const hasDocuments = s.documents.some((d) => d.status === 'ready');
  const hasMatrix = s.options.length > 0 && s.criteria.length > 0;
  const hasHumanScore = Object.values(s.scores).some((sc) => sc.source === 'human');

  if (hasDocuments && hasMatrix && hasHumanScore) return 3;
  if (hasDocuments && hasMatrix) return 2;
  if (hasDocuments) return 1;
  return 0;
}

export function selectOptionName(s: ConsensusStore, id: Id): string {
  return s.options.find((o) => o.id === id)?.name ?? id;
}

export function selectCriterionName(s: ConsensusStore, id: Id): string {
  return s.criteria.find((c) => c.id === id)?.name ?? id;
}
