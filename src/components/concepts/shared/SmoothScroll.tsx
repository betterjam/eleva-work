'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { gsap, ScrollTrigger, ScrollSmoother } from './gsapSetup';

type ScrollTarget = string | Element | number;

type SmoothScrollContextValue = {
  /** Scroll to a selector, element or pixel position. `offset` is the px gap kept above the target. */
  scrollTo: (target: ScrollTarget, offset?: number) => void;
  /** The live ScrollSmoother instance (null before mount / on unmount). */
  getSmoother: () => ScrollSmoother | null;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollTo: () => {},
  getSmoother: () => null,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type Props = {
  children: ReactNode;
  /** Seconds of "catch up" lag. 1–1.5 feels premium; 0 disables smoothing. */
  smooth?: number;
  /** Enable data-speed / data-lag parallax attributes on descendants. */
  effects?: boolean;
  className?: string;
};

/**
 * ScrollSmoother wrapper. Everything that scrolls must be a child of this component.
 * Fixed elements (headers, floating buttons) MUST live outside of it.
 *
 * Usage:
 *   <Header />               // fixed, outside
 *   <SmoothScroll>
 *     <main>…</main>
 *   </SmoothScroll>
 */
export default function SmoothScroll({ children, smooth = 1.2, effects = true, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const smootherRef = useRef<ScrollSmoother | null>(null);

  useIsomorphicLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      smootherRef.current = ScrollSmoother.create({
        wrapper,
        content,
        smooth: prefersReduced ? 0 : smooth,
        effects: effects && !prefersReduced,
        smoothTouch: 0, // native scrolling on touch devices
        normalizeScroll: false,
        ignoreMobileResize: true,
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    let fontsSettled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        fontsSettled = true;
        refresh();
      });
    }
    window.addEventListener('load', refresh);
    // Late-loading images change layout: refresh once more after a beat.
    const t = window.setTimeout(refresh, 600);
    const t2 = window.setTimeout(() => {
      if (!fontsSettled) refresh();
    }, 1500);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener('load', refresh);
      smootherRef.current = null;
      ctx.revert();
    };
  }, [smooth, effects]);

  const scrollTo = useCallback((target: ScrollTarget, offset = 0) => {
    const smoother = smootherRef.current;
    if (typeof target === 'number') {
      if (smoother) smoother.scrollTo(target, true);
      else window.scrollTo({ top: target, behavior: 'smooth' });
      return;
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (smoother) {
      smoother.scrollTo(el, true, `top ${offset}px`);
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const value = useMemo<SmoothScrollContextValue>(
    () => ({ scrollTo, getSmoother: () => smootherRef.current }),
    [scrollTo]
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      <div id="smooth-wrapper" ref={wrapperRef} className={className}>
        <div id="smooth-content" ref={contentRef}>
          {children}
        </div>
      </div>
    </SmoothScrollContext.Provider>
  );
}
