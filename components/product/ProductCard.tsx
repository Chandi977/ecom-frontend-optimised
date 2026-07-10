import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartPlus,
  faEye,
  faHeart,
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import type { IProduct } from "../../types/product";
import {
  formatCurrency,
  getAvailableStock,
  getDiscountPercent,
  getPrimaryPriceTier,
  getProductImageSrc,
  getProductSubCategory,
} from "../../utils/productCatalog";
import ProductImage from "./ProductImage";

interface ProductCardProps {
  product?: IProduct;
  isWishlisted?: boolean;
  compact?: boolean;
  onView?: (product: IProduct) => void;
  onQuickView?: (product: IProduct) => void;
  onWishlist?: (product: IProduct) => void;
  onCompare?: (product: IProduct) => void;
  onAddToCart?: (product: IProduct) => void;
}

const getName = (product?: IProduct): string =>
  [product?.brand?.name, product?.name, product?.model]
    .filter(Boolean)
    .join(" ");

export function ProductCard({
  product,
  isWishlisted = false,
  compact = false,
  onView,
  onQuickView,
  onWishlist,
  onCompare,
  onAddToCart,
}: ProductCardProps) {
  if (!product) {
    return <div className="product-card skeleton" aria-hidden="true" />;
  }

  const tier = getPrimaryPriceTier(product);
  const stock = getAvailableStock(product);
  const discountPercent =
    tier.discount ?? getDiscountPercent(tier.sellingPrice, tier.mrp);
  const subCategory = getProductSubCategory(product);
  const subCategoryName =
    subCategory && typeof subCategory === "object"
      ? String((subCategory as Record<string, unknown>).name || "")
      : "";

  return (
    <article className={compact ? "product-card compact" : "product-card"}>
      <button
        type="button"
        className="image-button"
        onClick={() => onView?.(product)}
        aria-label={`View ${product.name}`}
      >
        <ProductImage
          src={getProductImageSrc(product)}
          alt={product.name || "Product image"}
          width={compact ? 150 : 230}
          height={compact ? 130 : 190}
          loading="lazy"
          decoding="async"
          style={{ objectFit: "contain" }}
        />
      </button>

      <div className="badges">
        {(product.featured || product.top_product) && (
          <span className="badge">Featured</span>
        )}
        {product.deal_product && <span className="badge deal">Deal</span>}
      </div>

      <div className="content">
        <p className="meta">
          {[product.brand?.name, product.category?.name, subCategoryName]
            .filter(Boolean)
            .join(" / ")}
        </p>
        <button
          type="button"
          className="title"
          onClick={() => onView?.(product)}
        >
          {product?.brand?.name} {product?.name}
          {product?.model && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: "normal",
                color: "#6b7280",
                background: "#f3f4f6",
                padding: "1px 5px",
                borderRadius: "3px",
                marginLeft: "5px",
                border: "1px solid #e5e7eb",
                display: "inline-block",
                textTransform: "none",
              }}
            >
              {product.model}
            </span>
          )}
        </button>
        <div className="price-row">
          {tier.mrp > tier.sellingPrice && (
            <span className="mrp">{formatCurrency(tier.mrp)}</span>
          )}
          <strong>{formatCurrency(tier.sellingPrice)}</strong>
          {discountPercent > 0 && (
            <span className="off">{discountPercent}% off</span>
          )}
        </div>
        <p className={stock > 0 ? "stock in-stock" : "stock out-stock"}>
          {stock > 0 ? `${stock} available` : "Out of stock"}
        </p>
      </div>

      <div className="actions">
        <button
          type="button"
          onClick={() => onQuickView?.(product)}
          aria-label="Quick view"
        >
          <FontAwesomeIcon icon={faEye} />
        </button>
        <button
          type="button"
          onClick={() => onWishlist?.(product)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={isWishlisted ? "active" : ""}
        >
          <FontAwesomeIcon icon={faHeart} />
        </button>
        <button
          type="button"
          onClick={() => onCompare?.(product)}
          aria-label="Compare"
        >
          <FontAwesomeIcon icon={faScaleBalanced} />
        </button>
        <button
          type="button"
          onClick={() => onAddToCart?.(product)}
          aria-label="Add to cart"
        >
          <FontAwesomeIcon icon={faCartPlus} />
        </button>
      </div>

      <style jsx>{`
        .product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 360px;
          background: #f9f9f9;
          border: 1px solid #ededed;
        }
        .product-card.compact {
          min-height: 320px;
        }
        .product-card.skeleton {
          min-height: 288px;
          background: #f3f4f6;
        }
        .image-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 190px;
          border: 0;
          background: #f9f9f9;
          cursor: pointer;
        }
        .compact .image-button {
          height: 160px;
        }
        .badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .badge {
          background: #182c5a;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          padding: 6px 8px;
          text-transform: uppercase;
        }
        .badge.deal {
          background: #e92227;
        }
        .content {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 8px;
          padding: 12px 14px;
          text-align: center;
        }
        .meta {
          min-height: 18px;
          margin: 0;
          color: #6b7280;
          font-size: 11px;
          text-transform: capitalize;
        }
        .title {
          display: -webkit-box;
          min-height: 44px;
          border: 0;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: transparent;
          color: #1f2937;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.45;
          text-align: center;
          text-transform: capitalize;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          cursor: pointer;
        }
        .price-row {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          min-height: 24px;
        }
        .mrp {
          color: #6b7280;
          text-decoration: line-through;
        }
        strong {
          color: #e92227;
          font-size: 17px;
        }
        .off {
          color: #e92227;
          font-size: 12px;
          font-weight: 700;
        }
        .stock {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
        }
        .in-stock {
          color: #17803d;
        }
        .out-stock {
          color: #dc2626;
        }
        .actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid #e5e7eb;
        }
        .actions button {
          min-height: 40px;
          border: 0;
          border-right: 1px solid #e5e7eb;
          background: #fff;
          color: #182c5a;
        }
        .actions button:last-child {
          border-right: 0;
          background: #182c5a;
          color: #fff;
        }
        .actions button.active {
          color: #e92227;
        }
      `}</style>
    </article>
  );
}

export default ProductCard;
