import type { ConsensusStore } from './index';
import type { Gaps, RankedOption, Id } from '@/lib/types';
import { computeRanking, analyseFlip } from '@/lib/scoring/rank';
import { computeGaps } from '@/lib/scoring/gaps';
import type { Capabilities } from '@/lib/webmcp/types';

export type { Capabilities };

/**
 * Derived state.
 *
 * Plain functions over a snapshot rather than hooks, so both React components
 * and tool execute() functions can call them. Same inputs, same outputs, no
 * duplicated logic between what the human sees and what the agent is told.
 *
 * ⚠ EVERY SELECTOR RETURNING AN OBJECT OR ARRAY MUST BE MEMOIZED.
 *
 * Zustand v5 uses useSyncExternalStore strictly. A selector that builds a
 * fresh array on each call makes Object.is(prev, next) always false, React
 * concludes the store changed on every render, and the app spins in an
 * infinite loop. Caching against the referentially stable [options, criteria,
 * scores] slices fixes it: immer swaps those references precisely when the
 * data changes, so the cache invalidates exactly when it should.
 */

type Deps = readonly [unknown, unknown, unknown];

function sameDeps(a: Deps | null, b: Deps): boolean {
  return a !== null && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

let rankingDeps: Deps | null = null;
let rankingCache: RankedOption[] = [];

export function selectRanking(s: ConsensusStore): RankedOption[] {
  const deps: Deps = [s.options, s.criteria, s.scores];
  if (sameDeps(rankingDeps, deps)) return rankingCache;
  rankingCache = computeRanking(s.options, s.criteria, s.scores);
  rankingDeps = deps;
  return rankingCache;
}

let gapsDeps: Deps | null = null;
let gapsCache: Gaps = { unscoredCells: [], scoresWithoutEvidence: [] };

export function selectGaps(s: ConsensusStore): Gaps {
  const deps: Deps = [s.options, s.criteria, s.scores];
  if (sameDeps(gapsDeps, deps)) return gapsCache;
  gapsCache = computeGaps(s.options, s.criteria, s.scores);
  gapsDeps = deps;
  return gapsCache;
}

let flipDeps: Deps | null = null;
let flipCache: ReturnType<typeof analyseFlip> | null = null;

export function selectFlip(s: ConsensusStore): ReturnType<typeof analyseFlip> {
  const deps: Deps = [s.options, s.criteria, s.scores];
  if (sameDeps(flipDeps, deps) && flipCache) return flipCache;
  flipCache = analyseFlip(s.options, s.criteria, s.scores);
  flipDeps = deps;
  return flipCache;
}

let capsDeps: Deps | null = null;
let capsCache: Capabilities = { documents: false, matrix: false, humanScore: false };

/**
 * What the workspace can currently support.
 *
 * This is what drives tool registration. Reversible by construction: remove
 * every document and `documents` goes false, the registry diffs against the
 * smaller set, and locate_evidence unregisters.
 */
export function selectCapabilities(s: ConsensusStore): Capabilities {
  const documents = s.documents.some((d) => d.status === 'ready');
  const matrix = s.options.length > 0 && s.criteria.length > 0;
  const humanScore = Object.values(s.scores).some((sc) => sc.source === 'human');

  const deps: Deps = [documents, matrix, humanScore];
  if (sameDeps(capsDeps, deps)) return capsCache;
  capsCache = { documents, matrix, humanScore };
  capsDeps = deps;
  return capsCache;
}

/** Count of satisfied capabilities, for the progress indicator. Never used for registration. */
export function selectSatisfiedCount(s: ConsensusStore): number {
  const c = selectCapabilities(s);
  return Number(c.documents) + Number(c.matrix) + Number(c.humanScore);
}

export function selectOptionName(s: ConsensusStore, id: Id): string {
  return s.options.find((o) => o.id === id)?.name ?? id;
}

export function selectCriterionName(s: ConsensusStore, id: Id): string {
  return s.criteria.find((c) => c.id === id)?.name ?? id;
}
