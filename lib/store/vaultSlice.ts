import type { StateCreator } from 'zustand';
import type { Id, PageChunk, VaultDocument } from '@/lib/types';
import type { ConsensusStore } from './index';

/**
 * BLOCK 1: shape only. The pdf.js worker, chunker and MiniSearch index land
 * in B1-07 through B1-09.
 *
 * It exists now because selectPhase reads `documents` to decide whether the
 * search and disclosure tools should be registered, and phase derivation has
 * to be wired before there is anything to derive from.
 *
 * ⚠ chunks holds plaintext. Never spread a PageChunk into a tool result.
 */
export interface VaultSlice {
  documents: VaultDocument[];
  chunks: Record<Id, PageChunk[]>;
  indexReady: boolean;

  addDocument: (doc: VaultDocument) => void;
  updateDocumentStatus: (id: Id, status: VaultDocument['status'], error?: string) => void;
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
      s.indexReady = s.documents.some((d) => d.status === 'ready');
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
      s.indexReady = false;
    }),
});
