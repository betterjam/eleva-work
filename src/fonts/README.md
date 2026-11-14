# Self-hosted fonts

The woff2 files here are loaded with `next/font/local` from the root layout, so `next build`
never talks to Google Fonts. Until November 2026 the same families came through
`next/font/google`, which downloads them at build time; that download failed the production
build of 2026-11-14 (the school landing had the same failure in October, vercel/next.js#99114).

Each file is the **latin** slice that Google Fonts serves to Chrome, byte for byte (copied from
the school landing, `betterjam/eleva-landing`), so the site renders exactly as it did before.
Spanish and English are fully covered by the latin subset.

| File | Family | Notes |
|------|--------|-------|
| `lexend-latin.woff2` | Lexend | variable, wght 100-900 |
| `atkinson-hyperlegible-latin-{400,700}[-italic].woff2` | Atkinson Hyperlegible | static |

Both families are published under the SIL Open Font License 1.1 (https://openfontlicense.org);
their sources are on https://fonts.google.com. Keep the file names: the layout references
them by path.
