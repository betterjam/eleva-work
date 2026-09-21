'use client';

import { Fragment, useCallback, useRef, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import ChapterOpener from './ChapterOpener';
import Plate from './Plate';
import { EASE, MQ, countTo, useMotion, type MotionKit } from './motion';

type Relation = { label: string; value: string };
type MatchRow = { name: string; code: string; value: number };

/**
 * Cap. 01 · Estructura — three spreads: organigrama (plate wipes in from the
 * left), catálogo (inset-settle plate + word-masked alias line) and match con
 * IA (bottom→top wipe, scrubbed confidence bars, pull-quote).
 */
export default function Cap01Estructura() {
  const t = useTranslations('conceptB');
  const facts = t.raw('cap01.orgChart.facts') as string[];
  const aliases = t.raw('cap01.catalog.aliases') as string[];
  const relations = t.raw('cap01.catalog.relations') as Relation[];
  const rows = t.raw('cap01.match.rows') as MatchRow[];
  const unit = t('cap01.match.unit');

  const root = useRef<HTMLElement>(null);
  const s1 = useRef<HTMLDivElement>(null);
  const s2 = useRef<HTMLDivElement>(null);
  const s3 = useRef<HTMLDivElement>(null);
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);
  const p3 = useRef<HTMLDivElement>(null);
  const tableWrap = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines } = kit;
    mm.add(MQ.motion, () => {
      const lines = (el: Element | null, delay: number, stagger = 0.08, trigger?: Element | null) => {
        if (!el) return;
        splitLines(el, (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.8,
            stagger,
            ease: EASE.reveal,
            delay,
            scrollTrigger: { trigger: trigger ?? el, start: 'top 80%', once: true },
          })
        );
      };

      /* ---- 1a Organigrama ---- */
      if (s1.current) {
        const spread = s1.current;
        const tl = gsap.timeline({ scrollTrigger: { trigger: spread, start: 'top 75%', once: true }, defaults: { ease: EASE.reveal } });
        const factSpans = q('.b-ruled .b-mask > span', spread);
        const marks = q('.b-ruled .r-fade', spread);
        if (factSpans.length) tl.fromTo(factSpans, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.15 }, 0.5);
        if (marks.length) tl.fromTo(marks, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, stagger: 0.15 }, 0.7);
        lines(spread.querySelector('.b-h3'), 0.2, 0.08, spread);
        lines(spread.querySelector('.b-body'), 0.35, 0.05, spread);
      }

      /* ---- 1b Catálogo ---- */
      if (s2.current) {
        const spread = s2.current;
        const tl = gsap.timeline({ scrollTrigger: { trigger: spread, start: 'top 75%', once: true } });
        const aliasWords = q('.b-alias .b-alias-word', spread);
        const eqs = q('.b-alias .b-eq', spread);
        if (aliasWords.length) tl.fromTo(aliasWords, { yPercent: 110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, ease: EASE.reveal }, 0.3);
        if (eqs.length) tl.fromTo(eqs, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, stagger: 0.08 }, 0.75);
        lines(spread.querySelector('.b-h3'), 0.1, 0.08, spread);
        lines(spread.querySelector('.b-body'), 0.25, 0.05, spread);
        lines(spread.querySelector('.b-example'), 0.6, 0.04, spread);
      }

      /* ---- 1c Match con IA ---- */
      if (s3.current) {
        const spread = s3.current;
        if (p3.current) {
          gsap.fromTo(
            p3.current,
            { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 1 },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE.reveal, scrollTrigger: { trigger: spread, start: 'top 75%', once: true } }
          );
        }
        const capt = spread.querySelector('.b-plate-caption');
        if (capt) gsap.fromTo(capt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, delay: 1.0, scrollTrigger: { trigger: spread, start: 'top 75%', once: true } });
        lines(spread.querySelector('.b-h3'), 0.2, 0.08);
        lines(spread.querySelector('.b-body'), 0.35, 0.05);

        const table = tableWrap.current;
        if (table) {
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: table, start: 'top 70%', end: 'top 30%', scrub: 0.5 },
          });
          const trs = q('tbody tr', table);
          trs.forEach((tr, i) => {
            const bar = tr.querySelector<HTMLElement>('.b-bar');
            const cell = tr.querySelector<HTMLElement>('.r-count');
            const value = Number(cell?.dataset.value ?? 0);
            if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: value / 100, duration: 1 }, i * 0.05);
            if (cell) tl.add(countTo(cell, value, { from: 0, ease: 'none', duration: 1, suffix: cell.dataset.unit ?? '' }), i * 0.05);
          });
          const first = trs[0]?.querySelector<HTMLElement>('.r-count');
          // Scrub --on; `.b-table .b-figure` mixes the accent from live tokens (no baked colour).
          if (first) tl.to(first, { '--on': 1, duration: 0.15 }, 1.15);
        }

        if (quoteRef.current) {
          const el = quoteRef.current;
          splitLines(el, (self) => {
            const qt = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
            qt.from(self.lines[0], { yPercent: 110, duration: 1.0, ease: EASE.reveal });
            if (self.lines.length > 1) qt.from(self.lines.slice(1), { yPercent: 110, duration: 0.6, stagger: 0.06, ease: EASE.reveal }, '-=0.5');
            return qt;
          });
        }
      }
    });

    /* Láminas 02 and 03. Two columns (md+): keyed to their spread so plate and text
       arrive together. Stacked (phones): both plates render AFTER their text column
       (1a's text is `b-m-first`), ~400–600px below the spread top, so a spread-keyed
       reveal would finish off-screen; each plate triggers on itself instead. */
    const plates = (trigger: (box: HTMLElement, spread: HTMLElement) => Element) => {
      if (s1.current && p1.current) {
        gsap.fromTo(
          p1.current,
          { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE.reveal, scrollTrigger: { trigger: trigger(p1.current, s1.current), start: 'top 75%', once: true } }
        );
      }
      if (s2.current && p2.current) {
        gsap.fromTo(
          p2.current,
          { clipPath: 'inset(4% 4% 4% 4%)', scale: 1.04, autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: EASE.settle, scrollTrigger: { trigger: trigger(p2.current, s2.current), start: 'top 75%', once: true } }
        );
      }
    };
    mm.add(MQ.md, () => plates((_box, spread) => spread));
    mm.add(MQ.mobile, () => plates((box) => box));
  }, []);

  useMotion(root, build);

  return (
    <section id="cap-01-estructura" ref={root} data-chapter={t('cap01.runningHead')} className="b-chapter">
      <ChapterOpener numeral={t('cap01.numeral')} folio={t('cap01.folio')} title={t('cap01.title')} lede={t('cap01.lede')} />

      <div className="b-container">
        {/* 1a — Organigrama */}
        <div ref={s1} className="b-spread b-grid">
          <div className="b-c1-8">
            <Plate
              id="orgChart"
              className="r-wipe r-wipe-left"
              boxRef={p1}
              folio={t('cap01.orgChart.plate.folio')}
              caption={t('cap01.orgChart.plate.caption')}
              alt={t('cap01.orgChart.plate.alt')}
              sizes="(min-width: 1280px) 803px, (min-width: 768px) 62vw, 100vw"
            />
          </div>
          <div className="b-c9-12 b-m-first">
            <h3 className="b-h3 r-text">{t('cap01.orgChart.title')}</h3>
            <p className="b-body r-text" style={{ marginTop: 16 }}>
              {t('cap01.orgChart.body')}
            </p>
            <ul className="b-ruled" style={{ marginTop: 24 }}>
              {facts.map((f, i) => (
                <li key={f}>
                  {i === facts.length - 1 ? (
                    <span className="b-mark r-fade" aria-hidden="true" />
                  ) : (
                    <span className="b-square r-fade" style={{ alignSelf: 'center' }} aria-hidden="true" />
                  )}
                  <span className="b-mask" style={{ flex: '1 1 auto' }}>
                    <span className="r-text">{f}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 1b — Catálogo */}
        <div ref={s2} className="b-spread b-grid">
          <div className="b-c1-5">
            <h3 className="b-h3 r-text">{t('cap01.catalog.title')}</h3>
            <p className="b-body r-text" style={{ marginTop: 16 }}>
              {t('cap01.catalog.body')}
            </p>
            <p className="b-alias" style={{ margin: '28px 0 0' }}>
              {aliases.map((a, i) => (
                <Fragment key={a}>
                  {i > 0 && (
                    <span className="b-eq r-fade" aria-hidden="true">
                      =
                    </span>
                  )}
                  <span className="b-mask-inline">
                    <span className="b-alias-word r-text">{a}</span>
                  </span>
                </Fragment>
              ))}
            </p>
            <p className="b-code" style={{ marginTop: 8 }}>
              {t('cap01.catalog.genderLine')}
            </p>
            <p className="b-label" style={{ marginTop: 28 }}>
              {t('cap01.catalog.exampleLabel')}
            </p>
            <p className="b-small b-example r-text" style={{ marginTop: 8, display: 'block' }} lang="es">
              {t('cap01.catalog.example')}
            </p>
            <dl className="b-relations">
              {relations.map((r) => (
                <div key={r.label}>
                  <dt className="b-label">{r.label}</dt>
                  <dd className="b-small">{r.value}</dd>
                </div>
              ))}
            </dl>
            <p className="b-folio" style={{ marginTop: 12, whiteSpace: 'normal' }}>
              {t('cap01.catalog.actions')}
            </p>
          </div>
          <div className="b-c6-12">
            <Plate
              id="roleCatalog"
              className="r-wipe"
              boxRef={p2}
              folio={t('cap01.catalog.plate.folio')}
              caption={t('cap01.catalog.plate.caption')}
              alt={t('cap01.catalog.plate.alt')}
              sizes="(min-width: 1280px) 699px, (min-width: 768px) 55vw, 100vw"
            />
          </div>
        </div>

        {/* 1c — Match con IA */}
        <div ref={s3} className="b-spread b-grid">
          <div className="b-c1-12">
            <Plate
              id="aiMatch"
              className="r-wipe r-wipe-down"
              boxRef={p3}
              hideCaption
              folio={t('cap01.match.plate.folio')}
              caption={t('cap01.match.plate.caption')}
              alt={t('cap01.match.plate.alt')}
            />
          </div>
          <div className="b-c1-6">
            <p className="b-plate-caption r-fade" style={{ marginTop: -22 }}>
              <span className="b-folio">{t('cap01.match.plate.folio')}</span>
              <span className="b-plate-desc" style={{ textAlign: 'left' }}>
                {t('cap01.match.plate.caption')}
              </span>
            </p>
            <h3 className="b-h3 r-text" style={{ marginTop: 40 }}>
              {t('cap01.match.title')}
            </h3>
            <p className="b-body r-text" style={{ marginTop: 16 }}>
              {t('cap01.match.body')}
            </p>
          </div>
          <div ref={tableWrap} className="b-c8-12 b-overlap-up b-match-table">
            <p className="b-label">{t('cap01.match.tableLabel')}</p>
            <table className="b-table" style={{ marginTop: 12 }}>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code}>
                    <td>
                      <span className="b-small" style={{ display: 'block', color: 'var(--ink)' }}>
                        {r.name}
                      </span>
                      <span className="b-code">{r.code}</span>
                    </td>
                    <td style={{ width: 72 }}>
                      <i className="b-bar" style={{ '--v': r.value } as CSSProperties} aria-hidden="true" />
                    </td>
                    <td
                      className="b-figure b-tnum r-count"
                      data-value={r.value}
                      data-unit={unit}
                      style={{ fontSize: 40, textAlign: 'right' }}
                    >
                      {r.value}
                      {unit}
                    </td>
                    <td className="b-folio b-lg-only" style={{ width: 1, textAlign: 'right' }}>
                      {t('cap01.match.chooseLabel')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="b-c2-11" style={{ marginTop: 32 }}>
            <p className="b-label">{t('cap01.match.quoteLabel')}</p>
            <blockquote ref={quoteRef} className="b-quote-md r-text" style={{ marginTop: 12 }} lang="es">
              {t('cap01.match.quote')}
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
