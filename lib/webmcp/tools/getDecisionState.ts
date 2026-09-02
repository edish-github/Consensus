import { ok } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { selectRanking, selectGaps } from '@/lib/store/selectors';

/**
 * CLASS A · read-only · phase 0
 *
 * BLOCK 2 UPDATE: no longer a stub. Reads the real store — the same object the
 * matrix on screen is rendering. This is the point at which the agent and the
 * human are demonstrably looking at one artifact.
 *
 * The `gaps` array is the important part of the payload. Telling the agent what
 * is MISSING reliably turns "summarise this" into "go find evidence for the
 * empty cells". Reporting only what exists produces a summary.
 */
export const getDecisionState: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_decision_state',
  description: DESCRIPTIONS.get_decision_state,
  minPhase: 0,
  klass: 'A',
  annotations: { readOnlyHint: true, title: 'Read decision state' },
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },

  async execute() {
    const s = store.getState();
    const ranking = selectRanking(s);
    const gaps = selectGaps(s);

    return ok({
      decisionTitle: s.decisionTitle,
      options: s.options.map((o) => ({ id: o.id, name: o.name, note: o.note })),
      criteria: s.criteria.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        weight: c.weight,
      })),
      scores: Object.values(s.scores).map((sc) => ({
        optionId: sc.optionId,
        criterionId: sc.criterionId,
        value: sc.value,
        source: sc.source,
        hasEvidence: sc.evidenceRefs.length > 0,
        rationale: sc.rationale,
      })),
      ranking: ranking.map((r) => ({
        rank: r.rank,
        optionId: r.optionId,
        name: r.name,
        weightedTotal: r.weightedTotal,
        normalised: Number(r.normalised.toFixed(3)),
        completeness: Number(r.completeness.toFixed(2)),
      })),
      gaps,
      documentCount: s.documents.length,
      note:
        gaps.unscoredCells.length > 0
          ? `${gaps.unscoredCells.length} cells have no score. Use locate_evidence to find supporting material, then propose scores.`
          : 'All cells are scored.',
    });
  },
};
