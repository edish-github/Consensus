/**
 * The complete domain model.
 *
 * One property of this file matters more than any other:
 *
 *   PageChunk.text is the ONLY field holding confidential plaintext.
 *
 * It is referenced by exactly two call sites — the search indexer and
 * read_snippet after a gate check. Keeping that surface this narrow is what
 * makes evals/security.spec.ts tractable: there are only two places a leak
 * could originate, and both are tested.
 */

export type Id = string;

/** Scores and weights are both 1–5. Narrowing the type stops out-of-range writes. */
export type Rating = 1 | 2 | 3 | 4 | 5;

export const RATINGS: readonly Rating[] = [1, 2, 3, 4, 5] as const;

export function isRating(n: unknown): n is Rating {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;
}

/* ------------------------------------------------------------------ *
 * Matrix — the co-authored artifact                                   *
 * ------------------------------------------------------------------ */

export interface Option {
  id: Id;
  name: string;
  note?: string;
  /** Documents scoped to this option, so "search Vendor B's files" is a real query. */
  documentIds: Id[];
  /** Options are always human-created. The agent has no tool that adds one. */
  createdBy: 'human';
  createdAt: number;
}

export interface Criterion {
  id: Id;
  name: string;
  description?: string;
  /** HUMAN ONLY. No registered tool can write this field. */
  weight: Rating;
  createdBy: 'human' | 'agent-proposed-human-accepted';
  createdAt: number;
}

export type ScoreSource = 'human' | 'agent-proposed-human-accepted';

export interface Score {
  optionId: Id;
  criterionId: Id;
  value: Rating;
  rationale?: string;
  evidenceRefs: EvidenceRef[];
  source: ScoreSource;
  updatedAt: number;
}

/** Composite key for the score map. Kept in one place so it cannot drift. */
export function scoreKey(optionId: Id, criterionId: Id): string {
  return `${optionId}:${criterionId}`;
}

/* ------------------------------------------------------------------ *
 * Vault — confidential documents, parsed locally, never uploaded      *
 * ------------------------------------------------------------------ */

export type DocumentStatus = 'queued' | 'parsing' | 'ready' | 'failed' | 'no-text';

export interface VaultDocument {
  id: Id;
  filename: string;
  pageCount: number;
  optionId?: Id;
  status: DocumentStatus;
  parsedAt?: number;
  /** Bytes are released once text extraction completes. Only text lives on. */
  error?: string;
}

export interface PageChunk {
  id: Id;
  documentId: Id;
  page: number;
  /** ⚠ PLAINTEXT. Never serialise this into a tool result. */
  text: string;
  subChunks: SubChunk[];
}

export interface SubChunk {
  id: Id;
  /** ⚠ PLAINTEXT. ~600 chars with 80 overlap. Retrieval unit. */
  text: string;
  offset: number;
}

/* ------------------------------------------------------------------ *
 * Gate — the disclosure boundary                                      *
 * ------------------------------------------------------------------ */

export type PageSealState = 'sealed' | 'requested' | 'released' | 'denied' | 'blocked';

export interface DisclosureRequest {
  id: Id;
  documentId: Id;
  page: number;
  /** Agent-supplied. Shown to the human before they decide. */
  reason: string;
  state: PageSealState;
  requestedAt: number;
  resolvedAt?: number;
  /** Capped at 1. A second refusal is permanent for the session. */
  reRequestCount: number;
}

export interface LedgerEntry {
  id: Id;
  requestId: Id;
  documentId: Id;
  filename: string;
  page: number;
  reason: string;
  /** Denials are logged too. The ledger is a record of decisions, not releases. */
  decision: 'approved' | 'denied';
  decidedAt: number;
  charactersReleased: number;
  textHash: string;
}

export interface EvidenceRef {
  documentId: Id;
  page: number;
  subChunkId?: Id;
  textHash?: string;
}

/* ------------------------------------------------------------------ *
 * Proposals and challenges — the agent argues, never commits          *
 * ------------------------------------------------------------------ */

export interface CriterionProposal {
  kind: 'criterion';
  id: Id;
  name: string;
  description?: string;
  suggestedWeight: Rating;
  createdAt: number;
}

export interface ScoreProposal {
  kind: 'score';
  id: Id;
  optionId: Id;
  criterionId: Id;
  value: Rating;
  rationale: string;
  evidenceRefs: EvidenceRef[];
  createdAt: number;
}

export type Proposal = CriterionProposal | ScoreProposal;

export interface Challenge {
  id: Id;
  optionId: Id;
  criterionId: Id;
  /** The human's score being disputed, captured at challenge time. */
  disputedValue: Rating;
  argument: string;
  /** Pages the agent has read. */
  evidenceRefs: EvidenceRef[];
  /** Pages it located but has NOT been allowed to read. The demo climax. */
  unreadRefs: EvidenceRef[];
  state: 'open' | 'accepted' | 'dismissed';
  createdAt: number;
}

/* ------------------------------------------------------------------ *
 * Derived                                                             *
 * ------------------------------------------------------------------ */

export interface RankedOption {
  rank: number;
  optionId: Id;
  name: string;
  weightedTotal: number;
  maxPossible: number;
  /** 0–1. weightedTotal / maxPossible over scored cells only. */
  normalised: number;
  /** 0–1. Scored cells / total criteria. A partial leader is visibly provisional. */
  completeness: number;
  scoredCount: number;
}

export interface CriterionContribution {
  criterionId: Id;
  criterionName: string;
  weight: Rating;
  score: Rating | null;
  contribution: number;
}

export interface FlipAnalysis {
  possible: boolean;
  criterionId?: Id;
  criterionName?: string;
  currentWeight?: Rating;
  newWeight?: Rating;
  /** Plain-language summary for explain_ranking. */
  summary: string;
}

export interface Gaps {
  unscoredCells: { optionId: Id; criterionId: Id }[];
  scoresWithoutEvidence: { optionId: Id; criterionId: Id }[];
}
