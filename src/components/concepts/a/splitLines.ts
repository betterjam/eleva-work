'use client';

import { gsap, SplitText } from '@/components/concepts/shared/gsapSetup';

export type TweenVars = Parameters<typeof gsap.from>[1];

/**
 * Masked line reveal. `autoSplit` re-splits on resize / late font load and,
 * because the tween is returned from `onSplit`, GSAP recreates it with its
 * progress preserved. Callers keep the instance and call `revert()` in cleanup.
 * The parent carries `.rv-lines` (visibility hidden) until the first split.
 * `onTween` receives every tween created (again after each re-split) so a caller
 * can drive it, e.g. jump it to its end when a control inside receives focus.
 */
export function splitLines(el: Element, vars: TweenVars = {}, onTween?: (tween: gsap.core.Tween) => void): SplitText {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit: (self) => {
      gsap.set(el, { visibility: 'visible' });
      const tween = gsap.from(self.lines, {
        yPercent: 110,
        duration: 0.8,
        stagger: 0.08,
        ease: 'reveal',
        ...vars,
      });
      onTween?.(tween);
      return tween;
    },
  });
}

/**
 * Timeline-membership variant for scrubbed beats: the line tween is added INTO `tl` at
 * `at` instead of playing on its own (no ScrollTrigger of its own). On an `autoSplit`
 * re-split GSAP reverts the previous tween (which removes it from `tl`), calls `onSplit`
 * again and re-syncs the new tween's time; the new tween is re-added at the same position.
 * Call after `document.fonts.ready`. Durations are proportions of the beat, like every
 * other tween in it.
 */
export function splitLinesInto(el: Element, tl: gsap.core.Timeline, at: number, vars: TweenVars = {}): SplitText {
  let current: gsap.core.Tween | null = null;
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit: (self) => {
      gsap.set(el, { visibility: 'visible' });
      if (current) {
        tl.remove(current);
        current.kill();
        current = null;
      }
      // Created on the global timeline (rendering its start state at once) and moved into
      // the beat synchronously, so it never plays on its own.
      const tween = gsap.from(self.lines, {
        yPercent: 110,
        duration: 0.8,
        stagger: 0.08,
        ease: 'reveal',
        ...vars,
      });
      tl.add(tween, at);
      current = tween;
      return tween;
    },
  });
}

/**
 * Masked word reveal (pull quotes), timeline-membership variant: same contract as
 * `splitLinesInto` — the tween is added INTO `tl` at `at` and owns no ScrollTrigger, so
 * the director scrubs it across the beat's window. Call after `document.fonts.ready`.
 */
export function splitWordsInto(el: Element, tl: gsap.core.Timeline, at: number, vars: TweenVars = {}): SplitText {
  let current: gsap.core.Tween | null = null;
  return SplitText.create(el, {
    type: 'words',
    mask: 'words',
    autoSplit: true,
    wordsClass: 'split-word',
    onSplit: (self) => {
      gsap.set(el, { visibility: 'visible' });
      if (current) {
        tl.remove(current);
        current.kill();
        current = null;
      }
      const tween = gsap.from(self.words, {
        yPercent: 120,
        duration: 0.7,
        stagger: 0.03,
        ease: 'reveal',
        ...vars,
      });
      tl.add(tween, at);
      current = tween;
      return tween;
    },
  });
}
