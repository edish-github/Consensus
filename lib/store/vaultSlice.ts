import type { StateCreator } from 'zustand';
import type { Id, PageChunk, VaultDocument } from '@/lib/types';
import type { ConsensusStore } from './index';

/**
 * The vault.
 *
 * ⚠ `chunks` holds confidential plaintext. It is read by exactly two modules:
 * lib/search/index.ts (to build the BM25 index) and lib/vault/readPage.ts
 * (for read_snippet after a gate check). Nothing else may touch it.
 */
export interface VaultSlice {
  documents: VaultDocument[];
  chunks: Record<Id, PageChunk[]>;
  /** documentId -> [pagesDone, pageCount], for the progress bar during parse. */
  parseProgress: Record<Id, [number, number]>;
  indexReady: boolean;

  addDocument: (doc: VaultDocument) => void;
  updateDocumentStatus: (id: Id, status: VaultDocument['status'], error?: string) => void;
  setPageCount: (id: Id, pageCount: number) => void;
  setParseProgress: (id: Id, page: number, pageCount: number) => void;
  setDocumentOption: (docId: Id, optionId: Id | undefined) => void;
  removeDocument: (id: Id) => void;
  setChunks: (docId: Id, chunks: PageChunk[]) => void;
  resetVault: () => void;
}

export const createVaultSlice: StateCreator<
  ConsensusStore,
  [['zustand/immer', never]],
  [],
  VaultSlice
> = (set) => ({
  documents: [],
  chunks: {},
  parseProgress: {},
  indexReady: false,

  addDocument: (doc) =>
    set((s) => {
      s.documents.push(doc);
    }),

  updateDocumentStatus: (id, status, error) =>
    set((s) => {
      const doc = s.documents.find((d) => d.id === id);
      if (!doc) return;
      doc.status = status;
      doc.error = error;
      if (status === 'ready') doc.parsedAt = Date.now();
      if (status !== 'parsing') delete s.parseProgress[id];
      s.indexReady = s.documents.some((d) => d.status === 'ready');
    }),

  setPageCount: (id, pageCount) =>
    set((s) => {
      const doc = s.documents.find((d) => d.id === id);
      if (doc) doc.pageCount = pageCount;
    }),

  setParseProgress: (id, page, pageCount) =>
    set((s) => {
      s.parseProgress[id] = [page, pageCount];
    }),

  setDocumentOption: (docId, optionId) =>
    set((s) => {
      const doc = s.documents.find((d) => d.id === docId);
      if (doc) doc.optionId = optionId;
    }),

  removeDocument: (id) =>
    set((s) => {
      s.documents = s.documents.filter((d) => d.id !== id);
      delete s.chunks[id];
      delete s.parseProgress[id];
      s.indexReady = s.documents.some((d) => d.status === 'ready');
    }),

  setChunks: (docId, chunks) =>
    set((s) => {
      s.chunks[docId] = chunks;
    }),

  resetVault: () =>
    set((s) => {
      s.documents = [];
      s.chunks = {};
      s.parseProgress = {};
      s.indexReady = false;
    }),
});
