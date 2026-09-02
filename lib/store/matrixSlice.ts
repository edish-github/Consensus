import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import type { Criterion, EvidenceRef, Id, Option, Rating, Score, ScoreSource } from '@/lib/types';
import type { ConsensusStore } from './index';
import { scoreKey } from '@/lib/types';

export interface MatrixSlice {
  decisionTitle: string;
  options: Option[];
  criteria: Criterion[];
  scores: Record<string, Score>;

  setDecisionTitle: (title: string) => void;

  addOption: (name: string, note?: string) => Id;
  removeOption: (id: Id) => void;
  renameOption: (id: Id, name: string) => void;

  addCriterion: (
    name: string,
    weight: Rating,
    description?: string,
    createdBy?: Criterion['createdBy']
  ) => Id;
  removeCriterion: (id: Id) => void;
  /** HUMAN ONLY. Deliberately has no corresponding registered tool. */
  setWeight: (criterionId: Id, weight: Rating) => void;

  /** HUMAN ONLY at the tool boundary. The agent reaches this via an accepted proposal. */
  setScore: (
    optionId: Id,
    criterionId: Id,
    value: Rating,
    opts?: { source?: ScoreSource; rationale?: string; evidenceRefs?: EvidenceRef[] }
  ) => void;
  clearScore: (optionId: Id, criterionId: Id) => void;
  attachEvidenceToScore: (optionId: Id, criterionId: Id, ref: EvidenceRef) => void;

  seedDemoScenario: () => void;
  resetMatrix: () => void;
}

export const createMatrixSlice: StateCreator<
  ConsensusStore,
  [['zustand/immer', never]],
  [],
  MatrixSlice
> = (set) => ({
  decisionTitle: 'Untitled decision',
  options: [],
  criteria: [],
  scores: {},

  setDecisionTitle: (title) =>
    set((s) => {
      s.decisionTitle = title;
    }),

  addOption: (name, note) => {
    const id = nanoid(8);
    set((s) => {
      s.options.push({
        id,
        name,
        note,
        documentIds: [],
        createdBy: 'human',
        createdAt: Date.now(),
      });
    });
    return id;
  },

  removeOption: (id) =>
    set((s) => {
      s.options = s.options.filter((o) => o.id !== id);
      for (const key of Object.keys(s.scores)) {
        if (key.startsWith(`${id}:`)) delete s.scores[key];
      }
    }),

  renameOption: (id, name) =>
    set((s) => {
      const option = s.options.find((o) => o.id === id);
      if (option) option.name = name;
    }),

  addCriterion: (name, weight, description, createdBy = 'human') => {
    const id = nanoid(8);
    set((s) => {
      s.criteria.push({ id, name, description, weight, createdBy, createdAt: Date.now() });
    });
    return id;
  },

  removeCriterion: (id) =>
    set((s) => {
      s.criteria = s.criteria.filter((c) => c.id !== id);
      for (const key of Object.keys(s.scores)) {
        if (key.endsWith(`:${id}`)) delete s.scores[key];
      }
    }),

  setWeight: (criterionId, weight) =>
    set((s) => {
      const criterion = s.criteria.find((c) => c.id === criterionId);
      if (criterion) criterion.weight = weight;
    }),

  setScore: (optionId, criterionId, value, opts) =>
    set((s) => {
      const key = scoreKey(optionId, criterionId);
      const existing = s.scores[key];
      s.scores[key] = {
        optionId,
        criterionId,
        value,
        source: opts?.source ?? 'human',
        rationale: opts?.rationale ?? existing?.rationale,
        // A manual override drops inherited citations: the evidence supported the
        // old value, not the new one. Silently keeping it would be a false claim.
        evidenceRefs: opts?.evidenceRefs ?? (opts?.source ? [] : []),
        updatedAt: Date.now(),
      };
    }),

  clearScore: (optionId, criterionId) =>
    set((s) => {
      delete s.scores[scoreKey(optionId, criterionId)];
    }),

  attachEvidenceToScore: (optionId, criterionId, ref) =>
    set((s) => {
      const score = s.scores[scoreKey(optionId, criterionId)];
      if (!score) return;
      const already = score.evidenceRefs.some(
        (r) => r.documentId === ref.documentId && r.page === ref.page
      );
      if (!already) score.evidenceRefs.push(ref);
    }),

  /**
   * The rehearsal fixture. Three vendors, four criteria, a couple of human
   * scores. Having this one click away matters more than it looks: B3-04 asks
   * for fifteen-plus runs of the climax, and rebuilding the matrix by hand
   * each time is how rehearsal quietly gets skipped.
   */
  seedDemoScenario: () =>
    set((s) => {
      const now = Date.now();
      s.decisionTitle = 'Analytics vendor — Q4';
      s.options = [
        { id: 'o_a', name: 'Vendor A', documentIds: [], createdBy: 'human', createdAt: now },
        { id: 'o_b', name: 'Vendor B', documentIds: [], createdBy: 'human', createdAt: now },
        { id: 'o_c', name: 'Vendor C', documentIds: [], createdBy: 'human', createdAt: now },
      ];
      s.criteria = [
        { id: 'c_price', name: 'Price', weight: 3, createdBy: 'human', createdAt: now,
          description: 'Total annual cost including overages' },
        { id: 'c_soc2', name: 'SOC 2 coverage', weight: 4, createdBy: 'human', createdAt: now,
          description: 'Scope and qualification of the Type II report' },
        { id: 'c_resid', name: 'Data residency', weight: 2, createdBy: 'human', createdAt: now,
          description: 'Where data is processed and stored' },
        { id: 'c_integ', name: 'Integrations', weight: 3, createdBy: 'human', createdAt: now,
          description: 'Coverage of our existing stack' },
      ];
      s.scores = {
        'o_a:c_price': { optionId: 'o_a', criterionId: 'c_price', value: 4,
          source: 'human', evidenceRefs: [], updatedAt: now },
        'o_a:c_integ': { optionId: 'o_a', criterionId: 'c_integ', value: 5,
          source: 'human', evidenceRefs: [], updatedAt: now },
        'o_b:c_price': { optionId: 'o_b', criterionId: 'c_price', value: 3,
          source: 'human', evidenceRefs: [], updatedAt: now },
        'o_c:c_price': { optionId: 'o_c', criterionId: 'c_price', value: 5,
          source: 'human', evidenceRefs: [], updatedAt: now },
      };
    }),

  resetMatrix: () =>
    set((s) => {
      s.decisionTitle = 'Untitled decision';
      s.options = [];
      s.criteria = [];
      s.scores = {};
    }),
});
