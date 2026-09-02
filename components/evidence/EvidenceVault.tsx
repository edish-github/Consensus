'use client';

import { useConsensusStore } from '@/lib/store';
import { DocumentDropzone } from './DocumentDropzone';
import { DocumentCard } from './DocumentCard';

export function EvidenceVault() {
  const documents = useConsensusStore((s) => s.documents);
  const ready = documents.filter((d) => d.status === 'ready');
  const totalPages = ready.reduce((n, d) => n + d.pageCount, 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Evidence vault</h2>
        {ready.length > 0 && (
          <span className="text-[11px] text-neutral-400">
            {ready.length} indexed · {totalPages} pages
          </span>
        )}
      </div>

      <DocumentDropzone />

      {documents.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </ul>
      )}

      {ready.length > 0 && (
        <p className="mt-3 border-t border-neutral-100 pt-2.5 text-[11px] leading-relaxed text-neutral-500">
          Your agent can search these and see where matches are. It cannot read a
          page without your release.
        </p>
      )}
    </div>
  );
}
