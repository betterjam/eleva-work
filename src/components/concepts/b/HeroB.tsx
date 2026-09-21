'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import { useSmoothScroll } from '@/components/concepts/shared/SmoothScroll';
import Plate from './Plate';
import { EASE, MQ, drawRule, useMotion, type MotionKit } from './motion';

/**
 * Cover: kicker + audience on the hero's one teal rule, H1 (Fraunces, masked
 * lines), lede, CTAs, a mono summary list and Lámina 01 pressed in from the top.
 */
export default function HeroB() {
  const t = useTranslations('conceptB');
  const { scrollTo } = useSmoothScroll();
  const summary = t.raw('hero.summary') as string[];

  const root = useRef<HTMLElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const audienceRef = useRef<HTMLParagraphElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const summaryLabelRef = useRef<HTMLParagraphElement>(null);
  const plateBox = useRef<HTMLDivElement>(null);
  const plateImg = useRef<HTMLImageElement>(null);
  const captionRule = useRef<HTMLSpanElement>(null);
  const captionText = useRef<HTMLSpanElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines, isMobile } = kit;
    mm.add(MQ.motion, () => {
      const mobile = isMobile();
      const tl = gsap.timeline({ defaults: { ease: EASE.reveal } });

      if (ruleRef.current) tl.add(drawRule(ruleRef.current, { duration: 0.9 }), 0);

      if (plateBox.current) {
        tl.fromTo(
          plateBox.current,
          { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: mobile ? 0.9 : 1.3 },
          0.5
        );
      }
      if (plateImg.current) tl.fromTo(plateImg.current, { y: -24 }, { y: 0, duration: mobile ? 0.9 : 1.3 }, 0.5);

      const ctas = q('.b-cta-row > *');
      if (ctas.length) {
        tl.fromTo(
          ctas,
          { scaleX: 0.96, autoAlpha: 0 },
          { scaleX: 1, autoAlpha: 1, duration: 0.5, ease: EASE.settle, stagger: 0.08 },
          0.95
        );
      }
      if (summaryLabelRef.current) tl.fromTo(summaryLabelRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.95);

      const items = q('.b-hero-summary .b-mask > span');
      if (items.length) tl.fromTo(items, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06 }, 1.0);

      if (captionRule.current) tl.add(drawRule(captionRule.current, { duration: 0.6 }), 1.6);
      const caption = captionText.current?.parentElement;
      if (caption) tl.fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 1.75);

      const lineTween = (delay: number, y: number, duration: number, stagger: number) => (self: { lines: Element[] }) =>
        gsap.from(self.lines, { yPercent: y, duration, stagger, ease: EASE.reveal, delay });
      if (kickerRef.current) splitLines(kickerRef.current, lineTween(0.15, 100, 0.6, 0.05));
      if (audienceRef.current) splitLines(audienceRef.current, lineTween(0.15, 100, 0.6, 0.05));
      if (h1Ref.current) splitLines(h1Ref.current, lineTween(0.25, 110, 1.1, 0.09));
      if (ledeRef.current) splitLines(ledeRef.current, lineTween(0.7, 100, 0.8, 0.06));
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="hero" ref={root} data-chapter={t('hero.runningHead')} className="b-hero">
      <div className="b-container flex flex-col grow">
        <div className="b-grid">
          <div className="b-c1-12">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p ref={kickerRef} className="b-label r-text" style={{ margin: 0 }}>
                {t('hero.kicker')}
              </p>
              <p ref={audienceRef} className="b-folio r-text" style={{ margin: 0, whiteSpace: 'normal' }}>
                {t('hero.audience')}
              </p>
            </div>
            <span ref={ruleRef} className="b-rule-accent r-rule" style={{ marginTop: 14 }} aria-hidden="true" />
          </div>

          <div className="b-c1-8">
            <h1 ref={h1Ref} className="b-h1 r-text" data-speed="1.03">
              {t('hero.title')}
            </h1>
            <p ref={ledeRef} className="b-lede r-text" style={{ marginTop: 32 }}>
              {t('hero.lede')}
            </p>
            <div className="b-cta-row">
              <button type="button" className="b-btn r-fade" onClick={() => scrollTo('#request-demo', 80)}>
                {t('hero.ctaPrimary')}
              </button>
              <button type="button" className="b-btn-ghost r-fade" onClick={() => scrollTo('#cap-01-estructura', 80)}>
                {t('hero.ctaSecondary')}
              </button>
            </div>
          </div>

          <div className="b-c9-12 md:self-end">
            <p ref={summaryLabelRef} className="b-label r-fade" style={{ margin: '0 0 12px' }}>
              {t('hero.summaryLabel')}
            </p>
            <ul className="b-hero-summary">
              {summary.map((s) => (
                <li key={s}>
                  <span className="b-mask">
                    <span className="r-text">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto" style={{ paddingTop: 48 }} data-speed="0.92">
          <Plate
            id="heroRubric"
            frame="accent-top"
            priority
            className="r-wipe r-wipe-up"
            boxRef={plateBox}
            imgRef={plateImg}
            drawnCaption
            captionRuleRef={captionRule}
            captionTextRef={captionText}
            captionClassName="r-fade"
            folio={t('hero.plate.folio')}
            caption={t('hero.plate.caption')}
            alt={t('hero.plate.alt')}
          />
        </div>
      </div>
    </section>
  );
}
