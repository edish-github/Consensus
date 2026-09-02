import type { Criterion, Gaps, Option, Score } from '@/lib/types';
import { scoreKey } from '@/lib/types';

/**
 * What is missing, rather than what exists.
 *
 * This is returned by get_decision_state and it does more to steer the agent
 * than any prompt: given a list of empty cells, the agent's next move is to
 * look for evidence for them. Given only what already exists, it tends to
 * summarise instead of investigate.
 *
 * scoresWithoutEvidence is the ungrounded-claim detector. A score the agent
 * proposed with no citation shows up here, so an unsupported assertion is
 * visible by construction rather than by trusting the prose.
 */
export function computeGaps(
  options: Option[],
  criteria: Criterion[],
  scores: Record<string, Score>
): Gaps {
  const unscoredCells: Gaps['unscoredCells'] = [];
  const scoresWithoutEvidence: Gaps['scoresWithoutEvidence'] = [];

  for (const option of options) {
    for (const criterion of criteria) {
      const score = scores[scoreKey(option.id, criterion.id)];
      if (!score) {
        unscoredCells.push({ optionId: option.id, criterionId: criterion.id });
      } else if (score.evidenceRefs.length === 0) {
        scoresWithoutEvidence.push({ optionId: option.id, criterionId: criterion.id });
      }
    }
  }

  return { unscoredCells, scoresWithoutEvidence };
}
