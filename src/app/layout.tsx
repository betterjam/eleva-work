import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Lexend } from "next/font/google";
// The brand token sheet (a copy of public/brand/web/eleva-tokens.css) is bundled
// into the site's own stylesheet rather than linked: one request fewer before the
// first paint. Its font variables are pointed at the self-hosted fonts below in
// globals.css.
import "@/styles/eleva-tokens.css";
import "./globals.css";

// The two brand fonts, self-hosted by next/font: served from this domain and
// preloaded, instead of a render-blocking stylesheet on fonts.googleapis.com
// plus font files on fonts.gstatic.com (two extra connections on a slow phone).
const lexend = Lexend({ subsets: ["latin"], weight: ["500", "600"], display: "swap", variable: "--font-lexend" });
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-atkinson",
});

// Only a language-neutral fallback title lives here. The description used to
// be a hardcoded Spanish sentence describing a different product, and it
// shadowed meta.description for every locale; each page under `[locale]` now
// exports its own generateMetadata with the translated strings instead.
// metadataBase turns every relative canonical, alternate and Open Graph URL
// into an absolute one on the production domain.
export const metadata: Metadata = {
  metadataBase: new URL('https://eleva.works'),
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
    <html lang="es" className={`${lexend.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* eleva 360° brand (public/brand = brand-assets/, see brand-assets/web/head.html):
            the favicon, the app icons and the web manifest. Fonts and tokens are
            bundled above. */}
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
