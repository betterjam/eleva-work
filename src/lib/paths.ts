/**
 * The pages whose address is a word, in each language (Diego, 2026-11-16: translated addresses, «same thing for the
 * landing pages»). The static export has no middleware: each address is a folder of its own under [locale], and the
 * other language's word only forwards (LegalForward).
 */
export const LEGAL = {
  privacy: { es: 'privacidad', en: 'privacy' },
  terms: { es: 'terminos', en: 'terms' },
} as const;

export type LegalPage = keyof typeof LEGAL;

/** A legal page's address in a language: /es/privacidad/, /en/privacy/. */
export function legalPath(page: LegalPage, locale: string): string {
  const language = locale === 'en' ? 'en' : 'es';
  return `/${language}/${LEGAL[page][language]}/`;
}
