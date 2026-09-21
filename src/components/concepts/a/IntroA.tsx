'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { gsap, SplitText } from '@/components/concepts/shared/gsapSetup';
import { splitLines } from './splitLines';
import { useScrollTo } from './scrollTo';

type IndexEntry = { id: string; num: string; label: string };

/**
 * Page intro — the cover of `/platform`. Compact by design: eyebrow, H1, a two-sentence
 * lead, the way back to the landing, the demo CTA (the form lives on the landing) and the
 * §01–§07 index of the page. No stats strip and no plate: the System sheet (§01) right
 * below is the real opening spread.
 *
 * Its section spec is `flow / next: continue`, but the choreography here is a LOAD
 * timeline, not a scroll window (the block is above the fold on arrival, so there is no
 * window to scrub): the subtree is `data-rv-manual` and this component drives the
 * `.rv-*` targets itself. Reduced motion and no-JS get the CSS final states.
 */
export default function IntroA() {
  const t = useTranslations('conceptA');
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const scrollTo = useScrollTo();

  const index = t.raw('intro.index') as IndexEntry[];

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const splits: SplitText[] = [];
    let cancelled = false;
    const ctx = gsap.context(() => {}, section);

    const start = () => {
      if (cancelled) return;
      ctx.add(() => {
        const eyebrow = section.querySelector<HTMLElement>('.a-intro-eyebrow');
        const title = section.querySelector<HTMLElement>('.a-intro-h1');
        const lead = section.querySelector<HTMLElement>('.a-intro-lead');
        const actions = section.querySelector<HTMLElement>('.a-intro-actions');
        const indexLabel = section.querySelector<HTMLElement>('.a-intro-index-label');
        const rows = section.querySelectorAll<HTMLElement>('.a-intro-index-item');
        const hr = section.querySelector<HTMLElement>('.a-intro-hr');

        // Masked lines carry the weight; the rest settles around them.
        if (title) splits.push(splitLines(title, { delay: 0.12, duration: 0.85, stagger: 0.08 }));
        if (lead) splits.push(splitLines(lead, { delay: 0.45, duration: 0.7, stagger: 0.07 }));

        const tl = gsap.timeline();
        if (eyebrow) {
          tl.fromTo(
            eyebrow,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0 0 0)', duration: 0.5, ease: 'reveal' },
            0
          ).set(eyebrow, { clipPath: 'none' });
        }
        if (actions) {
          tl.fromTo(
            actions,
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.5, ease: 'settle' },
            0.8
          );
        }
        if (hr) tl.fromTo(hr, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'reveal' }, 0.85);
        if (indexLabel) {
          tl.fromTo(
            indexLabel,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0 0 0)', duration: 0.45, ease: 'reveal' },
            0.95
          ).set(indexLabel, { clipPath: 'none' });
        }
        if (rows.length) {
          tl.fromTo(
            rows,
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0 0 0)', duration: 0.45, stagger: 0.05, ease: 'reveal' },
            1
            // A residual clip-path would clip the focus ring of the button inside.
          ).set(rows, { clipPath: 'none' });
        }
      });
    };

    // Lines need font metrics before they can be split.
    document.fonts.ready.then(start, start);

    return () => {
      cancelled = true;
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, []);

  return (
    <section id="intro" data-section="intro" ref={ref} className="a-section a-intro" data-rv-manual>
      <div className="a-container">
        <div className="a-cols">
          <div className="col-span-4 md:col-span-9">
            <p className="a-label a-intro-eyebrow rv-wipe">{t('intro.eyebrow')}</p>
            <h1 className="a-h1 a-intro-h1 rv-lines">{t('intro.title')}</h1>
            <p className="a-lead a-intro-lead rv-lines">{t('intro.lead')}</p>
            <div className="a-intro-actions rv-fade">
              {/* Cross-page: the landing owns the hero, the pricing, the FAQ and the form. */}
              <Link href={`/${locale}/`} className="a-link a-intro-back">
                {t('intro.back')}
              </Link>
              <Link href={`/${locale}/#demo`} className="a-btn a-btn-primary a-btn-sm">
                {t('intro.cta')}
              </Link>
            </div>
          </div>
        </div>

        <nav className="a-intro-index" aria-label={t('intro.indexLabel')}>
          <span className="a-intro-hr rv-rule-x" aria-hidden="true" />
          <span className="a-label a-intro-index-label rv-wipe">{t('intro.indexLabel')}</span>
          <ol className="a-intro-index-list">
            {index.map((e) => (
              <li key={e.id} className="a-intro-index-item rv-wipe">
                <button type="button" className="a-intro-index-link" onClick={() => scrollTo(`#${e.id}`, 72)}>
                  <span className="a-code a-intro-index-num">{e.num}</span>
                  <span>{e.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
