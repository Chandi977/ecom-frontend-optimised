// Shared formatting for the dark B2B product page.
//
// The rest of the storefront prints ₹ with Indian digit grouping, so these keep
// the product page consistent with the cart and listing pages rather than using
// the "Rs 15" shape of `utils/productCatalog#formatCurrency`.

import type { NormalizedPriceTier } from "../../../utils/productCatalog";

export const formatINR = (value: unknown, fractionDigits = 2): string => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "₹0.00";
  return `₹${numberValue.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

/**
 * A price tier's `number` is its pack size and `sellingPrice` is the price of
 * the whole pack, so the per-unit rate the B2B buyer compares tiers on is
 * price ÷ pack size.
 */
export const unitPriceOf = (tier?: NormalizedPriceTier | null): number => {
  if (!tier) return 0;
  const packSize = tier.number || 1;
  return tier.sellingPrice / packSize;
};

export const unitMrpOf = (tier?: NormalizedPriceTier | null): number => {
  if (!tier) return 0;
  const packSize = tier.number || 1;
  return tier.mrp / packSize;
};
