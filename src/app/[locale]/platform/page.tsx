import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { shareMeta } from '@/lib/shareMeta';
import PageA from '@/components/concepts/a/PageA';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'conceptA' });
  return shareMeta({ locale, path: 'platform/', title: t('meta.title'), description: t('meta.description') });
}

/** `/es/platform`, `/en/platform`: the platform explained module by module. */
export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PageA />;
}
