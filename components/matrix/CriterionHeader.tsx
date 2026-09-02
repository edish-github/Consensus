'use client';

import type { Criterion } from '@/lib/types';
import { WeightSlider } from './WeightSlider';
import { useConsensusStore } from '@/lib/store';

export function CriterionHeader({ criterion }: { criterion: Criterion }) {
  const setWeight = useConsensusStore((s) => s.setWeight);
  const removeCriterion = useConsensusStore((s) => s.removeCriterion);
  const fromAgent = criterion.createdBy === 'agent-proposed-human-accepted';

  return (
    <th scope="col" className="min-w-[150px] p-2 align-top">
      <div className="space-y-1.5">
        <div className="flex items-start gap-1">
          <span
            className="text-left text-xs font-semibold leading-tight text-neutral-900"
            title={criterion.description}
          >
            {criterion.name}
          </span>
          <button
            type="button"
            onClick={() => removeCriterion(criterion.id)}
            aria-label={`Remove ${criterion.name}`}
            className="ml-auto shrink-0 rounded px-1 text-xs text-neutral-300 transition hover:text-red-600"
          >
            ×
          </button>
        </div>

        {fromAgent && (
          <span className="inline-block rounded bg-amber-50 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-700">
            agent proposed
          </span>
        )}

        <WeightSlider
          value={criterion.weight}
          label={criterion.name}
          onChange={(w) => setWeight(criterion.id, w)}
        />
      </div>
    </th>
  );
}
