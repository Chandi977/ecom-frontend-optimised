/**
 * Fly-to-cart animation.
 *
 * A product image is cloned, pinned to the viewport and animated along an arc
 * into whichever cart icon is currently on screen. The Navbar registers its
 * icons via `registerCartTarget` and listens for CART_FLY_ARRIVED_EVENT so the
 * badge only pops once the clone actually lands.
 *
 * Every exit path (no target, reduced motion, unsupported browser, cancelled
 * animation) still announces arrival, so callers never have to special-case it.
 */

export const CART_FLY_ARRIVED_EVENT = "cartFlyArrived";

const FLIGHT_DURATION = 750;
const SAFETY_MARGIN = 1500;

const cartTargets = new Set<HTMLElement>();
let activeFlights = 0;

const isVisible = (element: HTMLElement) => {
  if (!element.isConnected) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/**
 * Registers a cart icon as a flight destination. Both the desktop and the
 * mobile header register one; the topmost visible target wins at flight time.
 * Returns an unregister function for use in a `useEffect` cleanup.
 */
export const registerCartTarget = (element: HTMLElement | null) => {
  if (!element) return () => {};
  cartTargets.add(element);
  return () => {
    cartTargets.delete(element);
  };
};

const getCartTarget = (): HTMLElement | null => {
  let target: HTMLElement | null = null;
  let topMost = Number.POSITIVE_INFINITY;

  cartTargets.forEach((element) => {
    if (!isVisible(element)) return;
    const { top } = element.getBoundingClientRect();
    if (top < topMost) {
      topMost = top;
      target = element;
    }
  });

  return target;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const announceArrival = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_FLY_ARRIVED_EVENT));
};

/**
 * True while at least one clone is still in the air. The Navbar uses this to
 * hold the badge count back until the image lands instead of bumping it the
 * instant `cartUpdated` fires.
 */
export const hasCartFlightInProgress = () => activeFlights > 0;

const buildClone = (source: HTMLElement, bounds: DOMRect) => {
  const clone = source.cloneNode(true) as HTMLElement;

  // Duplicated ids would break any `getElementById` / label lookup on the page.
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.setAttribute("aria-hidden", "true");

  Object.assign(clone.style, {
    position: "fixed",
    top: `${bounds.top}px`,
    left: `${bounds.left}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    margin: "0",
    padding: getComputedStyle(source).padding,
    zIndex: "9999",
    pointerEvents: "none",
    overflow: "hidden",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
    transformOrigin: "center",
  } as Partial<CSSStyleDeclaration>);

  return clone;
};

/**
 * Sends a clone of `source` into the cart icon. Resolves immediately — the
 * caller should not await the landing; listen for CART_FLY_ARRIVED_EVENT
 * instead. Returns whether an animation actually started.
 */
export const flyToCart = (source?: HTMLElement | null): boolean => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const target = getCartTarget();

  if (
    !source ||
    !source.isConnected ||
    !target ||
    prefersReducedMotion() ||
    typeof source.animate !== "function"
  ) {
    announceArrival();
    return false;
  }

  const sourceBounds = source.getBoundingClientRect();
  const targetBounds = target.getBoundingClientRect();

  if (sourceBounds.width === 0 || sourceBounds.height === 0) {
    announceArrival();
    return false;
  }

  const clone = buildClone(source, sourceBounds);
  document.body.appendChild(clone);

  const destinationX =
    targetBounds.left +
    targetBounds.width / 2 -
    (sourceBounds.left + sourceBounds.width / 2);
  const destinationY =
    targetBounds.top +
    targetBounds.height / 2 -
    (sourceBounds.top + sourceBounds.height / 2);

  activeFlights += 1;
  let settled = false;

  const land = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(safetyTimer);
    activeFlights = Math.max(0, activeFlights - 1);
    clone.remove();
    announceArrival();
  };

  // Backgrounded tabs can throttle rAF hard enough that `onfinish` never
  // arrives; make sure the clone can never be stranded on the page.
  const safetyTimer = window.setTimeout(land, FLIGHT_DURATION + SAFETY_MARGIN);

  const animation = clone.animate(
    [
      {
        transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
        opacity: 1,
        offset: 0,
      },
      {
        transform: `translate3d(${destinationX * 0.45}px, ${
          destinationY * 0.15 - 80
        }px, 0) scale(0.6) rotate(-8deg)`,
        opacity: 0.95,
        offset: 0.45,
      },
      {
        transform: `translate3d(${destinationX}px, ${destinationY}px, 0) scale(0.08) rotate(12deg)`,
        opacity: 0.15,
        offset: 1,
      },
    ],
    {
      duration: FLIGHT_DURATION,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "forwards",
    },
  );

  animation.onfinish = land;
  animation.oncancel = land;

  return true;
};

/**
 * Resolves the element to fly from. Accepts a ref, a resolver that receives the
 * clicked button (handy for mapped lists where a per-row ref is awkward), or
 * nothing at all — in which case the add still animates the cart badge.
 */
export type FlySource =
  | { current: HTMLElement | null }
  | ((button: HTMLElement) => HTMLElement | null | undefined)
  | null
  | undefined;

export const resolveFlySource = (
  source: FlySource,
  button: HTMLElement,
): HTMLElement | null => {
  if (!source) return null;
  if (typeof source === "function") return source(button) || null;
  return source.current;
};
