'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import { useSmoothScroll } from '@/components/concepts/shared/SmoothScroll';
import { EASE, MQ, countTo, useMotion, type MotionKit } from './motion';

type Figure = { value: number; suffix: string; label: string };
type IndexItem = { id: string; num: string; title: string; desc: string; plates: string };

/**
 * § 00 · Sumario: seven catalog figures on a ruled row (mechanical counters,
 * dividers drawing in) and a text-only index of chapters and appendices.
 */
export default function SumarioB() {
  const t = useTranslations('conceptB');
  const { scrollTo } = useSmoothScroll();
  const figures = t.raw('sumario.figures') as Figure[];
  const index = t.raw('sumario.index') as IndexItem[];
  const root = useRef<HTMLElement>(null);
  const figuresRef = useRef<HTMLDivElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q } = kit;
    mm.add(MQ.motion, () => {
      const row = figuresRef.current;
      if (row) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 80%', once: true } });
        const rules = q('.b-fig-rule', row);
        if (rules.length) tl.fromTo(rules, { scaleY: 0, autoAlpha: 1 }, { scaleY: 1, duration: 0.6, ease: EASE.reveal, stagger: 0.06 }, 0);
        q('.b-figures > div', row).forEach((cell, i) => {
          const fig = cell.querySelector<HTMLElement>('.r-count');
          const label = cell.querySelector<HTMLElement>('.b-mask > span');
          if (fig) {
            const value = Number(fig.dataset.value ?? 0);
            const suffix = fig.dataset.suffix ?? '';
            tl.add(countTo(fig, value, { duration: 1.2, ease: EASE.settle, suffix }), i * 0.08);
          }
          if (label) {
            tl.fromTo(label, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: EASE.reveal }, i * 0.08 + 0.2);
          }
        });
      }
      const rows = q('.b-index > li');
      if (rows.length) {
        ScrollTrigger.batch(rows, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            const titles = batch.map((li) => li.querySelector('.b-index-title')).filter(Boolean) as Element[];
            gsap.fromTo(
              titles,
              { yPercent: 110, opacity: 1 },
              { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, ease: EASE.reveal }
            );
          },
        });
      }
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="sumario" ref={root} data-chapter={t('sumario.runningHead')} className="b-section">
      <div className="b-container">
        <div className="b-divider">
          <span className="b-folio">{t('sumario.folio')}</span>
        </div>

        <div ref={figuresRef} className="b-figures has-rules" style={{ marginTop: 24 }}>
          {figures.map((f) => (
            <div key={f.label}>
              <i className="b-rule-v b-fig-rule r-rule-v" aria-hidden="true" />
              <span
                className="b-figure b-tnum r-count"
                data-value={f.value}
                data-suffix={f.suffix}
                style={{ display: 'block' }}
              >
                {f.value}
                {f.suffix}
              </span>
              <span className="b-mask" style={{ marginTop: 10 }}>
                <span className="b-label r-text">{f.label}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="b-folio" style={{ marginTop: 12, textAlign: 'right', whiteSpace: 'normal' }}>
          {t('sumario.footnote')}
        </p>

        <p className="b-label" style={{ marginTop: 64, marginBottom: 12 }}>
          {t('sumario.indexLabel')}
        </p>
        <ol className="b-index">
          {index.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => scrollTo(`#${item.id}`, 80)}>
                <span className="b-folio">{item.num}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="b-mask">
                    <span className="b-index-title r-text">{item.title}</span>
                  </span>
                  <span className="b-small" style={{ display: 'block', marginTop: 4 }}>
                    {item.desc}
                  </span>
                </span>
                <span className="b-folio">{item.plates}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
