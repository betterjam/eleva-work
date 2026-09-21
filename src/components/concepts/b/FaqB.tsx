'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import { EASE, MQ, useMotion, type MotionKit } from './motion';

type FaqItem = { num: string; q: string; a: string };

/**
 * § Notas — six questions on hairlines; questions unmask in batches, answers
 * open with a height tween + clip-path reveal, one at a time.
 */
export default function FaqB() {
  const t = useTranslations('conceptB');
  const items = t.raw('faq.items') as FaqItem[];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const root = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const ictx = useRef<gsap.Context | null>(null);
  const reducedRef = useRef(false);

  // Interaction context (long-lived; reverted on unmount).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      // Reduced motion: CSS opens every answer for no-JS; with JS the accordion still works.
      if (reducedRef.current && listRef.current) gsap.set(listRef.current.querySelectorAll('.b-faq-a'), { height: 0 });
    }, el);
    ictx.current = ctx;
    return () => {
      ictx.current = null;
      ctx.revert();
    };
  }, []);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines } = kit;
    mm.add(MQ.motion, () => {
      if (h2Ref.current) {
        const h = h2Ref.current;
        splitLines(h, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.08, ease: EASE.reveal, scrollTrigger: { trigger: h, start: 'top 80%', once: true } }));
      }
      if (ledeRef.current) {
        const l = ledeRef.current;
        splitLines(l, (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.7, stagger: 0.05, ease: EASE.reveal, delay: 0.2, scrollTrigger: { trigger: l, start: 'top 80%', once: true } }));
      }
      const rows = q('.b-faq > li');
      if (rows.length) {
        ScrollTrigger.batch(rows, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            const qs = batch.map((li) => li.querySelector('.b-faq-q')).filter(Boolean) as Element[];
            gsap.fromTo(qs, { yPercent: 110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, ease: EASE.reveal });
          },
        });
      }
    });
  }, []);

  useMotion(root, build);

  const animate = (idx: number, open: boolean) => {
    const li = listRef.current?.children[idx] as HTMLElement | undefined;
    if (!li) return;
    const answer = li.querySelector<HTMLElement>('.b-faq-a');
    const inner = answer?.firstElementChild as HTMLElement | null;
    const plus = li.querySelector<HTMLElement>('.b-faq-plus');
    if (!answer || !inner || !plus) return;
    const ctx = ictx.current;
    if (!ctx) return;
    if (reducedRef.current) {
      ctx.add(() => {
        gsap.set(answer, { height: open ? 'auto' : 0 });
        gsap.set(plus, { rotate: open ? 45 : 0 });
      });
      ScrollTrigger.refresh();
      return;
    }
    ctx.add(() => {
      gsap.killTweensOf([answer, inner, plus]);
      if (open) {
        gsap
          .timeline({ onComplete: () => ScrollTrigger.refresh() })
          .to(answer, { height: 'auto', duration: 0.45, ease: EASE.settle })
          .fromTo(inner, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: EASE.reveal }, 0)
          .to(plus, { rotate: 45, duration: 0.3, ease: EASE.snap }, 0);
      } else {
        gsap
          .timeline({ onComplete: () => ScrollTrigger.refresh() })
          .to(answer, { height: 0, duration: 0.3, ease: EASE.snap })
          .to(plus, { rotate: 0, duration: 0.3, ease: EASE.snap }, 0);
      }
    });
  };

  const toggle = (i: number) => {
    const next = openIndex === i ? null : i;
    if (openIndex !== null) animate(openIndex, false);
    if (next !== null) animate(next, true);
    setOpenIndex(next);
  };

  return (
    <section id="faq" ref={root} data-chapter={t('faq.runningHead')} className="b-section">
      <div className="b-container">
        <div className="b-grid">
          <div className="b-c1-4">
            <div className="b-divider">
              <span className="b-folio">{t('faq.folio')}</span>
            </div>
            <h2 ref={h2Ref} className="b-h2 r-text" style={{ marginTop: 24 }}>
              {t('faq.title')}
            </h2>
            <p ref={ledeRef} className="b-lede r-text" style={{ marginTop: 16, fontSize: 18 }}>
              {t('faq.lede')}
            </p>
          </div>
          <div className="b-c5-12">
            <ol ref={listRef} className="b-faq">
              {items.map((it, i) => {
                const open = openIndex === i;
                return (
                  <li key={it.num} className={open ? 'is-open' : undefined}>
                    <button type="button" aria-expanded={open} aria-controls={`b-faq-a-${i}`} onClick={() => toggle(i)}>
                      <span className="b-faq-num">{it.num}</span>
                      <span className="b-mask">
                        <span id={`b-faq-q-${i}`} className="b-faq-q r-text">
                          {it.q}
                        </span>
                      </span>
                      <span className="b-faq-plus" aria-hidden="true">
                        +
                      </span>
                    </button>
                    <div className="b-faq-a" id={`b-faq-a-${i}`} role="region" aria-labelledby={`b-faq-q-${i}`} aria-hidden={!open}>
                      <div>{it.a}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
