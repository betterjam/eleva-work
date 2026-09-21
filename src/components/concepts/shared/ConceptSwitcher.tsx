'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';

const options: Array<{ key: 'current' | 'a' | 'b'; path: string; label: string }> = [
  { key: 'current', path: '', label: 'Actual' },
  { key: 'a', path: '/concepts/a', label: 'A' },
  { key: 'b', path: '/concepts/b', label: 'B' },
];

/**
 * Small fixed pill to jump between the live site and the two concepts.
 * Review aid only: delete this component (and its usages) once a concept is chosen.
 *
 * Links carry the locale prefix explicitly (`/es/concepts/a`): the site has no i18n
 * middleware, so next-intl's prefix-less default-locale URLs would 404.
 */
export default function ConceptSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();
  const active: 'current' | 'a' | 'b' = pathname.startsWith('/concepts/a')
    ? 'a'
    : pathname.startsWith('/concepts/b')
      ? 'b'
      : 'current';

  return (
    <div
      className="concept-switcher"
      role="navigation"
      aria-label="Concept switcher"
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: 'rgba(10,12,16,0.82)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.8)',
      }}
    >
      <span style={{ padding: '0 8px 0 10px', opacity: 0.55, textTransform: 'uppercase' }}>concepto</span>
      {options.map((o) => {
        const isActive = o.key === active;
        return (
          <Link
            key={o.key}
            href={`/${locale}${o.path}/`}
            style={{
              padding: '6px 11px',
              borderRadius: 999,
              textDecoration: 'none',
              color: isActive ? '#04111a' : 'rgba(255,255,255,0.85)',
              background: isActive ? '#2dd4bf' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              transition: 'background .2s, color .2s',
            }}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
