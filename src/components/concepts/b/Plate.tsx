'use client';

import Image from 'next/image';
import type { CSSProperties, Ref } from 'react';
import { PLATES, cropVars, type PlateKey } from './plates';
import { refreshSoon } from './motion';

type Props = {
  id: PlateKey;
  folio: string;
  caption: string;
  alt: string;
  /** 'ink' (default): 1px ink line in light / hairline in dark. 'accent-top' adds the 2px teal top edge. */
  frame?: 'hairline' | 'ink' | 'accent-top';
  /** Hero only. */
  priority?: boolean;
  /** Reveal classes for the box (r-wipe r-wipe-left …). */
  className?: string;
  boxRef?: Ref<HTMLDivElement>;
  imgRef?: Ref<HTMLImageElement>;
  hideCaption?: boolean;
  /** Renders a drawable rule above the caption instead of the static border (hero). */
  drawnCaption?: boolean;
  captionRuleRef?: Ref<HTMLSpanElement>;
  captionTextRef?: Ref<HTMLSpanElement>;
  /** Reveal class for the figcaption (hero: r-fade). */
  captionClassName?: string;
  sizes?: string;
};

/**
 * A screenshot tipped in as a captioned plate: fixed-aspect box, exact
 * percentage crop (desktop + optional mobile crop), folio + caption on a rule.
 */
export default function Plate({
  id,
  folio,
  caption,
  alt,
  frame = 'ink',
  priority = false,
  className = '',
  boxRef,
  imgRef,
  hideCaption = false,
  drawnCaption = false,
  captionRuleRef,
  captionTextRef,
  captionClassName = '',
  sizes = '(min-width: 1280px) 1216px, (min-width: 768px) 92vw, 100vw',
}: Props) {
  const def = PLATES[id];
  const style = cropVars(def) as CSSProperties;
  const frameClass = frame === 'hairline' ? 'is-hairline' : frame === 'accent-top' ? 'is-accent-top' : 'is-ink';
  const drawn = drawnCaption;

  return (
    <figure className="b-plate">
      <div ref={boxRef} className={`b-plate-box ${frameClass} ${className}`.trim()} style={style}>
        <Image
          ref={imgRef}
          src={def.src}
          width={def.w}
          height={def.h}
          alt={alt}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          unoptimized
          sizes={sizes}
          className="b-plate-img"
          onLoad={refreshSoon}
          draggable={false}
        />
      </div>
      {!hideCaption && (
        <>
          {drawn && <span ref={captionRuleRef} className="b-rule r-rule" style={{ marginTop: 10 }} aria-hidden="true" />}
          <figcaption
            className={`b-plate-caption ${captionClassName}`.trim()}
            style={drawn ? { borderTop: 0, marginTop: 0 } : undefined}
          >
            <span className="b-folio">{folio}</span>
            <span ref={captionTextRef} className="b-plate-desc">
              {caption}
            </span>
          </figcaption>
        </>
      )}
    </figure>
  );
}
