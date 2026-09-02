/**
 * Design tokens.
 *
 * The motion values are the ones that matter. The ranking reorder is the
 * demo's climax, and a spring that settles too fast reads as a glitch while
 * one that settles too slow drags. 380/32 lands around 400ms with a small
 * overshoot — enough that the eye tracks the movement and registers it as
 * a consequence of the weight change rather than a repaint.
 */
export const SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

export const SPRING_SOFT = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 30,
};

export const RANK_COLORS = [
  'bg-emerald-500',
  'bg-emerald-400',
  'bg-neutral-300',
  'bg-neutral-300',
  'bg-neutral-300',
] as const;
