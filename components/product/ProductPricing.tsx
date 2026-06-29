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
      <div className="price-row">
        {showMrp && selectedTier.mrp > selectedTier.sellingPrice && (
          <span className="mrp">MRP: {formatCurrency(selectedTier.mrp)}</span>
        )}
        <strong className="price">
          {formatCurrency(selectedTier.sellingPrice)}
        </strong>
        {discountPercent > 0 && (
          <span className="discount">{Math.round(discountPercent)}% Off</span>
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

      <dl className="pricing-meta">
        {showPackWeight && selectedTier.packWeight !== undefined && (
          <div>
            <dt>Pack Weight</dt>
            <dd>{selectedTier.packWeight} kg</dd>
          </div>
        )}
        <div>
          <dt>Total</dt>
          <dd>{formatCurrency(selectedTier.sellingPrice * quantity)}</dd>
        </div>
        {showSavings && savings > 0 && (
          <div>
            <dt>Savings</dt>
            <dd>{formatCurrency(savings)}</dd>
          </div>
        )}
      </dl>

      <style jsx>{`
        .product-pricing {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .price-row {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 16px;
        }
        .mrp {
          color: #4b5563;
          font-size: 16px;
          text-decoration: line-through;
        }
        .price {
          color: #111827;
          font-size: 28px;
          line-height: 1;
        }
        .discount {
          color: #e92227;
          font-size: 18px;
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
        select {
          min-width: 86px;
          min-height: 36px;
          border: 1px solid #d1d5db;
          background: #fff;
          padding: 6px 10px;
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
        .pricing-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px 24px;
          margin: 0;
        }
        .pricing-meta div {
          display: flex;
          gap: 6px;
        }
        dt {
          color: #4b5563;
          font-weight: 600;
        }
        dd {
          margin: 0;
          color: #111827;
          font-weight: 700;
        }
      `}</style>
    </section>
  );
}

export default ProductPricing;
