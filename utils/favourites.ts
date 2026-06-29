import { toast } from "react-toastify";
import { getService, postService } from "../services/service";
import { getPrimaryPriceTier } from "./productCatalog";

const GUEST_WISHLIST_KEY = "PIFav";
const REMOTE_WISHLIST_CACHE_PREFIX = "PIWishlistCache";
export const WISHLIST_UPDATED_EVENT = "wishlistUpdated";

let remoteWishlistRequest: Promise<Array<Record<string, unknown>>> | null = null;

const isBrowser = () => typeof window !== "undefined";

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const getToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem("PIToken");
};

const getUser = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeParse(localStorage.getItem("PIUser"), null);
};

const getUserId = () => getUser()?._id || null;

const getRemoteCacheKey = (userId = getUserId()) => {
  if (!userId) {
    return null;
  }

  return `${REMOTE_WISHLIST_CACHE_PREFIX}:${userId}`;
};

const getProductId = (wishlistItem) => {
  const product = wishlistItem?.product;

  if (product && typeof product === "object") {
    return String(product._id || product.id || "");
  }

  return String(product || "");
};

const normalizeWishlistItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => !!getProductId(item));
};

const readGuestWishlist = () => {
  if (!isBrowser()) {
    return [];
  }

  return normalizeWishlistItems(
    safeParse(localStorage.getItem(GUEST_WISHLIST_KEY), []),
  );
};

const writeGuestWishlist = (items) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    GUEST_WISHLIST_KEY,
    JSON.stringify(normalizeWishlistItems(items)),
  );
};

const readRemoteWishlistCache = (userId = getUserId()) => {
  if (!isBrowser()) {
    return null;
  }

  const cacheKey = getRemoteCacheKey(userId);
  if (!cacheKey) {
    return null;
  }

  const raw = localStorage.getItem(cacheKey);
  if (!raw) {
    return null;
  }

  return normalizeWishlistItems(safeParse(raw, []));
};

const writeRemoteWishlistCache = (items, userId = getUserId()) => {
  if (!isBrowser()) {
    return;
  }

  const cacheKey = getRemoteCacheKey(userId);
  if (!cacheKey) {
    return;
  }

  localStorage.setItem(cacheKey, JSON.stringify(normalizeWishlistItems(items)));
};

const emitWishlistUpdated = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
};

const hasWishlistItem = (items, productId) => {
  const normalizedProductId = String(productId || "");
  return normalizeWishlistItems(items).some(
    (item) => getProductId(item) === normalizedProductId,
  );
};

const getDefaultWishlistPayload = (product) => {
  const priceOption = getPrimaryPriceTier(product);

  return {
    product: product?._id,
    quantity: 1,
    price: Number(priceOption.sellingPrice ?? product?.price ?? 0),
    discountPrice: 0,
    totalPackWeight: Number(priceOption.packWeight ?? 0),
    packSize: Number(priceOption.number ?? 1),
    brand:
      typeof product?.brand === "object"
        ? product?.brand?.name || ""
        : product?.brand || "",
    category:
      typeof product?.category === "object"
        ? product?.category?.name || ""
        : product?.category || "",
  };
};

const fetchRemoteWishlist = async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}) => {
  const userId = getUserId();
  if (!userId) {
    return [];
  }

  if (!forceRefresh) {
    const cachedWishlist = readRemoteWishlistCache(userId);
    if (cachedWishlist !== null) {
      return cachedWishlist;
    }

    if (remoteWishlistRequest) {
      return remoteWishlistRequest;
    }
  }

  const request = (async () => {
    const response = await getService(
      `wishlist/${userId}`,
      {},
      { silent: true, suppressErrorStatuses: [404] },
    );
    if (!response) {
      const cachedWishlist = readRemoteWishlistCache(userId);
      return cachedWishlist !== null ? cachedWishlist : [];
    }

    const wishlistItems = normalizeWishlistItems(
      response?.data?.data?.products || [],
    );
    writeRemoteWishlistCache(wishlistItems, userId);
    return wishlistItems;
  })();

  remoteWishlistRequest = request;

  try {
    return await request;
  } finally {
    if (remoteWishlistRequest === request) {
      remoteWishlistRequest = null;
    }
  }
};

export const clearWishlistCache = (userId = getUserId()) => {
  if (!isBrowser()) {
    return;
  }

  const cacheKey = getRemoteCacheKey(userId);
  if (cacheKey) {
    localStorage.removeItem(cacheKey);
  }

  remoteWishlistRequest = null;
  emitWishlistUpdated();
};

export const getFav = async (options: Record<string, any> = {}) => {
  if (!isBrowser()) {
    return [];
  }

  if (!getToken()) {
    return readGuestWishlist();
  }

  return fetchRemoteWishlist(options);
};

