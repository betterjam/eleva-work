import { legalPath } from '@/lib/paths';
import { trialUrl } from '@/lib/trial';
import NextLink from 'next/link';
import { getTranslations } from 'next-intl/server';
import CookieBanner from '@/components/CookieBanner';
import BlogHeader from './BlogHeader';

type Props = {
  locale: string;
  otherLocaleHref: string;
  children: React.ReactNode;
};

/** What every page of the blog shares: the bar on top, the call to a demo and the footer below. */
export default async function BlogShell({ locale, otherLocaleHref, children }: Props) {
  const t = await getTranslations({ locale });

  return (
    <div className="blog-page">
      <BlogHeader otherLocaleHref={otherLocaleHref} />
      <main className="flex-1">{children}</main>

      <section className="blog-band">
        <div className="blog-band__in">
          <p>{t('blog.cta')}</p>
          <a href={trialUrl(locale)} className="blog-cta">
            {t('nav.requestDemo')}
          </a>
        </div>
      </section>

      <footer className="blog-footer">
        <div className="blog-footer__in">
          <span>© {new Date().getFullYear()} Eleva</span>
          <nav>
            <NextLink href={`/${locale}/`}>{t('blog.home')}</NextLink>
            <NextLink href={`/${locale}/blog/`}>{t('nav.blog')}</NextLink>
            <NextLink href={legalPath('privacy', locale)}>{t('legal.privacy')}</NextLink>
            <NextLink href={legalPath('terms', locale)}>{t('legal.terms')}</NextLink>
          </nav>
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
}
