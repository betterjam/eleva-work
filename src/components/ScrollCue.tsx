'use client';

import { goTo } from '@/lib/scrollNav';

type Direction = 'down' | 'up' | 'next';

type BaseProps = {
  /** Section id to travel to (the `-mobile` twin is picked automatically). */
  targetId: string;
  direction?: Direction;
  className?: string;
};

/**
 * The accessible name is mandatory: every cue ships either a visible `label`
 * or an explicit `ariaLabel` (both are translated strings), so a raw section
 * id can never end up as the button's name.
 */
type Props = BaseProps &
  ({ label: string; ariaLabel?: string } | { label?: string; ariaLabel: string });

const CHEVRON: Record<Direction, string> = {
  down: 'M19 9l-7 7-7-7',
  up: 'M5 15l7-7 7 7',
  next: 'M9 5l7 7-7 7',
};

/** "Keep scrolling" hint that is also the control that does it. */
export default function ScrollCue({
  targetId,
  label,
  ariaLabel,
  direction = 'down',
  className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={() => goTo(targetId)}
      aria-label={ariaLabel ?? label}
      // outline-current follows the text colour, which globals.css rewrites for
      // the light theme, so the focus ring stays visible in both themes.
      className={`scroll-cue scroll-cue--${direction} inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${className}`}
    >
      {label && <span className="whitespace-nowrap">{label}</span>}
      <svg
        className="scroll-cue-icon h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CHEVRON[direction]} />
      </svg>
    </button>
  );
}
