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

interface ProductPricingProps {
  product?: IProduct;
  selectedNumber?: number;
  quantity?: number;
  showQuantity?: boolean;
  onTierChange?: (tier: NormalizedPriceTier) => void;
  onQuantityChange?: (quantity: number) => void;
}

export function ProductPricing({
  product,
  selectedNumber,
  quantity = 1,
  showQuantity = true,
  onTierChange,
  onQuantityChange,
}: ProductPricingProps) {
  const tiers = getPriceTiers(product);
  const selectedTier =
    tiers.find((tier) => tier.number === selectedNumber) ||
    tiers[0] ||
    getPrimaryPriceTier(product);
  const discountPercent =
    selectedTier.discount ??
    getDiscountPercent(selectedTier.sellingPrice, selectedTier.mrp);
  const savings = Math.max(
    0,
    (selectedTier.mrp - selectedTier.sellingPrice) * quantity,
  );

  const productRecord = product as Record<string, unknown> | undefined;
  const showMrp = isFieldVisible(productRecord, FIELD_VISIBILITY_KEYS.priceMrp);
  const showSavings = isFieldVisible(productRecord, FIELD_VISIBILITY_KEYS.priceSavings);
  const showPackWeight = isFieldVisible(productRecord, FIELD_VISIBILITY_KEYS.pricePackWeight);

  return (
    <section className="product-pricing" aria-label="Product pricing">
      <div className="price-pack-container">
        <div className="price-row">
          <strong className="price">
            {formatCurrency(selectedTier.sellingPrice)}
          </strong>
          {showMrp && selectedTier.mrp > selectedTier.sellingPrice && (
            <span className="mrp">MRP: {formatCurrency(selectedTier.mrp)}</span>
          )}
          {showSavings && savings > 0 && (
            <span className="price-save">
              You Save: <strong className="price-save-amount">{formatCurrency(savings)}</strong>
            </span>
          )}
        </div>

        {tiers.length > 0 && (
          <label className="tier-select">
            <span>Select Pack Size</span>
            <select
              value={selectedTier.number}
              onChange={(event) => {
                const tier = tiers.find(
                  (item) => item.number === Number(event.target.value),
                );
                if (tier && onTierChange) onTierChange(tier);
              }}
            >
              {tiers.map((tier) => (
                <option key={tier.number} value={tier.number}>
                  {tier.number}
                </option>
              ))}
            </select>
          </label>
        )}
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
        .price-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .mrp {
          color: #9ca3af;
          font-size: 16px;
          text-decoration: line-through;
        }
        .price {
          color: #182c5a;
          font-size: 28px;
          line-height: 1;
          font-weight: 700;
        }
        .price-save {
          font-size: 15px;
          color: #4b5563;
          font-weight: 500;
        }
        .price-save-amount {
          color: #16a34a !important;
          font-weight: 700;
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

export default ProductPricing;
