/**
 * The blog's articles, read from Eleva's API while the site is BUILT (never from the reader's browser): each
 * published article becomes a page of this site, with its text in the HTML. Publishing or taking down an
 * article shows here on the next build.
 */

const API = (process.env.ELEVA_BLOG_API ?? process.env.NEXT_PUBLIC_ELEVA_API ?? 'https://api.eleva.school').replace(/\/+$/, '');
const SITE = 'works';

export type BlogTranslation = { language: string; slug: string };

export type BlogPost = {
  slug: string;
  language: string;
  title: string;
  summary: string;
  /** Absent in the list. */
  bodyHtml?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  tags: string[];
  author?: string | null;
  publishedOn: string;
  updatedOn: string;
  readingMinutes: number;
  /**
   * Its original address, on the site it was written for. An article published on both sites is the same text on two
   * domains: the copy points search engines to the original.
   */
  canonicalUrl?: string | null;
  translations: BlogTranslation[];
};

/** The address segment of the page that stands in for `[slug]` while a language has no article. */
export const EMPTY_SLUG = 'sin-articulos';

/**
 * One value per build. Next keeps the answers of a build's requests (.next/cache) and would hand a later
 * build the articles of an earlier one; a request that differs in every build is always asked again.
 */
const BUILD = Date.now().toString(36);

/** What this build process already read: the list is asked for by every page, each article by three callers. */
const answers = new Map<string, Promise<unknown>>();

function read<T>(path: string): Promise<T | null> {
  let answer = answers.get(path);
  if (!answer) {
    answer = fetchOnce(path);
    answers.set(path, answer);
  }
  return answer as Promise<T | null>;
}

async function fetchOnce(path: string): Promise<unknown> {
  const stamped = `${path}${path.includes('?') ? '&' : '?'}build=${BUILD}`;
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${API}/api/public/blog/${SITE}${stamped}`, { cache: 'force-cache' });
    // An API that has no blog yet answers 404: the site builds with an empty blog instead of failing.
    if (response.status === 404) return null;
    if (response.ok) return response.json();
    // A busy API (too many requests, a deploy in progress) is asked again a few times, each after a longer wait.
    const busy = response.status === 429 || response.status >= 500;
    if (busy && attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
      continue;
    }
    // Anything else that is not an answer stops the build: a blog must never be published half read.
    throw new Error(`The blog could not be read from ${API} (${response.status}).`);
  }
}

/**
 * An article's images live in the API; scripts/blog-media.mjs copies them into public/blog-media/ before the
 * build. Here every address of one becomes the address of its copy, so the page loads it from this site.
 */
const API_IMAGE = /(?:https?:\/\/[^"'\s/]+)?\/api\/public\/blog\/images\/(\d{4})\/([A-Za-z0-9._-]+)/g;

function local<T extends string | null | undefined>(text: T): T {
  return (text ? text.replace(API_IMAGE, '/blog-media/$1-$2') : text) as T;
}

function withLocalImages(post: BlogPost): BlogPost {
  return { ...post, coverUrl: local(post.coverUrl), bodyHtml: local(post.bodyHtml) };
}

/** The published articles of a language, newest first, without their text. */
export async function blogPosts(locale: string): Promise<BlogPost[]> {
  return ((await read<BlogPost[]>(`/posts?lang=${encodeURIComponent(locale)}`)) ?? []).map(withLocalImages);
}

export async function blogPost(locale: string, slug: string): Promise<BlogPost | null> {
  const post = await read<BlogPost>(`/posts/${encodeURIComponent(slug)}?lang=${encodeURIComponent(locale)}`);
  return post ? withLocalImages(post) : null;
}

export type BlogSection = { id: string; text: string };

/** A stretch of the article: its own HTML, or one of the site's pieces («lámina») with its caption. */
export type BlogPart = { html: string } | { lamina: string; pie: string };

/** A paragraph that only names a piece of the site: `[[lamina:360|Quién evalúa a cada persona.]]`. */
const LAMINA = /<p>\s*\[\[lamina:([a-z0-9-]+)(?:\|([^\]<]*))?\]\]\s*<\/p>/g;

/**
 * The article's HTML made ready for the page: every section heading gets an id (so «En este artículo» can link
 * to it) and every image becomes a figure with its description as the caption. The HTML is the API's, already
 * kept to an article's tags; nothing is added here but ids, `figure` and `figcaption`.
 */
export function blogArticle(bodyHtml: string | null | undefined): { parts: BlogPart[]; sections: BlogSection[] } {
  const sections: BlogSection[] = [];
  const used = new Set<string>();
  const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  const slug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'seccion';

  let html = (bodyHtml ?? '').replace(/<h2>([\s\S]*?)<\/h2>/g, (_all, inner: string) => {
    const text = plain(inner);
    let id = slug(text);
    for (let n = 2; used.has(id); n++) id = `${slug(text)}-${n}`;
    used.add(id);
    if (text) sections.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });

  // An image alone in its paragraph leaves the paragraph; one inside a sentence closes it and opens another.
  const figure = (src: string, alt: string) => `<figure><img src="${src}" alt="${alt}" loading="lazy">${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`;
  html = html
    .replace(/<p>\s*<img src="([^"]*)" alt="([^"]*)">\s*<\/p>/g, (_all, src: string, alt: string) => figure(src, alt))
    .replace(/<img src="([^"]*)" alt="([^"]*)">/g, (_all, src: string, alt: string) => `</p>${figure(src, alt)}<p>`)
    .replace(/<p>\s*<\/p>/g, '');

  // Where a paragraph names a lámina, the article's HTML stops, the piece goes in, and the HTML goes on.
  const parts: BlogPart[] = [];
  let from = 0;
  for (const match of html.matchAll(LAMINA)) {
    const before = html.slice(from, match.index);
    if (before.trim()) parts.push({ html: before });
    parts.push({ lamina: match[1], pie: (match[2] ?? '').trim() });
    from = match.index + match[0].length;
  }
  if (html.slice(from).trim()) parts.push({ html: html.slice(from) });

  return { parts, sections };
}

export function blogDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' });
}
