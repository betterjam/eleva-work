import type { Metadata } from "next";
import "./globals.css";

// Only a language-neutral fallback title lives here. The description used to
// be a hardcoded Spanish sentence describing a different product, and it
// shadowed meta.description for every locale; each page under `[locale]` now
// exports its own generateMetadata with the translated strings instead.
export const metadata: Metadata = {
  title: 'Eleva',
};

// This is the only layout that renders <html>, and it sits above the [locale]
// segment, so it cannot read the locale at build time. The script below (which
// already runs synchronously in <head>, before the body is parsed) reads it off
// the path instead, so /en and /en/platform declare English to screen readers,
// browser translation and hyphenation rather than inheriting the `es` default.
const themeScript = `
  (function() {
    try {
      var locale = (location.pathname.split('/')[1] || '').toLowerCase();
      if (locale === 'en' || locale === 'es') {
        document.documentElement.lang = locale;
      }
    } catch (e) {}
    try {
      // Palette: the brand's own light palette (aqua actions on paper) is the
      // default for everyone. ?palette=navy opts into the navy exploration (navy
      // header and hero band) and ?palette=ocean comes back; the choice sticks.
      var wanted = new URLSearchParams(location.search).get('palette');
      if (wanted === 'navy' || wanted === 'ocean') {
        localStorage.setItem('eleva-palette', wanted);
      }
      if (localStorage.getItem('eleva-palette') === 'navy') {
        document.documentElement.setAttribute('data-palette', 'navy');
      }
    } catch (e) {}
    try {
      // ?theme=light|dark fixes the theme the same way the toggle does.
      var wantedTheme = new URLSearchParams(location.search).get('theme');
      if (wantedTheme === 'light' || wantedTheme === 'dark') {
        localStorage.setItem('theme', wantedTheme);
      }
      var stored = localStorage.getItem('theme');
      if (stored) {
        document.documentElement.setAttribute('data-theme', stored);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* eleva 360° brand (public/brand = brand-assets/, see brand-assets/web/head.html):
            the two brand fonts, the colour/type tokens, the favicon, the app icons
            and the web manifest. The token sheet carries its own light and dark values. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* The brand's head snippet asks for plain <link> tags; this is the single root
            layout, so both rules below are false alarms for the app router. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Lexend:wght@500;600&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/brand/web/eleva-tokens.css" />
        <link rel="icon" href="/brand/icons/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/brand/icons/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="apple-touch-icon" href="/brand/icons/icon-180.png" />
        <link rel="manifest" href="/brand/web/site.webmanifest" />
        <meta name="theme-color" content="#0b3a5c" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
