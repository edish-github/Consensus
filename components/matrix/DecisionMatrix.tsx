'use client';

import { useState } from 'react';
import { useConsensusStore } from '@/lib/store';
import { MatrixRow } from './MatrixRow';
import { CriterionHeader } from './CriterionHeader';
import { EmptyMatrix } from './EmptyMatrix';
import type { Rating } from '@/lib/types';

export function DecisionMatrix() {
  const options = useConsensusStore((s) => s.options);
  const criteria = useConsensusStore((s) => s.criteria);
  const addOption = useConsensusStore((s) => s.addOption);
  const addCriterion = useConsensusStore((s) => s.addCriterion);

  const [optionDraft, setOptionDraft] = useState('');
  const [criterionDraft, setCriterionDraft] = useState('');

  if (options.length === 0 && criteria.length === 0) return <EmptyMatrix />;

  function submitOption() {
    const name = optionDraft.trim();
    if (!name) return;
    addOption(name);
    setOptionDraft('');
  }

  function submitCriterion() {
    const name = criterionDraft.trim();
    if (!name) return;
    addCriterion(name, 3 as Rating);
    setCriterionDraft('');
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className="w-40 p-2 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                Option
              </th>
              {criteria.map((c) => (
                <CriterionHeader key={c.id} criterion={c} />
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((option, i) => (
              <MatrixRow key={option.id} option={option} rowIndex={i} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
        <input
          value={optionDraft}
          onChange={(e) => setOptionDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitOption()}
          placeholder="Add an option…"
          aria-label="New option name"
          className="w-44 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
        />
        <input
          value={criterionDraft}
          onChange={(e) => setCriterionDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitCriterion()}
          placeholder="Add a criterion…"
          aria-label="New criterion name"
          className="w-44 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
        />
        <p className="ml-auto self-center text-[11px] text-neutral-400">
          Focus a cell and press <kbd className="rounded bg-neutral-100 px-1">1</kbd>–
          <kbd className="rounded bg-neutral-100 px-1">5</kbd> to score
        </p>
      </div>
    </div>
  );
}
