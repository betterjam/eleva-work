// Runs before `next build`: brings the images of the published blog articles from Eleva's API into
// public/blog-media/, so the site serves them from its own domain and no page depends on the API.
// src/lib/blog.ts points every article at these copies with the same naming rule (`<year>-<name>`).
import { mkdir, rm, writeFile } from 'node:fs/promises';

const API = (process.env.ELEVA_BLOG_API ?? process.env.NEXT_PUBLIC_ELEVA_API ?? 'https://api.eleva.school').replace(/\/+$/, '');
const SITE = 'works';
const OUT = new URL('../public/blog-media/', import.meta.url);
const IMAGE = /(?:https?:\/\/[^"'\s/]+)?\/api\/public\/blog\/images\/(\d{4})\/([A-Za-z0-9._-]+)/g;

/** A busy API (too many requests, a deploy in progress) is asked again a few times, each after a longer wait. */
async function ask(url) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url);
    const busy = response.status === 429 || response.status >= 500;
    if (!busy || attempt >= 5) return response;
    await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
  }
}

async function read(path) {
  const response = await ask(`${API}/api/public/blog/${SITE}${path}`);
  if (response.status === 404) return null; // an API without the blog yet: nothing to bring
  if (!response.ok) throw new Error(`The blog could not be read from ${API} (${response.status}).`);
  return response.json();
}

const wanted = new Map();
for (const locale of ['es', 'en']) {
  for (const listed of (await read(`/posts?lang=${locale}`)) ?? []) {
    const post = await read(`/posts/${encodeURIComponent(listed.slug)}?lang=${locale}`);
    for (const text of [post?.coverUrl, post?.bodyHtml, listed.coverUrl]) {
      for (const match of (text ?? '').matchAll(IMAGE)) wanted.set(`${match[1]}-${match[2]}`, `${match[1]}/${match[2]}`);
    }
  }
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const [file, path] of wanted) {
  const response = await ask(`${API}/api/public/blog/images/${path}`);
  // A published article with a missing image stops the build: better no deploy than a broken page.
  if (!response.ok) throw new Error(`Blog image ${path} could not be read (${response.status}).`);
  await writeFile(new URL(file, OUT), Buffer.from(await response.arrayBuffer()));
}
console.log(`blog-media: ${wanted.size} image(s)`);
