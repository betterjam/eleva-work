'use client';

import { useEffect, type ReactNode } from 'react';

type Props = {
  concept: 'a' | 'b';
  /** Font variable classes from next/font, e.g. `${display.variable} ${body.variable}` */
  fontClassName?: string;
  children: ReactNode;
};

/**
 * Wraps a concept page. Sets `data-concept` on the wrapper (SSR-safe token scope)
 * and mirrors it onto <html> after mount so html-level rules (background,
 * scroll-behavior) can be scoped per concept without touching the root layout.
 *
 * Never put transform/filter on this element: fixed children would break.
 */
export default function ConceptRoot({ concept, fontClassName = '', children }: Props) {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.getAttribute('data-concept');
    html.setAttribute('data-concept', concept);
    // Font variables must reach fixed elements and <html>-level backgrounds too.
    const classes = fontClassName.split(/\s+/).filter(Boolean);
    classes.forEach((c) => html.classList.add(c));
    return () => {
      if (previous) html.setAttribute('data-concept', previous);
      else html.removeAttribute('data-concept');
      classes.forEach((c) => html.classList.remove(c));
    };
  }, [concept, fontClassName]);

  return (
    <div data-concept={concept} className={`${fontClassName} concept-root`}>
      {children}
    </div>
  );
}
