'use client';

import { useState } from 'react';
import { useConsensusStore } from '@/lib/store';
import { buildDecisionBrief, downloadDecisionBrief } from '@/lib/persistence/exportBrief';

/**
 * Export the decision brief.
 *
 * Preview before download, because the point of the brief is that you can hand
 * it to someone — and you should see what you are handing over, particularly
 * the ledger showing which pages you released.
 */
export function ExportBrief() {
  const [preview, setPreview] = useState<string | null>(null);
  const hasDecision = useConsensusStore(
    (s) => s.options.length > 0 && s.criteria.length > 0
  );

  if (!hasDecision) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Decision brief</h2>
        {preview && (
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="text-[11px] text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
          >
            close
          </button>
        )}
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
        Every score, its origin, its citations, and the full record of which pages
        you released.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setPreview(buildDecisionBrief())}
          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:border-neutral-400"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={downloadDecisionBrief}
          className="rounded-lg bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-neutral-700"
        >
          Download .md
        </button>
      </div>

      {preview && (
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-[10px] leading-relaxed text-neutral-700">
          {preview}
        </pre>
      )}
    </div>
  );
}
