import type { Metadata } from 'next';

/**
 * Canonical, language alternates and the link preview (Open Graph + Twitter card) for a
 * page. The preview image is the brand card in public/brand/web/og-card.png (1200×630):
 * without it LinkedIn, WhatsApp and Slack pick the first image on the page. URLs are
 * relative; metadataBase in the root layout makes them absolute.
 */
export function shareMeta(opts: { locale: string; path?: string; title: string; description: string }): Metadata {
  const path = opts.path ?? '';
  const url = `/${opts.locale}/${path}`;
  const image = { url: '/brand/web/og-card.png', width: 1200, height: 630, alt: 'eleva 360°' };
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      languages: { es: `/es/${path}`, en: `/en/${path}`, 'x-default': `/es/${path}` },
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'eleva 360°',
      title: opts.title,
      description: opts.description,
      locale: opts.locale === 'en' ? 'en_US' : 'es_CL',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [image.url],
    },
  };
}
