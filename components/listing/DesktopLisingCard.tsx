import React from "react";
import { addToCart } from "../../utils/cart";
import {
  getProductImageSrc,
  getPrimaryPriceTier,
} from "../../utils/productCatalog";
import ProductImage from "../product/ProductImage";
import ProductCardSkeleton from "./ProductCardSkeleton";
import {
  formatProductCardPrice,
  getProductCardDiscountLabel,
  getProductCardBadge,
  getProductCardSummary,
  getProductDisplayName,
} from "./productDisplay";
import { useBrands } from "../../context/BrandContext";

function DesktopListingCard({ item }: { item?: any }) {
  const { brandNameById } = useBrands();

  if (!item) {
    return <ProductCardSkeleton variant="grid" />;
  }

  const tier = getPrimaryPriceTier(item);
  const quantity = Math.max(1, tier.number);
  const priceForOne = tier.sellingPrice / quantity;
  // Collapsed label listing: several labels-per-roll products shown as one card.
  // Title uses the base model (display-only clone — the item itself keeps its
  // real model for cart payloads) and the quantities render as a variants line.
  const labelVariants =
    Array.isArray(item?.label_variants) && item.label_variants.length > 1
      ? item.label_variants
      : null;
  const title = getProductDisplayName(
    labelVariants && item?.label_base_model
      ? { ...item, model: item.label_base_model }
      : item,
    {
      includePack: true,
      brandNameById,
    },
  );
  const summary = getProductCardSummary(item);
  const badge = getProductCardBadge(item);
  const showMrp = tier.mrp > tier.sellingPrice;
  const discountLabel = getProductCardDiscountLabel(tier);

  const handleViewProduct = () => {
    const productId = item?.slug;
    if (!productId) return;

    const newTab = window.open(`/${productId}`, "_blank");
    if (newTab) {
      newTab.focus();
    }
  };

  const handleCart = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    await addToCart(item, quantity, priceForOne);
  };

  return (
    <article className="listing-product-card">
      {badge && <span className={`card-badge ${badge.toLowerCase()}`}>{badge}</span>}

      <button
        type="button"
        className="image-button"
        onClick={handleViewProduct}
        aria-label={`View ${title}`}
      >
        <ProductImage
          src={getProductImageSrc(item)}
          alt={item?.name || "Product image"}
          width={280}
          height={210}
          loading="lazy"
          decoding="async"
          style={{ objectFit: "contain", maxHeight: "210px" }}
        />
      </button>

      <div className="card-body">
        <button type="button" className="product-title" onClick={handleViewProduct}>
          {title}
        </button>
        <p className="product-summary">{summary}</p>
        {labelVariants && (
          <p className="variant-line">
            Labels/Roll: {labelVariants.map((variant) => variant.labelQty).join(" / ")}
          </p>
        )}

        <div className="card-footer">
          <div className="price-stack" aria-label="Product price">
            <strong>{formatProductCardPrice(tier.sellingPrice)}</strong>
            {showMrp && <s>{formatProductCardPrice(tier.mrp)}</s>}
            {discountLabel && <span>{discountLabel}</span>}
          </div>
          <button type="button" className="add-cart-button" onClick={handleCart}>
            ADD TO CART
          </button>
        </div>
      </div>

      <style jsx>{`
        .listing-product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          width: min(100%, 300px);
          min-height: 380px;
          background: #fff;
          border: 1px solid #d9dde6;
          box-shadow: none;
          overflow: hidden;
        }
        .card-badge {
          position: absolute;
          top: 20px;
          left: 24px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 10px;
          background: #02051f;
          color: #fff;
          font-family: "Montserrat", sans-serif;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          text-transform: uppercase;
        }
        .card-badge.sale {
          background: #cf1717;
        }
        .image-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 250px;
          border: 0;
          padding: 30px 12px 12px;
          background: #fff;
          cursor: pointer;
        }
        .card-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 0 18px 16px;
        }
        .product-title {
          display: -webkit-box;
          min-height: 42px;
          border: 0;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: transparent;
          color: #4a5160;
          font-family: "Montserrat", sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.35;
          text-align: left;
          text-transform: capitalize;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          cursor: pointer;
        }
        .product-title:hover {
          color: #02051f;
        }
        .product-summary {
          display: -webkit-box;
          min-height: 19px;
          margin: 4px 0 14px;
          overflow: hidden;
          color: #596172;
          font-family: "Montserrat", sans-serif;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.35;
          text-transform: none;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
        .variant-line {
          margin: -8px 0 12px;
          color: #182c5a;
          font-family: "Montserrat", sans-serif;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.35;
        }
        .card-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-top: auto;
        }
        .price-stack {
          display: flex;
          min-width: 0;
          align-items: baseline;
          flex-wrap: wrap;
          justify-content: flex-start;
          gap: 5px;
        }
        .price-stack strong {
          color: #02051f;
          font-family: "Montserrat", sans-serif;
          font-size: 18px;
          font-weight: 800;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .price-stack s {
          color: #666c78;
          font-family: "Montserrat", sans-serif;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .price-stack span {
          color: #17803d;
          font-family: "Montserrat", sans-serif;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
        }
        .add-cart-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 110px;
          height: 38px;
          border: 0;
          padding: 0 15px;
          background: #02051f;
          color: #fff;
          font-family: "Montserrat", sans-serif;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          transition: background-color 180ms ease, transform 180ms ease;
        }
        .add-cart-button:hover {
          background: #cf1717;
        }
        .add-cart-button:active {
          transform: translateY(1px);
        }
        .image-button:focus-visible,
        .product-title:focus-visible,
        .add-cart-button:focus-visible {
          outline: 2px solid #cf1717;
          outline-offset: 3px;
        }
      `}</style>
    </article>
  );
}

export default DesktopListingCard;
