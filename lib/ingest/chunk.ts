import { nanoid } from 'nanoid';
import type { PageChunk, SubChunk } from '@/lib/types';

/**
 * Two granularities, deliberately.
 *
 *   PAGE chunks are the unit of DISCLOSURE. Permission is granted per page
 *   because a page is a thing a human can reason about: "release page 13 of
 *   the DPA" is a decision someone can make. "Release sub-chunk c_91" is not.
 *
 *   SUB-CHUNKS are the unit of RETRIEVAL. BM25 precision over 600-character
 *   windows is far better than over a whole page, and the match count per page
 *   becomes a real signal about where relevant content is dense.
 *
 * The overlap matters: without it, a phrase straddling a boundary is invisible
 * to search. "EU subprocessor arrangement" split across two chunks would not
 * match a query for the whole phrase, and that phrase is the demo.
 */

const SUB_CHUNK_SIZE = 600;
const SUB_CHUNK_OVERLAP = 80;

export function chunkPage(documentId: string, page: number, text: string): PageChunk {
  return {
    id: nanoid(10),
    documentId,
    page,
    text,
    subChunks: splitIntoSubChunks(text),
  };
}

function splitIntoSubChunks(text: string): SubChunk[] {
  if (text.length <= SUB_CHUNK_SIZE) {
    return text.length > 0 ? [{ id: nanoid(10), text, offset: 0 }] : [];
  }

  const out: SubChunk[] = [];
  const stride = SUB_CHUNK_SIZE - SUB_CHUNK_OVERLAP;

  for (let offset = 0; offset < text.length; offset += stride) {
    const slice = text.slice(offset, offset + SUB_CHUNK_SIZE);
    if (slice.replace(/\s/g, '').length === 0) continue;
    out.push({ id: nanoid(10), text: slice, offset });
    if (offset + SUB_CHUNK_SIZE >= text.length) break;
  }

  return out;
}
