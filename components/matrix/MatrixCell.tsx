'use client';

import { useConsensusStore } from '@/lib/store';
import { scoreKey, isRating, type Id, type Rating } from '@/lib/types';

/**
 * One cell. Keyboard-first: focus and press 1–5 to score, Backspace to clear,
 * arrows to move.
 *
 * BATCH 5: the two slots built empty in batch 2 are now filled.
 *
 *  · Provenance chip — a cited score shows how many pages back it, and the
 *    "no source" marker is what makes an ungrounded claim visible rather than
 *    indistinguishable from a verified one.
 *
 *  · Challenge ring — a disputed cell gets a red ring that matches the card
 *    below the matrix. That pairing is what makes the challenge read as an
 *    argument about a specific number rather than a floating notification.
 */
export function MatrixCell({
  optionId, criterionId, rowIndex, colIndex,
}: {
  optionId: Id; criterionId: Id; rowIndex: number; colIndex: number;
}) {
  const score = useConsensusStore((s) => s.scores[scoreKey(optionId, criterionId)]);
  const setScore = useConsensusStore((s) => s.setScore);
  const clearScore = useConsensusStore((s) => s.clearScore);
  const challenged = useConsensusStore((s) =>
    s.challenges.some(
      (c) => c.state === 'open' && c.optionId === optionId && c.criterionId === criterionId
    )
  );
  const proposed = useConsensusStore((s) =>
    s.proposals.some(
      (p) => p.kind === 'score' && p.optionId === optionId && p.criterionId === criterionId
    )
  );

  const fromAgent = score?.source === 'agent-proposed-human-accepted';
  const evidenceCount = score?.evidenceRefs.length ?? 0;
  const unevidenced = Boolean(score) && evidenceCount === 0;

  function move(dRow: number, dCol: number) {
    document
      .querySelector<HTMLButtonElement>(`[data-cell="${rowIndex + dRow}-${colIndex + dCol}"]`)
      ?.focus();
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
          score
            ? `Score ${score.value} of 5${challenged ? ', disputed by your agent' : ''}. Press 1 to 5 to change.`
            : 'No score. Press 1 to 5 to set.'
        }
        className={[
          'group relative flex h-14 w-full flex-col items-center justify-center rounded-lg border transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1',
          challenged
            ? 'border-red-400 bg-red-50 ring-2 ring-red-300 animate-[pulse_1s_ease-out_2]'
            : proposed
              ? 'border-amber-300 bg-amber-50/40'
              : score
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

        <span className="flex h-3.5 items-center gap-1">
          {evidenceCount > 0 && (
            <span
              className="rounded bg-emerald-50 px-1 text-[10px] font-medium text-emerald-700"
              title={`${evidenceCount} released ${evidenceCount === 1 ? 'page' : 'pages'} cited`}
            >
              {evidenceCount === 1 ? 'cited' : `${evidenceCount} cited`}
            </span>
          )}
          {unevidenced && (
            <span
              className="rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-700"
              title="Scored with no supporting document"
            >
              no source
            </span>
          )}
          {fromAgent && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-400"
              title="Agent proposed, you accepted"
            />
          )}
        </span>

        {challenged && (
          <span
            className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
            title="Your agent disputes this score"
          >
            !
          </span>
        )}
      </button>
    </td>
  );
}
