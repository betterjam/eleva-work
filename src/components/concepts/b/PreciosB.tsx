'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import { useSmoothScroll } from '@/components/concepts/shared/SmoothScroll';
import { EASE, MQ, countTo, useMotion, type MotionKit } from './motion';

type Plan = { id: string; name: string; price: string; priceValue: number; period: string; highlight: boolean; cta: string };
type Feature = { label: string; cells: string[] };

/**
 * § Tarifario — a rate card. Desktop: a ruled matrix whose rules draw, prices
 * count, inclusion squares stamp and the "Más elegido" column is framed by a
 * stroked accent rect measured from the live layout. Mobile: three stacked
 * cards. Placeholder pricing, labelled as such.
 */
export default function PreciosB() {
  const t = useTranslations('conceptB');
  const { scrollTo } = useSmoothScroll();
  const plans = t.raw('precios.plans') as Plan[];
  const features = t.raw('precios.features') as Feature[];
  const hotIdx = Math.max(0, plans.findIndex((p) => p.highlight));

  const root = useRef<HTMLElement>(null);
  const ratesRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const tagMaskRef = useRef<HTMLSpanElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const drawnRef = useRef(false);

  /** Sizes the accent frame and the tag from the hot column's first/last cells. */
  const measure = useCallback(() => {
    const rates = ratesRef.current;
    const rect = rectRef.current;
    if (!rates || !rect) return;
    const col = rates.dataset.hot ?? '0';
    const cells = rates.querySelectorAll<HTMLElement>(`.b-rrow > [data-col="${col}"]`);
    if (!cells.length) return;
    const first = cells[0];
    const last = cells[cells.length - 1];
    const rb = rates.getBoundingClientRect();
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const x = a.left - rb.left;
    const y = a.top - rb.top;
    const w = a.width;
    const h = b.bottom - a.top;
    rect.setAttribute('x', String(x + 0.5));
    rect.setAttribute('y', String(y + 0.5));
    rect.setAttribute('width', String(Math.max(0, w - 1)));
    rect.setAttribute('height', String(Math.max(0, h - 1)));
    const perimeter = 2 * (w + h);
    rect.style.strokeDasharray = String(perimeter);
    if (!drawnRef.current) rect.style.strokeDashoffset = String(perimeter);
    if (tagMaskRef.current) {
      tagMaskRef.current.style.left = `${x + 16}px`;
      tagMaskRef.current.style.top = `${y}px`;
    }
  }, []);

  useEffect(() => {
    const rates = ratesRef.current;
    if (!rates) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) drawnRef.current = true;
    const ro = new ResizeObserver(() => measure());
    ro.observe(rates);
    measure();
    return () => ro.disconnect();
  }, [measure]);

  const build = useCallback(
    (kit: MotionKit) => {
      const { mm, q, splitLines, root: el } = kit;
      mm.add(MQ.motion, () => {
        if (h2Ref.current) {
          const h = h2Ref.current;
          splitLines(h, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.08, ease: EASE.reveal, scrollTrigger: { trigger: h, start: 'top 80%', once: true } }));
        }
        if (ledeRef.current) {
          const l = ledeRef.current;
          splitLines(l, (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.7, stagger: 0.05, ease: EASE.reveal, delay: 0.2, scrollTrigger: { trigger: l, start: 'top 80%', once: true } }));
        }
        const ruled = el.querySelector('.b-cta-ruled');
        if (ruled) gsap.fromTo(ruled.children, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.1, ease: EASE.settle, scrollTrigger: { trigger: ruled, start: 'top 92%', once: true } });
      });

      /* Desktop (≥1024): the matrix. Below that the 22 % plan columns cannot hold the CTAs. */
      mm.add(MQ.desktop, () => {
        const rates = ratesRef.current;
        if (!rates) return;
        const tl = gsap.timeline({ scrollTrigger: { trigger: rates, start: 'top 75%', once: true } });
        q('.b-plan-name', rates).forEach((n, i) => {
          splitLines(n, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.8, ease: EASE.reveal, delay: i * 0.08, scrollTrigger: { trigger: rates, start: 'top 75%', once: true } }));
        });
        q('.b-plan-price', rates).forEach((p, i) => {
          const v = Number(p.dataset.value ?? 0);
          if (v > 0) tl.add(countTo(p, v, { from: 0, duration: 0.9, ease: EASE.settle, prefix: '$' }), 0.2 + i * 0.08);
          else tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.2 + i * 0.08);
        });
        q('.b-rrow', rates).forEach((row, i) => {
          const rule = row.querySelector('.b-rrule');
          const squares = row.querySelectorAll('.b-square');
          const fades = row.querySelectorAll('.r-fade');
          const at = 0.1 + i * 0.05;
          if (rule) tl.fromTo(rule, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.5, ease: EASE.reveal }, at);
          if (squares.length) tl.fromTo(squares, { scale: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: EASE.snap, stagger: 0.05 }, at + 0.1);
          if (fades.length) tl.fromTo(fades, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, at + 0.1);
        });
        if (rectRef.current) {
          const rect = rectRef.current;
          tl.fromTo(
            rect,
            { strokeDashoffset: () => parseFloat(rect.style.strokeDasharray) || 0 },
            { strokeDashoffset: 0, duration: 1.4, ease: EASE.reveal },
            0.7
          );
        }
        const tag = tagMaskRef.current?.firstElementChild;
        if (tag) tl.fromTo(tag, { yPercent: -110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: EASE.reveal }, 1.7);
        tl.call(() => {
          drawnRef.current = true;
        });
      });

      /* Phones and tablets: stacked cards. */
      mm.add(MQ.stacked, () => {
        q('.b-rate-card', el).forEach((card) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 80%', once: true } });
          const name = card.querySelector('.b-plan-name');
          if (name) splitLines(name, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.8, ease: EASE.reveal, scrollTrigger: { trigger: card, start: 'top 80%', once: true } }));
          const price = card.querySelector<HTMLElement>('.b-plan-price');
          if (price) {
            const v = Number(price.dataset.value ?? 0);
            if (v > 0) tl.add(countTo(price, v, { from: 0, duration: 0.9, ease: EASE.settle, prefix: '$' }), 0.1);
            else tl.fromTo(price, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.1);
          }
          const squares = card.querySelectorAll('.b-square');
          const fades = card.querySelectorAll('.r-fade');
          if (squares.length) tl.fromTo(squares, { scale: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: EASE.snap, stagger: 0.04 }, 0.2);
          if (fades.length) tl.fromTo(fades, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.04 }, 0.2);
        });
      });
    },
    []
  );

  useMotion(root, build);

  const setHot = (i: number | null) => {
    const rates = ratesRef.current;
    if (!rates) return;
    if (i === null) rates.removeAttribute('data-hot-col');
    else rates.setAttribute('data-hot-col', String(i));
  };

  const cell = (v: string): ReactNode => {
    if (v === 'yes') {
      return (
        <span className="b-cell">
          <i className="b-square r-stamp" aria-hidden="true" />
          <span className="sr-only">{t('a11y.included')}</span>
        </span>
      );
    }
    if (v === 'no') {
      return (
        <span className="b-cell r-fade">
          <span aria-hidden="true">—</span>
          <span className="sr-only">{t('a11y.notIncluded')}</span>
        </span>
      );
    }
    return <span className="b-cell r-fade">{v}</span>;
  };

  const goDemo = () => scrollTo('#request-demo', 80);

  return (
    <section id="precios" ref={root} data-chapter={t('precios.runningHead')} className="b-section">
      <div className="b-container">
        <div className="b-grid">
          <div className="b-c1-8">
            <div className="b-divider">
              <span className="b-folio">{t('precios.folio')}</span>
            </div>
            <h2 ref={h2Ref} className="b-h2 r-text" style={{ marginTop: 24 }}>
              {t('precios.title')}
            </h2>
            <p ref={ledeRef} className="b-lede r-text" style={{ marginTop: 16 }}>
              {t('precios.lede')}
            </p>
          </div>
        </div>

        {/* Desktop matrix */}
        <div ref={ratesRef} className="b-rates b-lg-only" data-hot={hotIdx} style={{ marginTop: 40 }}>
          <svg className="b-hot-frame" aria-hidden="true">
            <rect ref={rectRef} />
          </svg>
          <span ref={tagMaskRef} className="b-hot-mask" style={{ left: 'calc(56% + 16px)', top: 0 }}>
            <span className="b-tag b-tag-fill r-text">{t('precios.highlightTag')}</span>
          </span>
          <div className="b-rates-grid" role="table">
            <div className="b-rrow is-head" role="row">
              <div role="columnheader">
                <span className="b-label">{t('precios.featureHead')}</span>
              </div>
              {plans.map((p, i) => (
                <div
                  key={p.id}
                  role="columnheader"
                  data-col={i}
                  className={p.highlight ? 'b-col-hot' : undefined}
                  onMouseEnter={() => setHot(i)}
                  onMouseLeave={() => setHot(null)}
                >
                  <span className="b-plan-name r-text">{p.name}</span>
                  <span className="b-plan-price b-tnum r-count" data-value={p.priceValue}>
                    {p.price}
                  </span>
                  <span className="b-plan-period">{p.period}</span>
                </div>
              ))}
              <i className="b-rrule r-rule" aria-hidden="true" />
            </div>
            {features.map((f) => (
              <div key={f.label} className="b-rrow" role="row">
                <div role="rowheader">{f.label}</div>
                {f.cells.map((c, i) => (
                  <div
                    key={i}
                    role="cell"
                    data-col={i}
                    className={plans[i]?.highlight ? 'b-col-hot' : undefined}
                    onMouseEnter={() => setHot(i)}
                    onMouseLeave={() => setHot(null)}
                  >
                    {cell(c)}
                  </div>
                ))}
                <i className="b-rrule r-rule" aria-hidden="true" />
              </div>
            ))}
            <div className="b-rrow is-cta" role="row">
              <div role="cell" />
              {plans.map((p, i) => (
                <div
                  key={p.id}
                  role="cell"
                  data-col={i}
                  className={p.highlight ? 'b-col-hot' : undefined}
                  onMouseEnter={() => setHot(i)}
                  onMouseLeave={() => setHot(null)}
                >
                  <button type="button" className="b-btn b-btn-sm r-fade" onClick={goDemo}>
                    {p.cta}
                  </button>
                </div>
              ))}
              <i className="b-rrule r-rule" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Stacked cards (<1024) */}
        <div className="b-rate-cards b-lg-hide" style={{ marginTop: 40 }}>
          {plans.map((p, i) => (
            <div key={p.id} className={`b-rate-card${p.highlight ? ' is-hot' : ''}`}>
              {p.highlight && (
                <span className="b-tag b-tag-fill" style={{ marginBottom: 12 }}>
                  {t('precios.highlightTag')}
                </span>
              )}
              <span className="b-plan-name r-text" style={{ display: 'block' }}>
                {p.name}
              </span>
              <span className="b-plan-price b-tnum r-count" data-value={p.priceValue} style={{ display: 'block' }}>
                {p.price}
              </span>
              <span className="b-plan-period" style={{ display: 'block' }}>
                {p.period}
              </span>
              <ul>
                {features.map((f) => (
                  <li key={f.label}>
                    <span>{f.label}</span>
                    {cell(f.cells[i] ?? 'no')}
                  </li>
                ))}
              </ul>
              <button type="button" className="b-btn r-fade" style={{ width: '100%', marginTop: 20 }} onClick={goDemo}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="b-cta-ruled">
          <button type="button" className="b-btn" onClick={goDemo}>
            {t('precios.cta')}
          </button>
          <span className="b-folio" style={{ whiteSpace: 'normal' }}>
            {t('precios.note')}
          </span>
        </div>
      </div>
    </section>
  );
}
