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
 * Capabilities.
 *
 * Each tool is gated on the capability it actually needs, rather than
 * a rigid linear sequence.
 */
export interface Capabilities {
  documents: boolean;   // at least one indexed document
  matrix: boolean;      // at least one option AND one criterion
  humanScore: boolean;  // a human has entered a judgement to argue with
}

let lastCapsArgs: [boolean, boolean, boolean] | null = null;
let cachedCaps: Capabilities = { documents: false, matrix: false, humanScore: false };

export function selectCapabilities(s: ConsensusStore): Capabilities {
  const documents = s.documents.some((d) => d.status === 'ready');
  const matrix = s.options.length > 0 && s.criteria.length > 0;
  const humanScore = Object.values(s.scores).some((sc) => sc.source === 'human');

  if (
    lastCapsArgs &&
    lastCapsArgs[0] === documents &&
    lastCapsArgs[1] === matrix &&
    lastCapsArgs[2] === humanScore
  ) {
    return cachedCaps;
  }

  cachedCaps = { documents, matrix, humanScore };
  lastCapsArgs = [documents, matrix, humanScore];
  return cachedCaps;
}

/**
 * Derived score for the progress indicator. Never used for registration.
 */
export function selectPhase(s: ConsensusStore): ToolPhase {
  const c = selectCapabilities(s);
  return (Number(c.documents) + Number(c.matrix) + Number(c.humanScore)) as ToolPhase;
}

export function selectOptionName(s: ConsensusStore, id: Id): string {
  return s.options.find((o) => o.id === id)?.name ?? id;
}

export function selectCriterionName(s: ConsensusStore, id: Id): string {
  return s.criteria.find((c) => c.id === id)?.name ?? id;
}

