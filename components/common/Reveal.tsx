import React from "react";
type Tag = "div" | "section" | "article" | "li" | "span" | "ul";
type RevealOwnProps = {
  children: React.ReactNode;
  as?: Tag;
  // Legacy presentation options accepted while callers migrate to plain markup.
  from?: "bottom" | "left" | "right" | "none";
  delay?: number;
  index?: number;
  duration?: number;
  distance?: number;
  amount?: number;
  scaleFrom?: number;
};
type RevealProps = RevealOwnProps & Omit<React.HTMLAttributes<HTMLElement>, keyof RevealOwnProps>;
/** Render content immediately without observers or entrance delays. */
export default function Reveal({ children, from, delay, index, duration, distance, amount, scaleFrom, as = "div", ...rest }: RevealProps) {
  return React.createElement(as, { ...rest, "data-reveal": "shown" }, children);
}
