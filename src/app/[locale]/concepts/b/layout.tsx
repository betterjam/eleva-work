import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Instrument_Sans, Geist_Mono } from 'next/font/google';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ConceptRoot from '@/components/concepts/shared/ConceptRoot';
import { routing } from '@/i18n/routing';
import '@/styles/concept-b.css';

/**
 * Concept B — "Memoria Anual".
 * Display: Fraunces (variable, opsz axis only; SOFT/WONK stay at their 0 defaults).
 * Body: Instrument Sans 400/500/600. Mono: Geist Mono 400/500.
 * Fallbacks are metric-adjusted by next/font (adjustFontFallback) to limit CLS
 * before the swap, which matters for the pinned Cap. 02 stage.
 */
const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-display',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const body = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-body',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

const mono = Geist_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});

/**
 * Reveal gate. Runs before the concept markup is parsed: stamps `data-b-js` on
 * <html> so the CSS start states (opacity 0, clip-paths, scaleX 0) apply from
 * the first paint instead of flashing server-rendered content and then hiding
 * it. If the client bundle has not reported in (`data-b-motion`, set by
 * useMotion) within 4 s (chunk failure, runtime error, an error boundary), the
 * stamp is lifted and the complete server-rendered page shows as is.
 */
const gateScript =
  "(function(){var d=document.documentElement;d.setAttribute('data-b-js','');" +
  "setTimeout(function(){if(!d.hasAttribute('data-b-motion'))d.removeAttribute('data-b-js')},4000)})()";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'conceptB.meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ConceptBLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ConceptRoot concept="b" fontClassName={`${display.variable} ${body.variable} ${mono.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: gateScript }} />
      {children}
    </ConceptRoot>
  );
}
