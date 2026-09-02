import type { Id, PageSealState } from '@/lib/types';
import type { RawHit } from './index';

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  SECURITY BARRIER 2 OF 2 — THE MOST SECURITY-CRITICAL FILE IN THE PROJECT
 *
 *  This function is the only thing standing between the local search index and
 *  the agent's context window. It must never return document text.
 *
 *  Note the implementation detail that matters: the output object is
 *  CONSTRUCTED FIELD BY FIELD. It is never built by spreading a hit and
 *  deleting what we do not want. Deletion-based sanitising fails open — add a
 *  field upstream and it leaks silently. Construction fails closed: a new
 *  upstream field simply does not appear.
 *
 *  DO NOT ADD A TEXT FIELD HERE.
 *  Not a preview. Not a highlighted excerpt. Not "just the matched term".
 *  If the agent needs text, that is what request_disclosure exists for.
 *
 *  evals/security.spec.ts fuzzes 200 queries against every 20-character
 *  shingle of the corpus and asserts zero appear in this output.
 * ══════════════════════════════════════════════════════════════════════════
 */

export interface EvidenceLocation {
  documentId: Id;
  filename: string;
  page: number;
  /** Distinct sub-chunks on this page that matched. A density signal, not content. */
  matchCount: number;
  /** 0–1, normalised against the best hit in this result set. */
  relevance: number;
  sealState: PageSealState;
}

export interface ProjectionContext {
  filenameFor: (documentId: Id) => string;
  sealStateFor: (documentId: Id, page: number) => PageSealState;
  /** Restrict to one option's documents, or undefined for all. */
  allowedDocumentIds?: Set<Id>;
}

export function projectToMetadata(
  hits: RawHit[],
  ctx: ProjectionContext,
  limit: number
): EvidenceLocation[] {
  const scoped = ctx.allowedDocumentIds
    ? hits.filter((h) => ctx.allowedDocumentIds!.has(h.documentId))
    : hits;

  if (scoped.length === 0) return [];

  // Collapse sub-chunk hits to page granularity, because the page is the unit
  // the human will be asked to release.
  const byPage = new Map<string, { documentId: Id; page: number; count: number; best: number }>();

  for (const hit of scoped) {
    const key = `${hit.documentId}:${hit.page}`;
    const existing = byPage.get(key);
    if (existing) {
      existing.count += 1;
      existing.best = Math.max(existing.best, hit.score);
    } else {
      byPage.set(key, {
        documentId: hit.documentId,
        page: hit.page,
        count: 1,
        best: hit.score,
      });
    }
  }

  const groups = [...byPage.values()].sort((a, b) => b.best - a.best);
  const topScore = groups[0]?.best ?? 1;

  return groups.slice(0, limit).map((g) => ({
    documentId: g.documentId,
    filename: ctx.filenameFor(g.documentId),
    page: g.page,
    matchCount: g.count,
    relevance: Number((g.best / topScore).toFixed(2)),
    sealState: ctx.sealStateFor(g.documentId, g.page),
    // NO TEXT FIELD. See the block comment above.
  }));
}
