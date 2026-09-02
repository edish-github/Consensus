import { describe, it, expect, beforeEach } from 'vitest';
import { webcrypto } from 'node:crypto';
import { store, resetAll } from '@/lib/store';
import { proposeScore } from '@/lib/webmcp/tools/proposeScore';
import { proposeCriterion } from '@/lib/webmcp/tools/proposeCriterion';
import { attachEvidence } from '@/lib/webmcp/tools/attachEvidence';
import { flagInconsistency } from '@/lib/webmcp/tools/flagInconsistency';
import { ALL_TOOLS, toolsFor } from '@/lib/webmcp/tools';
import { scoreKey } from '@/lib/types';

if (!globalThis.crypto?.subtle) (globalThis as any).crypto = webcrypto;
const ctx = {};
const j = (r: unknown) => JSON.parse(JSON.stringify(r)) as any;

let optionId = '', criterionId = '';

beforeEach(() => {
  resetAll();
  const s = store.getState();
  optionId = s.addOption('Vendor A');
  criterionId = s.addCriterion('Data residency', 2);
  s.addDocument({ id: 'd1', filename: 'vendor-a-dpa.pdf', pageCount: 21, status: 'ready' });
  store.getState().setChunks('d1', [{ id: 'c13', documentId: 'd1', page: 13, text: 'EU subprocessor pending.', subChunks: [] }]);
  store.getState().updateDocumentStatus('d1', 'ready');
});

describe('the agent proposes; only the human commits', () => {
  it('propose_score does not write a score', async () => {
    const r = j(await proposeScore.execute({ optionId, criterionId, value: 2, rationale: 'EU residency unproven' }, ctx));
    expect(r.ok).toBe(true);
    expect(store.getState().scores[scoreKey(optionId, criterionId)]).toBeUndefined();
    expect(store.getState().proposals).toHaveLength(1);
  });

  it('a human accepting the proposal is what writes it', () => {
    store.getState().addProposal({
      kind: 'score', id: 'p1', optionId, criterionId, value: 2,
      rationale: 'x', evidenceRefs: [], createdAt: Date.now(),
    });
    store.getState().acceptProposal('p1');
    const written = store.getState().scores[scoreKey(optionId, criterionId)];
    expect(written?.value).toBe(2);
    expect(written?.source).toBe('agent-proposed-human-accepted');
  });

  it('propose_criterion does not add a criterion', async () => {
    const before = store.getState().criteria.length;
    const r = j(await proposeCriterion.execute({ name: 'Support SLA', suggestedWeight: 3 }, ctx));
    expect(r.ok).toBe(true);
    expect(store.getState().criteria).toHaveLength(before);
  });
});

describe('citations must be earned', () => {
  it('propose_score refuses to cite an unreleased page', async () => {
    const r = j(await proposeScore.execute({
      optionId, criterionId, value: 2, rationale: 'p13 says so',
      evidenceRefs: [{ documentId: 'd1', page: 13 }],
    }, ctx));
    expect(r.ok).toBe(false);
    expect(r.code).toBe('BOUNDARY_VIOLATION');
  });

  it('attach_evidence refuses an unreleased page', async () => {
    store.getState().setScore(optionId, criterionId, 5, { source: 'human' });
    const r = j(await attachEvidence.execute({ optionId, criterionId, documentId: 'd1', page: 13 }, ctx));
    expect(r.ok).toBe(false);
    expect(r.code).toBe('BOUNDARY_VIOLATION');
  });

  it('accepts a citation once the human has released the page', async () => {
    store.getState().setScore(optionId, criterionId, 5, { source: 'human' });
    const req = store.getState().createRequest('d1', 13, 'verify');
    if (req.ok) store.getState().approveRequest(req.requestId);
    const r = j(await attachEvidence.execute({ optionId, criterionId, documentId: 'd1', page: 13 }, ctx));
    expect(r.ok).toBe(true);
    expect(store.getState().scores[scoreKey(optionId, criterionId)]?.evidenceRefs).toHaveLength(1);
  });
});

describe('flag_inconsistency — the challenge', () => {
  it('only challenges scores the human entered', async () => {
    store.getState().setScore(optionId, criterionId, 4, { source: 'agent-proposed-human-accepted' });
    const r = j(await flagInconsistency.execute({ optionId, criterionId, argument: 'wrong' }, ctx));
    expect(r.ok).toBe(false);
    expect(r.code).toBe('VALIDATION_FAILED');
  });

  it('challenges a human score without changing it, and queues the unread pages', async () => {
    store.getState().setScore(optionId, criterionId, 5, { source: 'human' });
    const r = j(await flagInconsistency.execute({
      optionId, criterionId,
      argument: 'Three matches on p.13 appear inconsistent with a 5.',
      unreadRefs: [{ documentId: 'd1', page: 13 }],
    }, ctx));

    expect(r.ok).toBe(true);
    expect(r.data.unreadPages).toBe(1);
    // the score is untouched
    expect(store.getState().scores[scoreKey(optionId, criterionId)]?.value).toBe(5);
    // a real disclosure request now exists for the human to answer
    const challenge = store.getState().challenges[0]!;
    expect(challenge.pendingRequestIds).toHaveLength(1);
    expect(store.getState().sealStateFor('d1', 13)).toBe('requested');
  });
});

describe('the complete tool surface', () => {
  it('registers exactly ten tools', () => {
    expect(ALL_TOOLS).toHaveLength(10);
  });

  for (const forbidden of ['set_score', 'set_weight', 'add_option', 'delete_option', 'finalize_decision', 'read_document']) {
    it(`never registers a tool named ${forbidden}`, () => {
      expect(ALL_TOOLS.map((t) => t.name)).not.toContain(forbidden);
    });
  }

  it('gates flag_inconsistency behind a human score', () => {
    const without = toolsFor({ documents: true, matrix: true, humanScore: false }).map((t) => t.name);
    const with_ = toolsFor({ documents: true, matrix: true, humanScore: true }).map((t) => t.name);
    expect(without).not.toContain('flag_inconsistency');
    expect(with_).toContain('flag_inconsistency');
  });

  it('unregisters every document tool when the vault empties', () => {
    const names = toolsFor({ documents: false, matrix: true, humanScore: true }).map((t) => t.name);
    for (const gated of ['locate_evidence', 'request_disclosure', 'read_snippet']) {
      expect(names).not.toContain(gated);
    }
    expect(names).toContain('get_decision_state');
  });
});
