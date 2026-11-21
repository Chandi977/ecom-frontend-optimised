import { useRef } from "react";
type Options = { distance?: number; amount?: number; index?: number };
/** Compatibility hook: catalog cards are visible immediately, including during SSR. */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>(_options: Options = {}) {
  const ref = useRef<T>(null);
  return { ref, revealProps: { "data-reveal": "shown" } as const };
}
export default useRevealOnScroll;
