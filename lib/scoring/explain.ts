import type { Criterion, Option, Score } from '@/lib/types';
import { analyseFlip, computeRanking, contributionsFor } from './rank';

/** Shaped for the explain_ranking tool result. Arithmetic the agent can quote back. */
export function explainRanking(
  options: Option[],
  criteria: Criterion[],
  scores: Record<string, Score>
) {
  const ranking = computeRanking(options, criteria, scores);

  return {
    ranking: ranking.map((r) => ({
      rank: r.rank,
      option: r.name,
      weightedTotal: r.weightedTotal,
      maxPossible: r.maxPossible,
      normalised: Number(r.normalised.toFixed(3)),
      completeness: Number(r.completeness.toFixed(2)),
      contributions: contributionsFor(r.optionId, criteria, scores).map((c) => ({
        criterion: c.criterionName,
        weight: c.weight,
        score: c.score,
        contribution: c.contribution,
      })),
    })),
    flipAnalysis: analyseFlip(options, criteria, scores),
    method:
      'weightedTotal = sum of (score x weight) over scored cells only. Unscored cells are excluded from both the total and the maximum, so a partly-evaluated option is not penalised for being unevaluated.',
  };
}
