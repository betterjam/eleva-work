import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as 'es' | 'en')) {
    locale = routing.defaultLocale;
  }

  // Base site copy + one namespace per redesign concept (messages/concept-*/).
  const [base, conceptA] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/concept-a/${locale}.json`),
  ]);

  return {
    locale,
    messages: {
      ...base.default,
      conceptA: conceptA.default,
    },
  };
});
