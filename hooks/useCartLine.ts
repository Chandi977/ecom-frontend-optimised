import { useEffect, useState } from "react";

import { getCart } from "../utils/cart";

/**
 * Shared, cached view of "what is currently in the cart", keyed by product id.
 *
 * Product cards need this to decide between the add-to-cart button and the
 * quantity stepper, so the lookup is deliberately a single fetch shared by
 * every subscriber rather than one request per card. The snapshot is
 * invalidated by the same `cartUpdated` event the Navbar listens to.
 */

export type CartLine = {
  productId: string;
  quantity: number;
  packSize?: number;
};

type CartLines = Map<string, CartLine>;

let snapshot: CartLines | null = null;
let inFlight: Promise<CartLines> | null = null;
let requestVersion = 0;
const subscribers = new Set<() => void>();

const getLineProductId = (line: any) => {
  const raw = line?.product;
  if (raw && typeof raw === "object") {
    return raw?._id || raw?.id || "";
  }
  return raw || "";
};

const readCartLines = async (): Promise<CartLines> => {
  const cart = await getCart();
  const lines: CartLines = new Map();

  (Array.isArray(cart?.products) ? cart.products : []).forEach((line: any) => {
    const productId = String(getLineProductId(line) || "");
    if (!productId) return;
    lines.set(productId, {
      productId,
      quantity: Number(line?.quantity) || 1,
      packSize: Number(line?.packSize) || undefined,
    });
  });

  return lines;
};

const notify = () => subscribers.forEach((callback) => callback());

const refreshCartLines = (invalidate = false) => {
  if (inFlight && !invalidate) return inFlight;
  const version = ++requestVersion;
  inFlight = readCartLines()
    .then((lines) => {
      if (version !== requestVersion) return lines;
      snapshot = lines;
      inFlight = null;
      notify();
      return lines;
    })
    .catch(() => {
      if (version === requestVersion) inFlight = null;
      return snapshot || new Map();
    });
  return inFlight;
};

const onCartUpdated = () => {
  refreshCartLines(true);
};

/**
 * Returns the cart line for a product, or null when it is not in the cart.
 * Always null on the first render (server and client alike) so hydration
 * matches; the real value arrives once the cart has been read.
 */
export function useCartLine(productId?: string | null): CartLine | null {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const onChange = () => forceRender((count) => count + 1);
    const isFirstSubscriber = subscribers.size === 0;
    subscribers.add(onChange);

    // Cart changes can happen while all product cards are unmounted (for
    // example on the cart page). Revalidate when returning to the listing.
    if (isFirstSubscriber) {
      window.addEventListener("cartUpdated", onCartUpdated);
      refreshCartLines();
    }

    return () => {
      subscribers.delete(onChange);
      if (subscribers.size === 0) {
        window.removeEventListener("cartUpdated", onCartUpdated);
        // Discard any read started before the next listing visit.
        requestVersion++;
        inFlight = null;
      }
    };
  }, []);

  if (!productId) return null;
  return snapshot?.get(String(productId)) || null;
}

export default useCartLine;
