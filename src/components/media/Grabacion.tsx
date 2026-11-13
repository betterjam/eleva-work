'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';

/**
 * A short recording of the platform in use (`public/media/grabaciones/`, made from the presentation's recordings by
 * eleva-presentaciones/herramientas/capturas/para-landing.py): an animated WebP per scene and theme, plus a still.
 * The English pages read the recordings made with the platform in English (`-en` suffix); a scene without them
 * shows the Spanish ones.
 *
 * Built for a fast page:
 * - Nothing loads during SSR or hydration (the theme is only known on the client): the box keeps its size from
 *   `width`/`height`, so the layout never shifts.
 * - The still loads when the box comes within `margin` of the viewport (native lazy loading cannot see the theme).
 * - The animation is fetched only while the box is mostly in view and `play` is true, and only shown once it has
 *   arrived (the still stays until then). It plays from its first frame every time (a fresh blob URL); leaving the
 *   view puts the still back, so an off-screen recording costs no decoding.
 * - Reduced motion never animates.
 */
type Props = {
  escena: string;
  alt: string;
  /** Intrinsic size of the files (1200 × 750 unless the scene is a phone). */
  width?: number;
  height?: number;
  /** False keeps the still (a screen that is not in front). */
  play?: boolean;
  className?: string;
  /** How far outside the viewport the still starts loading. */
  margin?: string;
  /** Share of the box that must be in view to play. */
  threshold?: number;
  /** Load the still at once (above the fold). */
  eager?: boolean;
};

const BASE = '/media/grabaciones';
const VACIA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function readTheme(): 'dark' | 'light' {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** The page's theme, or null before the client knows it (SSR and hydration). */
function useClientTheme() {
  return useSyncExternalStore<'dark' | 'light' | null>(subscribeTheme, readTheme, () => null);
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The suffix of the files recorded with the platform in a language other than its own (Spanish). */
export function sufijoIdioma(locale: string) {
  return locale === 'es' ? '' : `-${locale}`;
}

export function grabacionFija(escena: string, tema: 'dark' | 'light', locale = 'es') {
  return `${BASE}/${escena}-${tema}${sufijoIdioma(locale)}-fija.webp`;
}

export default function Grabacion({
  escena,
  alt,
  width = 1200,
  height = 750,
  play = true,
  className,
  margin = '400px 0px',
  threshold = 0.45,
  eager = false,
}: Props) {
  const theme = useClientTheme();
  const locale = useLocale();
  // A scene not recorded in the page's language (its still is missing) shows the Spanish files.
  const [sinIdioma, setSinIdioma] = useState(false);
  const idioma = sinIdioma ? 'es' : locale;
  const ref = useRef<HTMLImageElement>(null);
  const [near, setNear] = useState(eager);
  const [inView, setInView] = useState(false);
  // The animation that arrived, and for which request (scene, theme): a stale one is never shown.
  const [animated, setAnimated] = useState<{ para: string; url: string } | null>(null);
  const quiere = Boolean(theme && play && inView);
  const para = `${escena}-${theme}${sufijoIdioma(idioma)}`;

  // Near: start the still. In view: allowed to play.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: margin }
    );
    const viewObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting && e.intersectionRatio >= threshold)),
      { threshold: [0, threshold, 1] }
    );
    if (!eager) nearObserver.observe(el);
    viewObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [margin, threshold, eager]);

  // Fetch the animation while it may play; a fresh blob URL restarts it from its first frame.
  useEffect(() => {
    if (!quiere || reducedMotion()) return;
    let url: string | null = null;
    let cancelled = false;
    const controller = new AbortController();
    fetch(`${BASE}/${para}.webp`, { signal: controller.signal })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        // Decoded before it replaces the still, so the swap never flashes an empty box.
        const probe = new Image();
        probe.src = url;
        return probe.decode().catch(() => undefined).then(() => {
          if (!cancelled && url) setAnimated({ para, url });
        });
      })
      .catch(() => {
        /* the still stays */
      });
    return () => {
      cancelled = true;
      controller.abort();
      if (url) {
        const old = url;
        // Released once the element has dropped it (the render below stops using it as soon as `quiere` drops).
        window.setTimeout(() => URL.revokeObjectURL(old), 1000);
      }
    };
  }, [quiere, para]);

  const still = theme && near ? grabacionFija(escena, theme, idioma) : undefined;
  // Until then a transparent pixel: the box keeps its ratio and the alt text is not painted into it.
  const playing = quiere && animated?.para === para ? animated.url : null;
  const src = playing ?? still ?? VACIA;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- animated WebP swapped at runtime; next/image would re-encode it
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      // A fixed ratio, never the loaded file's: the placeholder pixel must not reshape the box (a page whose
      // scroll triggers were measured would otherwise move under them).
      style={{ aspectRatio: `${width} / ${height}` }}
      decoding="async"
      fetchPriority={eager ? 'high' : 'low'}
      draggable={false}
      onError={() => {
        if (idioma !== 'es' && src === still) setSinIdioma(true);
      }}
      className={className}
      data-grabacion={escena}
      data-estado={playing ? 'animada' : still ? 'fija' : 'vacia'}
    />
  );
}
