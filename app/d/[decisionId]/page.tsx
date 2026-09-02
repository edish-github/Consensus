'use client';

import { useState } from 'react';
import { WebMCPProvider } from '@/components/agent/WebMCPProvider';
import { ToolSurfacePanel } from '@/components/agent/ToolSurfacePanel';
import { JudgeQuickstart } from '@/components/agent/JudgeQuickstart';
import { DecisionMatrix } from '@/components/matrix/DecisionMatrix';
import { RankingBoard } from '@/components/matrix/RankingBoard';
import { EvidenceVault } from '@/components/evidence/EvidenceVault';
import { DisclosureQueue } from '@/components/gate/DisclosureQueue';
import { DisclosureLedger } from '@/components/gate/DisclosureLedger';
import { SealIndicator } from '@/components/gate/SealIndicator';
import { EgressCounter } from '@/components/security/EgressCounter';
import { ProposalQueue } from '@/components/proposals/ProposalQueue';
import { ExportBrief } from '@/components/export/ExportBrief';
import { useConsensusStore } from '@/lib/store';
import { selectCapabilities, type Capabilities } from '@/lib/store/selectors';

/**
 * THE WORKSPACE — complete.
 *
 * Top-level route, rendered directly in the main document. Never framed:
 * ChatGPT's built-in browser does not discover tools registered inside
 * iframes, so a stray wrapper here silently removes every tool.
 *
 * Layout order in the left column is deliberate and reads as urgency:
 *
 *   1. DisclosureQueue — sticky. The agent has stopped and is waiting on you.
 *   2. ProposalQueue   — challenges first, then suggestions.
 *   3. DecisionMatrix  — the artifact both parties are working on.
 *   4. ToolSurfacePanel — what the agent can currently do, and what it did.
 */
export default function WorkspacePage() {
  const capabilities = useConsensusStore(selectCapabilities);
  const title = useConsensusStore((s) => s.decisionTitle);
  const setTitle = useConsensusStore((s) => s.setDecisionTitle);
  const [ledgerOpen, setLedgerOpen] = useState(false);

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

      <WebMCPProvider capabilities={capabilities}>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <DisclosureQueue />
            <ProposalQueue />
            <DecisionMatrix />
            <ToolSurfacePanel />
            <JudgeQuickstart />
          </div>

          <div className="space-y-5">
            <RankingBoard />
            <EvidenceVault />
            <SealIndicator onClick={() => setLedgerOpen((v) => !v)} />
            {ledgerOpen && <DisclosureLedger />}
            <EgressCounter />
            <ExportBrief />
            <CapabilityCard capabilities={capabilities} />
          </div>
        </div>
      </WebMCPProvider>
    </main>
  );
}

function CapabilityCard({ capabilities }: { capabilities: Capabilities }) {
  const items = [
    { key: 'matrix' as const, label: 'Matrix', unlocks: 'explain_ranking, propose_score, attach_evidence' },
    { key: 'documents' as const, label: 'Documents', unlocks: 'locate_evidence, disclosure' },
    { key: 'humanScore' as const, label: 'Scored', unlocks: 'flag_inconsistency' },
  ];
  const satisfied = items.filter((i) => capabilities[i.key]).length;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Capabilities</h2>
        <span className="text-xs font-semibold tabular-nums text-neutral-900">{satisfied} / 3</span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const on = capabilities[item.key];
          return (
            <li key={item.key} className="flex items-baseline gap-2">
              <span
                className={[
                  'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium',
                  on ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400',
                ].join(' ')}
              >
                {on ? '✓' : '○'} {item.label}
              </span>
              <span className={`text-[10px] leading-snug ${on ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {item.unlocks}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
