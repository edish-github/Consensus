'use client';

import { useState } from 'react';
import { useConsensusStore } from '@/lib/store';
import { loadSampleCorpus } from '@/lib/ingest/ingest';

/**
 * First-run state.
 *
 * Provides a single button to load the full 3-vendor matrix and ingest the
 * 5 synthetic PDFs (89 pages) entirely client-side.
 */
export function EmptyMatrix() {
  const [loading, setLoading] = useState(false);
  const seed = useConsensusStore((s) => s.seedDemoScenario);

  async function setUpDemo() {
    setLoading(true);
    try {
      seed();
      await loadSampleCorpus();
    } catch (err) {
      console.error('Failed to set up demo:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
      <h2 className="text-sm font-semibold text-neutral-900">No decision yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
        Add the options you are choosing between and the criteria that matter, then drop in the
        documents. Your agent can search them and tell you where the answers are — it cannot read
        a page without your release.
      </p>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={setUpDemo}
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? 'Setting up demo…' : 'Set up the demo — 3 vendors, 5 documents, 89 pages'}
        </button>
      </div>

      <p className="mt-5 text-xs text-neutral-500">
        Then try asking:{' '}
        <em className="text-neutral-700">
          &ldquo;What criteria should I use to choose an analytics vendor?&rdquo;
        </em>
      </p>
    </div>
  );
}
