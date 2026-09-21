'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import { useSectionDirector } from './director/SectionDirector';

export type Bar = { label: string; code: string; pct: number };

type Props = {
  label: string;
  bars: Bar[];
  /** Window start for the fill draw: the block's top at this % of the viewport (default 60). */
  enterAt?: number;
};

/**
 * Typographic confidence bars (match options). The first row is the top match
 * (accent fill). The fills are one BEAT handed to the Section Director: their draw is
 * scrubbed across the block's scroll window and locked at completion, so a fast scroll can
 * never leave a bar half-drawn. Reduced motion: the stylesheet renders the final state.
 */
export default function ConfidenceBars({ label, bars, enterAt = 60 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerBeat } = useSectionDirector();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let unregister = () => {};
    const ctx = gsap.context(() => {
      const fills = root.querySelectorAll('.a-bar-fill');
      if (!fills.length) return;
      // Durations are proportions of the window, not seconds.
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(fills, { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.1, ease: 'settle' }, 0);
      unregister = registerBeat(root, tl, { enterAt });
    }, root);

    return () => {
      // Unregister first: the director drops its trigger without touching the timeline,
      // which the context then reverts.
      unregister();
      ctx.revert();
    };
  }, [enterAt, registerBeat]);

  return (
    <div ref={ref} className="a-bars">
      <p className="a-label">{label}</p>
      {bars.map((b, i) => (
        <div key={`${b.label}-${i}`} className={`a-bar${i === 0 ? ' is-top' : ''}`}>
          <div>
            <div className="a-bar-label">
              <span>{b.label}</span>
              {b.code ? <span className="a-code">{b.code}</span> : null}
            </div>
            <div className="a-bar-track">
              <span className="a-bar-fill" style={{ width: `${b.pct}%` }} />
            </div>
          </div>
          <span className="a-bar-pct">{b.pct} %</span>
        </div>
      ))}
    </div>
  );
}
