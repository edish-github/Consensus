'use client';

import { WebMCPProvider } from '@/components/agent/WebMCPProvider';
import { ToolSurfacePanel } from '@/components/agent/ToolSurfacePanel';
import { DecisionMatrix } from '@/components/matrix/DecisionMatrix';
import { RankingBoard } from '@/components/matrix/RankingBoard';
import { useConsensusStore } from '@/lib/store';
import { selectCapabilities, selectPhase, type Capabilities } from '@/lib/store/selectors';

/**
 * THE WORKSPACE.
 *
 * Top-level route, rendered directly in the main document. Never framed:
 * ChatGPT's built-in browser does not discover tools registered inside
 * iframes, so a stray wrapper here silently removes every tool.
 *
 * Capability-gated tool registration: each tool registers when the workspace
 * capabilities it requires are satisfied.
 */
export default function WorkspacePage() {
  const capabilities = useConsensusStore(selectCapabilities);
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

      <WebMCPProvider capabilities={capabilities} phase={phase}>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
          <DecisionMatrix />
          <div className="space-y-5">
            <RankingBoard />
            <PhaseCard capabilities={capabilities} phase={phase} />
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
 * Shows which registration phase and capabilities are active.
 */
function PhaseCard({ capabilities, phase }: { capabilities: Capabilities; phase: 0 | 1 | 2 | 3 }) {
  const getStatusText = () => {
    if (phase === 3) return 'All tools and inconsistency challenges unlocked';
    if (capabilities.matrix && capabilities.documents) return 'Matrix & documents active · Add human score for challenges';
    if (capabilities.matrix) return 'Matrix active · explain_ranking unlocked · Add documents for search';
    if (capabilities.documents) return 'Documents indexed · Evidence search unlocked · Add matrix options';
    return 'Add matrix options or drop documents to unlock tools';
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Registration phase</h2>
        <span className="text-xs font-semibold tabular-nums text-neutral-900">{phase} / 3</span>
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

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={[
            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
            capabilities.matrix ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-400',
          ].join(' ')}
        >
          {capabilities.matrix ? '✓' : '○'} Matrix
        </span>
        <span
          className={[
            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
            capabilities.documents ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-400',
          ].join(' ')}
        >
          {capabilities.documents ? '✓' : '○'} Documents
        </span>
        <span
          className={[
            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
            capabilities.humanScore ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-neutral-100 text-neutral-400',
          ].join(' ')}
        >
          {capabilities.humanScore ? '✓' : '○'} Scored
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-neutral-600">{getStatusText()}</p>
    </div>
  );
}
