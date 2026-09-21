import type { ReactNode } from 'react';
import { Schibsted_Grotesk, Geist, JetBrains_Mono } from 'next/font/google';
import { routing } from '@/i18n/routing';
import ConceptRoot from '@/components/concepts/shared/ConceptRoot';
import '@/styles/concept-a.css';

/**
 * `/[locale]/platform` — the platform in detail, in Concept A's "Plano Maestro" language.
 * Display: Schibsted Grotesk (tight newspaper grotesk, tabular numerals).
 * Body: Geist (quiet technical sans). Mono: JetBrains Mono (codes, captions, labels).
 * All three are variable fonts on Google Fonts, so no `weight` list is passed:
 * next/font loads the variable file and every weight used in the CSS (400–700) is available.
 */
const display = Schibsted_Grotesk({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-display',
});

const body = Geist({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-body',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-mono',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* When JavaScript is off, reveal targets must not stay hidden. Mirrors the
   `.a-noscript-visible` rules in concept-a.css without needing a class. */
const noscriptCss = `
[data-concept="a"] .rv-fade{opacity:1}
[data-concept="a"] .rv-lines{visibility:visible}
[data-concept="a"] .rv-wipe,[data-concept="a"] .rv-wipe-up,[data-concept="a"] .rv-wipe-down,[data-concept="a"] .rv-wipe-left{clip-path:none}
[data-concept="a"] .rv-rule-x,[data-concept="a"] .rv-rule-y,[data-concept="a"] .rv-mask>*,[data-concept="a"] .a-bar-fill,[data-concept="a"] .a-rail{transform:none}
[data-concept="a"] .a-svg-pending .a-draw,[data-concept="a"] .a-svg-pending text[clip-path],[data-concept="a"] .a-svg-pending .a-donut-leader{visibility:visible}
[data-concept="a"] .a-hdr-rule,[data-concept="a"] .a-res-hr,[data-concept="a"] .a-grid .a-cols>i{transform:none}
[data-concept="a"] .a-nav-link{clip-path:none}
[data-concept="a"] .rv-mask{overflow:visible}
[data-concept="a"] .a-rule[data-rule-pending] .a-rule-line{transform:none}
[data-concept="a"] .a-rule[data-rule-pending] .a-rule-code,[data-concept="a"] .a-rule[data-rule-pending] .a-running{clip-path:none}
[data-concept="a"] .a-progress{transform:none}
[data-concept="a"] .a-pb-frame-head,[data-concept="a"] .a-pb-frame-label,[data-concept="a"] .a-pb-slot,[data-concept="a"] .a-pb-caption{visibility:visible;opacity:1}
[data-concept="a"] .a-pb-card,[data-concept="a"] .a-pb-dim,[data-concept="a"] .a-pb-cover{clip-path:none}
[data-concept="a"] .a-pb-norms>li>span,[data-concept="a"] .a-pb-link,[data-concept="a"] .a-pb-gutter-rule{transform:none}
[data-concept="a"] .a-pb-slots.a-pb-pin-only{display:none}
/* The claim's own start states are the shared rv-* ones, lifted above. What is left is its
   PLACEMENT: without JS the builder never hands the ledger's cell over, so the claim must
   not overlay it — the stage grows by one row and the claim closes it, as it does under
   reduced motion. Equal specificity, later in the document: this wins over the pinned MQ. */
[data-concept="a"] .a-pb-stage{height:auto;padding-bottom:40px;row-gap:56px}
[data-concept="a"] .a-pb-claim{grid-column:1/-1;grid-row:auto;align-self:start;height:auto;display:block;pointer-events:auto}
`;

type Props = {
  children: ReactNode;
};

export default function PlatformLayout({ children }: Props) {
  return (
    <ConceptRoot concept="a" fontClassName={`${display.variable} ${body.variable} ${mono.variable}`}>
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${noscriptCss}</style>` }} />
      {children}
    </ConceptRoot>
  );
}
