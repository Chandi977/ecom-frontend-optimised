import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  DURATION,
  EASE_OUT,
  backdrop,
  modalPanel,
  transition,
  withoutMotion,
} from "../../../utils/motion";

export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  inStock: boolean;
}

/**
 * Dark industrial gallery: thumbnail rail (left on desktop, scrolling strip on
 * mobile), main showcase image with a stock badge and caption bar, and a
 * full-screen lightbox with its own thumbnail switcher.
 */
export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, inStock }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const reduceMotion = useReducedMotion();

  // A slug change swaps the image list underneath us; don't keep pointing at an
  // index the new product may not have.
  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  // Escape closes the lightbox, and the page behind it must not scroll.
  useEffect(() => {
    if (!showLightbox) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLightbox(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showLightbox]);

  const currentImg = images[selectedIndex] || images[0];
  if (!currentImg) return null;

  return (
    <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-4">
      {/* Thumbnails: bottom strip on mobile, sidebar on desktop */}
      {images.length > 1 && (
        <div className="tw-order-2 md:tw-order-1 tw-flex md:tw-flex-col tw-gap-3 tw-overflow-x-auto md:tw-overflow-visible tw-pb-2 md:tw-pb-0 tw-shrink-0">
          {images.map((img, idx) => (
            <button
              key={`${img.src}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={`Show image ${idx + 1}: ${img.caption}`}
              aria-current={selectedIndex === idx}
              className={`tw-w-20 tw-h-20 tw-p-0 tw-border tw-border-solid tw-overflow-hidden tw-shrink-0 tw-transition-all tw-bg-white tw-rounded-lg tw-relative tw-group tw-cursor-pointer ${
                selectedIndex === idx
                  ? "tw-border-slate-900 tw-ring-1 tw-ring-slate-900"
                  : "tw-border-slate-200 hover:tw-border-slate-400"
              }`}
              title={img.caption}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="tw-w-full tw-h-full tw-object-cover tw-transition-transform group-hover:tw-scale-105 tw-opacity-90 group-hover:tw-opacity-100"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main showcase image */}
      <div className="tw-order-1 md:tw-order-2 tw-grow tw-bg-slate-50 tw-border tw-border-solid tw-border-slate-200 tw-rounded-xl tw-relative tw-overflow-hidden tw-group tw-min-h-[380px] md:tw-min-h-[460px] md:tw-h-full tw-flex tw-items-center tw-justify-center tw-p-6">
        {inStock ? (
          <span
            className="tw-absolute tw-top-4 tw-left-4 tw-z-10 tw-bg-white/95 tw-text-emerald-700 tw-border tw-border-solid tw-border-emerald-600/30 tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-bold tw-tracking-wider tw-rounded-md tw-flex tw-items-center tw-gap-2 tw-shadow-sm"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <span className="tw-w-2 tw-h-2 tw-bg-emerald-600 tw-rounded-full tw-animate-pulse" />
            IN STOCK
          </span>
        ) : (
          <span
            className="tw-absolute tw-top-4 tw-left-4 tw-z-10 tw-bg-white/95 tw-text-red-700 tw-border tw-border-solid tw-border-red-600/30 tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-bold tw-tracking-wider tw-rounded-md tw-flex tw-items-center tw-gap-2 tw-shadow-sm"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <span className="tw-w-2 tw-h-2 tw-bg-red-600 tw-rounded-full" />
            OUT OF STOCK
          </span>
        )}

        {/* Keyed on src so picking a thumbnail remounts the image and it
            settles in, instead of the view hard-cutting to a different
            product shot with no indication anything changed. The container
            has a min-height, so nothing reflows during the swap. */}
        <motion.img
          key={currentImg.src}
          src={currentImg.src}
          alt={currentImg.alt}
          onClick={() => setShowLightbox(true)}
          // Starts hidden, so it needs the no-JS / reduced-motion escape hatch
          // — this is the main product photo and must never stay invisible.
          data-reveal="hidden"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transition(reduceMotion ? 0.01 : DURATION.base, EASE_OUT)}
          className="tw-w-full tw-max-h-[420px] md:tw-max-h-[440px] tw-object-contain tw-transition-transform tw-duration-500 group-hover:tw-scale-105 tw-cursor-zoom-in"
        />

        <button
          type="button"
          onClick={() => setShowLightbox(true)}
          className="tw-absolute tw-bottom-4 tw-right-4 tw-bg-white hover:tw-bg-slate-900 hover:tw-text-white tw-text-slate-800 tw-p-2.5 tw-rounded-full tw-shadow-md tw-transition-all tw-flex tw-items-center tw-justify-center tw-border tw-border-solid tw-border-slate-200 tw-cursor-pointer"
          title="Zoom product image"
          aria-label="Zoom product image"
        >
          <span className="material-symbols-outlined tw-text-xl">zoom_in</span>
        </button>

        <div
          className="tw-absolute tw-bottom-3 tw-left-4 tw-text-xs tw-text-slate-700 tw-font-semibold tw-bg-white/95 tw-backdrop-blur-sm tw-border tw-border-solid tw-border-slate-200 tw-px-3 tw-py-1 tw-rounded-md tw-max-w-[65%] tw-truncate tw-shadow-sm"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {currentImg.caption} ({selectedIndex + 1}/{images.length})
        </div>
      </div>

      {/* Lightbox. AnimatePresence keeps it mounted long enough to play its
          exit, so dismissing reverses the way it arrived rather than the
          overlay vanishing mid-gesture. */}
      <AnimatePresence>
        {showLightbox && (
        <motion.div
          className="tw-fixed tw-inset-0 tw-bg-black/90 tw-backdrop-blur-sm tw-z-[1200] tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${currentImg.alt} — enlarged view`}
          onClick={() => setShowLightbox(false)}
          variants={reduceMotion ? withoutMotion(backdrop) : backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="tw-relative tw-max-w-4xl tw-w-full tw-max-h-[90vh] tw-flex tw-flex-col tw-items-center"
            onClick={(event) => event.stopPropagation()}
            variants={reduceMotion ? withoutMotion(modalPanel) : modalPanel}
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="tw-absolute -tw-top-10 tw-right-0 tw-text-white hover:tw-text-[#ffb3ac] tw-text-sm tw-font-bold tw-bg-black/40 tw-px-3 tw-py-1 tw-rounded-full tw-border tw-border-solid tw-border-white/20 tw-cursor-pointer"
            >
              ✕ Close
            </button>

            <motion.img
              key={currentImg.src}
              src={currentImg.src}
              alt={currentImg.alt}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition(DURATION.fast)}
              className="tw-max-h-[80vh] tw-w-auto tw-object-contain tw-rounded tw-border tw-border-solid tw-border-white/10 tw-bg-white tw-p-2 tw-shadow-2xl"
            />

            <p className="tw-text-white tw-text-xs tw-mt-3 tw-mb-0 tw-bg-black/60 tw-px-4 tw-py-1.5 tw-rounded-full tw-font-medium tw-text-center">
              {currentImg.caption} — high-resolution inspection view
            </p>

            {images.length > 1 && (
              <div className="tw-flex tw-gap-2 tw-mt-4 tw-flex-wrap tw-justify-center">
                {images.map((img, idx) => (
                  <button
                    key={`lightbox-${img.src}-${idx}`}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    aria-label={`Show image ${idx + 1}`}
                    className={`tw-w-12 tw-h-12 tw-p-0 tw-rounded tw-border-2 tw-border-solid tw-overflow-hidden tw-cursor-pointer ${
                      selectedIndex === idx
                        ? "tw-border-[#ffb3ac]"
                        : "tw-border-white/30 tw-opacity-60"
                    }`}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="tw-w-full tw-h-full tw-object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductGallery;
