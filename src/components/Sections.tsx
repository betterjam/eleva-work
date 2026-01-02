'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Step = { title: string; desc: string };
type Card = { title: string; desc: string };
type AdminRow = { label: string; value: string };
type Plan = { name: string; price: string; note: string; bullets: string[]; cta: string; highlight?: string };
type FAQItem = { q: string; a: string };
type HowRow = { k: string; v: string };

export default function Sections() {
  const t = useTranslations();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Basic reveals with stagger
      const reveals = gsap.utils.toArray<HTMLElement>('.js-reveal');
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        );
      });

      // Staggered cards in How section
      const howCards = gsap.utils.toArray<HTMLElement>('.js-how-card');
      if (howCards.length) {
        gsap.fromTo(
          howCards,
          { y: 40, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: howCards[0],
              start: 'top 85%',
            },
          }
        );
      }

      // Security cards with slide in
      const securityCards = gsap.utils.toArray<HTMLElement>('.js-security-card');
      if (securityCards.length) {
        gsap.fromTo(
          securityCards,
          { x: -40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: securityCards[0],
              start: 'top 85%',
            },
          }
        );
      }

      // Pricing cards with pop effect
      const pricingCards = gsap.utils.toArray<HTMLElement>('.js-pricing-card');
      if (pricingCards.length) {
        gsap.fromTo(
          pricingCards,
          { y: 60, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: pricingCards[0],
              start: 'top 85%',
            },
          }
        );
      }

      // FAQ cards with alternating slide
      const faqCards = gsap.utils.toArray<HTMLElement>('.js-faq-card');
      faqCards.forEach((card, i) => {
        const fromX = i % 2 === 0 ? -30 : 30;
        gsap.fromTo(
          card,
          { x: fromX, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
            },
          }
        );
      });

      // Parallax effect on dashboard panels
      const parallaxElements = gsap.utils.toArray<HTMLElement>('.js-parallax');
      parallaxElements.forEach((el) => {
        gsap.to(el, {
          y: -30,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      // Counter animation for pricing
      const prices = gsap.utils.toArray<HTMLElement>('.js-price');
      prices.forEach((el) => {
        const text = el.textContent || '';
        const match = text.match(/\d+/);
        if (match) {
          const target = parseInt(match[0], 10);
          gsap.fromTo(
            el,
            { textContent: '$0' },
            {
              textContent: target,
              duration: 1.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
              },
              snap: { textContent: 1 },
              onUpdate: function() {
                const val = Math.round(parseFloat(el.textContent?.replace(/[^0-9.]/g, '') || '0'));
                el.textContent = `$${val}`;
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = t.raw('how.steps') as Step[];
  const howRows = t.raw('how.rows') as HowRow[];
  const securityCards = t.raw('security.cards') as Card[];
  const adminRows = t.raw('security.adminRows') as AdminRow[];
  const plans = t.raw('pricing.plans') as Plan[];
  const faqItems = t.raw('faq.items') as FAQItem[];

  return (
    <div ref={sectionRef} className="sections-wrapper bg-[#070A12] text-white transition-all duration-500">
      {/* How it works */}
      <section id="how" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="js-reveal max-w-2xl">
            <h2 className="text-3xl font-semibold">{t('how.title')}</h2>
            <p className="mt-3 text-white/70">{t('how.sub')}</p>
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div className="space-y-6">
              {steps.map((s: Step, i: number) => (
                <div key={s.title} className="js-how-card rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="text-sm font-medium">{s.title}</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="js-parallax rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="text-sm font-medium">{t('how.dashboardTitle')}</div>
              <p className="mt-2 text-sm text-white/70">{t('how.dashboardSub')}</p>

              <div className="mt-6 space-y-3 text-xs text-white/70">
                {howRows.map((row: HowRow) => (
                  <div key={row.k} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span>{row.k}</span>
                    <span className="text-white/90">{row.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">{t('how.nextActionLabel')}</div>
                <div className="mt-1 text-sm font-medium">{t('how.nextActionTitle')}</div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-2xl bg-white px-4 py-2 text-xs font-medium text-black transition hover:opacity-90">
                    {t('how.send')}
                  </button>
                  <button className="rounded-2xl border border-white/15 px-4 py-2 text-xs text-white/85 transition hover:bg-white/10">
                    {t('how.preview')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <div className="js-reveal">
                <h2 className="text-3xl font-semibold">{t('security.title')}</h2>
                <p className="mt-3 text-white/70">{t('security.sub')}</p>
              </div>

              <div className="mt-6 grid gap-3">
                {securityCards.map((x: Card) => (
                  <div key={x.title} className="js-security-card rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="text-sm font-medium">{x.title}</div>
                    <p className="mt-2 text-sm text-white/70">{x.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="js-parallax rounded-3xl border border-white/10 bg-black/20 p-6">
              <div className="text-sm font-medium">{t('security.adminTitle')}</div>
              <p className="mt-2 text-sm text-white/70">{t('security.adminSub')}</p>

              <div className="mt-6 space-y-3 text-xs">
                {adminRows.map((r: AdminRow) => (
                  <div key={r.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-white/70">{r.label}</span>
                    <span className="text-white/90">{r.value}</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-white/50">{t('security.note')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="js-reveal max-w-2xl">
            <h2 className="text-3xl font-semibold">{t('pricing.title')}</h2>
            <p className="mt-3 text-white/70">{t('pricing.sub')}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {plans.map((p: Plan) => (
              <div
                key={p.name}
                className={`js-pricing-card rounded-3xl border p-6 shadow-lg ${
                  p.highlight ? 'border-white/25 bg-white/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-medium">{p.name}</div>
                  {p.highlight && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80">
                      {p.highlight}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="js-price text-4xl font-semibold">{p.price}</div>
                  <div className="mt-1 text-xs text-white/60">{p.note}</div>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-white/75">
                  {p.bullets.map((b: string) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/70" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#demo"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${
                    p.highlight
                      ? 'bg-white text-black hover:opacity-90'
                      : 'border border-white/15 text-white/85 hover:bg-white/10'
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>

          <div className="js-reveal mt-10 rounded-3xl border border-white/10 bg-black/20 p-6">
            <div className="text-sm font-medium">{t('pricing.procTitle')}</div>
            <p className="mt-2 text-sm text-white/70">{t('pricing.procSub')}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="js-reveal max-w-2xl">
            <h2 className="text-3xl font-semibold">{t('faq.title')}</h2>
            <p className="mt-3 text-white/70">{t('faq.sub')}</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqItems.map((x: FAQItem) => (
              <div key={x.q} className="js-faq-card rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-medium">{x.q}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{x.a}</p>
              </div>
            ))}
          </div>

          <div className="js-reveal mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-semibold">{t('faq.finalTitle')}</h3>
                <p className="mt-2 text-sm text-white/70">{t('faq.finalSub')}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
                >
                  {t('faq.requestDemo')}
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/85 transition hover:bg-white/10"
                >
                  {t('faq.viewPricing')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
