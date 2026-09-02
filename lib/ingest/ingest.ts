import { nanoid } from 'nanoid';
import { store } from '@/lib/store';
import { extractDocument } from './extract';
import { addDocumentToIndex, removeDocumentFromIndex } from '@/lib/search';
import type { Id } from '@/lib/types';

/**
 * Ingestion orchestrator.
 *
 * Sequences the whole pipeline for one file: register → extract → chunk →
 * store → index → mark ready. Lives outside the store slice so the slice stays
 * a pure state container and the side effects are in one readable place.
 *
 * ⚠ There is no upload code path in this file, and there must never be one.
 * `file.arrayBuffer()` is read inside extractDocument and goes out of scope
 * when it returns. Nothing here touches fetch, XHR, or a form submission.
 */

export async function ingestFile(file: File, optionId?: Id): Promise<Id> {
  const documentId = nanoid(8);
  const s = store.getState();

  s.addDocument({
    id: documentId,
    filename: file.name,
    pageCount: 0,
    optionId,
    status: 'parsing',
  });

  try {
    const result = await extractDocument(documentId, file, ({ page, pageCount }) => {
      store.getState().setParseProgress(documentId, page, pageCount);
    });

    if (result.chunks.length === 0) {
      store.getState().updateDocumentStatus(
        documentId,
        'no-text',
        'No extractable text. This looks like a scan; OCR is out of scope.'
      );
      return documentId;
    }

    store.getState().setChunks(documentId, result.chunks);
    store.getState().setPageCount(documentId, result.pageCount);
    addDocumentToIndex(documentId, result.chunks);
    store.getState().updateDocumentStatus(documentId, 'ready');
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to read this file';
    store.getState().updateDocumentStatus(documentId, 'failed', message.slice(0, 120));
  }

  return documentId;
}

export async function ingestFiles(files: File[], optionId?: Id): Promise<void> {
  // Sequential rather than parallel: five documents in flight would contend for
  // the pdf.js worker and make the progress bars jump around unhelpfully.
  for (const file of files) {
    await ingestFile(file, optionId);
  }
}

export function removeDocument(documentId: Id): void {
  removeDocumentFromIndex(documentId);
  store.getState().removeDocument(documentId);
}

/** Loads the bundled synthetic corpus. Used by the demo button and rehearsal. */
export async function loadSampleCorpus(): Promise<void> {
  const manifest: { file: string; option?: string }[] = [
    { file: 'vendor-a-dpa.pdf', option: 'o_a' },
    { file: 'vendor-a-security-questionnaire.pdf', option: 'o_a' },
    { file: 'vendor-b-soc2.pdf', option: 'o_b' },
    { file: 'vendor-b-dpa.pdf', option: 'o_b' },
    { file: 'vendor-c-pricing.pdf', option: 'o_c' },
  ];

  const optionIds = new Set(store.getState().options.map((o) => o.id));

  for (const entry of manifest) {
    const response = await fetch(`/sample/${entry.file}`);
    if (!response.ok) continue;
    const blob = await response.blob();
    const file = new File([blob], entry.file, { type: 'application/pdf' });
    await ingestFile(file, optionIds.has(entry.option ?? '') ? entry.option : undefined);
  }
}
