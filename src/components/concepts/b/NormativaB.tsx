'use client';

import { Fragment, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import { useSmoothScroll } from '@/components/concepts/shared/SmoothScroll';
import { EASE, MQ, useMotion, type MotionKit } from './motion';

type Item = { key: string; num: string; name: string };
type Group = { issuer: string; items: Item[] };
type Law = { key: string; label: string };

const PIN_TOP = 112; // header 64 + 48

/**
 * Apéndice A · Normativa — an index table of the 14 regulations and
 * frameworks a Director's rubric evaluates (masked rows, static rules) and a
 * pinned typographic specimen of question no. 1 whose law chips stamp in and
 * cross-reference the table rows by `data-law`.
 */
export default function NormativaB() {
  const t = useTranslations('conceptB');
  const { scrollTo } = useSmoothScroll();
  const groups = t.raw('normativa.groups') as Group[];
  const tags = t.raw('normativa.specimen.tags') as string[];
  const laws = t.raw('normativa.specimen.laws') as Law[];

  const root = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const landed = useRef<Set<string>>(new Set());

  /** Highlights the table row for a law key (sticky once the chip has landed). */
  const hit = useCallback((key: string, on: boolean) => {
    const row = root.current?.querySelector(`tr[data-law="${key}"]`);
    if (!row) return;
    if (on || landed.current.has(key)) row.classList.add('is-hit');
    else row.classList.remove('is-hit');
  }, []);

  const build = useCallback(
    (kit: MotionKit) => {
      const { mm, q, splitLines } = kit;
      mm.add(MQ.motion, () => {
        if (h2Ref.current) {
          const el = h2Ref.current;
          splitLines(el, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.08, ease: EASE.reveal, scrollTrigger: { trigger: el, start: 'top 80%', once: true } }));
        }
        if (ledeRef.current) {
          const el = ledeRef.current;
          splitLines(el, (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.7, stagger: 0.05, ease: EASE.reveal, delay: 0.2, scrollTrigger: { trigger: el, start: 'top 80%', once: true } }));
        }

        const left = leftRef.current;
        if (left) {
          const rows = q('tbody tr', left);
          if (rows.length) {
            ScrollTrigger.batch(rows, {
              start: 'top 88%',
              once: true,
              onEnter: (batch) => {
                const spans = batch.flatMap((r) => Array.from(r.querySelectorAll('.b-mask > span')));
                gsap.fromTo(spans, { yPercent: 110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: EASE.reveal });
              },
            });
          }
          const foot = left.querySelector('.b-footnote');
          if (foot) gsap.fromTo(foot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, scrollTrigger: { trigger: foot, start: 'top 92%', once: true } });
        }

        const sp = specimenRef.current;
        if (sp) {
          const stl = gsap.timeline({ scrollTrigger: { trigger: sp, start: 'top 75%', once: true } });
          q('.b-box-drawn > i', sp).forEach((side, i) => {
            const horizontal = i % 2 === 0;
            stl.fromTo(
              side,
              horizontal ? { scaleX: 0, autoAlpha: 1 } : { scaleY: 0, autoAlpha: 1 },
              horizontal ? { scaleX: 1, duration: 0.15, ease: 'none' } : { scaleY: 1, duration: 0.15, ease: 'none' },
              i * 0.15
            );
          });
          if (questionRef.current) {
            splitLines(questionRef.current, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.8, stagger: 0.08, ease: EASE.reveal, delay: 0.3, scrollTrigger: { trigger: sp, start: 'top 75%', once: true } }));
          }
          // Tags stamp in like the law chips (a left→right wipe), not a generic fade-up.
          const tagEls = q('.b-spec-tags .b-chip', sp);
          if (tagEls.length) {
            stl.fromTo(
              tagEls,
              { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
              { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, stagger: 0.05, ease: EASE.reveal },
              0.6
            );
          }
          q('button.b-chip-law', sp).forEach((chip, i) => {
            stl.fromTo(
              chip,
              { scale: 1.2, autoAlpha: 0 },
              {
                scale: 1,
                autoAlpha: 1,
                duration: 0.4,
                ease: EASE.snap,
                onComplete: () => {
                  const key = chip.dataset.law;
                  if (key) {
                    landed.current.add(key);
                    hit(key, true);
                  }
                },
              },
              0.9 + i * 0.08
            );
          });
          const note = sp.querySelector('.b-spec-note');
          if (note) stl.fromTo(note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 1.4);
        }
      });

      /* Desktop: the specimen rides along the index table (pin, no spacing). */
      mm.add(MQ.desktop, () => {
        const sp = specimenRef.current;
        const left = leftRef.current;
        if (!sp || !left) return;
        ScrollTrigger.create({
          trigger: sp,
          start: `top ${PIN_TOP}px`,
          endTrigger: left,
          end: () => `bottom ${PIN_TOP + sp.offsetHeight}px`,
          pin: sp,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });
      });
    },
    [hit]
  );

  useMotion(root, build);

  return (
    <section id="normativa" ref={root} data-chapter={t('normativa.runningHead')} className="b-section">
      <div className="b-container">
        <div className="b-grid">
          <div className="b-c1-8">
            <div className="b-divider">
              <span className="b-folio">{t('normativa.folio')}</span>
            </div>
            <h2 ref={h2Ref} className="b-h2 r-text" style={{ marginTop: 24 }}>
              {t('normativa.title')}
            </h2>
            <p ref={ledeRef} className="b-lede r-text" style={{ marginTop: 24 }}>
              {t('normativa.lede')}
            </p>
          </div>
        </div>

        {/* Heading above, then (mobile) the specimen ahead of the index table. */}
        <div className="b-grid" style={{ marginTop: 56 }}>
          <div ref={leftRef} className="b-c1-7">
            <p className="b-label">{t('normativa.countLabel')}</p>
            <table className="b-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 'clamp(120px, 34%, 176px)' }}>{t('normativa.tableHead.issuer')}</th>
                  <th>{t('normativa.tableHead.norm')}</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.issuer}>
                    <tr className="is-group">
                      <td colSpan={2}>
                        <span className="b-mask">
                          <span className="r-text">{g.issuer}</span>
                        </span>
                      </td>
                    </tr>
                    {g.items.map((it) => (
                      <tr key={it.key} id={`b-law-${it.key}`} data-law={it.key}>
                        <td>
                          <span className="b-mask">
                            <span className="b-law-num r-text">{it.num}</span>
                          </span>
                        </td>
                        <td>
                          <span className="b-mask">
                            <span className="r-text">{it.name}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <p className="b-small b-footnote r-fade" style={{ marginTop: 24, display: 'block' }}>
              {t('normativa.footnote')}
            </p>
          </div>

          <div className="b-c8-12 b-m-first">
            <div ref={specimenRef} className="b-specimen">
              <div className="b-box-drawn">
                <i className="r-rule" aria-hidden="true" />
                <i className="r-rule-v" aria-hidden="true" />
                <i className="r-rule" aria-hidden="true" />
                <i className="r-rule-v" aria-hidden="true" />
                <p className="b-label">{t('normativa.specimen.label')}</p>
                <p ref={questionRef} className="b-h4 r-text" style={{ marginTop: 12 }}>
                  {t('normativa.specimen.text')}
                </p>
                <div className="b-dims b-spec-tags" style={{ marginTop: 14 }}>
                  {tags.map((tag) => (
                    <span key={tag} className="b-chip r-fade">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="b-label" style={{ marginTop: 18 }}>
                  {t('normativa.specimen.lawsLabel')}
                </p>
                <div className="b-dims" style={{ marginTop: 8 }}>
                  {laws.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      className="b-chip-law r-stamp"
                      data-law={l.key}
                      onClick={() => scrollTo(`#b-law-${l.key}`, 120)}
                      onMouseEnter={() => hit(l.key, true)}
                      onMouseLeave={() => hit(l.key, false)}
                      onFocus={() => hit(l.key, true)}
                      onBlur={() => hit(l.key, false)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="b-folio b-spec-note r-fade" style={{ marginTop: 12, whiteSpace: 'normal' }}>
                {t('normativa.specimen.note')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
