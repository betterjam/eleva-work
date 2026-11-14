'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollCue from '@/components/ScrollCue';
import HowIllustration from '@/components/HowIllustration';
import Grabacion from '@/components/media/Grabacion';
import {
  goTo,
  navClick,
  prefersReducedMotion,
  registerAnchor,
  setCue,
  setActiveSection,
  unregisterAnchor,
} from '@/lib/scrollNav';

gsap.registerPlugin(ScrollTrigger);

/** A module of the cycle and the recording of the platform that shows it. */
type ModuleCard = {
  title: string;
  desc: string;
  escena: string;
  alt: string;
};

/** What a `data-fx` element does when its reveal progress moves 0 -> 1. */
type RevealKind = 'title' | 'text' | 'rule' | 'card';

/** The cube's side faces. The modules ride on four faces: the one turning away takes the next module. */
const FACES = 4;

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Shared by every reveal here, so the pinned column and the mobile stack move alike. */
const revealEase = gsap.parseEase('power2.out');

const revealFrom: Record<RevealKind, gsap.TweenVars> = {
  title: { clipPath: 'inset(0% 100% 0% 0%)', y: 8 },
  text: { opacity: 0, y: 12 },
  rule: { scaleX: 0, transformOrigin: 'left center' },
  card: { clipPath: 'inset(0% 0% 100% 0%)', y: 22, opacity: 0 },
};

