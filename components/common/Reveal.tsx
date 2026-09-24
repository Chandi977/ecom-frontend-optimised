import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

import { DURATION, EASE_OUT, staggerDelay } from "../../utils/motion";

type From = "bottom" | "left" | "right" | "none";

/** Tags the reveal can render as, so it can sit inside grids and lists
 *  without an extra div changing the layout. */
type Tag = "div" | "section" | "article" | "li" | "span" | "ul";

type RevealOwnProps = {
  children: React.ReactNode;
  /** Edge the content travels in from. "none" fades in place. */
  from?: From;
  /** Seconds before this element starts. Prefer `index` for grids. */
  delay?: number;
  /**
   * Position in a staggered group. Converted to a delay via
   * {@link staggerDelay}, which caps how far the ramp can run so late items
   * in a long grid don't sit invisible waiting their turn.
   */
  index?: number;
  duration?: number;
  /** Travel distance in px. */
  distance?: number;
  /** Fraction of the element that must be on screen before it plays (0–1). */
  amount?: number;
  /** Scale the element starts at, for a subtle zoom-in (1 = plain fade). */
  scaleFrom?: number;
  /** Element to render. Defaults to a layout-neutral block div. */
  as?: Tag;
};

/**
 * Everything else — id, className, onClick, aria-* — is forwarded to the
 * rendered element, so a Reveal can stand in for the element it replaces
 * without the parent's CSS (`:nth-child`, `> p`) noticing the difference.
 */
type RevealProps = RevealOwnProps &
  Omit<React.HTMLAttributes<HTMLElement>, keyof RevealOwnProps>;

const offsetFor = (from: From, distance: number) => {
  switch (from) {
    case "left":
      return { x: -distance, y: 0 };
    case "right":
      return { x: distance, y: 0 };
    case "bottom":
      return { x: 0, y: distance };
    default:
      return { x: 0, y: 0 };
  }
};

/**
 * Fades content in the first time it scrolls into view.
 *
 * Wrap markup rather than replacing it — the wrapper is layout-neutral, so the
 * children keep their styled-jsx scoped classes and their place in whatever
 * grid or flex row they sit in. Use `as` when a plain div would break the
 * parent's layout (a grid child, a list item). While visible it carries
 * `data-reveal="shown"`, which page styles can hook into for follow-on effects.
 *
 * Timing comes from utils/motion.ts so reveals share the site's rhythm.
 *
 * Users who ask for reduced motion get a plain, instant fade with no travel —
 * and styles/globals.css force-shows `[data-reveal]` as a second safety net,
 * matching the existing noscript fallback in _document.tsx.
 */
export default function Reveal({
  children,
  from = "bottom",
  delay,
  index,
  duration = DURATION.entrance,
  distance = 28,
  amount = 0.2,
  scaleFrom = 1,
  as = "div",
  className,
  style,
  ...rest
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(false);

  const resolvedDelay =
    delay !== undefined ? delay : index !== undefined ? staggerDelay(index) : 0;

  const variants: Variants = {
    hidden: reduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: scaleFrom, ...offsetFor(from, distance) },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.01 : duration,
        delay: reduceMotion ? 0 : resolvedDelay,
        ease: EASE_OUT,
      },
    },
  };

  const MotionTag = (motion as any)[as] || motion.div;

  return (
    <MotionTag
      {...rest}
      className={className}
      style={style}
      data-reveal={shown ? "shown" : "hidden"}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      onViewportEnter={() => setShown(true)}
    >
      {children}
    </MotionTag>
  );
}
