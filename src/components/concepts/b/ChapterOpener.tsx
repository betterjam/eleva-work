'use client';

import { useCallback, useRef } from 'react';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import { EASE, MQ, drawRule, useMotion, type MotionKit } from './motion';

type Props = {
  numeral: string;
  folio: string;
  title: string;
  lede: string;
};

/**
 * Chapter opener: numeral rising out of the chapter's teal rule, folio on a
 * hairline, H2 and lede unmasking line by line.
 */
export default function ChapterOpener({ numeral, folio, title, lede }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const numeralRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, splitLines, root: el } = kit;
    mm.add(MQ.motion, () => {
      const trigger = { trigger: el, start: 'top 75%', once: true };
      const tl = gsap.timeline({ scrollTrigger: trigger, defaults: { ease: EASE.reveal } });
      if (ruleRef.current) tl.add(drawRule(ruleRef.current, { duration: 0.9 }), 0);
      if (numeralRef.current) {
        tl.fromTo(
          numeralRef.current,
          { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 },
          0.1
        );
      }
      if (h2Ref.current) {
        splitLines(h2Ref.current, (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.9,
            stagger: 0.08,
            ease: EASE.reveal,
            delay: 0.15,
            scrollTrigger: trigger,
          })
        );
      }
      if (ledeRef.current) {
        splitLines(ledeRef.current, (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            duration: 0.7,
            stagger: 0.05,
            ease: EASE.reveal,
            delay: 0.4,
            scrollTrigger: trigger,
          })
        );
      }
    });
  }, []);

  useMotion(root, build);

  return (
    <div className="b-container">
      <div className="b-opener" ref={root}>
        <div className="b-opener-num" aria-hidden="true">
          <span ref={numeralRef} className="b-numeral r-wipe r-wipe-down" style={{ display: 'block' }}>
            {numeral}
          </span>
        </div>
        <div className="b-opener-body">
          <div className="b-divider">
            <span className="b-folio">{folio}</span>
          </div>
          <h2 ref={h2Ref} className="b-h2 r-text" style={{ marginTop: 24 }}>
            {title}
          </h2>
          <p ref={ledeRef} className="b-lede r-text" style={{ marginTop: 24 }}>
            {lede}
          </p>
        </div>
        <span ref={ruleRef} className="b-opener-rule b-rule-accent r-rule" aria-hidden="true" />
      </div>
    </div>
  );
}