export const addToFav = async (product, options: Record<string, any> = {}) => {
  if (!isBrowser() || !product?._id) {
    return false;
  }

  const { silent = false } = options;

  if (!getToken()) {
    const guestWishlist = readGuestWishlist();
    if (hasWishlistItem(guestWishlist, product._id)) {
      if (!silent) {
        toast.info("Item is already in favourites.");
      }
      return true;
    }

    const updatedWishlist = [...guestWishlist, { product }];
    writeGuestWishlist(updatedWishlist);
    emitWishlistUpdated();

    if (!silent) {
      toast.success("Item added in favourites.");
    }
    return true;
  }

  const userId = getUserId();
  if (!userId) {
    return false;
  }

  const currentWishlist = await getFav();
  if (hasWishlistItem(currentWishlist, product._id)) {
    if (!silent) {
      toast.info("Item is already in favourites.");
    }
    return true;
  }

  const response = await postService(
    "AddtoWishlist",
    {
      product: getDefaultWishlistPayload(product),
      user: userId,
    },
    { silent: true, suppressErrorStatuses: [400] },
  );

  if (response?.data?.success) {
    const updatedWishlist = [...currentWishlist, { product }];
    writeRemoteWishlistCache(updatedWishlist, userId);
    emitWishlistUpdated();

    if (!silent) {
      toast.success("Item added in favourites.");
    }
    return true;
  }

  const refreshedWishlist = await getFav({ forceRefresh: true });
  if (hasWishlistItem(refreshedWishlist, product._id)) {
    if (!silent) {
      toast.info("Item is already in favourites.");
    }
    return true;
  }

  if (!silent) {
    toast.error("Failed to update favourites.");
  }
  return false;
};

export const removeFromFav = async (productId, options: Record<string, any> = {}) => {
  if (!isBrowser() || !productId) {
    return false;
  }

  const { silent = false } = options;
  const normalizedProductId = String(productId);

  if (!getToken()) {
    const guestWishlist = readGuestWishlist();
    const updatedWishlist = guestWishlist.filter(
      (item) => getProductId(item) !== normalizedProductId,
    );

    writeGuestWishlist(updatedWishlist);
    emitWishlistUpdated();
    return true;
  }

  const userId = getUserId();
  if (!userId) {
    return false;
  }

  const currentWishlist = await getFav();
  if (!hasWishlistItem(currentWishlist, normalizedProductId)) {
    writeRemoteWishlistCache(
      currentWishlist.filter((item) => getProductId(item) !== normalizedProductId),
      userId,
    );
    emitWishlistUpdated();
    return true;
  }

  const response = await postService(
    "removefromwishlist",
    {
      user: userId,
      product: normalizedProductId,
    },
    { silent: true, suppressErrorStatuses: [404] },
  );

  if (response?.data?.success) {
    const updatedWishlist = currentWishlist.filter(
      (item) => getProductId(item) !== normalizedProductId,
    );
    writeRemoteWishlistCache(updatedWishlist, userId);
    emitWishlistUpdated();
    return true;
  }

  const refreshedWishlist = await getFav({ forceRefresh: true });
  if (!hasWishlistItem(refreshedWishlist, normalizedProductId)) {
    writeRemoteWishlistCache(refreshedWishlist, userId);
    emitWishlistUpdated();
    return true;
  }

  if (!silent) {
    toast.error("Failed to update favourites.");
  }
  return false;
};

export const syncFavToServer = async () => {
  if (!isBrowser() || !getToken()) {
    return false;
  }

  const userId = getUserId();
  if (!userId) {
    return false;
  }

  const guestWishlist = readGuestWishlist();
  if (!guestWishlist.length) {
    await getFav({ forceRefresh: true });
    return true;
  }

  const remoteWishlist = await getFav({ forceRefresh: true });
  const remoteProductIds = new Set(remoteWishlist.map((item) => getProductId(item)));

  for (const wishlistItem of guestWishlist) {
    const product = wishlistItem?.product;
    const productId = getProductId(wishlistItem);

    if (!product?._id || remoteProductIds.has(productId)) {
      continue;
    }

    const response = await postService(
      "AddtoWishlist",
      {
        product: getDefaultWishlistPayload(product),
        user: userId,
      },
      { silent: true, suppressErrorStatuses: [400] },
    );

    if (response?.data?.success) {
      remoteProductIds.add(productId);
    }
  }

  const refreshedWishlist = await getFav({ forceRefresh: true });
  const refreshedProductIds = new Set(
    refreshedWishlist.map((item) => getProductId(item)),
  );

  if (
    guestWishlist.every((item) => refreshedProductIds.has(getProductId(item)))
  ) {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  }

  writeRemoteWishlistCache(refreshedWishlist, userId);
  emitWishlistUpdated();
  return true;
};
