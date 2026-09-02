import type {
  Criterion, Option, RankedOption, Score, Rating,
  CriterionContribution, FlipAnalysis, Id,
} from '@/lib/types';
import { scoreKey } from '@/lib/types';

/**
 * The scoring engine.
 *
 * Deliberately simple and fully inspectable. A decision tool whose arithmetic
 * nobody understands is a decision tool nobody trusts — and on camera, a
 * ranking that moves for reasons the viewer cannot follow reads as a trick.
 *
 *   weightedTotal = Σ score(o,c) × weight(c)   over SCORED cells only
 *   maxPossible   = Σ 5 × weight(c)            over the same cells
 *   normalised    = weightedTotal / maxPossible
 *
 * Unscored cells are excluded from BOTH sides. Without that, an option nobody
 * has evaluated yet would rank last purely for being unevaluated, which is
 * both wrong and actively misleading during a partial evaluation.
 *
 * Completeness is surfaced separately so a partial leader is visibly provisional.
 */

export function computeRanking(
  options: Option[],
  criteria: Criterion[],
  scores: Record<string, Score>
): RankedOption[] {
  const rows = options.map((option) => {
    let weightedTotal = 0;
    let maxPossible = 0;
    let scoredCount = 0;

    for (const criterion of criteria) {
      const score = scores[scoreKey(option.id, criterion.id)];
      if (!score) continue;
      weightedTotal += score.value * criterion.weight;
      maxPossible += 5 * criterion.weight;
      scoredCount += 1;
    }

    return {
      rank: 0,
      optionId: option.id,
      name: option.name,
      weightedTotal,
      maxPossible,
      normalised: maxPossible > 0 ? weightedTotal / maxPossible : 0,
      completeness: criteria.length > 0 ? scoredCount / criteria.length : 0,
      scoredCount,
    } satisfies RankedOption;
  });

  // Deterministic ordering. Without a total order the layout animation jitters
  // between renders, which looks like a bug on camera.
  rows.sort(
    (a, b) =>
      b.normalised - a.normalised ||
      b.completeness - a.completeness ||
      a.name.localeCompare(b.name)
  );

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function contributionsFor(
  optionId: Id,
  criteria: Criterion[],
  scores: Record<string, Score>
): CriterionContribution[] {
  return criteria.map((criterion) => {
    const score = scores[scoreKey(optionId, criterion.id)];
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight: criterion.weight,
      score: score ? score.value : null,
      contribution: score ? score.value * criterion.weight : 0,
    };
  });
}

/**
 * The smallest single weight change that would invert the top two options.
 *
 * This is the one derived value that makes explain_ranking say something
 * genuinely useful rather than restating arithmetic: "SOC 2 coverage would
 * have to drop from 4 to 2 for Vendor B to overtake Vendor A" tells you how
 * robust the answer is.
 */
export function analyseFlip(
  options: Option[],
  criteria: Criterion[],
  scores: Record<string, Score>
): FlipAnalysis {
  const ranking = computeRanking(options, criteria, scores);
  const [first, second] = ranking;

  if (!first || !second) {
    return { possible: false, summary: 'Need at least two scored options to compare.' };
  }
  if (first.normalised === second.normalised) {
    return { possible: false, summary: `${first.name} and ${second.name} are currently tied.` };
  }

  let best: { criterion: Criterion; newWeight: Rating; delta: number } | null = null;

  for (const criterion of criteria) {
    for (const candidate of [1, 2, 3, 4, 5] as Rating[]) {
      if (candidate === criterion.weight) continue;

      const trial = criteria.map((c) =>
        c.id === criterion.id ? { ...c, weight: candidate } : c
      );
      const trialRanking = computeRanking(options, trial, scores);

      if (trialRanking[0]?.optionId === second.optionId) {
        const delta = Math.abs(candidate - criterion.weight);
        if (!best || delta < best.delta) {
          best = { criterion, newWeight: candidate, delta };
        }
      }
    }
  }

  if (!best) {
    return {
      possible: false,
      summary: `No single weight change flips ${first.name} and ${second.name}. The current order is robust to any one weight.`,
    };
  }

  return {
    possible: true,
    criterionId: best.criterion.id,
    criterionName: best.criterion.name,
    currentWeight: best.criterion.weight,
    newWeight: best.newWeight,
    summary: `Changing "${best.criterion.name}" from ${best.criterion.weight} to ${best.newWeight} would put ${second.name} ahead of ${first.name}.`,
  };
}
