'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, registerAnchor, unregisterAnchor } from '@/lib/scrollNav';
import TrialCta from '@/components/TrialCta';

gsap.registerPlugin(ScrollTrigger);

/** What a `data-fx` element does when its reveal progress moves 0 -> 1. */
type RevealKind = 'title' | 'text' | 'rule' | 'card';

const revealFrom: Record<RevealKind, gsap.TweenVars> = {
  title: { clipPath: 'inset(0% 100% 0% 0%)', y: 8 },
  text: { opacity: 0, y: 12 },
  rule: { scaleX: 0, transformOrigin: 'left center' },
  card: { clipPath: 'inset(0% 0% 100% 0%)', y: 22, opacity: 0 },
};

const revealTo: Record<RevealKind, gsap.TweenVars> = {
  title: { clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
  text: { opacity: 1, y: 0 },
  rule: { scaleX: 1, transformOrigin: 'left center' },
  card: { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1 },
};

const kindOf = (el: HTMLElement): RevealKind => (el.dataset.fx as RevealKind) || 'card';

/**
 * A scrubbed reveal must never un-reveal itself when the reader scrolls back:
 * once its window is behind us the animation is snapped to its end and the
 * trigger stops listening (the tween stays alive, so gsap.context can still
 * revert it on unmount).
 */
function lockAtEnd(self: ScrollTrigger) {
  self.getTween()?.kill();
  self.animation?.progress(1);
  self.disable(false, true);
}

export default function DemoForm() {
  const t = useTranslations('demo');
  // `null` until the first client measurement: the reveal effect below picks
  // the mobile or the desktop tree from it, and a `false` default would build
  // the desktop reveals once against the `hidden md:block` section on a phone.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLElement>(null);
  const desktopBoxRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop: "Solicitar demo" (header, hero, stage CTA, deep link) lands on the
  // page's last screen, the form standing above the footer, not on the section's
  // top edge: the section fills the viewport and parks the form at its bottom,
  // so landing on its top edge would show an empty band with the form under it.
  // On phones the stacked section is taller than the screen and `resolveY`
  // falls back to the `#demo` wrapper element, which is right.
  useEffect(() => {
    if (isMobile !== false) return;
    registerAnchor('demo', () => document.documentElement.scrollHeight - window.innerHeight);
    return () => unregisterAnchor('demo');
  }, [isMobile]);

  // Desktop: centre the pair in the band the reader actually sees on that last
  // screen, between the header and the footer. The box fills the viewport
  // below the header; at the page's end its top (footer height minus header)
  // is scrolled out above and the header covers the rest, so the visible band
  // is the box minus one footer height at the top. Padding the box by the
  // footer's height and centring in what is left puts the pair mid-band.
  useEffect(() => {
    if (isMobile !== false) return;
    const box = desktopBoxRef.current;
    const footer = document.querySelector('footer');
    if (!box || !footer) return;
    const apply = () => {
      box.style.paddingTop = `${footer.offsetHeight}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(footer);
    return () => {
      observer.disconnect();
      box.style.paddingTop = '';
    };
  }, [isMobile]);

  // Reveals. The elements carrying `data-fx` are wrappers this component owns,
  // never the Benefits/FormCard subtrees themselves - those are re-created on
  // every render, so inline styles written onto them would not survive a submit.
  useEffect(() => {
    if (isMobile === null || prefersReducedMotion()) return;

    const root = isMobile ? mobileRef.current : sectionRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-fx]'));
    if (!items.length) return;

    const ctx = gsap.context(() => {
      if (isMobile) {
        // Stacked layout: a flick would cross a scrubbed window before anyone
        // saw it, so each element plays its reveal once, in real time, as it
        // enters the viewport.
        items.forEach((el, i) => {
          const kind = kindOf(el);
          gsap.fromTo(el, { ...revealFrom[kind] }, {
            ...revealTo[kind],
            duration: kind === 'card' ? 0.7 : 0.5,
            delay: (i % 4) * 0.06,
            ease: 'power2.out',
            // A finished wipe drops its clip-path: resting on inset(0 0 0 0)
            // keeps clipping at the border box and would swallow the card's
            // shadow and any focus ring inside it.
            onComplete: () => {
              gsap.set(el, { clipPath: 'none' });
            },
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          });
        });
        return;
      }

      // Desktop: one cascade over the window in which the section enters the
      // viewport, finished by the time its top reaches 35% of the viewport.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 80%',
          end: 'top 35%',
          scrub: 0.3,
          onLeave: lockAtEnd,
        },
      });

      items.forEach((el, index) => {
        const kind = kindOf(el);
        tl.fromTo(
          el,
          { ...revealFrom[kind] },
          {
            ...revealTo[kind],
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(el, { clipPath: 'none' });
            },
          },
          index * 0.12,
        );
      });
    }, root);

    return () => ctx.revert();
  }, [isMobile]);

  // Rendered as elements (called, not mounted as components): a component defined in here would be a new
  // type on every render, and React would remount the form, wiping what was typed, on every state change.
  const benefits = () => (
    <div className="space-y-4">
      {[
        { title: t('benefit1Title'), sub: t('benefit1Sub') },
        { title: t('benefit2Title'), sub: t('benefit2Sub') },
        { title: t('benefit3Title'), sub: t('benefit3Sub') },
      ].map((benefit) => (
        <div key={benefit.title} className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 flex-shrink-0">
            <svg className="h-3.5 w-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-white">{benefit.title}</div>
            <div className="text-sm text-white/60">{benefit.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // The card spans its column: the whole width on phones, the desktop column's max-w-md beside the copy. Where the
  // request form was: the trial is taken in the app, and this is the way there.
  const formCard = () => (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* The brand's flying pair: the trial is where a team takes off. Decorative, so no alternative text. */}
      <div className="trial-art flex justify-center px-6 pt-5">
        <Image
          src="/images/illustrations/artboard-3.webp"
          alt=""
          width={960}
          height={593}
          sizes="(min-width: 768px) 17rem, 70vw"
          className="h-auto w-full max-w-[17rem]"
        />
      </div>
      <div className="p-6 pt-4 md:p-8 md:pt-5">
        <h3 className="text-xl font-semibold text-white">{t('trialTitle')}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{t('trialSub')}</p>
        <TrialCta wide className="mt-6" label={t('trialCta')} note={t('trialNote')} />
      </div>
    </div>
  );

  return (
    <div id="demo">
      {/* Mobile layout - simple stacked */}
      <section ref={mobileRef} className="md:hidden border-t border-white/10 px-5 py-12">
        <h2 data-fx="title" className="text-2xl font-semibold text-white">
          {t('title')}
        </h2>
        <p data-fx="text" className="mt-3 text-base text-white/70">
          {t('sub')}
        </p>
        <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />

        <div data-fx="card" className="mt-6">
          {benefits()}
        </div>

        <div data-fx="card" className="mt-8">
          {formCard()}
        </div>
      </section>

      {/* Desktop layout - copy and form side by side in the hero's container width,
          the copy flush against the form, both centred on the same vertical axis.
          The section fills the viewport below the 73px sticky header, so the
          pinned stage above never shows at the page's last scroll, and the pair
          is centred in the band between header and footer (see the padding
          effect above), which is what the reader sees on that last screen. */}
      <section ref={sectionRef} className="hidden md:block border-t border-white/10">
        <div ref={desktopBoxRef} className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center px-5 pt-20">
          <div className="flex items-center gap-12 lg:gap-20">
          {/* Left side - copy */}
          <div className="flex min-w-0 flex-1 justify-end">
            <div className="max-w-xl">
              <h2 data-fx="title" className="text-3xl font-semibold text-white md:text-4xl">
                {t('title')}
              </h2>
              <p data-fx="text" className="mt-4 text-lg text-white/70">
                {t('sub')}
              </p>
              <div data-fx="rule" className="mt-6 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
              <div data-fx="card" className="mt-8">
                {benefits()}
              </div>
            </div>
          </div>

          {/* Right side - form */}
          <div className="w-full max-w-md flex-shrink-0">
            {/* The wrapper, not FormCard itself, carries the reveal: FormCard
                is re-created on every render and would lose the inline styles. */}
            <div data-fx="card" className="w-full">
              {formCard()}
            </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}
