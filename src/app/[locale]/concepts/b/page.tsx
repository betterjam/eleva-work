import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import SmoothScroll from '@/components/concepts/shared/SmoothScroll';
import ConceptSwitcher from '@/components/concepts/shared/ConceptSwitcher';
import CookieBanner from '@/components/CookieBanner';
import WhatsAppButton from '@/components/WhatsAppButton';
import MastheadB from '@/components/concepts/b/MastheadB';
import HeroB from '@/components/concepts/b/HeroB';
import SumarioB from '@/components/concepts/b/SumarioB';
import Cap01Estructura from '@/components/concepts/b/Cap01Estructura';
import Cap02Pauta from '@/components/concepts/b/Cap02Pauta';
import Cap03Proceso from '@/components/concepts/b/Cap03Proceso';
import Cap04Resultados from '@/components/concepts/b/Cap04Resultados';
import IaSpread from '@/components/concepts/b/IaSpread';
import NormativaB from '@/components/concepts/b/NormativaB';
import TestimonioB from '@/components/concepts/b/TestimonioB';
import PreciosB from '@/components/concepts/b/PreciosB';
import FaqB from '@/components/concepts/b/FaqB';
import DemoFormB from '@/components/concepts/b/DemoFormB';
import FooterB from '@/components/concepts/b/FooterB';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Concept B — "Memoria Anual". ConceptRoot (tokens, fonts) is applied by the
 * layout. Fixed pieces live OUTSIDE <SmoothScroll>; everything that scrolls
 * lives inside it.
 */
export default async function ConceptBPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <MastheadB />
      <SmoothScroll smooth={1.2} effects>
        <main id="b-main" tabIndex={-1}>
          <HeroB />
          <SumarioB />
          <Cap01Estructura />
          <Cap02Pauta />
          <Cap03Proceso />
          <Cap04Resultados />
          <IaSpread />
          <NormativaB />
          <TestimonioB />
          <PreciosB />
          <FaqB />
          <DemoFormB />
        </main>
        <FooterB />
      </SmoothScroll>
      <WhatsAppButton phoneNumber="56979591791" message="Hola! Me interesa saber más sobre Eleva" />
      <CookieBanner />
      <ConceptSwitcher />
    </>
  );
}
