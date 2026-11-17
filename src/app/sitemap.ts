import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { blogPosts } from '@/lib/blog';
import { LEGAL } from '@/lib/paths';

// A static export writes this once, at build time, as /sitemap.xml.
export const dynamic = 'force-static';

const SITE = 'https://eleva.works';

/** The pages every language has, by their path under each language (the legal ones have a word per language). */
const PAGES: { path: Record<string, string>; priority: number }[] = [
  { path: { es: '', en: '' }, priority: 1 },
  { path: { es: 'blog/', en: 'blog/' }, priority: 0.8 },
  { path: { es: `${LEGAL.privacy.es}/`, en: `${LEGAL.privacy.en}/` }, priority: 0.2 },
  { path: { es: `${LEGAL.terms.es}/`, en: `${LEGAL.terms.en}/` }, priority: 0.2 },
];

/**
 * The pages a search engine should know: the home, the blog and the legal pages in each language, and every
 * published article. The pages that only forward (platform, concepts) are left out on purpose.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of PAGES) {
    const languages = Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE}/${locale}/${page.path[locale]}`]));
    for (const locale of routing.locales) {
      entries.push({ url: `${SITE}/${locale}/${page.path[locale]}`, priority: page.priority, alternates: { languages } });
    }
  }

  for (const locale of routing.locales) {
    for (const post of await blogPosts(locale)) {
      const languages: Record<string, string> = { [locale]: `${SITE}/${locale}/blog/${post.slug}/` };
      for (const other of post.translations) languages[other.language] = `${SITE}/${other.language}/blog/${other.slug}/`;
      entries.push({
        url: `${SITE}/${locale}/blog/${post.slug}/`,
        lastModified: post.updatedOn,
        priority: 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
