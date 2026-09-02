'use client';

import { useState } from 'react';
import { useConsensusStore } from '@/lib/store';
import { readPageText } from '@/lib/vault/readPage';

/**
 * The ledger — append-only record of every disclosure decision.
 *
 * Denials are recorded alongside approvals. A log of only what you said yes to
 * is a log that flatters itself; the useful artifact is the record of what was
 * asked and what you decided, including the times you refused.
 *
 * Expanding an approved entry shows the exact text that was released. Not for
 * convenience — so that "eight pages left this tab" is checkable rather than
 * asserted. It is the same claim the Network panel makes, from the other side.
 */
export function DisclosureLedger() {
  const ledger = useConsensusStore((s) => s.ledger);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (ledger.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Disclosure ledger</h2>
        <span className="text-[11px] text-neutral-400">append-only</span>
      </div>

      <ol className="space-y-1.5">
        {ledger.map((entry) => {
          const approved = entry.decision === 'approved';
          const isOpen = expanded === entry.id;
          const text = isOpen && approved ? readPageText(entry.documentId, entry.page) : null;

          return (
            <li key={entry.id} className="rounded-lg bg-neutral-50 px-2.5 py-2">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                disabled={!approved}
                className="flex w-full items-baseline gap-2 text-left disabled:cursor-default"
              >
                <span
                  className={[
                    'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                    approved ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600',
                  ].join(' ')}
                >
                  {approved ? 'released' : 'declined'}
                </span>
                <code className="min-w-0 flex-1 truncate text-[11px] text-neutral-900" title={entry.filename}>
                  {entry.filename}
                </code>
                <span className="shrink-0 text-[11px] tabular-nums text-neutral-600">p.{entry.page}</span>
              </button>

              <p className="mt-1 text-[10px] leading-snug text-neutral-500">
                {new Date(entry.decidedAt).toLocaleTimeString()} ·{' '}
                {approved && entry.charactersReleased > 0
                  ? `${entry.charactersReleased} chars · ${entry.textHash}`
                  : approved
                    ? 'approved, not yet read'
                    : 'nothing released'}
              </p>

              <p className="mt-1 text-[10px] italic leading-snug text-neutral-400">
                &ldquo;{entry.reason}&rdquo;
              </p>

              {isOpen && text && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-white p-2 text-[10px] leading-relaxed text-neutral-700">
                  {text}
                </pre>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
