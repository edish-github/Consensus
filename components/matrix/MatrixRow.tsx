'use client';

import { useConsensusStore } from '@/lib/store';
import { MatrixCell } from './MatrixCell';
import type { Option } from '@/lib/types';

export function MatrixRow({ option, rowIndex }: { option: Option; rowIndex: number }) {
  const criteria = useConsensusStore((s) => s.criteria);
  const removeOption = useConsensusStore((s) => s.removeOption);

  return (
    <tr>
      <th scope="row" className="p-2 text-left align-middle">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-900">{option.name}</span>
          <button
            type="button"
            onClick={() => removeOption(option.id)}
            aria-label={`Remove ${option.name}`}
            className="rounded px-1 text-xs text-neutral-300 transition hover:text-red-600"
          >
            ×
          </button>
        </div>
      </th>

      {criteria.map((criterion, colIndex) => (
        <MatrixCell
          key={criterion.id}
          optionId={option.id}
          criterionId={criterion.id}
          rowIndex={rowIndex}
          colIndex={colIndex}
        />
      ))}
    </tr>
  );
}
