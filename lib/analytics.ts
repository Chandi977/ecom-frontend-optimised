/**
 * Customer-behavior analytics for the storefront.
 *
 * Architecture: the app pushes a standardized event onto `window.dataLayer`. Google Tag
 * Manager (already loaded in pages/_app.tsx, container GTM-MSJXBZMT) routes these to
 * Mixpanel (and/or GA4) — configured inside the GTM container UI, so no SDK is bundled here.
 *
 * High-value intent events (search, product view) are ALSO posted to our own backend so the
 * admin "Demand Signals" panel can show what to stock/feature without depending on a
 * third-party analytics API.
 *
 * Consent: nothing is sent unless the user has analytics consent. Wire `setAnalyticsConsent`
 * to your cookie banner, and to the logged-in user's privacyPreferences.usageAnalytics.
 */
import { postService } from "../services/service";

const CONSENT_KEY = "analytics_consent";

type Props = Record<string, unknown>;

const getDataLayer = (): unknown[] | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
};

/** Returns false only when the user has explicitly opted out. */
export const hasAnalyticsConsent = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONSENT_KEY) !== "denied";
};

export const setAnalyticsConsent = (granted: boolean): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
};

/** Push a standardized event to the GTM dataLayer (→ Mixpanel/GA4). */
export const track = (event: string, props: Props = {}): void => {
  if (!hasAnalyticsConsent()) return;
  const dl = getDataLayer();
  if (!dl) return;
  dl.push({ event, ...props });
};

/** Associate subsequent events with a known user (call on login). */
export const identify = (userId: string, traits: Props = {}): void => {
  if (!hasAnalyticsConsent() || !userId) return;
  const dl = getDataLayer();
  if (!dl) return;
  dl.push({ event: "identify", user_id: userId, ...traits });
};

// Standard ecommerce event names — keep these stable so GTM/Mixpanel triggers don't break.
export const EVENTS = {
  PRODUCT_VIEWED: "product_viewed",
  PRODUCT_LIST_VIEWED: "product_list_viewed",
  SEARCH: "search",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  VIEW_CART: "view_cart",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
  WISHLIST_ADD: "wishlist_add",
  CATEGORY_VIEWED: "category_viewed",
} as const;

const postSignal = (url: string, body: Props): void => {
  // Fire-and-forget; never block or surface errors in the customer flow.
  void postService(url, { ...body, source: "web" }, { silent: true });
};

/** Track a search: to Mixpanel (via dataLayer) AND our demand-signals backend. */
export const trackSearch = (query: string, resultsCount: number): void => {
  const q = (query || "").trim();
  if (!q) return;
  track(EVENTS.SEARCH, { query: q, results_count: resultsCount, zero_results: resultsCount === 0 });
  if (hasAnalyticsConsent()) postSignal("demand/track/search", { query: q, resultsCount });
};

/** Track a product view: to Mixpanel (via dataLayer) AND our demand-signals backend. */
export const trackProductView = (product: {
  id: string;
  name?: string;
  category?: string;
  subcategory?: string;
  price?: number;
}): void => {
  if (!product?.id) return;
  track(EVENTS.PRODUCT_VIEWED, {
    product_id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory,
    price: product.price,
  });
  if (hasAnalyticsConsent()) {
    postSignal("demand/track/view", {
      productId: product.id,
      productName: product.name,
      category: product.category,
    });
  }
};
