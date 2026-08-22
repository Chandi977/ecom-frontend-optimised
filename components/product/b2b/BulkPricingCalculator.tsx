import React, { useMemo } from "react";
import { toast } from "react-toastify";

import AddToCartContent from "../../common/AddToCartContent";
import useAddToCart from "../../../hooks/useAddToCart";
import { addToCart } from "../../../utils/cart";
import {
  getAvailableStock,
  getDiscountPercent,
  getInventoryStatus,
  type NormalizedPriceTier,
} from "../../../utils/productCatalog";
import {
  FIELD_VISIBILITY_KEYS,
  isFieldVisible,
} from "../../../utils/fieldVisibility";
import { formatINR, unitMrpOf, unitPriceOf } from "./format";

interface BulkPricingCalculatorProps {
  product: Record<string, any>;
  productName: string;
  brandName: string;
  sku: string;
  tiers: NormalizedPriceTier[];
  selectedTier: NormalizedPriceTier;
  onTierChange: (tier: NormalizedPriceTier) => void;
  /** Number of packs of the selected tier. */
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRequestQuote?: () => void;
}

const formatProductNameWithSku = (name: string, skuStr?: string): string => {
  if (!name) return skuStr ? `SKU: ${skuStr}` : "";
  const capitalized = name
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");

  if (!skuStr) return capitalized;
  if (capitalized.toLowerCase().includes(skuStr.toLowerCase())) {
    return capitalized;
  }
  return `${capitalized} ${skuStr}`;
};

const TRUST_BADGES = [
  { icon: "verified", line1: "ISO 9001:2015", line2: "CERTIFIED" },
  { icon: "local_shipping", line1: "PAN-INDIA", line2: "DISPATCH" },
  { icon: "payments", line1: "BULK CREDIT", line2: "AVAILABLE" },
];

/**
 * Right-hand column of the product hero: identity, tiered bulk pricing, the
 * pack/quantity estimator and the two order CTAs.
 */
