import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  addToFav,
  getFav,
  removeFromFav,
  WISHLIST_UPDATED_EVENT,
} from "../utils/favourites";

type WishlistProduct = Record<string, any>;

interface WishlistContextValue {
  wishlistIds: Set<string>;
  pendingIds: Set<string>;
  toggleWishlist: (product: WishlistProduct) => Promise<boolean>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const productIdOf = (value: any): string => {
  const product = value?.product;
  if (product && typeof product === "object") {
    return String(product._id || product.id || "");
  }
  return String(product || value?._id || value?.id || "");
};

const idsFromWishlist = (items: any[]): Set<string> =>
  new Set((Array.isArray(items) ? items : []).map(productIdOf).filter(Boolean));

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const wishlistIdsRef = useRef(wishlistIds);
  const pendingIdsRef = useRef(pendingIds);

  useEffect(() => {
    wishlistIdsRef.current = wishlistIds;
  }, [wishlistIds]);

  const refreshWishlist = useCallback(async () => {
    const items = await getFav();
    const next = idsFromWishlist(items);
    wishlistIdsRef.current = next;
    setWishlistIds(next);
  }, []);

  useEffect(() => {
    void refreshWishlist();
    window.addEventListener(WISHLIST_UPDATED_EVENT, refreshWishlist);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, refreshWishlist);
    };
  }, [refreshWishlist]);

  const toggleWishlist = useCallback(async (product: WishlistProduct) => {
    const productId = productIdOf(product);
    if (!productId || pendingIdsRef.current.has(productId)) return false;

    const wasWishlisted = wishlistIdsRef.current.has(productId);
    const nextPending = new Set(pendingIdsRef.current).add(productId);
    const optimisticIds = new Set(wishlistIdsRef.current);
    if (wasWishlisted) optimisticIds.delete(productId);
    else optimisticIds.add(productId);

    pendingIdsRef.current = nextPending;
    wishlistIdsRef.current = optimisticIds;
    setPendingIds(nextPending);
    setWishlistIds(optimisticIds);

    try {
      const success = wasWishlisted
        ? await removeFromFav(productId, { silent: true })
        : await addToFav(product, { silent: true });

      if (!success) throw new Error("Wishlist update failed");
      toast.success(
        wasWishlisted ? "Removed from wishlist." : "Added to wishlist.",
      );
      return true;
    } catch {
      const rollbackIds = new Set(wishlistIdsRef.current);
      if (wasWishlisted) rollbackIds.add(productId);
      else rollbackIds.delete(productId);
      wishlistIdsRef.current = rollbackIds;
      setWishlistIds(rollbackIds);
      toast.error("Unable to update wishlist.");
      return false;
    } finally {
      const next = new Set(pendingIdsRef.current);
      next.delete(productId);
      pendingIdsRef.current = next;
      setPendingIds(next);
    }
  }, []);

  const value = useMemo(
    () => ({ wishlistIds, pendingIds, toggleWishlist }),
    [pendingIds, toggleWishlist, wishlistIds],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextValue => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
