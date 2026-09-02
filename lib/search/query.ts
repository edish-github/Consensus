import { store } from '@/lib/store';
import { rawSearch } from './index';
import { projectToMetadata, type EvidenceLocation } from './project';
import type { Id } from '@/lib/types';

/**
 * The query path used by locate_evidence.
 *
 * Composes: lexical search → option scoping → metadata projection. The agent
 * never sees anything from this file except the projected result.
 */
export function searchEvidence(
  query: string,
  opts: { optionId?: Id; limit?: number } = {}
): EvidenceLocation[] {
  const s = store.getState();

  let allowedDocumentIds: Set<Id> | undefined;
  if (opts.optionId) {
    allowedDocumentIds = new Set(
      s.documents.filter((d) => d.optionId === opts.optionId).map((d) => d.id)
    );
  }

  const hits = rawSearch(query);

  return projectToMetadata(
    hits,
    {
      filenameFor: (id) => s.documents.find((d) => d.id === id)?.filename ?? id,
      sealStateFor: (id, page) => s.sealStateFor(id, page),
      allowedDocumentIds,
    },
    opts.limit ?? 8
  );
}
