'use client';

import { useConsensusStore } from '@/lib/store';
import { removeDocument } from '@/lib/ingest/ingest';
import type { VaultDocument } from '@/lib/types';

const STATUS_STYLE: Record<VaultDocument['status'], string> = {
  queued: 'bg-neutral-100 text-neutral-600',
  parsing: 'bg-blue-50 text-blue-700',
  ready: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  'no-text': 'bg-amber-50 text-amber-700',
};

const STATUS_LABEL: Record<VaultDocument['status'], string> = {
  queued: 'queued',
  parsing: 'parsing',
  ready: 'indexed',
  failed: 'failed',
  'no-text': 'no text layer',
};

export function DocumentCard({ doc }: { doc: VaultDocument }) {
  const options = useConsensusStore((s) => s.options);
  const setDocumentOption = useConsensusStore((s) => s.setDocumentOption);
  const progress = useConsensusStore((s) => s.parseProgress[doc.id]);

  const pct = progress ? Math.round((progress[0] / Math.max(progress[1], 1)) * 100) : 0;

  return (
    <li className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-900" title={doc.filename}>
          {doc.filename}
        </span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[doc.status]}`}>
          {STATUS_LABEL[doc.status]}
        </span>
        <button
          type="button"
          onClick={() => removeDocument(doc.id)}
          aria-label={`Remove ${doc.filename}`}
          className="shrink-0 rounded px-1 text-xs text-neutral-300 transition hover:text-red-600"
        >
          ×
        </button>
      </div>

      {doc.status === 'parsing' && (
        <div className="mt-1.5">
          <div className="h-1 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-blue-500 transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-neutral-500">
            page {progress?.[0] ?? 0} of {progress?.[1] ?? '?'} · parsed locally
          </p>
        </div>
      )}

      {doc.status === 'ready' && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-neutral-500">{doc.pageCount} pages</span>
          <select
            value={doc.optionId ?? ''}
            onChange={(e) => setDocumentOption(doc.id, e.target.value || undefined)}
            aria-label={`Scope ${doc.filename} to an option`}
            className="ml-auto rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] text-neutral-700 focus:border-neutral-400 focus:outline-none"
          >
            <option value="">Unscoped</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      {doc.error && <p className="mt-1.5 text-[10px] leading-snug text-red-700">{doc.error}</p>}
    </li>
  );
}
