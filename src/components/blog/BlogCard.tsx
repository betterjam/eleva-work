import NextLink from 'next/link';
import { blogDate, type BlogPost } from '@/lib/blog';

type ArtProps = { post: BlogPost; tint: number };

/** What a card shows on top: the article's cover, or the brand's rings in one of four tints, with its topic. */
export function BlogArt({ post, tint }: ArtProps) {
  return (
    <div className={`blog-art ${post.coverUrl ? 'blog-art--cover' : ''} blog-art--${tint % 4}`}>
      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt={post.coverAlt ?? ''} loading="lazy" />
      )}
      {post.tags[0] && <span className="blog-art__topic">{post.tags[0]}</span>}
    </div>
  );
}

type Props = { post: BlogPost; locale: string; tint: number; readingTime: string; readMore: string };

/** One article in a grid. */
export default function BlogCard({ post, locale, tint, readingTime, readMore }: Props) {
  return (
    <NextLink href={`/${locale}/blog/${post.slug}/`} className="blog-card">
      <BlogArt post={post} tint={tint} />
      <div className="blog-card__body">
        <span className="blog-card__meta">
          <time dateTime={post.publishedOn}>{blogDate(post.publishedOn, locale)}</time> · {readingTime}
        </span>
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
        <span className="blog-card__go">{readMore} →</span>
      </div>
    </NextLink>
  );
}
