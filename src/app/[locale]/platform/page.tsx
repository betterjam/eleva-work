import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import PlatformRedirect from './PlatformRedirect';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * `/es/platform`, `/en/platform` used to explain the platform module by module. The site no longer tells how
 * Eleva works, only what it delivers; this route stays as a forward for the links that still point here.
 */
export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  return <PlatformRedirect locale={locale} />;
}
