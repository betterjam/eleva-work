'use client';

import Grabacion from '@/components/media/Grabacion';

/**
 * A «lámina» inside a blog article: one of the site's own pieces (a drawing, or a recording of the platform in
 * use), shown live — animated, in the reader's theme and language. The article only names it
 * (`[[lamina:<clave>|<pie>]]`, see blogArticle in src/lib/blog.ts); the piece itself lives here, so improving
 * it improves every article that shows it.
 */

/** The recordings an article may show (public/media/grabaciones), and the phone-shaped ones among them. */
const GRABACIONES = new Set([
  'organigrama', 'pautas', 'proceso', 'retroalimentacion', 'informe', 'consolidado', 'perfil', 'enfoque',
]);
const TELEFONO = new Set<string>();

export const LAMINAS = [...GRABACIONES];

type Props = { clave: string; pie: string };

export default function BlogLamina({ clave, pie }: Props) {
  if (!GRABACIONES.has(clave)) return null;
  const telefono = TELEFONO.has(clave);

  return (
    <figure className={`blog-lamina ${telefono ? 'blog-lamina--telefono' : ''}`}>
      <div className="blog-lamina__marco">
        {!telefono && (
          <div className="blog-lamina__barra" aria-hidden="true">
            <i /><i /><i />
          </div>
        )}
        <Grabacion escena={clave} alt={pie} {...(telefono ? { width: 600, height: 1298 } : { width: 1200, height: 750 })} />
      </div>
      {pie && <figcaption>{pie}</figcaption>}
    </figure>
  );
}
