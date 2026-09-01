/**
 * BLOCK 0 FIXTURES — delete this file at B2-05.
 *
 * Hardcoded state so the three stub tools can drive the agent through every
 * branch of the permission protocol before any real machinery exists.
 *
 * Deliberate design of the fixture: `req_002` is pre-DENIED and `req_003` is
 * pre-RELEASED, so a single session can exercise the wait path, the refusal
 * path, and the success path without waiting on UI that does not exist yet.
 *
 * The page-13 text carries a planted contradiction — a pending EU subprocessor
 * arrangement — because that is the sentence the demo climax turns on. Testing
 * against the real shape of the payoff from hour one is worth the ten minutes
 * it costs to write.
 */

export const STUB_DOCUMENTS = [
  { id: 'd_7fK2', filename: 'vendor-b-soc2.pdf', pageCount: 48, optionId: 'o_b', status: 'ready' as const },
  { id: 'd_3mQ9', filename: 'vendor-a-dpa.pdf', pageCount: 22, optionId: 'o_a', status: 'ready' as const },
  { id: 'd_8xR1', filename: 'vendor-c-pricing.pdf', pageCount: 6, optionId: 'o_c', status: 'ready' as const },
];

export const STUB_MATCHES = [
  { documentId: 'd_7fK2', filename: 'vendor-b-soc2.pdf', page: 14, matchCount: 3, relevance: 0.91, sealState: 'sealed' as const, optionId: 'o_b' },
  { documentId: 'd_3mQ9', filename: 'vendor-a-dpa.pdf', page: 13, matchCount: 2, relevance: 0.87, sealState: 'sealed' as const, optionId: 'o_a' },
  { documentId: 'd_7fK2', filename: 'vendor-b-soc2.pdf', page: 9, matchCount: 1, relevance: 0.62, sealState: 'sealed' as const, optionId: 'o_b' },
  { documentId: 'd_8xR1', filename: 'vendor-c-pricing.pdf', page: 3, matchCount: 2, relevance: 0.58, sealState: 'sealed' as const, optionId: 'o_c' },
];

export const STUB_SEALS: Record<string, { documentId: string; page: number; state: 'requested' | 'released' | 'denied' }> = {
  req_001: { documentId: 'd_7fK2', page: 14, state: 'requested' },
  req_002: { documentId: 'd_8xR1', page: 3, state: 'denied' },
  req_003: { documentId: 'd_3mQ9', page: 13, state: 'released' },
};

export const STUB_PAGE_TEXT: Record<string, string> = {
  'd_3mQ9:13':
    'Section 7.4 — Subprocessing and Data Location. The Processor maintains primary processing facilities in us-east-1 and us-west-2. An additional European Union processing region was under evaluation as of the effective date of this agreement; the EU subprocessor arrangement described in Annex C remained pending and had not been executed at the time of publication. Customers requiring in-region EU processing should confirm current status with their account representative before relying on the provisions of this section.',
};

export const STUB_STATE = {
  decisionTitle: 'Analytics vendor — Q4 (Block 0 fixture)',
  options: [
    { id: 'o_a', name: 'Vendor A' },
    { id: 'o_b', name: 'Vendor B' },
    { id: 'o_c', name: 'Vendor C' },
  ],
  criteria: [
    { id: 'c_price', name: 'Price', weight: 3 },
    { id: 'c_soc2', name: 'SOC 2 coverage', weight: 4 },
    { id: 'c_resid', name: 'Data residency', weight: 2 },
  ],
  scores: [
    { optionId: 'o_a', criterionId: 'c_price', value: 4, source: 'human', hasEvidence: false },
    { optionId: 'o_a', criterionId: 'c_resid', value: 5, source: 'human', hasEvidence: false },
  ],
  ranking: [
    { rank: 1, optionId: 'o_a', name: 'Vendor A', weightedTotal: 22, completeness: 0.67 },
    { rank: 2, optionId: 'o_b', name: 'Vendor B', weightedTotal: 0, completeness: 0 },
    { rank: 3, optionId: 'o_c', name: 'Vendor C', weightedTotal: 0, completeness: 0 },
  ],
  gaps: {
    unscoredCells: [
      { optionId: 'o_a', criterionId: 'c_soc2' },
      { optionId: 'o_b', criterionId: 'c_price' },
      { optionId: 'o_b', criterionId: 'c_soc2' },
      { optionId: 'o_b', criterionId: 'c_resid' },
      { optionId: 'o_c', criterionId: 'c_price' },
      { optionId: 'o_c', criterionId: 'c_soc2' },
      { optionId: 'o_c', criterionId: 'c_resid' },
    ],
    scoresWithoutEvidence: [
      { optionId: 'o_a', criterionId: 'c_price' },
      { optionId: 'o_a', criterionId: 'c_resid' },
    ],
  },
};
