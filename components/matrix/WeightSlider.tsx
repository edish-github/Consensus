'use client';

import type { Rating } from '@/lib/types';

/**
 * The weight control. 1–5, discrete, draggable.
 *
 * HUMAN ONLY. There is no registered tool that can write a weight — the agent
 * can call propose_criterion with a suggestion, and that is the extent of its
 * reach. This control is where "the human owns values" stops being a slogan
 * and becomes a fact about the interface.
 *
 * A native range input rather than five buttons, because the demo beat at
 * 1:30 is a drag: the viewer needs to see a continuous gesture cause the
 * ranking to move.
 */
export function WeightSlider({
  value,
  onChange,
  label,
}: {
  value: Rating;
  onChange: (weight: Rating) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        aria-label={`Weight for ${label}`}
        onChange={(e) => onChange(Number(e.target.value) as Rating)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-neutral-900
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-neutral-900 [&::-webkit-slider-thumb]:shadow"
      />
      <span className="w-3 shrink-0 text-xs font-semibold tabular-nums text-neutral-900">
        {value}
      </span>
    </div>
  );
}
