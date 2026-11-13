'use client';

import { useCallback, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import Grabacion from '@/components/media/Grabacion';
import PlateLightbox from './PlateLightbox';

export type PlateRegion = { x: number; y: number; w: number; h: number };

/** Every recording on this page is a desktop capture of this size (files in `public/media/grabaciones/`). */
export const RECORDING = { w: 1200, h: 750 };

export type PlateProps = {
  /** The recorded scene (`<escena>-<dark|light>[-en][-fija].webp`). */
  escena: string;
  alt: string;
  fig: string;
  caption: string;
  /** Crop in the recording's pixels (1200 × 750); the window takes the region's aspect ratio. */
  region?: PlateRegion;
  /** Alternative crop applied under 768px (same file, usually a shorter cut). */
  mobileRegion?: PlateRegion;
  /**
   * Whether the recording plays while the plate is in view. By default a whole recording
   * plays and a cropped one keeps its still: the crop was chosen on the still, and a
   * recording that scrolls would move something else into the window.
   */
  play?: boolean;
  /** Classes for the <figure> (layout, grid placement). */
  className?: string;
  /**
   * Reveal hook (`rv-wipe-up`, `rv-wipe-left`, …) applied to the inner body
   * (window + caption) so the frame and its crop marks stay visible while the
   * print develops inside. Wipe targets in choreography are `.a-plate-body`.
   */
  reveal?: string;
  style?: CSSProperties;
};

/**
 * Screenshot frame: 1px plate with crop marks, an image window and a FIG. caption bar.
 * The print is a recording of the platform (`components/media/Grabacion`): the still and
 * the animation of the page's theme and language, swapped live when the theme changes.
 * Region crops are pure CSS (`--crop-*` vars on the figure, read by `.a-crop`),
 * so the full-resolution file is positioned inside the window and stays sharp.
 * The window is also a button: it opens the whole recording, uncropped and playing, in a
 * modal lightbox (`PlateLightbox`). A wipe that still clips the body clips the button
 * too, so a print cannot be opened before it has developed.
 */
export default function Plate({
  escena,
  alt,
  fig,
  caption,
  region,
  mobileRegion,
  play,
  className,
  reveal,
  style,
}: PlateProps) {
  const t = useTranslations('conceptA');
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const vars: Record<string, string | number> = {};
  if (region) {
    vars['--img-w'] = RECORDING.w;
    vars['--crop-x'] = region.x;
    vars['--crop-y'] = region.y;
    vars['--crop-w'] = region.w;
    vars['--crop-h'] = region.h;
    vars['--ratio'] = `${region.w} / ${region.h}`;
  }
  if (mobileRegion) {
    vars['--crop-x-m'] = mobileRegion.x;
    vars['--crop-y-m'] = mobileRegion.y;
    vars['--crop-w-m'] = mobileRegion.w;
    vars['--crop-h-m'] = mobileRegion.h;
    vars['--ratio-m'] = `${mobileRegion.w} / ${mobileRegion.h}`;
  }
  const figureStyle = { ...vars, ...style } as CSSProperties;

  return (
    <figure
      className={`a-plate a-lamina${className ? ` ${className}` : ''}`}
      style={figureStyle}
      data-region={region ? 'true' : undefined}
      data-mregion={mobileRegion ? 'true' : undefined}
    >
      <span className="a-crop-marks" aria-hidden="true" />
      <div className={`a-plate-body${reveal ? ` ${reveal}` : ''}`}>
        <div className="a-plate-window">
          <Grabacion
            escena={escena}
            alt={alt}
            width={RECORDING.w}
            height={RECORDING.h}
            play={play ?? !region}
            className={region ? 'a-crop' : 'a-plate-full'}
          />
          <button
            type="button"
            className="a-plate-zoom"
            aria-label={fig ? t('common.enlargeFig', { fig }) : t('common.enlarge')}
            onClick={() => setOpen(true)}
          >
            <span className="a-plate-zoom-tag" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" />
              </svg>
            </span>
          </button>
        </div>
        <figcaption className="a-plate-caption">
          <span className="a-fig">{fig}</span>
          <span>{caption}</span>
        </figcaption>
      </div>
      {open ? <PlateLightbox escena={escena} alt={alt} fig={fig} caption={caption} onClose={close} /> : null}
    </figure>
  );
}
