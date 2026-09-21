'use client';

import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, registerAnchor, unregisterAnchor } from '@/lib/scrollNav';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // `null` until the first client measurement: React commits the effect that
  // sets it and the motion effects below in the same pass, so a two-state
  // `false` default would run the desktop pin once against the `hidden
  // md:block` section on a phone - every metric inside `display:none` is 0, so
  // the pin length comes out wrong and the trigger (plus its pin-spacer and the
  // refresh it forces) is built and torn down for nothing.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Skip the pinned effect on mobile, before the breakpoint is known, and
    // under reduced motion: unlike the Features stage this pin is not the only
    // route to anything, so a reader who asked for no motion gets the plain
    // two-column section instead of a ~500px scroll hijack. Navigation still
    // resolves `#demo`: with no anchor registered, `resolveY` falls back to the
    // wrapper element, and `goTo` jumps with `window.scrollTo` anyway.
    if (isMobile !== false || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const leftContent = leftContentRef.current;
      const trigger = triggerRef.current;

      if (!leftContent || !trigger) return;

      // The column's height is read live, never cached: a resize, a font swap
      // or a rotation changes it, and a stale value leaves the pin length and
      // the translation disagreeing - the copy either stops short of the top of
      // the column or overshoots and is cut before the pin releases.
      const st = ScrollTrigger.create({
        trigger: trigger,
        start: 'top top',
        end: () => `+=${leftContent.scrollHeight}`,
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set(leftContent, {
            y: -leftContent.scrollHeight * self.progress,
          });
        },
      });

      // The section is pinned: its document position is the pin start.
      registerAnchor('demo', () => st.start);
    }, sectionRef);

    return () => {
      unregisterAnchor('demo');
      ctx.revert();
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
        // Stacked layout: one short window per element, locked once passed.
        items.forEach((el) => {
          const kind = kindOf(el);
          gsap.fromTo(el, { ...revealFrom[kind] }, {
            ...revealTo[kind],
            ease: 'power2.out',
            // A finished wipe drops its clip-path: resting on inset(0 0 0 0)
            // keeps clipping at the border box and would swallow the card's
            // shadow and any focus ring inside it.
            onComplete: () => {
              gsap.set(el, { clipPath: 'none' });
            },
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              end: 'top 55%',
              scrub: 0.3,
              onLeave: lockAtEnd,
            },
          });
        });
        return;
      }

      // Desktop: the section pins at `top top`, so the whole cascade is spent
      // in the window above that - it is finished before the pin engages.
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // Honeypot check - if filled, it's a bot
    if (formData.get('website')) {
      setIsSubmitted(true); // Fake success to not alert bots
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with real API endpoint
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   body: JSON.stringify(Object.fromEntries(formData)),
      // });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Benefits component
  const Benefits = () => (
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

  // Form component
  const FormCard = () => (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
      {isSubmitted ? (
        <div className="text-center py-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-7 w-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">{t('successTitle')}</h3>
          <p className="mt-1.5 text-sm text-white/70">{t('successSub')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {/* Honeypot field - hidden from users, bots will fill it */}
          <input
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            className="absolute -left-[9999px] opacity-0 h-0 w-0"
            aria-hidden="true"
          />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1.5">
              {t('nameLabel')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none transition focus:border-white/25 focus:bg-white/10"
              placeholder={t('namePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
              {t('emailLabel')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none transition focus:border-white/25 focus:bg-white/10"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="school" className="block text-sm font-medium text-white/80 mb-1.5">
              {t('schoolLabel')}
            </label>
            <input
              type="text"
              id="school"
              name="school"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none transition focus:border-white/25 focus:bg-white/10"
              placeholder={t('schoolPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-white/80 mb-1.5">
              {t('roleLabel')}
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none transition focus:border-white/25 focus:bg-white/10"
            >
              <option value="" className="bg-[#070A12]">{t('rolePlaceholder')}</option>
              <option value="director" className="bg-[#070A12]">{t('roleDirector')}</option>
              <option value="rrhh" className="bg-[#070A12]">{t('roleHR')}</option>
              <option value="utp" className="bg-[#070A12]">{t('roleUTP')}</option>
              <option value="other" className="bg-[#070A12]">{t('roleOther')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-1.5">
              {t('messageLabel')}
            </label>
            <textarea
              id="message"
              name="message"
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 outline-none transition focus:border-white/25 focus:bg-white/10 resize-none"
              placeholder={t('messagePlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50 shadow-lg shadow-brand-600/25"
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>

          <p className="text-center text-xs text-white/50">
            {t('privacy')}
          </p>
        </form>
      )}
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
          <Benefits />
        </div>

        <div data-fx="card" className="mt-8">
          <FormCard />
        </div>
      </section>

      {/* Desktop layout - pinned split */}
      <section ref={sectionRef} className="hidden md:block border-t border-white/10">
        <div ref={triggerRef} className="relative h-screen overflow-hidden">
          <div className="absolute inset-0 flex">
            {/* Left side - Centered content */}
            <div className="w-1/2 h-full flex items-center justify-center overflow-hidden">
              <div ref={leftContentRef} className="px-8 lg:px-16 max-w-xl">
                <h2 data-fx="title" className="text-3xl font-semibold text-white md:text-4xl">
                  {t('title')}
                </h2>
                <p data-fx="text" className="mt-4 text-lg text-white/70">
                  {t('sub')}
                </p>
                <div data-fx="rule" className="mt-6 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                <div data-fx="card" className="mt-8">
                  <Benefits />
                </div>
              </div>
            </div>

            {/* Right side - Fixed Form */}
            <div className="w-1/2 h-full flex items-center justify-center px-8 lg:px-16">
              {/* The wrapper, not FormCard itself, carries the reveal: FormCard
                  is re-created on every render and would lose the inline styles. */}
              <div data-fx="card" className="w-full max-w-md">
                <FormCard />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
