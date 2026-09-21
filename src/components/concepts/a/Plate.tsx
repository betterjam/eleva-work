import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

export type PlateRegion = { x: number; y: number; w: number; h: number };

export type PlateProps = {
  src: string;
  alt: string;
  naturalW: number;
  naturalH: number;
  fig: string;
  caption: string;
  /** Crop in natural pixels; the window takes the region's aspect ratio. */
  region?: PlateRegion;
  /** Alternative crop applied under 768px (same file, usually a shorter cut). */
  mobileRegion?: PlateRegion;
  /** Rendered size when there is no region (the image scales to 100% width). */
  width?: number;
  height?: number;
  /** Classes for the <figure> (layout, grid placement). */
  className?: string;
  /**
   * Reveal hook (`rv-wipe-up`, `rv-wipe-left`, …) applied to the inner body
   * (window + caption) so the frame and its crop marks stay visible while the
   * print develops inside. Wipe targets in choreography are `.a-plate-body`.
   */
  reveal?: string;
  windowClassName?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  /** Absolutely positioned content over the image box (annotations, leaders). */
  overlay?: ReactNode;
  style?: CSSProperties;
};

/**
 * Screenshot frame: 1px plate with crop marks, an image window and a FIG. caption bar.
 * Region crops are pure CSS (`--crop-*` vars on the figure, read by `.a-crop`),
 * so the full-resolution file is positioned inside the window and stays sharp.
 */
export default function Plate({
  src,
  alt,
  naturalW,
  naturalH,
  fig,
  caption,
  region,
  mobileRegion,
  width,
  height,
  className,
  reveal,
  windowClassName,
  priority,
  sizes,
  onLoad,
  overlay,
  style,
}: PlateProps) {
  const vars: Record<string, string | number> = {};
  if (region) {
    vars['--img-w'] = naturalW;
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
      className={`a-plate${className ? ` ${className}` : ''}`}
      style={figureStyle}
      data-region={region ? 'true' : undefined}
      data-mregion={mobileRegion ? 'true' : undefined}
    >
      <span className="a-crop-marks" aria-hidden="true" />
      <div className={`a-plate-body${reveal ? ` ${reveal}` : ''}`}>
        <div className={`a-plate-window${windowClassName ? ` ${windowClassName}` : ''}`}>
          {region ? (
            <Image
              className="a-crop"
              src={src}
              alt={alt}
              width={naturalW}
              height={naturalH}
              sizes={sizes}
              priority={priority}
              onLoad={onLoad}
              draggable={false}
            />
          ) : (
            <Image
              className="a-plate-full"
              src={src}
              alt={alt}
              width={width ?? naturalW}
              height={height ?? naturalH}
              sizes={sizes}
              priority={priority}
              onLoad={onLoad}
              draggable={false}
            />
          )}
          {overlay}
        </div>
        <figcaption className="a-plate-caption">
          <span className="a-fig">{fig}</span>
          <span>{caption}</span>
        </figcaption>
      </div>
    </figure>
  );
}
