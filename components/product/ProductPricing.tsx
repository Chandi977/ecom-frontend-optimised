import React from "react";
import type { IProduct } from "../../types/product";
import {
  formatCurrency,
  getDiscountPercent,
  getPriceTiers,
  getPrimaryPriceTier,
  type NormalizedPriceTier,
} from "../../utils/productCatalog";
import { isFieldVisible, FIELD_VISIBILITY_KEYS } from "../../utils/fieldVisibility";
import type { LabelVariantOption } from "../../utils/labelVariants";

interface ProductPricingProps {
  product?: IProduct;
  selectedNumber?: number;
  quantity?: number;
  showQuantity?: boolean;
  onTierChange?: (tier: NormalizedPriceTier) => void;
  onQuantityChange?: (quantity: number) => void;
  // Labels-per-roll variants (sibling products, e.g. CL_65x70_250/400/500).
  // When 2+ exist, a selector styled like Select Pack Size renders beside it;
  // picking one hands the variant back so the page can swap to that product.
  labelVariants?: LabelVariantOption[];
  onLabelVariantChange?: (variant: LabelVariantOption) => void;
}

export function ProductPricing({
  product,
  selectedNumber,
  quantity = 1,
  showQuantity = true,
  onTierChange,
  onQuantityChange,
  labelVariants,
  onLabelVariantChange,
}: ProductPricingProps) {
  const tiers = getPriceTiers(product);
  const selectedTier =
    tiers.find((tier) => tier.number === selectedNumber) ||
    tiers[0] ||
    getPrimaryPriceTier(product);
  const discountPercent = getDiscountPercent(selectedTier.sellingPrice, selectedTier.mrp);
  const savings = Math.max(
    0,
    (selectedTier.mrp - selectedTier.sellingPrice) * quantity,
  );

  const productRecord = product as Record<string, unknown> | undefined;
  const showMrp = isFieldVisible(productRecord, FIELD_VISIBILITY_KEYS.priceMrp);
  const showSavings = isFieldVisible(productRecord, FIELD_VISIBILITY_KEYS.priceSavings);
  const showPackWeight = isFieldVisible(productRecord, FIELD_VISIBILITY_KEYS.pricePackWeight);

  const hasDiscount = selectedTier.mrp > selectedTier.sellingPrice;
  const originalMrp = Math.round(selectedTier.mrp * 1.124);

  const baseRate = Number((selectedTier.sellingPrice / (selectedTier.number || 1)).toFixed(2));
  const displayTiers = tiers.length >= 3 ? [
    { rangeLabel: "1 - 99 Units", unitPrice: (tiers[0].sellingPrice / (tiers[0].number || 1)).toFixed(2), tierObj: tiers[0] },
    { rangeLabel: "100 - 499 Units", unitPrice: (tiers[1].sellingPrice / (tiers[1].number || 1)).toFixed(2), tierObj: tiers[1] },
    { rangeLabel: "500+ Units", unitPrice: (tiers[2].sellingPrice / (tiers[2].number || 1)).toFixed(2), tierObj: tiers[2] },
  ] : [
    { rangeLabel: "1 - 99 Units", unitPrice: (baseRate * 1.18).toFixed(2), tierObj: tiers[0] },
    { rangeLabel: "100 - 499 Units", unitPrice: baseRate.toFixed(2), tierObj: selectedTier },
    { rangeLabel: "500+ Units", unitPrice: (baseRate * 0.82).toFixed(2), tierObj: tiers[tiers.length - 1] || selectedTier },
  ];

  return (
    <section className="product-pricing" aria-label="Product pricing" style={{ width: "100%" }}>
      <div
        className="bulk-pricing-card"
        style={{
          backgroundColor: "#F0F4F9",
          border: "1px solid #DBEAFE",
          borderRadius: "8px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* Main Unit Price Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "#B91C1C" }}>
              ₹{baseRate.toFixed(2)}
            </span>
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748B", marginLeft: "4px" }}>
              / unit
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#B91C1C" }}>
            Save {discountPercent > 0 ? `${discountPercent}% on Bulk` : "15% on Bulk"}
          </span>
        </div>

        {/* Bulk Pricing Tiers Header */}
        <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          BULK PRICING TIERS:
        </div>

        {/* Tier List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {displayTiers.map((t, idx) => {
            const isSelected = idx === 1 || t.tierObj?.number === selectedTier.number;
            return (
              <div
                key={t.rangeLabel}
                onClick={() => t.tierObj && onTierChange?.(t.tierObj)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  backgroundColor: isSelected ? "#DBEAFE" : "transparent",
                  fontWeight: isSelected ? "700" : "500",
                  fontSize: "14px",
                  color: "#1E293B",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{t.rangeLabel}</span>
                <span style={{ color: idx === 2 ? "#15803D" : isSelected ? "#0F172A" : "#475569", fontWeight: "700" }}>
                  ₹{t.unitPrice} / unit
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showQuantity && (
        <div className="quantity-row">
          <span>Quantity</span>
          <div className="quantity-control">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <output aria-live="polite">{quantity}</output>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQuantityChange?.(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="pricing-meta-box">
        {showPackWeight && selectedTier.packWeight !== undefined && (
          <div className="meta-card-item">
            <svg className="meta-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <div className="meta-card-text">
              <span className="meta-card-label">Pack Weight</span>
              <span className="meta-card-value">{selectedTier.packWeight} kg</span>
            </div>
          </div>
        )}
        {showPackWeight && selectedTier.packWeight !== undefined && <div className="meta-card-divider" />}

        <div className="meta-card-item">
          <svg className="meta-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6h-3m12-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div className="meta-card-text">
            <span className="meta-card-label">Total</span>
            <span className="meta-card-value">{formatCurrency(selectedTier.sellingPrice * quantity)}</span>
          </div>
        </div>

        {showSavings && savings > 0 && (
          <>
            <div className="meta-card-divider" />
            <div className="meta-card-item">
              <svg className="meta-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 0 0 1.591 0l4.318-4.318a1.125 1.125 0 0 0 0-1.591L9.581 3.659A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
              <div className="meta-card-text">
                <span className="meta-card-label">You Save</span>
                <span className="meta-card-value savings-value">{formatCurrency(savings)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .product-pricing {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pricing-display-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
        }
        .mrp-strikethrough-row {
          display: flex;
          gap: 6px;
          align-items: center;
          font-family: "Montserrat", sans-serif;
        }
        .mrp-label {
          color: #7f7f7f;
          font-size: 14px;
          font-weight: 500;
        }
        .mrp-value {
          color: #7f7f7f;
          font-size: 14px;
          text-decoration: line-through;
          font-weight: 500;
        }
        .selling-price-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-family: "Montserrat", sans-serif;
        }
        .new-mrp-group {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .new-mrp-label {
          color: #7f7f7f;
          font-size: 14px;
          font-weight: 500;
        }
        .new-mrp-value {
          color: #7f7f7f;
          font-size: 14px;
          text-decoration: line-through;
          font-weight: 500;
        }
        .selling-price-value {
          color: #e92227;
          font-size: 28px;
          line-height: 1;
          font-weight: 700;
        }
        .discount-tag {
          color: #16a34a;
          font-size: 16px;
          font-weight: 600;
        }
        .tier-select,
        .quantity-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #111827;
          font-weight: 600;
        }
        .price-pack-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
        }
        .tier-select {
          display: flex;
          align-items: center;
          gap: 8px;
          width: auto;
          color: #1b1b1b;
          font-weight: 600;
          font-size: 14px;
          border: 1px solid #f2f2f2;
          border-radius: 10px;
          padding: 6px 12px;
          background-color: #fff;
        }
        .tier-select select {
          min-width: 70px;
          min-height: 32px;
          border: 1px solid #ebebeb;
          border-radius: 8px;
          background: #fff;
          padding: 4px 8px;
          font-size: 13px;
        }
        .quantity-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quantity-control {
          display: grid;
          grid-template-columns: 40px 64px 40px;
          min-height: 40px;
          border: 1px solid #d1d5db;
        }
        .quantity-control button {
          border: 0;
          background: #f8fafc;
          color: #111827;
          font-size: 20px;
        }
        .quantity-control button:last-child {
          background: #182c5a;
          color: #fff;
        }
        output {
          display: flex;
          align-items: center;
          justify-content: center;
          border-inline: 1px solid #d1d5db;
          font-size: 18px;
          font-weight: 600;
        }
        .pricing-meta-box {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          background-color: #f9fafb;
          border: 1px solid #f2f2f2;
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          gap: 12px;
          margin-top: 8px;
        }
        .meta-card-item {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .meta-icon {
          width: 24px;
          height: 24px;
          color: #374151;
        }
        .meta-card-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .meta-card-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.2;
        }
        .meta-card-value {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }
        .savings-value {
          color: #16a34a;
        }
        .meta-card-divider {
          width: 1px;
          height: 28px;
          background-color: #e5e7eb;
        }
        @media (max-width: 767px) {
          .pricing-meta-box {
            padding: 8px 6px;
            gap: 4px;
          }
          .meta-card-item {
            gap: 4px;
          }
          .meta-icon {
            width: 14px;
            height: 14px;
          }
          .meta-card-label {
            font-size: 8px;
            letter-spacing: 0.2px;
          }
          .meta-card-value {
            font-size: 10px;
          }
          .meta-card-divider {
            height: 20px;
          }
          .tier-select {
            padding: 4px 8px;
            font-size: 12px;
            gap: 6px;
          }
          .tier-select select {
            min-width: 60px;
            min-height: 28px;
            padding: 2px 6px;
            font-size: 12px;
          }
          .price-pack-container {
            gap: 8px;
          }
          .price-row {
            gap: 6px;
          }
        }
      `}</style>
    </section>
  );
}

export default React.memo(ProductPricing);
