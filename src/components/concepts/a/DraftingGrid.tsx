'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/components/concepts/shared/gsapSetup';

/**
 * The 12-column drafting grid: a single FIXED hairline layer rendered OUTSIDE
 * <SmoothScroll> (≥1280px only, see the stylesheet). Vertical lines are
 * invariant under vertical translation, and a fixed layer never repaints on
 * scroll, so there is no moiré.
 *
 * The columns are parked at `scaleY(0)` in the stylesheet; this component is
 * their only driver (the page intro used to be the hero, which is gone), so it
 * draws them in once, on load, after the fonts have settled. Under reduced
 * motion — and whenever the parked state is not in force, i.e. below 1280px —
 * the set to `scaleY: 1` alone is enough.
 */
export default function DraftingGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cancelled = false;
    let ctx: gsap.Context | null = null;

    const run = () => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const cols = gsap.utils.toArray<HTMLElement>('.a-cols > i', root);
        if (!cols.length) return;
        if (reduced) {
          gsap.set(cols, { scaleY: 1 });
          return;
        }
        gsap.fromTo(
          cols,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.9, ease: 'reveal', stagger: 0.04 }
        );
      }, root);
    };

    document.fonts.ready.then(run, run);
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div className="a-grid" aria-hidden="true" ref={ref}>
      <div className="a-container">
        <div className="a-cols">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
