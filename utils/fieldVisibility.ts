// Admin-controlled storefront field visibility.
//
// The product carries a `field_visibility` map (key -> boolean) saved from the
// admin panel. A missing key (or `true`) means the field is shown; only an
// explicit `false` hides it. This keeps every existing product fully visible
// until an admin deliberately turns something off.
//
// NOTE: this app and the admin dashboard are separate codebases with no shared
// package, so the FIELD_VISIBILITY_KEYS below MUST mirror the keys produced by
// `ecom-admin-dashboard/src/utils/fieldVisibility.js`. The `spec:` rows are
// dynamic (one per specification field) and use the raw spec key.

export const FIELD_VISIBILITY_KEYS = {
  sectionQuickOverview: "section:quick_overview",
  sectionSpecifications: "section:specifications",
  sectionProductDetails: "section:product_details",
  aboutItem: "field:about_item",
  noteGst: "note:gst",
  noteDelivery: "note:delivery",
  badgeFreeDelivery: "badge:free_delivery",
  badgeSecureTransaction: "badge:secure_transaction",
  badgeNoReturns: "badge:no_returns",
  badgeRecyclable: "badge:recyclable",
  priceMrp: "price:mrp",
  priceSavings: "price:savings",
  pricePackWeight: "price:pack_weight",
} as const;

export const specVisibilityKey = (specKey: string): string => `spec:${specKey}`;

const asVisibilityMap = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

// Resolves a field's visibility with a product → category → default priority
// (mirrors the GST resolver order). "Common" toggles (sections, notes, badges,
// about) are configured once on the category; per-product spec rows live on the
// product. A field is shown unless the nearest level explicitly stored `false`.
export const isFieldVisible = (
  product: Record<string, unknown> | undefined,
  key: string,
): boolean => {
  const productMap = asVisibilityMap(product?.field_visibility);
  if (productMap[key] !== undefined) return productMap[key] !== false;

  const category = product?.category;
  const categoryMap = asVisibilityMap(
    category && typeof category === "object"
      ? (category as Record<string, unknown>).field_visibility
      : undefined,
  );
  if (categoryMap[key] !== undefined) return categoryMap[key] !== false;

  return true;
};
