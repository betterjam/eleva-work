import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import TermsContent from '@/components/legal/TermsContent';
import { legalPath } from '@/lib/paths';

/** Los términos de servicio en español: /es/terminos/ (los ingleses están en /en/terms/). */
export function generateStaticParams() {
  return [{ locale: 'es' }];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: { canonical: legalPath('terms', locale), languages: { es: legalPath('terms', 'es'), en: legalPath('terms', 'en') } } };
}

export default async function TermsPageEs({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsContent locale="es" />;
}
