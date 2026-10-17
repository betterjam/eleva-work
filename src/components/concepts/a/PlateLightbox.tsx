'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ScrollSmoother } from '@/components/concepts/shared/gsapSetup';

type Props = {
  src: string;
  alt: string;
  naturalW: number;
  naturalH: number;
  fig: string;
  caption: string;
  onClose: () => void;
};

/**
 * The whole file behind a plate, uncropped, at viewport size. A native modal <dialog>
 * (top layer, focus trap, Esc) portalled to <body>, so it sits outside the
 * ScrollSmoother's transformed content and above the fixed header. The frame is the
 * plate itself scaled up: crop marks, white window, FIG. caption with the close control.
 * While it is open the smoother is paused, so the wheel does not scroll the page behind
 * it; closing (button, Esc, a click on the backdrop) returns focus to the plate's own
 * button, which the dialog element does by itself.
 */
export default function PlateLightbox({ src, alt, naturalW, naturalH, fig, caption, onClose }: Props) {
  const t = useTranslations('conceptA');
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.addEventListener('close', onClose);
    if (!dialog.open) dialog.showModal();
    const smoother = ScrollSmoother.get();
    const wasPaused = smoother ? smoother.paused() : true;
    if (!wasPaused) smoother?.paused(true);
    // No dialog.close() here: unmounting removes the element from the top layer by
    // itself, and close() fires its `close` event asynchronously, which a re-run of this
    // effect (React's dev double-invocation) would catch and treat as the reader closing.
    return () => {
      dialog.removeEventListener('close', onClose);
      if (!wasPaused) smoother?.paused(false);
    };
  }, [onClose]);

  return createPortal(
    <dialog
      ref={ref}
      className="a-lightbox"
      aria-label={fig ? `${fig} — ${caption}` : alt}
      onClick={(e) => {
        // The backdrop is part of the dialog element: a click that lands on nothing
        // inside the frame closes it.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <figure className="a-plate a-lightbox-plate">
        <span className="a-crop-marks" aria-hidden="true" />
        <div className="a-plate-window">
          <Image
            className="a-lightbox-img"
            src={src}
            alt={alt}
            width={naturalW}
            height={naturalH}
            sizes="92vw"
            priority
            draggable={false}
          />
        </div>
        <figcaption className="a-plate-caption a-lightbox-caption">
          {fig ? <span className="a-fig">{fig}</span> : null}
          <span>{caption}</span>
          <button type="button" className="a-lightbox-close" aria-label={t('common.close')} onClick={() => ref.current?.close()}>
            <span>{t('common.close')}</span>
            <kbd aria-hidden="true">Esc</kbd>
          </button>
        </figcaption>
      </figure>
    </dialog>,
    document.body
  );
}