const revealTo: Record<RevealKind, gsap.TweenVars> = {
  title: { clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
  text: { opacity: 1, y: 0 },
  rule: { scaleX: 1, transformOrigin: 'left center' },
  card: { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1 },
};

const kindOf = (el: HTMLElement): RevealKind => (el.dataset.fx as RevealKind) || 'card';

/** The module a face carries while the cube sits between `step` and `step + 1` (null: nothing, it is at the back). */
function moduleOnFace(face: number, step: number, count: number) {
  for (let m = step - 1; m <= step + 2; m++) {
    if (((m % FACES) + FACES) % FACES === face) return m >= 0 && m < count ? m : null;
  }
  return null;
}

export default function Features() {
  const t = useTranslations();
  const sectionRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const shadesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const lastSlideRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  // `null` until the first client measurement, so the desktop stage never builds
  // itself against the `hidden md:block` markup on a phone (every offset 0 there).
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  // Which modules ride on which face (the cube's whole turns) and which one is in front.
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(0);

  const modules = t.raw('features.cards') as ModuleCard[];
  const ctaText = t('features.ctaTitle');
  const ctaDesc = t('features.ctaDesc');
  const last = modules.length - 1;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;

    const registeredIds: string[] = [];
    // Reduced motion keeps the pinned stage (it is the page's only route to
    // #how/#security/#faq) but the cube turns in whole steps and nothing eases.
    const reduce = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const horizontal = horizontalRef.current;
      const cube = cubeRef.current;
      const zoom = zoomRef.current;
      const lastSlide = lastSlideRef.current;
      const contentScroll = contentScrollRef.current;
      const trigger = triggerRef.current;
      if (!horizontal || !cube || !zoom || !lastSlide || !contentScroll || !trigger) return;

      // Every viewport-dependent length in one snapshot, re-taken on each refresh.
      // Module k rests at k * faceSpan (the snap points); the last one keeps a short dwell before the exit.
      const measure = () => {
        const faceSpan = Math.max(460, window.innerHeight * 0.7);
        const turnLeg = faceSpan * (last + 0.4);
        const exitLeg = window.innerWidth * 0.85;
        const contentHeight = Math.max(0, contentScroll.scrollHeight - window.innerHeight);
        return { faceSpan, turnLeg, exitLeg, contentHeight, total: turnLeg + exitLeg + contentHeight };
      };
      let m = measure();

      // Between two rests the cube turns; a little play at both ends keeps a resting face still.
      const progressAt = (scrollY: number) => {
        const k = Math.min(last, Math.floor(scrollY / m.faceSpan));
        if (k >= last) return last;
        if (reduce) return Math.max(0, k);
        const u = (scrollY - k * m.faceSpan) / m.faceSpan;
        return k + smooth(clamp01((u - 0.1) / 0.8));
      };

      // Where the scroll may come to rest, as progress of the pin: each module, the CTA with "how", each block of
      // the column, and the end.
      const restPoints = () => {
        const px = [
          ...modules.map((_, k) => k * m.faceSpan),
          m.turnLeg + m.exitLeg,
          ...blocks.map((b) => m.turnLeg + m.exitLeg + Math.min(b.el.offsetTop, m.contentHeight)),
          m.total,
        ];
        return [...new Set(px.map((y) => Math.round(y)))].sort((a, b) => a - b).map((y) => y / m.total);
      };
      // The scroll never stops between two views: once the reader stops, it settles on the next one in the
      // direction they were going (or back, after a nudge of under 12 % of the way); a fling that crosses several
      // settles on the one nearest to where it was heading.
      const snapTarget = (value: number, self?: ScrollTrigger) => {
        if (!self) return value;
        const rests = restPoints();
        const now = clamp01((window.scrollY - self.start) / (self.end - self.start));
        const i = rests.findIndex((r) => r > now + 1e-4);
        if (i === -1) return rests[rests.length - 1];
        if (i === 0) return rests[0];
        const prev = rests[i - 1];
        const next = rests[i];
        const frac = (now - prev) / (next - prev);
        const nearest = (list: number[], fallback: number) =>
          list.reduce((best, r) => (Math.abs(r - value) < Math.abs(best - value) ? r : best), fallback);
        if (self.direction > 0) return frac < 0.12 ? prev : nearest(rests.slice(i), next);
        return frac > 0.88 ? next : nearest(rests.slice(0, i), prev);
      };

      // Faces turned away darken, so the box reads as a solid in the light.
      const shade = (p: number) => {
        shadesRef.current.forEach((el, face) => {
          if (!el) return;
          const angle = ((face - p) * Math.PI) / 2;
          gsap.set(el, { opacity: clamp01((1 - Math.cos(angle)) * 0.85) });
        });
      };

      const blocks: Array<{ id: string; el: HTMLElement }> = [];
      ['how', 'security', 'faq'].forEach((id) => {
        const el = contentScroll.querySelector<HTMLElement>(`#${id}`);
        if (el) blocks.push({ id, el });
      });

      // --- Column reveals ------------------------------------------------
      // The how/security/faq column is dragged by the same onUpdate, so its
      // reveals are computed from that one number (column offset against each
      // block's offsetTop): a goTo('how') arrival plays the reveal.
      type RevealItem = { el: HTMLElement; kind: RevealKind; applied: number };
      type RevealGroup = { el: HTMLElement; top: number; items: RevealItem[] };
      const revealGroups: RevealGroup[] = blocks.map(({ el }) => ({
        el,
        top: el.offsetTop,
        items: Array.from(el.querySelectorAll<HTMLElement>('[data-fx]')).map((node) => ({
          el: node,
          kind: kindOf(node),
          applied: -1,
        })),
      }));
      const remeasureReveals = () => revealGroups.forEach((g) => { g.top = g.el.offsetTop; });

      const applyReveal = (item: RevealItem, progress: number) => {
        if (progress === item.applied) return;
        if (progress > 0 && progress < 1 && Math.abs(progress - item.applied) < 0.004) return;
        item.applied = progress;
        const eased = revealEase(progress);
        // A finished wipe drops its clip-path: inset(0 0 0 0) would still swallow shadows and focus rings.
        const done = progress >= 1;
        switch (item.kind) {
          case 'title':
            gsap.set(item.el, { clipPath: done ? 'none' : `inset(0% ${(1 - eased) * 100}% 0% 0%)`, y: (1 - eased) * 8 });
            break;
          case 'text':
            gsap.set(item.el, { opacity: eased, y: (1 - eased) * 12 });
            break;
          case 'rule':
            gsap.set(item.el, { scaleX: eased, transformOrigin: 'left center' });
            break;
          default:
            gsap.set(item.el, {
              clipPath: done ? 'none' : `inset(0% 0% ${(1 - eased) * 100}% 0%)`,
              y: (1 - eased) * 22,
              opacity: Math.min(1, eased * 1.6),
            });
        }
      };

      const updateReveals = (columnScroll: number, gate: number) => {
        if (reduce) return;
        const viewport = window.innerHeight;
        const enterAt = viewport * 0.92;
        const band = viewport * 0.62;
        revealGroups.forEach((group) => {
          const groupProgress = clamp01((enterAt - (group.top - columnScroll)) / band) * gate;
          const count = group.items.length;
          const span = 0.55;
          const stepSize = count > 1 ? (1 - span) / (count - 1) : 0;
          group.items.forEach((item, index) => applyReveal(item, clamp01((groupProgress - index * stepSize) / span)));
        });
      };

      const publishActiveBlock = (columnScroll: number) => {
        if (!revealGroups.length) return setActiveSection('features');
        const marker = columnScroll + window.innerHeight * 0.5;
        let current = blocks[0].id;
        revealGroups.forEach((group, index) => {
          if (group.top <= marker) current = blocks[index].id;
        });
        setActiveSection(current);
      };

      updateReveals(0, 0);
      gsap.set(lastSlide, { opacity: 0 });

      // The cue points at the next module, then at the column's blocks.
      const MIN_CUE_JUMP = 300;
      const nextStopId = (scrollY: number) => {
        const stops = [
          ...modules.map((_, k) => ({ id: `features-face-${k}`, at: k * m.faceSpan })),
          ...blocks.map((b) => ({ id: b.id, at: m.turnLeg + m.exitLeg + b.el.offsetTop })),
        ];
        return (
          stops.find((s) => s.at > scrollY + MIN_CUE_JUMP)?.id ?? stops.find((s) => s.at > scrollY + 8)?.id ?? 'demo'
        );
      };

      let shownStep = -1;
      let shownActive = -1;
      const showCube = (p: number) => {
        gsap.set(cube, { rotateY: -90 * p });
        // While it turns the cube steps back and tips a little toward the reader, then comes forward again.
        const turning = reduce ? 0 : Math.sin(Math.PI * (p - Math.floor(p)));
        gsap.set(zoom, { scale: 1 - 0.1 * turning, rotateX: -7 * turning, yPercent: -2 * turning });
        shade(p);
        const s = Math.floor(p + 1e-6);
        const a = Math.round(p);
        if (s !== shownStep) setStep((shownStep = s));
        if (a !== shownActive) setActive((shownActive = a));
      };
      showCube(0);

      const st = ScrollTrigger.create({
        trigger,
        start: 'top top',
        end: () => {
          m = measure();
          remeasureReveals();
          return `+=${m.total}`;
        },
        pin: true,
        scrub: reduce ? true : 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: {
          snapTo: snapTarget,
          delay: 0.12,
          duration: reduce ? { min: 0.1, max: 0.25 } : { min: 0.35, max: 0.85 },
          ease: 'power2.inOut',
          inertia: true,
        },
        onLeave: () => setCue({ target: 'demo', parked: false }),
        onLeaveBack: () => setCue({ target: 'features', parked: false }),
        onUpdate: (self) => {
          const scrollY = self.progress * m.total;
          setCue({ target: nextStopId(scrollY), parked: scrollY >= m.turnLeg + m.exitLeg * 0.6 });

          if (scrollY <= m.turnLeg) {
            // Phase 1: the cube turns through the modules.
            showCube(progressAt(scrollY));
            gsap.set(horizontal, { x: 0 });
            gsap.set(lastSlide, { opacity: 0 });
            gsap.set(contentScroll, { y: 0 });
            updateReveals(0, 0);
            setActiveSection('features');
          } else if (scrollY <= m.turnLeg + m.exitLeg) {
            // Phase 2: the modules slide away and the CTA with its column come in.
            showCube(last);
            const k = clamp01((scrollY - m.turnLeg) / m.exitLeg);
            const eased = reduce ? k : smooth(k);
            gsap.set(horizontal, { x: -window.innerWidth * eased });
            gsap.set(lastSlide, { opacity: eased });
            gsap.set(contentScroll, { y: 0 });
            updateReveals(0, eased);
            setActiveSection('features');
          } else {
            // Phase 3: the column scrolls under the parked CTA.
            gsap.set(horizontal, { x: -window.innerWidth });
            gsap.set(lastSlide, { opacity: 1 });
            const columnScroll = Math.min(m.contentHeight, scrollY - m.turnLeg - m.exitLeg);
            gsap.set(contentScroll, { y: -columnScroll });
            updateReveals(columnScroll, 1);
            publishActiveBlock(columnScroll);
          }
        },
      });

      // The approach: the cube settles in while the stage travels up to its pin.
      if (!reduce) {
        // On the scene, not the pivot: the pivot's own transform places the cube in depth.
        gsap.fromTo(
          cube.closest('.cubo-escena'),
          { opacity: 0, scale: 0.9, yPercent: 6 },
          {
            opacity: 1,
            scale: 1,
            yPercent: 0,
            ease: 'none',
            scrollTrigger: { trigger, start: 'top 85%', end: 'top top', scrub: 0.3 },
          }
        );
      }

      const addAnchor = (id: string, resolver: () => number) => {
        registerAnchor(id, resolver);
        registeredIds.push(id);
      };
      addAnchor('features', () => st.start);
      addAnchor('features-revealed', () => st.start);
      // On the rest points themselves, so arriving through a link never triggers a snap.
      modules.forEach((_, k) => addAnchor(`features-face-${k}`, () => st.start + k * m.faceSpan));
      blocks.forEach(({ id, el }) =>
        addAnchor(id, () => st.start + m.turnLeg + m.exitLeg + Math.min(el.offsetTop, m.contentHeight))
      );
    }, sectionRef);

    return () => {
      registeredIds.forEach(unregisterAnchor);
      ctx.revert();
    };
    // `modules` comes from static messages: its length never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Mobile: each element plays its reveal once, in time, as it enters the viewport.
  useEffect(() => {
    if (isMobile !== true || prefersReducedMotion()) return;
    const root = mobileRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-fx]').forEach((el, i) => {
        const kind = kindOf(el);
        gsap.fromTo(el, { ...revealFrom[kind] }, {
          ...revealTo[kind],
          duration: kind === 'card' ? 0.7 : 0.5,
          delay: (i % 4) * 0.06,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(el, { clipPath: 'none' });
          },
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
    }, mobileRef);
    return () => ctx.revert();
  }, [isMobile]);

  const number = (index: number) => String(index + 1).padStart(2, '0');

  return (
    <div id="features">
      {/* Mobile layout - simple vertical scroll; the modules are a swipe carousel of screens */}
      <section ref={mobileRef} className="md:hidden py-16">
        <div className="mb-6 px-5">
          <h2 data-fx="title" className="text-2xl font-semibold text-white">{t('features.title')}</h2>
          <p data-fx="text" className="mt-3 text-white/70">{t('features.sub')}</p>
          <div data-fx="rule" className="mt-5 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
        </div>

        <ol className="modulos-carrusel" aria-label={t('features.title')}>
          {modules.map((modulo, index) => (
            <li key={modulo.escena} className="modulos-carrusel-item">
              <div className="modulo-pantalla">
                <Grabacion escena={modulo.escena} alt={modulo.alt} threshold={0.7} />
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">
                {number(index)} / {number(last)}
              </div>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-white">{modulo.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{modulo.desc}</p>
            </li>
          ))}
        </ol>

        <div className="px-5">
          <div className="mt-8 flex justify-center">
            <ScrollCue targetId="how" label={t('cues.nextTo', { section: t('nav.how') })} />
          </div>

          {/* CTA */}
          <div className="mt-12 text-center py-12 border-t border-white/10">
            <Image src="/brand/logo/eleva-360-stacked-color.svg" alt="eleva 360°" width={877} height={906} className="logo-light mx-auto mb-6 h-auto w-24" />
            <Image src="/brand/logo/eleva-360-stacked-reverse.svg" alt="" width={877} height={906} className="logo-dark mx-auto mb-6 h-auto w-24" />
            <h2 data-fx="title" className="text-2xl font-semibold text-white mb-3">{ctaText}</h2>
            <p data-fx="text" className="text-base text-white/70 mb-6">{ctaDesc}</p>
            {/* transition-colors, not `transition`: this link is also a reveal target. */}
            <a
              data-fx="card"
              href="#demo"
              onClick={navClick('demo')}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-brand-700"
            >
              {t('nav.requestDemo')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>

          {/* How section */}
          <div id="how-mobile" className="py-12 border-t border-white/10">
            <h3 data-fx="title" className="text-xl font-semibold text-white">{t('how.title')}</h3>
            <p data-fx="text" className="mt-2 text-white/70">{t('how.sub')}</p>
            <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
            <div data-fx="card" className="mt-6">
              <HowIllustration className="mx-auto h-auto w-full max-w-sm" />
            </div>
            <div className="mt-6 grid gap-4">
              {(t.raw('how.steps') as Array<{ title: string; desc: string }>).map((stepItem, i) => (
                <div data-fx="card" key={stepItem.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/20 text-sm font-medium text-brand-400">
                      {i + 1}
                    </span>
                    <div className="text-sm font-medium text-white">{stepItem.title}</div>
                  </div>
                  <p className="text-sm text-white/60">{stepItem.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security section */}
          <div id="security-mobile" className="py-12 border-t border-white/10">
            <h3 data-fx="title" className="text-xl font-semibold text-white">{t('security.title')}</h3>
            <p data-fx="text" className="mt-2 text-white/70">{t('security.sub')}</p>
            <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
            <div className="mt-6 grid gap-4">
              {(t.raw('security.cards') as Array<{ title: string; desc: string }>).map((card) => (
                <div data-fx="card" key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-medium text-white">{card.title}</div>
                  <p className="mt-2 text-sm text-white/60">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ section */}
          <div id="faq-mobile" className="py-12 border-t border-white/10">
            <h3 data-fx="title" className="text-xl font-semibold text-white">{t('faq.title')}</h3>
            <p data-fx="text" className="mt-2 text-white/70">{t('faq.sub')}</p>
            <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
            <div className="mt-6 grid gap-4">
              {(t.raw('faq.items') as Array<{ q: string; a: string }>).map((item) => (
                <div data-fx="card" key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-medium text-white">{item.q}</div>
                  <p className="mt-2 text-sm text-white/60">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <ScrollCue targetId="demo" label={t('cues.nextTo', { section: t('nav.requestDemo') })} />
            </div>
          </div>
        </div>
      </section>

      {/* Desktop layout - the modules on a turning cube of screens, then the CTA and its column */}
      <section ref={sectionRef} className="relative hidden md:block">
        <div ref={triggerRef} className="relative h-screen overflow-hidden">
          <div ref={horizontalRef} className="absolute inset-y-0 left-0 flex" style={{ width: '200vw', willChange: 'transform' }}>
            {/* Slide 1: the modules */}
            <div className="relative h-full w-screen flex-shrink-0">
              <div className="modulos">
                <div className="modulos-columna">
                  <h2 className="text-[clamp(1.5rem,3.8vh,1.875rem)] font-semibold leading-tight text-white">{t('features.title')}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70 [@media(max-height:820px)]:mt-2">{t('features.sub')}</p>
                  <ol className="modulos-lista">
                    {modules.map((modulo, index) => (
                      <li key={modulo.escena}>
                        <button
                          type="button"
                          className="modulos-fila"
                          data-activo={index === active ? 'true' : undefined}
                          aria-current={index === active ? 'step' : undefined}
                          onClick={() => goTo(`features-face-${index}`)}
                        >
                          <span className="modulos-num">{number(index)}</span>
                          <span className="modulos-texto">
                            <span className="modulos-titulo">{modulo.title}</span>
                            <span className="modulos-desc">
                              <span>{modulo.desc}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="cubo-columna">
                  <div className="cubo-escena" aria-hidden="true">
                    <div ref={zoomRef} className="cubo-zoom">
                    <div className="cubo-pivote">
                      <div ref={cubeRef} className="cubo">
                        {Array.from({ length: FACES }, (_, face) => {
                          const index = moduleOnFace(face, step, modules.length);
                          const modulo = index === null ? null : modules[index];
                          return (
                            <div
                              key={face}
                              className="cubo-cara"
                              data-activa={index !== null && index === active ? 'true' : undefined}
                              style={{ ['--cara' as string]: face }}
                            >
                              {modulo ? (
                                <Grabacion
                                  key={modulo.escena}
                                  escena={modulo.escena}
                                  alt=""
                                  play={index === active}
                                  margin="200% 0px"
                                  threshold={0.2}
                                />
                              ) : null}
                              <span ref={(el) => { shadesRef.current[face] = el; }} className="cubo-sombra-cara" />
                            </div>
                          );
                        })}
                        <div className="cubo-tapa" />
                      </div>
                    </div>
                    </div>
                    <div className="cubo-suelo" />
                    <div className="cubo-contador">
                      <span className="cubo-contador-actual">{number(active)}</span>
                      <span className="cubo-contador-total">/ {number(last)}</span>
                      <span className="cubo-contador-titulo">{modules[active]?.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2: CTA left (30vw) + the how/security/faq column right (70vw) */}
            <div ref={lastSlideRef} className="flex h-full w-screen flex-shrink-0">
              <div className="cta-sticky flex w-[35vw] lg:w-[30vw] flex-shrink-0 h-full flex-col items-center justify-center px-4 lg:px-8 py-8 border-r border-white/10">
                <Image src="/brand/logo/eleva-360-stacked-color.svg" alt="eleva 360°" width={877} height={906} className="logo-light mb-8 h-auto w-28" />
                <Image src="/brand/logo/eleva-360-stacked-reverse.svg" alt="" width={877} height={906} className="logo-dark mb-8 h-auto w-28" />
                <h2 className="text-3xl font-semibold text-white text-center mb-4">{ctaText}</h2>
                <p className="text-base text-white/70 text-center mb-8 max-w-[280px]">{ctaDesc}</p>
                <a
                  href="#demo"
                  onClick={navClick('demo')}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-brand-700"
                >
                  {t('nav.requestDemo')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>

              <div className="flex-1 lg:w-[70vw] h-full overflow-hidden relative">
                <div ref={contentScrollRef} className="absolute w-full" style={{ willChange: 'transform' }}>
                  {/* How section */}
                  <div id="how" className="min-h-screen flex flex-col justify-center border-l border-white/10 p-8 lg:p-12">
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('how.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('how.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
                      <div className="grid gap-4">
                        {(t.raw('how.steps') as Array<{ title: string; desc: string }>).map((stepItem, i) => (
                          <div data-fx="card" key={stepItem.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-sm font-medium text-brand-400">
                                {i + 1}
                              </span>
                              <div className="text-base font-medium text-white">{stepItem.title}</div>
                            </div>
                            <p className="text-sm text-white/60">{stepItem.desc}</p>
                          </div>
                        ))}
                      </div>
                      <div data-fx="card" className="flex justify-center lg:justify-end">
                        <HowIllustration className="h-auto w-full max-w-[520px]" />
                      </div>
                    </div>
                  </div>

                  {/* Security section */}
                  <div id="security" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('security.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('security.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-4">
                      {(t.raw('security.cards') as Array<{ title: string; desc: string }>).map((card) => (
                        <div data-fx="card" key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="text-base font-medium text-white">{card.title}</div>
                          <p className="mt-2 text-sm text-white/60">{card.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ section */}
                  <div id="faq" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('faq.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('faq.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {(t.raw('faq.items') as Array<{ q: string; a: string }>).map((item) => (
                        <div data-fx="card" key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="text-base font-medium text-white">{item.q}</div>
                          <p className="mt-2 text-sm text-white/60">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
