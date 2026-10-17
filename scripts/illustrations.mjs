/**
 * Build the web-sized illustration set.
 *
 * Source: public/images/Eleva-IllustArtboard-<n>.png (2,700px RGBA exports with
 * wide transparent margins). Output: public/images/illustrations/artboard-<n>.webp,
 * trimmed to the drawing and capped at MAX_WIDTH, which is plenty for cards and
 * half-width sections on a 2x display. The site is a static export with image
 * optimisation off, so whatever lives in public/ is what the browser downloads.
 *
 *   node scripts/illustrations.mjs
 */
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'public/images';
const OUT = 'public/images/illustrations';
const MAX_WIDTH = 960;

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /^Eleva-IllustArtboard-\d+\.png$/.test(f));

for (const file of files.sort((a, b) => Number(a.match(/\d+/)) - Number(b.match(/\d+/)))) {
  const n = file.match(/\d+/)[0];
  const out = path.join(OUT, `artboard-${n}.webp`);
  const image = sharp(path.join(SRC, file)).trim({ threshold: 10 });
  const { width, height } = await image.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  await image
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(out);
  const size = (await stat(out)).size;
  console.log(`${file} -> ${path.basename(out)}  trimmed ${width}x${height}  ${(size / 1024).toFixed(0)} KB`);
}
