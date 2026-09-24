import React, { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

import { DURATION, EASE_OUT, staggerDelay } from "../utils/motion";

const cssEase = `cubic-bezier(${EASE_OUT.join(",")})`;

type Options = {
  /** Travel distance in px before settling. */
  distance?: number;
  /** Fraction of the element on screen before it plays (0–1). */
  amount?: number;
  /** Position in a staggered group — converted to a capped delay. */
  index?: number;
};

/**
 * Scroll reveal for elements that must stay plain DOM nodes.
 *
 * The {@link Reveal} component is the usual way to do this, but it renders a
 * framer `motion` component — and the product cards style themselves with
 * styled-jsx, whose scoped class is applied to the real `<article>` element.
 * Swapping that element for a motion component, or wrapping it in one, risks
 * the card's entire stylesheet or its position in the parent grid.
 *
 * So this hook animates in place instead: it hands back a ref plus `style` and
 * `data-reveal` props to spread onto the existing element. The DOM shape does
 * not change at all, and the transition is plain CSS.
 *
 * `data-reveal` is what makes the no-JS and reduced-motion fallbacks work —
 * both _document.tsx and styles/globals.css force `[data-reveal]` visible with
 * `!important`, which outranks the inline styles set here.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>({
  distance = 22,
  amount = 0.15,
  index,
}: Options = {}) {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, amount });

  const delay = index !== undefined ? staggerDelay(index, 4) : 0;

  const style: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView || reduceMotion ? "none" : `translateY(${distance}px)`,
    transition: reduceMotion
      ? "opacity 1ms linear"
      : `opacity ${DURATION.entrance}s ${cssEase} ${delay}s, transform ${DURATION.entrance}s ${cssEase} ${delay}s`,
    willChange: inView ? undefined : "opacity, transform",
  };

  return {
    ref,
    revealProps: {
      style,
      "data-reveal": inView ? "shown" : "hidden",
    } as const,
  };
}

export default useRevealOnScroll;
