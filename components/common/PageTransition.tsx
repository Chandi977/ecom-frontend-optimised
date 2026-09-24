import React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { DURATION, EASE_OUT } from "../../utils/motion";

/**
 * Fades and lifts each page as it mounts, so navigating between the storefront
 * routes reads as one surface changing rather than a hard cut.
 *
 * Deliberately enter-only. Wrapping routes in `AnimatePresence mode="wait"`
 * would hold the incoming page back until the outgoing one finished animating,
 * which on a shopping flow means every click costs an extra ~200ms for no
 * information gained. Re-keying on the path remounts the subtree and plays the
 * entrance immediately instead, so navigation stays as fast as it was.
 *
 * The wrapper is `flow-root` rather than a bare block: it reproduces the flex
 * item the page root used to be (full width, no margin collapse through it),
 * so adding this to _app.tsx does not move any existing page's layout.
 */
export default function PageTransition({
  routeKey,
  children,
}: {
  /** Pass `router.asPath`; it is normalised below. */
  routeKey: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  // Query and hash are stripped before the key is used, because re-keying
  // remounts the page and that must only happen on a real navigation:
  //   /packpro -> /packpro?segment=tapes  is a filter, not a new page. Keying
  //     on the raw asPath would tear down the catalog and lose its state.
  //   /        -> /#categories            is an in-page anchor. Same problem,
  //     plus the page would visibly flash on a jump link.
  // Two different products (/box-a -> /box-b) still differ here, so genuine
  // navigation keeps its entrance.
  const pathOnly = routeKey.split(/[?#]/)[0];

  return (
    <motion.div
      key={pathOnly}
      style={{ display: "flow-root", width: "100%" }}
      // This wrapper server-renders at opacity 0, which means every page on
      // the site depends on JS running to become visible. data-reveal opts it
      // into the two `!important` safety nets that already exist for exactly
      // this — the noscript rule in _document.tsx and the reduced-motion block
      // in globals.css. Without it, a failed hydration blanks the whole store.
      data-reveal="hidden"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.01 : DURATION.medium,
        ease: EASE_OUT,
      }}
    >
      {children}
    </motion.div>
  );
}