export const BulkPricingCalculator: React.FC<BulkPricingCalculatorProps> = ({
  product,
  productName,
  brandName,
  sku,
  tiers,
  selectedTier,
  onTierChange,
  quantity,
  onQuantityChange,
  onRequestQuote,
}) => {
  const unitPrice = unitPriceOf(selectedTier);
  const unitMrp = unitMrpOf(selectedTier);
  const discountPercent = getDiscountPercent(
    selectedTier.sellingPrice,
    selectedTier.mrp,
  );
  const packSize = selectedTier.number || 1;
  const totalUnits = packSize * quantity;
  const orderTotal = selectedTier.sellingPrice * quantity;

  const availableStock = getAvailableStock(product);
  const stockStatus = getInventoryStatus(product);
  const outOfStock = stockStatus === "out-of-stock";

  const showMrp = isFieldVisible(product, FIELD_VISIBILITY_KEYS.priceMrp);
  const showSavings = isFieldVisible(product, FIELD_VISIBILITY_KEYS.priceSavings);
  const showPackWeight = isFieldVisible(
    product,
    FIELD_VISIBILITY_KEYS.pricePackWeight,
  );

  const ratingAverage = Number(product?.ratingAverage) || 0;
  const ratingCount = Number(product?.ratingCount) || 0;

  const stars = useMemo(() => {
    return [1, 2, 3, 4, 5].map((position) => {
      if (ratingAverage >= position) return "star";
      if (ratingAverage >= position - 0.5) return "star_half";
      return "star_outline";
    });
  }, [ratingAverage]);

  const { state: addToCartState, buttonProps } = useAddToCart({
    onAdd: async () => {
      if (outOfStock) {
        toast.error("This product is currently out of stock.");
        return false;
      }
      const added = await addToCart(
        product,
        quantity,
        selectedTier.sellingPrice,
        selectedTier.packWeight || 0,
        packSize,
        packSize,
        product?.brand?._id || product?.brand,
        product?.category,
        selectedTier.stockQuantity ?? availableStock,
      );
      if (!added) {
        toast.error("Could not add this item to your order.");
        return false;
      }
      return true;
    },
  });

  const stepQuantity = (delta: number) => {
    onQuantityChange(Math.max(1, quantity + delta));
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3.5 sm:tw-gap-4">
      {/* Identity Header */}
      <div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-1.5 tw-flex-wrap">
          <span className="tw-text-[#64748b] tw-text-[11px] tw-font-bold tw-tracking-widest tw-uppercase">
            BRAND: <span className="tw-text-[#0f172a] tw-font-bold">{brandName}</span>
          </span>
          <span className="tw-text-[#64748b] tw-text-[11px] tw-font-semibold tw-tracking-widest">
            SKU: {sku}
          </span>
        </div>

        <h1 className="tw-text-xl sm:tw-text-2xl tw-font-bold tw-leading-tight tw-text-[#0f172a] tw-mb-2 tw-tracking-tight">
          {formatProductNameWithSku(productName, sku)}
        </h1>

        <div className="tw-flex tw-items-center tw-gap-2.5 tw-flex-wrap">
          {ratingCount > 0 ? (
            <>
              <span className="tw-flex tw-text-amber-500" aria-hidden="true">
                {stars.map((glyph, idx) => (
                  <span
                    key={idx}
                    className={`material-symbols-outlined tw-text-sm ${
                      glyph === "star_outline" ? "" : "b2b-icon-fill"
                    }`}
                  >
                    {glyph === "star_outline" ? "star" : glyph}
                  </span>
                ))}
              </span>
              <span className="tw-text-[#475569] tw-text-xs tw-font-medium">
                ({ratingAverage.toFixed(1)}/5) · {ratingCount}{" "}
                {ratingCount === 1 ? "review" : "reviews"}
              </span>
            </>
          ) : (
            <a
              href="#reviews"
              className="tw-text-[#64748b] tw-text-xs tw-font-medium hover:tw-text-[#0f172a] tw-transition-colors"
            >
              No reviews yet — be the first to review
            </a>
          )}
        </div>
      </div>

      {/* Main Pricing Box */}
      <div className="tw-bg-white tw-p-4 tw-border tw-border-solid tw-border-[#e2e8f0] tw-rounded-xl tw-shadow-sm">
        <div className="tw-flex tw-items-baseline tw-gap-2 tw-mb-1 tw-flex-wrap">
          <span className="tw-text-[#0f172a] tw-text-2xl sm:tw-text-3xl tw-font-bold">
            {formatINR(unitPrice)}
          </span>
          <span className="tw-text-[#64748b] tw-text-xs sm:tw-text-sm tw-font-medium">/ unit</span>
          {showMrp && unitMrp > unitPrice && (
            <span className="tw-text-[#94a3b8] tw-text-xs sm:tw-text-sm tw-line-through tw-font-medium">
              {formatINR(unitMrp)}
            </span>
          )}
          {showSavings && discountPercent > 0 && (
            <span className="tw-ml-auto tw-text-green-700 tw-font-bold tw-text-[10px] tw-tracking-widest tw-bg-green-50 tw-border tw-border-solid tw-border-green-200 tw-px-2 tw-py-0.5 tw-rounded">
              SAVE {discountPercent}%
            </span>
          )}
        </div>

        <p className="tw-text-[#64748b] tw-text-xs tw-font-medium tw-mb-3">
          {formatINR(selectedTier.sellingPrice)} per pack of {packSize}
        </p>

        <p className="tw-text-[#475569] tw-text-[11px] tw-mb-2 tw-font-bold tw-uppercase tw-tracking-wider">
          BULK PRICING TIERS
        </p>

        <div className="tw-mb-3.5">
          {tiers.length > 0 ? (
            <div className="tw-relative">
              <select
                value={selectedTier.number}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  const matched = tiers.find((t) => t.number === num);
                  if (matched) onTierChange(matched);
                }}
                aria-label="Select bulk pricing tier"
                className="tw-w-full tw-h-10 sm:tw-h-11 tw-pl-3 tw-pr-9 tw-bg-slate-50 tw-border tw-border-solid tw-border-[#cbd5e1] hover:tw-border-[#0f172a] tw-rounded-lg tw-text-[#0f172a] tw-text-xs sm:tw-text-sm tw-font-semibold focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-[#0f172a] tw-cursor-pointer tw-appearance-none tw-transition-colors"
              >
                {tiers.map((tier, idx) => (
                  <option
                    key={`${tier.number}-${idx}`}
                    value={tier.number}
                    className="tw-bg-white tw-text-[#0f172a] tw-font-medium tw-py-1"
                  >
                    Pack of {tier.number} — {formatINR(unitPriceOf(tier))} / unit
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined tw-absolute tw-right-2.5 tw-top-1/2 -tw-translate-y-1/2 tw-text-[#0f172a] tw-pointer-events-none tw-text-xl">
                arrow_drop_down
              </span>
            </div>
          ) : (
            <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-px-3 tw-rounded-lg tw-border tw-border-solid tw-border-[#e2e8f0] tw-bg-slate-50 tw-text-xs tw-text-[#64748b]">
              <span>Pricing on request</span>
              <span>Request a quote</span>
            </div>
          )}
        </div>

        {/* Quantity Estimator & Order CTA */}
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
            <div className="tw-flex tw-items-center tw-border tw-border-solid tw-border-[#e2e8f0] tw-rounded-lg tw-overflow-hidden tw-h-10 sm:tw-h-10.5 tw-bg-slate-50">
              <button
                type="button"
                onClick={() => stepQuantity(-1)}
                aria-label="Decrease pack quantity"
                className="tw-px-3 tw-h-full tw-bg-transparent tw-border-0 tw-text-[#64748b] hover:tw-bg-slate-200 hover:tw-text-[#0f172a] tw-transition-colors tw-cursor-pointer material-symbols-outlined tw-text-lg"
              >
                remove
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) =>
                  onQuantityChange(
                    Math.max(1, parseInt(event.target.value, 10) || 1),
                  )
                }
                aria-label="Number of packs"
                className="tw-w-12 sm:tw-w-14 tw-h-full tw-text-center tw-bg-transparent tw-border-0 tw-text-[#0f172a] focus:tw-outline-none tw-text-xs sm:tw-text-sm tw-font-bold"
              />
              <button
                type="button"
                onClick={() => stepQuantity(1)}
                aria-label="Increase pack quantity"
                className="tw-px-3 tw-h-full tw-bg-transparent tw-border-0 tw-text-[#64748b] hover:tw-bg-slate-200 hover:tw-text-[#0f172a] tw-transition-colors tw-cursor-pointer material-symbols-outlined tw-text-lg"
              >
                add
              </button>
            </div>

            <div className="tw-flex tw-flex-col tw-text-[11px] sm:tw-text-xs tw-text-[#64748b]">
              <span className="tw-font-medium">
                {quantity} {quantity === 1 ? "pack" : "packs"} ·{" "}
                {totalUnits.toLocaleString("en-IN")} units
              </span>
              <span className="tw-text-[#0f172a] tw-text-sm sm:tw-text-base tw-font-bold">
                {formatINR(orderTotal)}
              </span>
            </div>
          </div>

          <button
            {...buttonProps}
            type="button"
            disabled={outOfStock}
            className={`tw-w-full tw-h-10.5 sm:tw-h-11 tw-rounded-lg tw-text-[11px] sm:tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-transition-all tw-flex tw-items-center tw-justify-center tw-gap-2 ${
              outOfStock
                ? "tw-bg-slate-100 tw-text-slate-500 tw-border tw-border-solid tw-border-slate-200 tw-cursor-not-allowed"
                : "tw-bg-[#0f172a] tw-text-white hover:tw-bg-slate-800 tw-cursor-pointer tw-shadow-sm tw-border-0"
            }`}
          >
            <AddToCartContent
              state={addToCartState}
              icon={false}
              idleLabel={
                <>
                  <span className="material-symbols-outlined tw-text-base">
                    {outOfStock ? "remove_shopping_cart" : "shopping_cart"}
                  </span>
                  {outOfStock ? "OUT OF STOCK" : "ADD TO BULK ORDER"}
                </>
              }
            />
          </button>
        </div>

        {/* Stock & Pack Weight info */}
        <div className="tw-mt-3 tw-flex tw-items-center tw-gap-3.5 tw-flex-wrap tw-text-xs">
          <span
            className={outOfStock ? "tw-text-red-600 tw-font-semibold" : "tw-text-emerald-700 tw-font-semibold"}
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {outOfStock
              ? "Out of stock"
              : stockStatus === "low-stock"
                ? `Low stock — ${availableStock.toLocaleString("en-IN")} left`
                : `${availableStock.toLocaleString("en-IN")} units available`}
          </span>
          {showPackWeight && selectedTier.packWeight !== undefined && (
            <span className="tw-text-slate-500 tw-font-medium">
              Pack weight: {selectedTier.packWeight} kg
            </span>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="tw-grid tw-grid-cols-3 tw-gap-2">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.icon}
            className="tw-flex tw-flex-col tw-items-center tw-p-2 tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-bg-slate-50 tw-text-center"
          >
            <span className="material-symbols-outlined tw-text-slate-800 tw-mb-0.5 tw-text-lg">
              {badge.icon}
            </span>
            <span className="tw-text-[9px] sm:tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-tight tw-text-slate-700 tw-tracking-wider">
              {badge.line1}
              <br />
              {badge.line2}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkPricingCalculator;
