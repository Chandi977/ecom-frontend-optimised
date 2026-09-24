import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useWishlist } from "../../context/WishlistContext";

interface WishlistButtonProps {
  product?: Record<string, any> | null;
  size?: "sm" | "md";
  variant?: "overlay" | "inline" | "action";
  placement?: "top-right" | "top-left";
  className?: string;
}

const resolveProduct = (value?: Record<string, any> | null) => {
  if (value?.product && typeof value.product === "object" && value.product._id) {
    return value.product;
  }
  return value || null;
};

const getProductId = (product?: Record<string, any> | null): string =>
  String(product?._id || "");

export default function WishlistButton({
  product: productValue,
  size = "md",
  variant = "overlay",
  placement = "top-right",
  className = "",
}: WishlistButtonProps) {
  const product = resolveProduct(productValue);
  const productId = getProductId(product);
  const { wishlistIds, pendingIds, toggleWishlist } = useWishlist();
  const active = Boolean(productId && wishlistIds.has(productId));
  const pending = Boolean(productId && pendingIds.has(productId));
  const productName = String(product?.name || product?.model || "product");

  return (
    <button
      type="button"
      className={[
        "wishlist-card-button",
        `wishlist-${variant}`,
        `wishlist-${size}`,
        placement,
        active ? "is-active" : "",
        pending ? "is-pending" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={
        !productId
          ? "Wishlist unavailable for this product"
          : active
            ? `Remove ${productName} from wishlist`
            : `Add ${productName} to wishlist`
      }
      aria-pressed={active}
      aria-busy={pending}
      disabled={!productId || pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (productId && !pending) void toggleWishlist(product);
      }}
      title={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <FontAwesomeIcon icon={faHeart} aria-hidden="true" />

      <style jsx>{`
        .wishlist-card-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border: 1px solid #d9dde6;
          padding: 0;
          background: rgba(255, 255, 255, 0.96);
          color: #747b88;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(15, 39, 71, 0.08);
          transition:
            color 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease,
            transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .wishlist-overlay {
          position: absolute;
          z-index: 6;
          border-radius: 50%;
        }
        .wishlist-overlay.top-right {
          top: 12px;
          right: 12px;
        }
        .wishlist-overlay.top-left {
          top: 12px;
          left: 12px;
        }
        .wishlist-inline {
          position: relative;
          border-radius: 50%;
          box-shadow: none;
        }
        .wishlist-action {
          width: 100%;
          min-height: 40px;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }
        .wishlist-md {
          width: 36px;
          height: 36px;
          font-size: 15px;
        }
        .wishlist-sm {
          width: 32px;
          height: 32px;
          font-size: 13px;
        }
        .wishlist-card-button:hover:not(:disabled) {
          color: #cf1717;
          border-color: #cf1717;
          transform: translateY(-1px);
        }
        .wishlist-card-button:active:not(:disabled) {
          transform: scale(0.96);
        }
        .wishlist-card-button.is-active {
          border-color: #cf1717;
          background: #fff5f5;
          color: #cf1717;
        }
        .wishlist-card-button.is-pending :global(svg) {
          animation: wishlist-pulse 700ms ease-in-out infinite alternate;
        }
        .wishlist-card-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .wishlist-card-button:focus-visible {
          outline: 2px solid #cf1717;
          outline-offset: 3px;
        }
        @keyframes wishlist-pulse {
          from {
            opacity: 0.45;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1.06);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wishlist-card-button,
          .wishlist-card-button :global(svg) {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </button>
  );
}
