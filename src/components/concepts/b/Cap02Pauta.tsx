'use client';

import Image from 'next/image';
import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import ChapterOpener from './ChapterOpener';
import Plate from './Plate';
import { RUBRIC_COVER } from './plates';
import { EASE, MQ, countTo, refreshSoon, useMotion, type MotionKit } from './motion';

type Slip = {
  code: string;
  text: string;
  dimension: string;
  perspectives: string[];
  priority: string;
  laws: string[];
  selected: boolean;
};

/**
 * Cap. 02 · La pauta — the signature. Lámina 05 (question bank), then the
 * stage: a DOM ledger of six real questions beside an assembled frame.
 * Wide AND tall viewports (≥1024 × ≥760, `MQ.pin`): one pinned, scrubbed
 * timeline lifts the three Director questions out of the ledger into the
 * frame's slots (ghost → slot, measured from static DOM), stamps their law
 * chips, runs the counter 600 → 116, stamps the 11 dimensions, unmasks the
 * 14 normativas and finally wipes the real rubric screenshot over the frame.
 * Narrow or short viewports (`MQ.stack`): stacked, no pin. Reduced motion /
 * no script: CSS shows the finished frame (cover on, slots off).
 */
export default function Cap02Pauta() {
  const t = useTranslations('conceptB');
  const slips = t.raw('cap02.stage.slips') as Slip[];
  const dimensions = t.raw('cap02.stage.dimensions') as string[];
  const norms = t.raw('cap02.stage.norms') as string[];
  // Numeric JSON values: read raw (t() only formats strings).
  const counterFrom = Number(t.raw('cap02.stage.counterFrom')) || 600;
  const counterTo = Number(t.raw('cap02.stage.counterTo')) || 116;

  const root = useRef<HTMLElement>(null);
  const bankBox = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const mobileCounterRef = useRef<HTMLSpanElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const mobilePlateBox = useRef<HTMLDivElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q } = kit;
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;
    const from = Number(stage.dataset.from) || 600;
    const to = Number(stage.dataset.to) || 116;

    /* Lámina 05 wipes in from the left (all widths with motion). */
    mm.add(MQ.motion, () => {
      if (bankBox.current) {
        gsap.fromTo(
          bankBox.current,
          { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE.reveal, scrollTrigger: { trigger: bankBox.current, start: 'top 75%', once: true } }
        );
      }
    });

    /* Wide and tall: the pinned assembly. */
    mm.add(MQ.pin, () => {
      const counter = counterRef.current;
      const cover = coverRef.current;
      const caption = captionRef.current;
      if (!counter) return;

      const selected = q('.b-slip[data-selected="true"] .b-slip-card', stage);
      const ghosts = selected
        .map((c) => c.parentElement?.querySelector<HTMLElement>('.b-slip-ghost') ?? null)
        .filter(Boolean) as HTMLElement[];
      const slots = q('.b-slot', frame);
      const fills = slots.map((s) => s.querySelector<HTMLElement>('.b-slot-fill'));
      const remaining = q('.b-slip[data-selected="false"] .b-slip-card', stage);
      const frameLabels = q('.b-label', frame);
      const chips = q('.b-dims .b-chip', frame);
      const normSpans = q('.b-norms li > span', frame);

      // Start states. Labels, slots, chips and the cover already start hidden in CSS
      // (so SSR never snaps); these sets make the same state explicit for GSAP.
      gsap.set([...frameLabels, ...slots], { autoAlpha: 0 });
      gsap.set(chips, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(normSpans, { yPercent: 110 });
      gsap.set(ghosts, { opacity: 0 });
      if (cover) gsap.set(cover, { clipPath: 'inset(0% 0% 100% 0%)' });
      if (caption) gsap.set(caption, { autoAlpha: 0 });

      // Travel measured from the static li box to the static slot, never from the moving card.
      const delta = (i: number) => {
        const li = selected[i].parentElement;
        const slot = slots[i];
        if (!li || !slot) return { x: 0, y: 0, w: selected[i].offsetWidth };
        const a = li.getBoundingClientRect();
        const b = slot.getBoundingClientRect();
        return { x: b.left - a.left, y: b.top - a.top, w: b.width };
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=280%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 0.00–0.10 frame label + slots appear
      tl.fromTo([...frameLabels, ...slots], { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.01, duration: 0.08 }, 0);

      // 0.10–0.62 slips travel; laws stamp; counter runs
      selected.forEach((card, i) => {
        if (!slots[i]) return;
        const t0 = 0.1 + i * 0.16;
        if (ghosts[i]) tl.to(ghosts[i], { opacity: 1, duration: 0.02 }, t0);
        // `.b-slip-card.is-selected` mixes its border from --on (live tokens; a colour tween would bake the theme).
        tl.to(card, { '--on': 1, duration: 0.02 }, t0);
        // Width snaps once at lift-off (the dashed ghost stays behind, so the jump is
        // invisible); only transforms tween while the scrub runs — no per-frame relayout.
        tl.set(card, { width: () => delta(i).w }, t0 + 0.02);
        tl.to(card, { x: () => delta(i).x, y: () => delta(i).y, duration: 0.1 }, t0 + 0.02);
        const fill = fills[i];
        if (fill) tl.to(fill, { opacity: 1, duration: 0.02 }, t0 + 0.12);
        const laws = card.querySelectorAll('.b-chip-law');
        if (laws.length) {
          // Two `to` tweens, never a positioned fromTo: fromTo pre-renders its from-state
          // at build time (immediateRender), which would enlarge and tint the chips before
          // any scroll and then shrink them at the moment they are meant to stamp.
          tl.to(laws, { '--hit': 1, scale: 1.25, duration: 0.012, stagger: 0.008 }, t0 + 0.12).to(
            laws,
            { '--hit': 0, scale: 1, duration: 0.03, stagger: 0.008, ease: EASE.snap },
            t0 + 0.132
          );
        }
      });
      // 0.7 matches `.b-slip.is-remaining` and keeps the 13px slip text ≥ 4.5:1 in both themes.
      if (remaining.length) tl.to(remaining, { opacity: 0.7, duration: 0.2, stagger: 0.03 }, 0.3);
      tl.add(countTo(counter, to, { from, ease: 'none', duration: 0.52 }), 0.1);

      // 0.62–0.78 dimension chips stamp
      if (chips.length) tl.fromTo(chips, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.05, stagger: 0.012 }, 0.62);

      // 0.78–0.90 normativas unmask
      if (normSpans.length) tl.fromTo(normSpans, { yPercent: 110 }, { yPercent: 0, duration: 0.06, stagger: 0.006 }, 0.78);

      // 0.90–1.00 the real rubric wipes over the frame; slips fade beneath; counter turns accent; caption appears
      if (cover) tl.to(cover, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1 }, 0.9);
      if (selected.length) tl.to(selected, { autoAlpha: 0, duration: 0.05 }, 0.9);
      tl.to(counter, { '--on': 1, duration: 0.05 }, 0.92);
      if (caption) tl.fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.96);

      // Fit: the frame has a fixed height (a full-viewport pin). When the static content
      // (slots, 11 chips, 14 normativas) would not fit, compact the spacing (`.is-tight`)
      // so the last normativas are never clipped. Re-checked on every frame resize.
      const fit = () => {
        frame.classList.remove('is-tight');
        if (frame.scrollHeight > frame.clientHeight + 1) frame.classList.add('is-tight');
      };
      fit();
      const ro = new ResizeObserver(() => {
        fit();
        refreshSoon();
      });
      ro.observe(frame);
      return () => {
        ro.disconnect();
        frame.classList.remove('is-tight');
      };
    });

    /* Narrow or short (with motion): stacked, no pin. */
    mm.add(MQ.stack, () => {
      const cards = q('.b-slip-card', stage);
      cards.forEach((card) => {
        const li = card.parentElement;
        if (!li) return;
        gsap.fromTo(
          card,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.6,
            ease: EASE.reveal,
            scrollTrigger: { trigger: li, start: 'top 85%', once: true },
            onComplete: () => {
              if (li.dataset.selected === 'false') li.classList.add('is-remaining');
            },
          }
        );
      });

      const m = mobileCounterRef.current;
      if (m) {
        gsap
          .timeline({ scrollTrigger: { trigger: m, start: 'top 80%', once: true } })
          .add(countTo(m, to, { from: 0, duration: 1.2, ease: EASE.settle }));
      }

      const chips = q('.b-dims .b-chip', frame);
      const normSpans = q('.b-norms li > span', frame);
      const ftl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 75%', once: true } });
      if (chips.length) ftl.fromTo(chips, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, stagger: 0.03, ease: EASE.reveal }, 0);
      if (normSpans.length) ftl.fromTo(normSpans, { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.03, ease: EASE.reveal }, 0.3);

      if (mobilePlateBox.current) {
        gsap.fromTo(
          mobilePlateBox.current,
          { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: EASE.reveal, scrollTrigger: { trigger: mobilePlateBox.current, start: 'top 80%', once: true } }
        );
      }
    });

    /* Reduced motion: the frame is complete (CSS shows the cover and hides the
       slots); the counter reads the final figure. */
    mm.add(MQ.reduced, () => {
      if (counterRef.current) counterRef.current.textContent = String(to);
      if (coverRef.current) gsap.set(coverRef.current, { clipPath: 'none' });
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="cap-02-pauta" ref={root} data-chapter={t('cap02.runningHead')} className="b-chapter">
      <ChapterOpener numeral={t('cap02.numeral')} folio={t('cap02.folio')} title={t('cap02.title')} lede={t('cap02.lede')} />

      <div className="b-container">
        <div className="b-spread">
          <Plate
            id="bank"
            className="r-wipe r-wipe-left"
            boxRef={bankBox}
            folio={t('cap02.bankPlate.folio')}
            caption={t('cap02.bankPlate.caption')}
            alt={t('cap02.bankPlate.alt')}
          />
        </div>

        <div ref={stageRef} className="b-stage" style={{ marginTop: 48 }} data-from={counterFrom} data-to={counterTo}>
          {/* Bank ledger */}
          <div className="b-stage-bank">
            <p className="b-label">
              {t('cap02.stage.bankLabel')}{' '}
              <span className="b-folio" style={{ whiteSpace: 'normal' }}>
                {t('cap02.stage.bankMeta')}
              </span>
            </p>
            <p className="b-folio" style={{ marginTop: 10, whiteSpace: 'normal' }} aria-hidden="true">
              {t('cap02.stage.ledgerHead.code')} · {t('cap02.stage.ledgerHead.text')} · {t('cap02.stage.ledgerHead.dimension')} ·{' '}
              {t('cap02.stage.ledgerHead.perspectives')} · {t('cap02.stage.ledgerHead.priority')}
            </p>
            <ol className="b-ledger">
              {slips.map((s) => (
                <li key={s.code} className="b-slip" data-selected={s.selected ? 'true' : 'false'}>
                  <i className="b-slip-ghost" aria-hidden="true" />
                  <article className={`b-slip-card${s.selected ? ' is-selected' : ''}`}>
                    <p className="b-slip-text" style={{ margin: 0 }}>
                      {s.text}
                    </p>
                    <span className="b-slip-code">{s.code}</span>
                    <div className="b-slip-meta">
                      <span>{s.dimension}</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.perspectives.join(' · ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.priority}</span>
                      {s.laws.map((l) => (
                        <span key={l} className="b-chip-law">
                          {l}
                        </span>
                      ))}
                      {s.selected && <span className="b-tag b-tag-accent b-stack-only">{t('cap02.stage.selectedTag')}</span>}
                    </div>
                  </article>
                </li>
              ))}
            </ol>
            <p className="b-folio" style={{ marginTop: 12, whiteSpace: 'normal' }}>
              {t('cap02.stage.note')}
            </p>
          </div>

          {/* Desktop gutter: hairline on the boundary, counter box on it */}
          <div className="b-stage-gutter b-pin-only" aria-hidden="true">
            <span className="b-rule-v" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, height: 'auto' }} />
            <div className="b-stage-counter">
              <span ref={counterRef} className="b-counter b-tnum">
                {counterFrom}
              </span>
              <span className="b-label" style={{ display: 'block' }}>
                {t('cap02.stage.counterUnit')}
              </span>
            </div>
          </div>

          {/* Stacked counter row (<1024) */}
          <div className="b-stage-counter is-stacked b-stack-only" role="img" aria-label={`${t('cap02.stage.arrow')} ${t('a11y.counterUnit')}`}>
            <span className="b-counter b-tnum">{counterFrom}</span>
            <span className="b-label" aria-hidden="true">
              →
            </span>
            <span ref={mobileCounterRef} className="b-counter b-tnum">
              {counterTo}
            </span>
            <span className="b-label">{t('cap02.stage.counterUnit')}</span>
          </div>

          {/* The assembled frame */}
          <div className="b-stage-rubric">
            <div ref={frameRef} className="b-frame">
              <p className="b-label">
                {t('cap02.stage.rubricLabel')}{' '}
                <span className="b-folio" style={{ whiteSpace: 'normal' }}>
                  {t('cap02.stage.rubricMeta')}
                </span>
              </p>
              <div className="b-slots b-pin-only">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="b-slot" data-slot={i}>
                    <i className="b-slot-fill" aria-hidden="true" />
                    <span className="b-slot-label">
                      {t('cap02.stage.slotLabel')} {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <p className="b-label">{t('cap02.stage.dimensionsLabel')}</p>
              <div className="b-dims">
                {dimensions.map((d) => (
                  <span key={d} className="b-chip">
                    {d}
                  </span>
                ))}
              </div>
              <p className="b-label">{t('cap02.stage.normsLabel')}</p>
              <ul className="b-norms">
                {norms.map((n) => (
                  <li key={n}>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <div ref={coverRef} className="b-plate-cover b-pin-only">
                <Image
                  src={RUBRIC_COVER.src}
                  width={RUBRIC_COVER.w}
                  height={RUBRIC_COVER.h}
                  alt={t('cap02.rubricPlate.alt')}
                  unoptimized
                  loading="lazy"
                  sizes="(min-width: 1280px) 596px, 50vw"
                  onLoad={refreshSoon}
                  draggable={false}
                />
              </div>
            </div>
            <p ref={captionRef} className="b-plate-caption b-stage-caption b-pin-only">
              <span className="b-folio">{t('cap02.rubricPlate.folio')}</span>
              <span className="b-plate-desc">{t('cap02.rubricPlate.caption')}</span>
            </p>
          </div>

          {/* Stacked: the real plate, static */}
          <div className="b-stack-only">
            <Plate
              id="rubricMobile"
              className="r-wipe r-wipe-up"
              boxRef={mobilePlateBox}
              folio={t('cap02.rubricPlate.folio')}
              caption={t('cap02.rubricPlate.caption')}
              alt={t('cap02.rubricPlate.alt')}
              sizes="100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
