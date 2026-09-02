'use client';

import { useConsensusStore } from '@/lib/store';
import { scoreKey, isRating, type Id, type Rating } from '@/lib/types';

/**
 * One cell. Keyboard-first: focus it and press 1–5 to score, Backspace to
 * clear, arrows to move. No dropdown, no popover, no click target to hunt for.
 *
 * That choice is partly for the demo — "I just type 5" is a faster beat than
 * "I open a menu and select 5" — and partly because scoring twelve cells with
 * a mouse is genuinely tedious.
 *
 * Three slots are rendered even when empty: the score, the provenance chip
 * (B2-10) and the challenge marker (B2-09). Building the containers now means
 * the climax component drops in without a layout change, which matters when
 * the layout is already on camera.
 */
export function MatrixCell({
  optionId,
  criterionId,
  rowIndex,
  colIndex,
}: {
  optionId: Id;
  criterionId: Id;
  rowIndex: number;
  colIndex: number;
}) {
  const score = useConsensusStore((s) => s.scores[scoreKey(optionId, criterionId)]);
  const setScore = useConsensusStore((s) => s.setScore);
  const clearScore = useConsensusStore((s) => s.clearScore);

  const fromAgent = score?.source === 'agent-proposed-human-accepted';
  const hasEvidence = (score?.evidenceRefs.length ?? 0) > 0;
  const unevidenced = Boolean(score) && !hasEvidence;

  function move(dRow: number, dCol: number) {
    const next = document.querySelector<HTMLButtonElement>(
      `[data-cell="${rowIndex + dRow}-${colIndex + dCol}"]`
    );
    next?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const n = Number(e.key);
    if (isRating(n)) {
      e.preventDefault();
      setScore(optionId, criterionId, n as Rating, { source: 'human' });
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      clearScore(optionId, criterionId);
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const delta = moves[e.key];
    if (delta) {
      e.preventDefault();
      move(delta[0], delta[1]);
    }
  }

  return (
    <td className="p-1">
      <button
        type="button"
        data-cell={`${rowIndex}-${colIndex}`}
        onKeyDown={onKeyDown}
        aria-label={
          score ? `Score ${score.value} of 5. Press 1 to 5 to change.` : 'No score. Press 1 to 5 to set.'
        }
        className={[
          'group relative flex h-14 w-full flex-col items-center justify-center rounded-lg border transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1',
          score
            ? 'border-neutral-200 bg-white hover:border-neutral-400'
            : 'border-dashed border-neutral-200 bg-neutral-50 hover:border-neutral-300',
        ].join(' ')}
      >
        <span
          className={[
            'text-lg font-semibold tabular-nums',
            score ? 'text-neutral-900' : 'text-neutral-300',
          ].join(' ')}
        >
          {score ? score.value : '—'}
        </span>

        {/* Provenance slot — filled in B2-10 */}
        <span className="flex h-3 items-center gap-1">
          {hasEvidence && (
            <span className="rounded bg-emerald-50 px-1 text-[9px] font-medium text-emerald-700">
              cited
            </span>
          )}
          {unevidenced && (
            <span
              className="text-[9px] text-neutral-400"
              title="Scored with no supporting document"
            >
              no source
            </span>
          )}
          {fromAgent && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Agent proposed, you accepted" />
          )}
        </span>

        {/* Challenge slot — filled in B2-09 */}
      </button>
    </td>
  );
}
