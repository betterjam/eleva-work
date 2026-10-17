'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ScrollCue from '@/components/ScrollCue';
import { onCue, type CueState } from '@/lib/scrollNav';

/**
 * The one "keep scrolling" cue on desktop: fixed to the bottom of the viewport,
 * it travels with the reader and only its destination changes. The pinned
 * Features stage publishes the next stop while it is active (src/lib/scrollNav
 * `setCue`); before it the target is the stage itself, after it the demo form.
 * Two things hide it, both decided here in local state so no publish from the
 * stage can switch it back on:
 * - the demo form on screen (and everything below it, the footer), or the
 *   page scrolled to its very end for any reason;
 * - the hero's social strip still below the fold, which happens on short
 *   viewports where the hero is taller than the screen: the strip's empty
 *   middle is the cue's slot on the first screen, and until that slot has
 *   scrolled into view the cue would sit on the hero's pills instead.
 * Both are read straight from the live geometry on every scroll and resize,
 * and again whenever an IntersectionObserver reports a change (that is what
 * catches the layout jump when the stage inserts its pin spacer). Reading the
 * geometry, rather than keeping a transition's verdict, means no missed
 * callback can ever leave the cue stuck on the footer. No ScrollTrigger here:
 * this component mounts before the stage inserts its pin spacer, and a
 * ScrollTrigger created then keeps positions measured thousands of pixels too
 * high. Phones keep their inline cues: a fixed one would fight the WhatsApp
 * button and the banner.
 */
export default function FloatingCue() {
  const t = useTranslations();
  const [cue, setCueState] = useState<CueState>({ target: 'features', parked: false });
  const [mounted, setMounted] = useState(false);
  const [atForm, setAtForm] = useState(false);
  const [slotBelowFold, setSlotBelowFold] = useState(false);

  useEffect(() => onCue(setCueState), []);

  useEffect(() => {
    // Enters after the hero's own entrance has had its moment.
    const timer = window.setTimeout(() => setMounted(true), 1400);

    const demo = document.getElementById('demo');
    const slot = document.querySelector('#hero section');

    // "At the form" from the moment its top crosses 70% of the viewport, for
    // everything below it, and at the page's end whatever is there. "Slot
    // below the fold" while the strip has not entered the viewport yet.
    let frame = 0;
    const evaluate = () => {
      frame = 0;
      const vh = window.innerHeight;
      const atEnd = window.scrollY >= document.documentElement.scrollHeight - vh - 4;
      const demoTop = demo ? demo.getBoundingClientRect().top : Infinity;
      setAtForm(atEnd || demoTop < vh * 0.7);
      const slotTop = slot ? slot.getBoundingClientRect().top : -Infinity;
      setSlotBelowFold(slotTop >= vh);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(evaluate);
    };
    evaluate();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observers = [demo, slot]
      .filter((el): el is Element => !!el)
      .map((el) => {
        const observer = new IntersectionObserver(schedule, { threshold: [0, 0.3, 0.7, 1] });
        observer.observe(el);
        return observer;
      });

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  const sections: Record<string, string> = {
    how: t('nav.how'),
    security: t('nav.security'),
    faq: t('nav.faq'),
    demo: t('nav.requestDemo'),
  };
  const named = cue.target ? sections[cue.target] : undefined;
  // Named destinations get "Siguiente: X"; every stop inside the stage is just
  // "keep scrolling", with the accessible name saying where that leads.
  const label = named ? t('cues.nextTo', { section: named }) : t('cues.keepScrolling');
  const ariaLabel = named ? label : t('cues.keepScrollingTo', { section: t('nav.features') });
  const visible = mounted && !atForm && !slotBelowFold && cue.target !== null;

  return (
    <div
      inert={!visible}
      className={`floating-cue pointer-events-none fixed bottom-8 left-1/2 z-40 hidden md:block transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${cue.parked ? '-translate-x-[calc(50%+35vw)]' : '-translate-x-1/2'}`}
    >
      <ScrollCue
        targetId={cue.target ?? 'demo'}
        label={label}
        ariaLabel={ariaLabel}
        variant="float"
        className="pointer-events-auto"
      />
    </div>
  );
}
