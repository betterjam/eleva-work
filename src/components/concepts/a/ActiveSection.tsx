'use client';

import { createContext, useContext } from 'react';

export type ActiveSectionValue = {
  active: string;
  setActive: (id: string) => void;
};

/**
 * Active `data-section` id for the header counter and nav highlight. The provider is the
 * Section Director (`director/SectionDirector.tsx`), the single owner of the section
 * ScrollTriggers; consumers keep using `useActiveSection()`.
 */
export const ActiveSectionContext = createContext<ActiveSectionValue>({
  active: 'intro',
  setActive: () => {},
});

/**
 * §NN code for every tracked `data-section`. The intro is the page's cover (§00); the
 * seven modules run §01…§07. The closing CTA and the colophon are not tracked, so the
 * counter holds at §07 once Normativa has been read.
 */
export const SECTION_CODES: Record<string, string> = {
  intro: '00',
  system: '01',
  estructura: '02',
  pauta: '03',
  proceso: '04',
  resultados: '05',
  ia: '06',
  normativa: '07',
};

export const useActiveSection = () => useContext(ActiveSectionContext);
