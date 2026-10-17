'use client';

import { useEffect, type RefObject } from 'react';
import { gsap, SplitText } from '@/components/concepts/shared/gsapSetup';
import { useSectionDirector, type BeatOptions } from './director/SectionDirector';
import { splitLinesInto } from './splitLines';

const SELECTOR = [
  '.rv-wipe',
  '.rv-wipe-up',
  '.rv-wipe-down',
  '.rv-wipe-left',
  '.rv-rule-x',
  '.rv-rule-y',
  '.rv-fade',
  '.rv-lines',
  '.rv-mask',
].join(',');

/* Every edge carries a unit on both ends of the tween: GSAP cannot interpolate
   "100%" into a unitless "0", so a mixed pair never produced a single intermediate
   value and every wipe was a pop at the end of its window. */
const WIPE_FROM: Record<string, string> = {
  'rv-wipe': 'inset(0% 100% 0% 0%)',
  'rv-wipe-up': 'inset(100% 0% 0% 0%)',
  'rv-wipe-down': 'inset(0% 0% 100% 0%)',
  'rv-wipe-left': 'inset(0% 0% 0% 100%)',
};
const WIPE_TO = 'inset(0% 0% 0% 0%)';

type Options = {
  /** Legacy trigger start (`'top 80%'`): its percentage becomes the beats' `enterAt`. */
  start?: string;
};

type PendingLine = { el: HTMLElement; at: number };
type Built = { groupEl: HTMLElement; tl: gsap.core.Timeline; lines: PendingLine[]; opts: BeatOptions };

/** `'top 75%'` → 75; anything else → undefined (the section's `enterAt` applies). */
function parseEnterAt(start?: string): number | undefined {
  if (!start) return undefined;
  const m = start.match(/^\s*top\s+(\d+(?:\.\d+)?)%\s*$/);
  return m ? parseFloat(m[1]) : undefined;
}

/**
 * Standard entrances for every `.rv-*` target under `ref`, driven by the Section Director:
 * each group is one BEAT whose timeline is scrubbed across a scroll window (positional, so
 * a beat is always fully revealed once its top passes the settle line) and locked at
 * completion; inside a `[data-hold]` block the beat joins the section's pinned intro.
 * - Elements inside a `[data-rv-group]` share one timeline (the group is the beat);
 *   everything else is a beat of its own. `data-rv-start="top N%"` (or `options.start`)
 *   becomes the beat's `enterAt`.
 * - `data-rv-delay="0.3"` offsets an element inside its beat: durations and offsets are
 *   proportions of the beat, not seconds.
 * - Subtrees marked `[data-rv-manual]` are left to the section's own choreography
 *   (only markers INSIDE `ref` count, so a child component may run its own useReveal
 *   on a subtree its parent has marked manual).
 * - When a wipe finishes its clip-path is set to `none` and a mask gets `.is-revealed`,
 *   so focus rings and hover underlines of controls inside are not clipped afterwards.
 * - `.a-plate` wipes get the double mask (container clip + inner image slide).
 * - Keyboard: hidden states never remove a control from the tab order (`.rv-fade` is
 *   opacity, masks are transforms); `focusin` inside a beat locks it (the director).
 * Beats register once fonts are ready and their SplitText lines are in the timeline.
 * Reduced motion: the stylesheet already renders final states; nothing runs.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, options: Options = {}) {
  const { registerBeat } = useSectionDirector();
  const defaultStart = options.start;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => {
      const manual = el.closest('[data-rv-manual]');
      return !manual || !root.contains(manual);
    });
    if (!targets.length) return;

    const groups = new Map<HTMLElement, HTMLElement[]>();
    targets.forEach((el) => {
      const groupEl = (el.closest('[data-rv-group]') as HTMLElement | null) ?? el;
      const list = groups.get(groupEl);
      if (list) list.push(el);
      else groups.set(groupEl, [el]);
    });

    const built: Built[] = [];
    const splits: SplitText[] = [];
    const unregisters: (() => void)[] = [];
    let cancelled = false;

    const ctx = gsap.context(() => {
      groups.forEach((els, groupEl) => {
        const tl = gsap.timeline({ paused: true });
        const lines: PendingLine[] = [];
        let cursor = 0;

        els.forEach((el) => {
          const at = cursor + (parseFloat(el.dataset.rvDelay ?? '') || 0);
          const cls = el.classList;

          if (cls.contains('rv-lines')) {
            lines.push({ el, at });
            cursor += 0.08;
            return;
          }

          const wipe = Object.keys(WIPE_FROM).find((k) => cls.contains(k));
          if (wipe) {
            const isPlate = cls.contains('a-plate-body');
            const duration = isPlate ? 0.9 : 0.8;
            tl.fromTo(el, { clipPath: WIPE_FROM[wipe] }, { clipPath: WIPE_TO, duration, ease: 'reveal' }, at);
            tl.set(el, { clipPath: 'none' }, at + duration);
            if (isPlate) {
              const img = el.querySelector('img');
              if (img) {
                const from =
                  wipe === 'rv-wipe-left' ? { x: -32 } : wipe === 'rv-wipe-down' ? { y: -40 } : { y: 40 };
                tl.fromTo(img, from, { x: 0, y: 0, duration: 0.9, ease: 'reveal' }, at);
              }
            }
            cursor += 0.06;
            return;
          }

          if (cls.contains('rv-rule-x')) {
            tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'reveal' }, at);
            cursor += 0.05;
            return;
          }
          if (cls.contains('rv-rule-y')) {
            tl.fromTo(el, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'reveal' }, at);
            cursor += 0.05;
            return;
          }
          if (cls.contains('rv-fade')) {
            // opacity, not autoAlpha: a hidden button must stay in the tab order (see focusin).
            tl.fromTo(
              el,
              { opacity: 0, scale: 0.96 },
              { opacity: 1, scale: 1, duration: 0.6, ease: 'settle' },
              at
            );
            cursor += 0.08;
            return;
          }
          if (cls.contains('rv-mask')) {
            const children = Array.from(el.children);
            // The stylesheet parks the child at translateY(110%); GSAP reads that as a pixel
            // `y`, so it must be cleared explicitly or the child ends one line too low.
            tl.fromTo(children, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'reveal', stagger: 0.05 }, at);
            tl.call(() => el.classList.add('is-revealed'), [], at + 0.6 + 0.05 * Math.max(0, children.length - 1));
            cursor += 0.05;
          }
        });

        built.push({ groupEl, tl, lines, opts: { enterAt: parseEnterAt(groupEl.dataset.rvStart ?? defaultStart) } });
      });
    }, root);

    // Lines need font metrics; the beat registers once its timeline is complete.
    const finish = () => {
      if (cancelled) return;
      ctx.add(() => {
        built.forEach(({ groupEl, tl, lines, opts }) => {
          lines.forEach(({ el, at }) => {
            // A line target inside a display:none variant cannot be measured: just un-hide it.
            if (el.getClientRects().length === 0) {
              gsap.set(el, { visibility: 'visible' });
              return;
            }
            splits.push(splitLinesInto(el, tl, at));
          });
          unregisters.push(registerBeat(groupEl, tl, opts));
        });
      });
    };
    document.fonts.ready.then(finish, finish);

    return () => {
      cancelled = true;
      unregisters.forEach((fn) => fn());
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [ref, defaultStart, registerBeat]);
}
