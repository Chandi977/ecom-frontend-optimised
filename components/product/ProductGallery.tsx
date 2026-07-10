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
    <section className="product-gallery" aria-label="Product gallery">
      <button
        type="button"
        className="main-image"
        onClick={() => setLightboxOpen(true)}
        aria-label="Open product image fullscreen"
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

      <div className="thumbs" aria-label="Product thumbnails">
        {media.images.map((image, index) => (
          <button
            type="button"
            key={`${image.image}-${index}`}
            className={index === selectedIndex ? "thumb active" : "thumb"}
            onClick={() => setSelectedIndex(index)}
            aria-label={`Show product image ${index + 1}`}
          >
            <ProductImage
              src={image.image}
              alt={image.alt || `${product?.name || "Product"} ${index + 1}`}
              width={96}
              height={76}
              loading="lazy"
              style={{ objectFit: "contain" }}
            />
          </button>
        ))}
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
