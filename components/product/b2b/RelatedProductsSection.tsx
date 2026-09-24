import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

import AddToCartContent from "../../common/AddToCartContent";
import WishlistButton from "../../common/WishlistButton";
import useAddToCart from "../../../hooks/useAddToCart";
import { addToCart } from "../../../utils/cart";
import {
  getAvailableStock,
  getDiscountPercent,
  getPrimaryPriceTier,
  getProductImageSrc,
  getProductSpecification,
} from "../../../utils/productCatalog";
import {
  fetchRelatedProducts,
  normalizeId,
  type CatalogProduct,
} from "../../../utils/productRelations";
import { formatINR, unitPriceOf } from "./format";

interface RelatedProductsSectionProps {
  product: CatalogProduct;
}

const describeDimensions = (item: CatalogProduct): string => {
  const spec = getProductSpecification(item) as Record<string, unknown>;
  const dimension =
    spec?.size_mm ||
    spec?.size_inch ||
    spec?.size ||
    [spec?.length, spec?.width, spec?.height].filter(Boolean).join(" x ");
  const text = String(dimension || "").trim();
  return text || String(item?.model || "");
};

const formatTitleWithModel = (item: CatalogProduct): string => {
  if (!item) return "Product";
  const name = String(item.name || "").trim();
  const model = String(item.model || item.sku || "").trim();

  let fullName = name;
  if (model && !name.toLowerCase().includes(model.toLowerCase())) {
    fullName = `${name} ${model}`;
  }

  return fullName
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

/** Single card + its add-to-cart wiring matching reference layout. */
const RelatedCard: React.FC<{
  item: CatalogProduct;
  onQuickView: (item: CatalogProduct) => void;
}> = ({ item, onQuickView }) => {
  const tier = getPrimaryPriceTier(item);
  const outOfStock = getAvailableStock(item) <= 0;
  const showMrp = tier.mrp > tier.sellingPrice;
  const discount = getDiscountPercent(tier.sellingPrice, tier.mrp);
  const packSize = Math.max(1, tier.number);

  const { state, buttonProps } = useAddToCart({
    onAdd: async () => {
      if (outOfStock) {
        toast.error("This product is currently out of stock.");
        return false;
      }
      const added = await addToCart(
        item,
        1,
        tier.sellingPrice,
        tier.packWeight || 0,
        packSize,
        packSize,
        item?.brand?._id || item?.brand,
        item?.category,
        tier.stockQuantity ?? getAvailableStock(item),
      );
      return Boolean(added);
    },
  });

  const dimensions = describeDimensions(item);
  const rawName = String(item?.name || "Product");
  const formattedName = formatTitleWithModel(item);
  const titleText =
    packSize > 1 && !formattedName.toLowerCase().includes("pack of")
      ? `${formattedName} (Pack Of ${packSize})`
      : formattedName;

  return (
    <article className="related-product-card">
      {showMrp && <span className="card-sale-badge">SALE</span>}
      <WishlistButton product={item} size="sm" />

      <div className="card-image-box">
        <Link
          href={`/${item?.slug || normalizeId(item)}`}
          className="card-image-link"
        >
          <img
            src={getProductImageSrc(item)}
            alt={rawName}
            loading="lazy"
            className="card-img"
          />
        </Link>
        <button
          type="button"
          onClick={() => onQuickView(item)}
          title="Quick specifications"
          aria-label={`Quick specifications for ${rawName}`}
          className="card-quick-view-btn"
        >
          <span className="material-symbols-outlined">visibility</span>
        </button>
      </div>

      <div className="card-body-container">
        <Link
          href={`/${item?.slug || normalizeId(item)}`}
          className="card-title-link"
        >
          <h3 className="card-heading-title">{titleText}</h3>
        </Link>

        {dimensions && (
          <p className="card-dimension-text">
            Size: {dimensions}
          </p>
        )}

        <div className="card-price-row">
          <strong className="card-selling-price">{formatINR(tier.sellingPrice)}</strong>
          {showMrp && <s className="card-mrp-price">{formatINR(tier.mrp)}</s>}
          {showMrp && discount > 0 && (
            <span className="card-discount-badge">{discount}% off</span>
          )}
        </div>

        <button
          {...buttonProps}
          type="button"
          disabled={outOfStock}
          className={`card-cart-btn ${outOfStock ? "disabled" : ""}`}
        >
          <AddToCartContent
            state={state}
            icon={false}
            idleLabel={outOfStock ? "OUT OF STOCK" : "ADD TO CART"}
          />
        </button>
      </div>

      <style jsx>{`
        .related-product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #d9dde6;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          min-height: 380px;
        }
        .related-product-card:hover {
          border-color: #b9c0cd;
          box-shadow: 0 10px 24px -10px rgba(15, 39, 71, 0.25);
        }
        .card-sale-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 5;
          background: #cf1717;
          color: #ffffff;
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-radius: 2px;
          line-height: 1;
        }
        .card-image-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 220px;
          padding: 24px 16px 12px;
          background: #ffffff;
        }
        .card-image-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .card-img {
          max-height: 180px;
          max-width: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .related-product-card:hover .card-img {
          transform: scale(1.04);
        }
        .card-quick-view-btn {
          position: absolute;
          top: 54px;
          right: 14px;
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        .card-quick-view-btn:hover {
          background: #02051f;
          color: #ffffff;
          border-color: #02051f;
        }
        .card-body-container {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 14px 18px 18px;
        }
        .card-title-link {
          text-decoration: none;
        }
        .card-heading-title {
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #02051f;
          line-height: 1.35;
          margin: 0 0 4px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-heading-title:hover {
          color: #cf1717;
        }
        .card-dimension-text {
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #596172;
          margin: 0 0 12px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: auto;
          margin-bottom: 14px;
        }
        .card-selling-price {
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 19px;
          font-weight: 800;
          color: #02051f;
          letter-spacing: -0.3px;
        }
        .card-mrp-price {
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #666c78;
          text-decoration: line-through;
        }
        .card-discount-badge {
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 12px;
          font-weight: 800;
          color: #17803d;
        }
        .card-cart-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-width: 120px;
          height: 38px;
          padding: 0 16px;
          background: #02051f;
          color: #ffffff;
          font-family: "Montserrat", "Inter", sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 0;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .card-cart-btn:hover:not(.disabled) {
          background: #cf1717;
        }
        .card-cart-btn.disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </article>
  );
};

/** Related products grid with a quick-view specification modal. */
export const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({
  product,
}) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchRelatedProducts(product, 4)
      .then((related) => {
        if (isMounted) setProducts(related);
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      });
    return () => {
      isMounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (!quickView) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickView(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quickView]);

  if (products.length === 0) return null;

  const quickViewTier = quickView ? getPrimaryPriceTier(quickView) : null;
  const quickViewSpecs = quickView
    ? Object.entries(getProductSpecification(quickView) as Record<string, unknown>)
        .filter(
          ([key, value]) =>
            !["_id", "product", "createdAt", "updatedAt", "__v"].includes(key) &&
            value !== null &&
            value !== undefined &&
            typeof value !== "object" &&
            String(value).trim() !== "",
        )
        .slice(0, 6)
    : [];

  return (
    <section className="tw-mt-16" id="related-products">
      <h2 className="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-slate-900 tw-mb-6 tw-tracking-tight">
        Related Industrial Packaging Products
      </h2>

      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
        {products.map((item, index) => (
          <RelatedCard
            key={normalizeId(item) || index}
            item={item}
            onQuickView={setQuickView}
          />
        ))}
      </div>

      {/* Quick view modal */}
      {quickView && quickViewTier && (
        <div
          className="tw-fixed tw-inset-0 tw-bg-slate-900/60 tw-backdrop-blur-sm tw-z-[1200] tw-flex tw-items-center tw-justify-center tw-p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${quickView.name} specifications`}
          onClick={() => setQuickView(null)}
        >
          <div
            className="tw-bg-white tw-rounded-xl tw-max-w-lg tw-w-full tw-p-6 tw-border tw-border-solid tw-border-slate-200 tw-shadow-2xl tw-max-h-[90vh] tw-overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tw-flex tw-justify-between tw-items-start tw-gap-4 tw-mb-4 tw-pb-2">
              <h3 className="tw-font-bold tw-text-base tw-text-slate-900 tw-m-0">
                {formatTitleWithModel(quickView)}
              </h3>
              <button
                type="button"
                onClick={() => setQuickView(null)}
                aria-label="Close quick view"
                className="tw-text-slate-400 hover:tw-text-slate-900 tw-text-lg tw-font-bold tw-bg-transparent tw-border-0 tw-cursor-pointer tw-leading-none"
              >
                ✕
              </button>
            </div>

            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 tw-items-start">
              <div className="tw-w-36 tw-h-36 tw-bg-slate-50 tw-rounded-lg tw-p-2 tw-flex tw-items-center tw-justify-center tw-shrink-0 tw-border tw-border-solid tw-border-slate-200">
                <img
                  src={getProductImageSrc(quickView)}
                  alt={String(quickView.name || "Product")}
                  className="tw-max-h-full tw-object-contain"
                />
              </div>

              <div className="tw-space-y-2 tw-text-xs tw-grow tw-text-slate-900 tw-w-full">
                {quickView.model && (
                  <p className="tw-m-0">
                    <strong>SKU:</strong>{" "}
                    <span className="tw-text-slate-600">
                      {String(quickView.model)}
                    </span>
                  </p>
                )}
                <p className="tw-m-0">
                  <strong>Pack size:</strong>{" "}
                  <span className="tw-text-slate-600">
                    {quickViewTier.number} units
                  </span>
                </p>
                <p className="tw-m-0">
                  <strong>Price:</strong>{" "}
                  <span className="tw-text-slate-900 tw-font-semibold">
                    {formatINR(quickViewTier.sellingPrice)} / pack ·{" "}
                    {formatINR(unitPriceOf(quickViewTier))} / unit
                  </span>
                </p>
                {quickViewSpecs.map(([key, value]) => (
                  <p key={key} className="tw-m-0">
                    <strong>
                      {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:
                    </strong>{" "}
                    <span className="tw-text-slate-600">{String(value)}</span>
                  </p>
                ))}

                <div className="tw-pt-3">
                  <Link
                    href={`/${quickView.slug || normalizeId(quickView)}`}
                    className="tw-inline-flex tw-items-center tw-gap-1.5 tw-bg-slate-900 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-font-bold tw-uppercase tw-tracking-widest tw-text-[11px] hover:tw-bg-slate-800 tw-transition-all tw-no-underline tw-shadow-sm"
                  >
                    View full details
                    <span className="material-symbols-outlined tw-text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RelatedProductsSection;
