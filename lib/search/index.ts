import MiniSearch from 'minisearch';
import type { Id, PageChunk } from '@/lib/types';

/**
 * The local BM25 index.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  SECURITY BARRIER 1 OF 2
 *
 *  `storeFields` does NOT include `text`.
 *
 *  MiniSearch indexes the text (that is how search works) but stores only the
 *  listed fields for retrieval. A search result therefore has no text field at
 *  all — not a truncated one, not an empty one. It does not exist.
 *
 *  This means a careless `{...hit}` spread in a future refactor cannot leak
 *  document content, because there is nothing to spread. The projection layer
 *  in project.ts is barrier 2; either alone would be a single point of failure.
 *
 *  DO NOT ADD 'text' TO storeFields.
 *  evals/security.spec.ts fuzzes the corpus against this. It will fail.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Why BM25 and not embeddings: a semantic index would retrieve slightly better
 * and requires a ~25MB model download that can stall on demo day. Over a corpus
 * of five documents, lexical search is more than sufficient and always loads.
 * This is a deliberate constraint, not a shortcut.
 */

export interface IndexedSubChunk {
  id: Id;
  documentId: Id;
  page: number;
  text: string;
}

export interface RawHit {
  id: Id;
  documentId: Id;
  page: number;
  score: number;
}

function createIndex(): MiniSearch<IndexedSubChunk> {
  return new MiniSearch<IndexedSubChunk>({
    idField: 'id',
    fields: ['text'],
    storeFields: ['documentId', 'page'], // ← never 'text'
    searchOptions: {
      fuzzy: 0.15,
      prefix: true,
      combineWith: 'AND',
    },
  });
}

let index: MiniSearch<IndexedSubChunk> = createIndex();

/** subChunk ids per document, so removal can discard precisely. */
const idsByDocument = new Map<Id, Id[]>();

export function addDocumentToIndex(documentId: Id, chunks: PageChunk[]): void {
  removeDocumentFromIndex(documentId);

  const entries: IndexedSubChunk[] = [];
  for (const chunk of chunks) {
    for (const sub of chunk.subChunks) {
      entries.push({
        id: sub.id,
        documentId,
        page: chunk.page,
        text: sub.text,
      });
    }
  }

  index.addAll(entries);
  idsByDocument.set(documentId, entries.map((e) => e.id));
}

export function removeDocumentFromIndex(documentId: Id): void {
  const ids = idsByDocument.get(documentId);
  if (!ids) return;
  for (const id of ids) {
    try {
      index.discard(id);
    } catch {
      // Already gone. Not worth failing a document removal over.
    }
  }
  idsByDocument.delete(documentId);
}

export function resetIndex(): void {
  index = createIndex();
  idsByDocument.clear();
}

export function indexedDocumentCount(): number {
  return idsByDocument.size;
}

/**
 * Raw lexical search. Returns sub-chunk hits with scores and NO text.
 *
 * Not exported to tools directly — everything the agent sees goes through
 * project.ts, which collapses these to page granularity.
 */
export function rawSearch(query: string, limit = 60): RawHit[] {
  if (idsByDocument.size === 0) return [];

  // AND across terms is precise but brittle on long queries. Fall back to OR
  // so a five-word question still returns the page a two-word question would.
  let results = index.search(query, { combineWith: 'AND' });
  if (results.length === 0) {
    results = index.search(query, { combineWith: 'OR' });
  }

  return results.slice(0, limit).map((r) => ({
    id: String(r.id),
    documentId: String(r.documentId),
    page: Number(r.page),
    score: r.score,
  }));
}
