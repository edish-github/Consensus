'use client';

import { useConsensusStore } from '@/lib/store';

/**
 * First-run state.
 *
 * It tells the human what to say to the agent, not just what to click. A
 * WebMCP app whose empty state does not suggest a prompt leaves the visitor
 * staring at a blank grid wondering what the agent is even for.
 */
export function EmptyMatrix() {
  const seed = useConsensusStore((s) => s.seedDemoScenario);

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
          onClick={seed}
          className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Load demo scenario
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
