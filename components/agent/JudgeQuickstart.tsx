'use client';

import { useState } from 'react';

const SUGGESTED_PROMPTS = [
  {
    title: '1. Fast zero-text search',
    prompt: 'Where do these documents talk about EU data residency?',
    note: 'Watch locate_evidence run across 89 pages returning page pointers with 0 text leaked.',
  },
  {
    title: '2. Selective disclosure & extraction',
    prompt: 'What do the documents say about EU data residency? Read the relevant page.',
    note: 'The agent requests permission. You release page 13, and the agent extracts the pending subprocessor clause.',
  },
  {
    title: '3. Human-in-the-loop challenge (Climax)',
    prompt: 'Check my data residency score against the documents and flag it if it is inconsistent.',
    note: 'The agent will disagree with you and post the red Challenge Card. It cannot change the score itself.',
  },
];

export function JudgeQuickstart() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function copyPrompt(text: string, index: number) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">
          Try it with your agent — click to copy prompts
        </h2>
        <span className="text-[11px] font-medium text-blue-700">Judge Quickstart</span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {SUGGESTED_PROMPTS.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-lg border border-blue-200/80 bg-white p-3 shadow-xs"
          >
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-800">
                {item.title}
              </span>
              <p className="mt-1.5 text-xs font-medium text-neutral-900">
                &ldquo;{item.prompt}&rdquo;
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                {item.note}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyPrompt(item.prompt, idx)}
              className="mt-3 flex w-full items-center justify-center rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {copiedIndex === idx ? '✓ Copied to clipboard!' : 'Copy prompt'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
