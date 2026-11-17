import NextLink from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { shareMeta } from '@/lib/shareMeta';
import { blogDate, blogPosts } from '@/lib/blog';
import BlogShell from '@/components/blog/BlogShell';
import BlogCard, { BlogArt } from '@/components/blog/BlogCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return shareMeta({ locale, path: 'blog/', title: t('meta.title'), description: t('meta.description') });
}

/** `/es/blog`, `/en/blog`: the published articles, the newest one wide and the rest in a grid. Built from the API's list. */
export default async function BlogIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = await blogPosts(locale);
  const other = locale === 'es' ? 'en' : 'es';
  const [featured, ...rest] = posts;

  return (
    <BlogShell locale={locale} otherLocaleHref={`/${other}/blog/`}>
      <section className="blog-hero">
        <div className="blog-hero__in">
          <p className="blog-crumbs">{t('kicker')}</p>
          <h1>{t('title')}</h1>
          <p className="blog-hero__lead">{t('lead')}</p>
        </div>
      </section>

      <div className="blog-section">
        {posts.length === 0 && <p className="blog-empty">{t('empty')}</p>}

        {featured && (
          <NextLink href={`/${locale}/blog/${featured.slug}/`} className="blog-featured">
            <BlogArt post={featured} tint={0} />
            <div className="blog-featured__body">
              <span className="blog-card__meta">
                {t('latest')} · <time dateTime={featured.publishedOn}>{blogDate(featured.publishedOn, locale)}</time>
                {' · '}
                {t('readingTime', { minutes: featured.readingMinutes })}
              </span>
              <h2>{featured.title}</h2>
              <p>{featured.summary}</p>
              <span className="blog-card__go">{t('readMore')} →</span>
            </div>
          </NextLink>
        )}

        <ul className="blog-grid">
          {rest.map((post, index) => (
            <li key={post.slug}>
              <BlogCard
                post={post}
                locale={locale}
                tint={index + 1}
                readingTime={t('readingTime', { minutes: post.readingMinutes })}
                readMore={t('readMore')}
              />
            </li>
          ))}
        </ul>
      </div>
    </BlogShell>
  );
}
