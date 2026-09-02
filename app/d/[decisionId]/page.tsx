'use client';

import { WebMCPProvider } from '@/components/agent/WebMCPProvider';
import { ToolSurfacePanel } from '@/components/agent/ToolSurfacePanel';
import { DecisionMatrix } from '@/components/matrix/DecisionMatrix';
import { RankingBoard } from '@/components/matrix/RankingBoard';
import { useConsensusStore } from '@/lib/store';
import { selectPhase } from '@/lib/store/selectors';

/**
 * THE WORKSPACE.
 *
 * Top-level route, rendered directly in the main document. Never framed:
 * ChatGPT's built-in browser does not discover tools registered inside
 * iframes, so a stray wrapper here silently removes every tool.
 *
 * BLOCK 2: matrix, ranking and live phase-driven registration. The vault,
 * gate, proposal queue and challenge card land in B1-07 through B2-09.
 */
export default function WorkspacePage() {
  const phase = useConsensusStore(selectPhase);
  const title = useConsensusStore((s) => s.decisionTitle);
  const setTitle = useConsensusStore((s) => s.setDecisionTitle);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-5">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Consensus</h1>
          <span className="text-sm text-neutral-500">Your agent can find what it cannot read.</span>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Decision title"
          className="mt-3 w-full max-w-lg rounded-lg border border-transparent px-2 py-1 text-lg font-medium
                     text-neutral-900 transition hover:border-neutral-200 focus:border-neutral-400 focus:outline-none"
        />
      </header>

      <WebMCPProvider phase={phase}>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          <DecisionMatrix />
          <div className="space-y-5">
            <RankingBoard />
            <PhaseCard phase={phase} />
          </div>
        </div>

        <div className="mt-5">
          <ToolSurfacePanel />
        </div>
      </WebMCPProvider>
    </main>
  );
}

/**
 * Shows which registration phase is active and what unlocks the next one.
 *
 * This is a demo asset as much as a debugging aid: it makes "the tool surface
 * changes with page state" legible without the viewer having to open the
 * site-tools popover and count.
 */
function PhaseCard({ phase }: { phase: 0 | 1 | 2 | 3 }) {
  const labels = [
    'Empty workspace',
    'Documents indexed',
    'Matrix has shape',
    'Human has scored',
  ] as const;

  const unlocks = [
    'Add documents to unlock evidence search',
    'Add an option and a criterion to unlock scoring proposals',
    'Enter a score yourself to unlock challenges',
    'All tools registered',
  ] as const;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Registration phase</h2>
        <span className="text-xs font-semibold tabular-nums text-neutral-900">{phase}</span>
      </div>

      <div className="mt-2.5 flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((p) => (
          <div
            key={p}
            className={[
              'h-1 flex-1 rounded-full transition-colors',
              p <= phase ? 'bg-neutral-900' : 'bg-neutral-200',
            ].join(' ')}
          />
        ))}
      </div>

      <p className="mt-2.5 text-xs font-medium text-neutral-700">{labels[phase]}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{unlocks[phase]}</p>
    </div>
  );
}
