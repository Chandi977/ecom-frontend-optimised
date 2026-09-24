import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  flyToCart,
  resolveFlySource,
  type FlySource,
} from "../utils/flyToCart";

export type AddToCartState = "idle" | "adding" | "added";

type UseAddToCartOptions = {
  /** Performs the real add. Returning `false` sends the button back to idle. */
  onAdd: (event: React.MouseEvent<any>) => unknown | Promise<unknown>;
  /** Element cloned for the flight — usually the product image wrapper. */
  flySource?: FlySource;
  /** How long the "Added" confirmation stays up before resetting. */
  addedDuration?: number;
  /** Floor for the "Adding" state so the spinner never flashes on a fast add. */
  minAddingDuration?: number;
  /** Background used while the confirmation shows. */
  addedColor?: string;
  /** Merged into the button style after the layout properties the layers need. */
  style?: React.CSSProperties;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    window.setTimeout(resolve, ms);
  });

/**
 * Drives the three-state add-to-cart button (idle → adding → added) and fires
 * the fly-to-cart animation on click. Render {@link AddToCartContent} inside
 * the button so the states have something to cross-fade.
 *
 * The button element itself stays with the caller, so its existing styled-jsx
 * or Tailwind classes keep applying.
 */
export function useAddToCart({
  onAdd,
  flySource,
  addedDuration = 1300,
  minAddingDuration = 450,
  addedColor = "#17803d",
  style,
}: UseAddToCartOptions) {
  const [state, setState] = useState<AddToCartState>("idle");
  const stateRef = useRef<AddToCartState>("idle");
  const mountedRef = useRef(true);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const moveTo = useCallback((next: AddToCartState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const handleClick = useCallback(
    async (event: React.MouseEvent<any>) => {
      if (stateRef.current !== "idle") return;

      event.stopPropagation();

      // `currentTarget` is cleared once React finishes dispatching, so grab the
      // element before the first await.
      const button = event.currentTarget as HTMLElement;
      const startedAt = Date.now();

      moveTo("adding");
      flyToCart(resolveFlySource(flySource, button));

      let succeeded = true;
      try {
        succeeded = (await onAdd(event)) !== false;
      } catch (error) {
        succeeded = false;
      }

      await wait(minAddingDuration - (Date.now() - startedAt));
      if (!mountedRef.current) return;

      if (!succeeded) {
        moveTo("idle");
        return;
      }

      moveTo("added");
      resetTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        moveTo("idle");
      }, addedDuration);
    },
    [addedDuration, flySource, minAddingDuration, moveTo, onAdd],
  );

  return {
    state,
    isBusy: state !== "idle",
    buttonProps: {
      onClick: handleClick,
      "data-atc-state": state,
      "aria-busy": state === "adding",
      style: {
        position: "relative" as const,
        overflow: "hidden" as const,
        ...style,
        ...(state === "added" ? { backgroundColor: addedColor } : null),
      },
    },
  };
}

export default useAddToCart;
