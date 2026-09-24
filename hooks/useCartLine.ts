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

const refreshCartLines = () => {
  if (!inFlight) {
    inFlight = readCartLines()
      .then((lines) => {
        snapshot = lines;
        inFlight = null;
        notify();
        return lines;
      })
      .catch(() => {
        inFlight = null;
        return snapshot || new Map();
      });
  }
  return inFlight;
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
    subscribers.add(onChange);

    const onCartUpdated = () => {
      refreshCartLines();
    };
    window.addEventListener("cartUpdated", onCartUpdated);

    // A later mount (infinite scroll, client-side nav) reads the existing
    // snapshot during its first render, so only the first one needs a fetch.
    if (!snapshot) {
      refreshCartLines();
    }

    return () => {
      subscribers.delete(onChange);
      window.removeEventListener("cartUpdated", onCartUpdated);
    };
  }, []);

  if (!productId) return null;
  return snapshot?.get(String(productId)) || null;
}

export default useCartLine;
