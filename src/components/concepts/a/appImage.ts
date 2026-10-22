/**
 * Product screenshots exist once per language: `/images/app/<name>.png` in the components
 * resolves to `/images/app/<locale>/<name>.png` (company mockups, sources in
 * design/mockups/). Any other path is returned unchanged.
 */
export function appImage(src: string, locale: string): string {
  const prefix = '/images/app/';
  if (!src.startsWith(prefix)) return src;
  const lang = locale === 'en' ? 'en' : 'es';
  return `${prefix}${lang}/${src.slice(prefix.length)}`;
}
