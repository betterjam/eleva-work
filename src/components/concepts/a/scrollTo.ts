'use client';

import { useCallback } from 'react';
import { ScrollSmoother } from '@/components/concepts/shared/gsapSetup';
import { useSmoothScroll } from '@/components/concepts/shared/SmoothScroll';

/**
 * Anchor navigation for the concept page.
 * Inside <SmoothScroll> this is exactly `useSmoothScroll().scrollTo`. The fixed
 * chrome (header, mobile menu) lives OUTSIDE the provider by rule, where the
 * context is the no-op default, so it falls back to the live ScrollSmoother
 * instance (`ScrollSmoother.get()`), and finally to a native scroll.
 */
export function useScrollTo() {
  const { scrollTo, getSmoother } = useSmoothScroll();
  return useCallback(
    (target: string, offset = 72) => {
      if (getSmoother()) {
        scrollTo(target, offset);
        return;
      }
      const el = document.querySelector(target);
      if (!el) return;
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.paused(false);
        smoother.scrollTo(el, true, `top ${offset}px`);
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    [scrollTo, getSmoother]
  );
}
