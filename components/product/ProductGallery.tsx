import React, { useMemo, useState } from "react";
import type { IProduct } from "../../types/product";
import { getProductMedia } from "../../utils/productCatalog";
import ProductImage from "./ProductImage";

export function ProductGallery({ product }: { product?: IProduct }) {
  const media = useMemo(() => getProductMedia(product), [product]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const selectedImage = media.images[selectedIndex] || media.images[0];

  return (
    <section className="product-gallery-layout" aria-label="Product gallery">
      <div className="gallery-container" style={{ display: "flex", flexDirection: "row", gap: "16px", width: "100%" }}>
        {/* Left Vertical Thumbnails */}
        {media.images.length > 1 && (
          <div className="vertical-thumbs" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "72px", flexShrink: 0 }}>
            {media.images.map((image, index) => (
              <button
                type="button"
                key={`${image.image}-${index}`}
                className={index === selectedIndex ? "v-thumb active" : "v-thumb"}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show product image ${index + 1}`}
                style={{
                  width: "68px",
                  height: "68px",
                  border: index === selectedIndex ? "2px solid #B91C1C" : "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "4px",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <ProductImage
                  src={image.image}
                  alt={image.alt || `${product?.name || "Product"} ${index + 1}`}
                  width={60}
                  height={60}
                  loading="lazy"
                  style={{ objectFit: "contain" }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image Container */}
        <div
          className="main-image-wrap"
          style={{
            position: "relative",
            flex: 1,
            height: "480px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FAFAFA",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {/* Stock Tag Badge */}
          <div
            className="stock-badge-tag"
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              zIndex: 10,
              backgroundColor: (typeof product?.stockQuantity === "number" ? product.stockQuantity : 1) > 0 ? "#15803D" : "#DC2626",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: "700",
              padding: "4px 10px",
              borderRadius: "3px",
              letterSpacing: "0.05em",
            }}
          >
            {(typeof product?.stockQuantity === "number" ? product.stockQuantity : 1) > 0 ? "IN STOCK" : "OUT OF STOCK"}
          </div>

          <button
            type="button"
            className="main-image"
            onClick={() => setLightboxOpen(true)}
            aria-label="Open product image fullscreen"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              border: 0,
              background: "transparent",
              cursor: "zoom-in",
              padding: "24px",
            }}
          >
            <ProductImage
              src={selectedImage?.image || media.thumbnail}
              alt={selectedImage?.alt || product?.name || "Product image"}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
              style={{ objectFit: "contain" }}
            />
          </button>

          {/* Zoom Button Icon */}
          <button
            type="button"
            className="zoom-icon-button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Zoom image"
            style={{
              position: "absolute",
              bottom: "14px",
              right: "14px",
              zIndex: 10,
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              padding: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg style={{ width: "16px", height: "16px", color: "#334155" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Product image fullscreen"
        >
          <button
            type="button"
            className="close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen image"
          >
            x
          </button>
          <div className="lightbox-image">
            <ProductImage
              src={selectedImage?.image || media.thumbnail}
              alt={selectedImage?.alt || product?.name || "Product image"}
              fill
              sizes="100vw"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .product-gallery {
          width: 100%;
        }
        .main-image {
          position: relative;
          display: block;
          width: 100%;
          height: 469px;
          border: 1px solid #d9d9d9;
          background: #fff;
          overflow: hidden;
          cursor: zoom-in;
        }
        .thumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 22px;
        }
        .thumb {
          width: 100px;
          height: 82px;
          border: 1px solid #d9d9d9;
          background: #fff;
          padding: 3px;
        }
        .thumb.active {
          border-color: #182c5a;
          box-shadow: 0 0 0 1px #182c5a;
        }
        .lightbox {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.86);
          padding: 32px;
        }
        .lightbox-image {
          position: relative;
          width: min(100%, 1100px);
          height: min(82vh, 760px);
        }
        .close {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 1;
          width: 42px;
          height: 42px;
          border: 0;
          background: #fff;
          color: #111827;
          font-size: 20px;
        }
        @media (max-width: 900px) {
          .main-image {
            height: 320px;
            border: 0;
          }
          .thumbs {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
          }
        }
      `}</style>
    </section>
  );
}

export default ProductGallery;
