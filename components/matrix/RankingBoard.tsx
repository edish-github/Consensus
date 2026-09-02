'use client';

import { motion } from 'motion/react';
import { useConsensusStore } from '@/lib/store';
import { selectRanking, selectFlip } from '@/lib/store/selectors';
import { SPRING } from '@/components/ui/tokens';

/**
 * ★ THE MONEY SHOT.
 *
 * This component is on camera at 2:00, when the human drags a weight and the
 * order inverts. Everything about it is tuned for that forty seconds.
 *
 * How the animation works: each row is a motion.div with `layout` and a stable
 * key. When the sorted array reorders, Motion measures both positions and runs
 * a FLIP transition, so rows visibly travel to their new slots rather than
 * blinking into them. Two things break this and both are easy to do by
 * accident:
 *
 *   1. Unstable keys (index, or a freshly-generated id) → React remounts the
 *      row and there is nothing to animate between.
 *   2. Losing object identity in the store → same outcome. This is why the
 *      store uses immer.
 *
 * The bar width is animated separately so a score change that does NOT reorder
 * still produces visible motion. Without it, most edits look like nothing
 * happened.
 */
export function RankingBoard() {
  const ranking = useConsensusStore(selectRanking);
  const flip = useConsensusStore(selectFlip);
  const hasScores = ranking.some((r) => r.scoredCount > 0);

  if (ranking.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Ranking</h2>
        <p className="mt-2 text-xs text-neutral-500">Add options to see a ranking.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Ranking</h2>
        <span className="text-[11px] text-neutral-400">weighted · live</span>
      </div>

      <ol className="space-y-1.5">
        {ranking.map((r) => (
          <motion.li
            key={r.optionId}
            layout
            transition={SPRING}
            className="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
          >
            <div className="relative z-10 flex items-center gap-2.5">
              <span
                className={[
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold',
                  r.rank === 1 && hasScores
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-600',
                ].join(' ')}
              >
                {r.rank}
              </span>

              <span className="text-sm font-medium text-neutral-900">{r.name}</span>

              <span className="ml-auto flex items-baseline gap-2">
                {r.completeness < 1 && (
                  <span
                    className="text-[10px] text-neutral-400"
                    title="Not every criterion is scored yet — this position is provisional"
                  >
                    {Math.round(r.completeness * 100)}% scored
                  </span>
                )}
                <span className="text-sm font-semibold tabular-nums text-neutral-900">
                  {r.scoredCount > 0 ? Math.round(r.normalised * 100) : '—'}
                </span>
              </span>
            </div>

            <motion.div
              className="absolute inset-y-0 left-0 z-0 bg-emerald-100"
              initial={false}
              animate={{ width: `${r.normalised * 100}%` }}
              transition={SPRING}
              aria-hidden
            />
          </motion.li>
        ))}
      </ol>

      {hasScores && (
        <p className="mt-3 border-t border-neutral-100 pt-2.5 text-[11px] leading-relaxed text-neutral-500">
          {flip.summary}
        </p>
      )}
    </div>
  );
}
