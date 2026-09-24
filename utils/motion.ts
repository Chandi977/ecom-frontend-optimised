import type { Transition, Variants } from "framer-motion";

/**
 * Storefront motion tokens.
 *
 * Every animation on the site pulls its easing and duration from here so the
 * whole product moves with one rhythm. Before this existed the timings were
 * scattered across homepage.css and a dozen styled-jsx blocks (180ms / 200ms /
 * 250ms / 400ms / 500ms / 600ms, three different curves) and nothing felt
 * related. The CSS side of the same scale lives in styles/globals.css as
 * `--motion-*` custom properties — keep the two in sync when changing a value.
 *
 * Rules encoded here (Material motion + Apple HIG):
 *   - micro-interactions land in 150–300ms; nothing decorative runs past 600ms
 *   - exits run at ~65% of their entrance so dismissing feels responsive
 *   - only `transform` and `opacity` are animated, so nothing triggers layout
 */

/** Hover, colour and other in-place state changes. */
export const EASE_STANDARD: [number, number, number, number] = [0.4, 0, 0.2, 1];

/**
 * Entrances and lifts. Decelerates hard at the end, which is what makes a card
 * feel like it settles into place rather than sliding to a stop.
 */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Exits — accelerates away, the mirror of EASE_OUT. */
export const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

export const DURATION = {
  /** Press feedback — must land inside the 100ms perceived-instant budget. */
  instant: 0.12,
  /** Hover states, colour swaps, icon nudges. */
  fast: 0.18,
  /** Default for anything interactive. */
  base: 0.24,
  /** Content crossfades, tab panels, image swaps. */
  medium: 0.32,
  /** Modals and sheets arriving. */
  slow: 0.4,
  /** Scroll reveals — the one place a longer curve reads as intentional. */
  entrance: 0.55,
} as const;

/** Exits should feel quicker than entrances (Material motion). */
export const exitDuration = (enter: number) => Number((enter * 0.65).toFixed(3));

/** Gap between staggered siblings, in seconds. */
export const STAGGER_STEP = 0.06;

/**
 * Delay for the nth item in a staggered group.
 *
 * Capped deliberately: a 40-product grid staggered without a ceiling would
 * leave the last card waiting 2.4s, long after the user has scrolled past it.
 * After `max` items everything shares the final delay and arrives together.
 */
export const staggerDelay = (index: number, max = 8) =>
  Math.min(index, max) * STAGGER_STEP;

export const transition = (
  duration: number = DURATION.base,
  ease: [number, number, number, number] = EASE_STANDARD,
): Transition => ({ duration, ease });

// ── Shared variants ────────────────────────────────────────────────────────

/** Content arriving in place — used by tab panels and gallery image swaps. */
export const fadeSwap: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition(DURATION.medium, EASE_OUT),
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: transition(exitDuration(DURATION.medium), EASE_IN),
  },
};

/** Dimmed backdrop behind a modal, sheet or lightbox. */
export const backdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transition(DURATION.base) },
  exit: { opacity: 0, transition: transition(exitDuration(DURATION.base)) },
};

/**
 * Modal panel. Scales up from just under full size so it reads as arriving
 * from the page rather than dropping in from nowhere.
 */
export const modalPanel: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transition(DURATION.slow, EASE_OUT),
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: transition(exitDuration(DURATION.slow), EASE_IN),
  },
};

/** Route change — a short rise, deliberately subtle so navigation stays quick. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transition(DURATION.medium, EASE_OUT),
  },
  exit: {
    opacity: 0,
    transition: transition(exitDuration(DURATION.medium), EASE_IN),
  },
};

/**
 * Strips motion out of a variant set for `prefers-reduced-motion` users.
 *
 * Content still fades — a fade carries no vestibular risk and keeps the
 * appearance/disappearance legible — but every translate, scale and rotate is
 * dropped and the timing collapses. Pass the result straight to `variants`.
 */
export const withoutMotion = (variants: Variants): Variants => {
  const stripped: Variants = {};
  for (const [state, value] of Object.entries(variants)) {
    if (typeof value !== "object" || value === null) {
      stripped[state] = value;
      continue;
    }
    const { x, y, scale, rotate, transition: t, ...rest } = value as any;
    stripped[state] = {
      ...rest,
      transition: { ...(typeof t === "object" ? t : {}), duration: 0.01, delay: 0 },
    };
  }
  return stripped;
};
