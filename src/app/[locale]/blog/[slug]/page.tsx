import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { EMPTY_SLUG, blogArticle, blogDate, blogPost, blogPosts } from '@/lib/blog';
import BlogShell from '@/components/blog/BlogShell';
import BlogCard from '@/components/blog/BlogCard';
import BlogLamina from '@/components/blog/BlogLamina';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const SITE = 'https://eleva.works';
const CARD = '/brand/web/og-card.png';

/**
 * One page per published article and language. A static export needs at least one page per dynamic segment,
 * so a language with no article yet gets a stand-in that search engines are told to skip.
 */
export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    const posts = await blogPosts(locale);
    if (posts.length === 0) params.push({ locale, slug: EMPTY_SLUG });
    for (const post of posts) params.push({ locale, slug: post.slug });
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = slug === EMPTY_SLUG ? null : await blogPost(locale, slug);
  if (!post) return { robots: { index: false, follow: false } };

  const url = `/${locale}/blog/${post.slug}/`;
  // Published here and on the other site too: the original addresses are on the site it was written for.
  const home = post.canonicalUrl ? new URL(post.canonicalUrl).origin : '';
  const languages: Record<string, string> = { [locale]: home + url };
  for (const other of post.translations) languages[other.language] = `${home}/${other.language}/blog/${other.slug}/`;
  const image = post.coverUrl ? { url: post.coverUrl, alt: post.coverAlt ?? post.title } : { url: CARD, width: 1200, height: 630, alt: 'eleva 360°' };

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: post.canonicalUrl ?? url, languages },
    openGraph: {
      type: 'article',
      url,
      siteName: 'eleva 360°',
      title: post.title,
      description: post.summary,
      locale: locale === 'en' ? 'en_US' : 'es_CL',
      publishedTime: post.publishedOn,
      modifiedTime: post.updatedOn,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.summary, images: [image.url] },
  };
}

/** The first letters of who signs, for the round mark next to the name. */
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]!.toUpperCase()).join('');
}

/** `/es/blog/<slug>`: the article, whole, in the page's HTML. */
export default async function BlogArticle({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });
  const otherLocale = locale === 'es' ? 'en' : 'es';

  if (slug === EMPTY_SLUG) {
    return (
      <BlogShell locale={locale} otherLocaleHref={`/${otherLocale}/blog/`}>
        <div className="blog-section">
          <p className="blog-empty">{t('empty')}</p>
        </div>
      </BlogShell>
    );
  }

  const post = await blogPost(locale, slug);
  if (!post) notFound();

  const { parts, sections } = blogArticle(post.bodyHtml);
  const shared = (other: { tags: string[] }) => other.tags.filter((tag) => post.tags.includes(tag)).length;
  const others = (await blogPosts(locale))
    .filter((other) => other.slug !== post.slug)
    .map((other, index) => ({ other, index }))
    .sort((a, b) => shared(b.other) - shared(a.other) || a.index - b.index)
    .slice(0, 3)
    .map((entry) => entry.other);
  const translation = post.translations.find((x) => x.language === otherLocale);
  const author = post.author ?? 'Eleva';
  const address = `${SITE}/${locale}/blog/${post.slug}/`;
  const absolute = (path: string) => (path.startsWith('http') ? path : `${SITE}${path}`);
  const share = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(address)}` },
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${address}`)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(address)}&text=${encodeURIComponent(post.title)}` },
    { label: t('shareMail'), href: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(address)}` },
  ];
  const shareLinks = (
    <div className="blog-share">
      {share.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      ))}
    </div>
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    inLanguage: locale === 'en' ? 'en' : 'es-CL',
    datePublished: post.publishedOn,
    dateModified: post.updatedOn,
    mainEntityOfPage: address,
    image: absolute(post.coverUrl ?? CARD),
    author: { '@type': post.author ? 'Person' : 'Organization', name: author },
    publisher: { '@type': 'Organization', name: 'Eleva', logo: { '@type': 'ImageObject', url: absolute('/brand/logo/eleva-360-horizontal-color.svg') } },
    keywords: post.tags.join(', ') || undefined,
  };

  return (
    <BlogShell locale={locale} otherLocaleHref={translation ? `/${otherLocale}/blog/${translation.slug}/` : `/${otherLocale}/blog/`}>
      {/* The article for search engines, as data. Its values are the API's own, serialized, never markup. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <article>
        <header className={`blog-hero blog-hero--article ${post.coverUrl ? 'blog-hero--cover' : ''}`}>
          <div className="blog-hero__in">
            <p className="blog-crumbs">
              <NextLink href={`/${locale}/blog/`}>{t('back')}</NextLink>
              {post.tags[0] && <span>/ {post.tags[0]}</span>}
            </p>
            <h1>{post.title}</h1>
            <p className="blog-hero__lead">{post.summary}</p>
            <div className="blog-byline">
              <span className="blog-byline__avatar" aria-hidden="true">{initials(author)}</span>
              <span>
                <strong>{author}</strong>
                <time dateTime={post.publishedOn}>{blogDate(post.publishedOn, locale)}</time> · {t('readingTime', { minutes: post.readingMinutes })}
              </span>
            </div>
          </div>
        </header>

        {post.coverUrl && (
          <div className="blog-cover">
            <div className="blog-cover__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverUrl} alt={post.coverAlt ?? ''} />
            </div>
          </div>
        )}

        <div className={`blog-layout ${sections.length > 1 ? 'blog-layout--toc' : ''}`}>
          <div className="blog-main">
            {/* The API keeps this HTML to an article's own tags (headings, paragraphs, lists, quotes, links, images). */}
            {parts.map((part, index) =>
              'lamina' in part ? (
                <BlogLamina key={index} clave={part.lamina} pie={part.pie} />
              ) : (
                <div key={index} className={`blog-prose ${index === 0 ? 'blog-prose--opens' : ''}`} dangerouslySetInnerHTML={{ __html: part.html }} />
              )
            )}

            <footer className="blog-foot">
              {post.tags.length > 0 && (
                <ul className="blog-chips">
                  {post.tags.map((tag) => (
                    <li key={tag} className="blog-chip blog-chip--soft">{tag}</li>
                  ))}
                </ul>
              )}
              <div className="blog-share-row">{shareLinks}</div>
              <div className="blog-author">
                <span className="blog-byline__avatar" aria-hidden="true">{initials(author)}</span>
                <div>
                  <strong>{author}</strong>
                  <span>{t('authorLine')}</span>
                </div>
              </div>
            </footer>
          </div>

          {sections.length > 1 && (
            <aside className="blog-aside">
              <div className="blog-aside__in">
                <nav aria-label={t('toc')}>
                  <h2>{t('toc')}</h2>
                  <ul className="blog-toc">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`}>{section.text}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div>
                  <h2>{t('share')}</h2>
                  {shareLinks}
                </div>
              </div>
            </aside>
          )}
        </div>
      </article>

      {others.length > 0 && (
        <section className="blog-more">
          <div className="blog-section">
            <h2>{t('keepReading')}</h2>
            <ul className="blog-grid">
              {others.map((other, index) => (
                <li key={other.slug}>
                  <BlogCard
                    post={other}
                    locale={locale}
                    tint={index + 1}
                    readingTime={t('readingTime', { minutes: other.readingMinutes })}
                    readMore={t('readMore')}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </BlogShell>
  );
}
