import { store } from '@/lib/store';
import type { Id } from '@/lib/types';

/**
 * ⚠ PLAINTEXT ACCESS — the second and last call site.
 *
 * The architecture claims that PageChunk.text is referenced by exactly two
 * places: the search indexer, and read_snippet after a gate check. This file
 * is the second. It exists as its own module so that claim is verifiable by
 * grep rather than by trust.
 *
 * This function performs NO permission check. It is the mechanism, not the
 * policy. The gate check lives in the read_snippet tool, and the only path to
 * a 'released' seal state is the human clicking approve. Calling this from
 * anywhere else would be a boundary violation, and evals/security.spec.ts
 * asserts that no tool reaches it without a released page.
 */
export function readPageText(documentId: Id, page: number): string | null {
  const chunks = store.getState().chunks[documentId];
  if (!chunks) return null;
  return chunks.find((c) => c.page === page)?.text ?? null;
}

/** Page numbers that yielded extractable text, for validating a disclosure request. */
export function availablePages(documentId: Id): number[] {
  const chunks = store.getState().chunks[documentId];
  return chunks ? chunks.map((c) => c.page) : [];
}
