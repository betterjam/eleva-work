'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SmoothScroll from '@/components/concepts/shared/SmoothScroll';
import CookieBanner from '@/components/CookieBanner';
import WhatsAppButton from '@/components/WhatsAppButton';
import SectionDirector from './director/SectionDirector';
import DraftingGrid from './DraftingGrid';
import HeaderA from './HeaderA';
import IntroA from './IntroA';
import SystemSheet from './SystemSheet';
import EstructuraA from './EstructuraA';
import PautaBuilderA from './PautaBuilderA';
import ProcesoA from './ProcesoA';
import ResultadosA from './ResultadosA';
import IAA from './IAA';
import NormativaA from './NormativaA';
import CierreA from './CierreA';
import FooterA from './FooterA';
import { useScrollTo } from './scrollTo';

const WHATSAPP = '56979591791';

/**
 * `/platform` — the platform in detail ("Plano Maestro") — client composition root.
 * The page explains the system module by module: the landing at `/` owns the hero, the
 * pricing, the FAQ and the demo form, and every CTA here links back to it.
 * Fixed pieces (grid, header + menu, WhatsApp, cookie banner) sit OUTSIDE
 * <SmoothScroll>; every scrolling section sits inside it. The Section Director wraps the
 * whole body: it owns the `[data-section]` triggers (header counter, nav highlight), the
 * reveal windows, the hold pins and the transitions between sections (`director/sections.ts`).
 */
export default function PageA() {
  const mainRef = useRef<HTMLElement>(null);
  useDocumentLang();
  return (
    <SectionDirector scope={mainRef}>
      <PageBody mainRef={mainRef} />
    </SectionDirector>
  );
}

/**
 * Declares the document language for this route. Only the root layout may render <html>
 * in the App Router and it hardcodes `lang="es"`, so `/en/platform` would otherwise ship
 * an entirely English page announced as Spanish (screen-reader voice, hyphenation, the
 * browser's translation prompt). <html> already carries `suppressHydrationWarning`, and
 * the attribute is deliberately NOT restored on unmount: putting "es" back while the
 * reader is still inside the EN site would reintroduce the same lie.
 */
function useDocumentLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}

function PageBody({ mainRef }: { mainRef: RefObject<HTMLElement | null> }) {
  const t = useTranslations('conceptA');
  const scrollTo = useScrollTo();

  return (
    <>
      <a
        href="#main"
        className="a-sr-only"
        data-a-chrome
        onClick={(e) => {
          e.preventDefault();
          scrollTo('#main', 0);
          mainRef.current?.focus({ preventScroll: true });
        }}
      >
        {t('common.skipToContent')}
      </a>
      <DraftingGrid />
      <HeaderA />
      <SmoothScroll>
        <main id="main" ref={mainRef} tabIndex={-1}>
          <IntroA />
          <SystemSheet />
          <EstructuraA />
          <PautaBuilderA />
          <ProcesoA />
          <ResultadosA />
          <IAA />
          <NormativaA />
          <CierreA />
          <FooterA />
        </main>
      </SmoothScroll>
      {/* Fixed chrome (no transform on the wrapper); made inert while the mobile sheet is open. */}
      <div data-a-chrome>
        <WhatsAppButton phoneNumber={WHATSAPP} message={t('common.whatsappMessage')} />
        <CookieBanner />
      </div>
    </>
  );
}
