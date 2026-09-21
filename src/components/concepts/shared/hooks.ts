'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export type Theme = 'dark' | 'light';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const subscribeNever = () => () => {};

/** False during SSR and hydration, true once mounted on the client. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/**
 * Theme state synced with the `data-theme` attribute on <html> (set by the inline
 * script in the root layout) and persisted under localStorage 'theme'.
 * SSR and the first client render report 'dark' (mounted === false) so markup matches.
 */
export function useTheme() {
  const mounted = useMounted();
  const theme = useSyncExternalStore<Theme>(subscribeTheme, readTheme, () => 'dark');

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {}
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  return { theme: mounted ? theme : 'dark', toggle, mounted };
}

/** Switch between 'es' and 'en' keeping the current path. */
export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const other = locale === 'es' ? 'en' : 'es';
  const toggle = useCallback(() => {
    router.replace(pathname, { locale: other });
  }, [router, pathname, other]);
  return { locale, other, toggle };
}

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query]
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** True when the user asked the OS for reduced motion. */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** Viewport width below `breakpoint` (default 768 = Tailwind md). */
export function useIsMobile(breakpoint = 768) {
  return useMediaQuery(`(max-width: ${breakpoint - 0.02}px)`);
}
