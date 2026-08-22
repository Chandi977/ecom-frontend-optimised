import React, { useEffect, useState } from "react";
import Link from "next/link";

import { alterQuantity, removeFromCart } from "../../utils/cart";

/**
 * Replaces the add-to-cart button once a product is in the cart: a quantity
 * stepper bound to the cart line plus a link through to the cart.
 *
 * Products are sold by the pack, so the stepper counts packs — `quantity` is
 * the number of packs and `packSize` how many pieces each holds. The caption
 * spells the total out ("1 pack · 50 pcs") so nobody reads the stepper as a
 * piece count.
 *
 * Self-styled on purpose — it is rendered from cards whose own CSS is scoped
 * by styled-jsx, so it cannot rely on classes declared by its parents.
 */

type Size = "sm" | "md";

const sizing: Record<
  Size,
  { height: number; font: number; step: number; readout: number; gap: number }
> = {
  sm: { height: 34, font: 10, step: 22, readout: 34, gap: 6 },
  md: { height: 38, font: 11, step: 28, readout: 42, gap: 8 },
};

type CartQuantityControlProps = {
  productId: string;
  /** Number of packs in the cart. */
  quantity: number;
  /** Pieces per pack, used for the caption and to match the cart line. */
  packSize?: number;
  size?: Size;
  /** Word for a single piece, e.g. "roll" or "label". */
  unitLabel?: string;
  /** Where the "Go to cart" link points; defaults to the cart page. */
  href?: string;
  goToCartLabel?: string;
};

export function CartQuantityControl({
  productId,
  quantity,
  packSize,
  size = "md",
  unitLabel = "pcs",
  href = "/my-cart",
  goToCartLabel = "GO TO CART",
}: CartQuantityControlProps) {
  const metrics = sizing[size];
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const applyQuantity = async (
    event: React.MouseEvent<HTMLButtonElement>,
    next: number,
  ) => {
    event.stopPropagation();
    if (pending) return;

    setPending(true);
    setLocalQuantity(Math.max(0, next));
    try {
      if (next < 1) {
        await removeFromCart(productId);
      } else {
        await alterQuantity(productId, next, packSize);
      }
    } finally {
      setPending(false);
    }
  };

  const stepButtonStyle: React.CSSProperties = {
    width: `${metrics.step}px`,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: 0,
    background: "#f8fafc",
    color: "#182c5a",
    fontSize: `${metrics.font + 4}px`,
    fontWeight: 700,
    lineHeight: 1,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.6 : 1,
  };

  const piecesPerPack = Number(packSize) || 0;
  // Spelled out for assistive tech and on hover; the readout itself only has
  // room for the short form, and growing the control clips inside the cards.
  const packSummary =
    piecesPerPack > 1
      ? `${localQuantity} ${localQuantity === 1 ? "pack" : "packs"} (${
          localQuantity * piecesPerPack
        } ${unitLabel})`
      : `${localQuantity} ${localQuantity === 1 ? "item" : "items"}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: `${metrics.gap}px`,
        flex: "1 1 auto",
        minWidth: 0,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          flexShrink: 0,
          height: `${metrics.height}px`,
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <button
          type="button"
          aria-label="Decrease quantity"
          style={stepButtonStyle}
          onClick={(event) => applyQuantity(event, localQuantity - 1)}
        >
          -
        </button>
        <span
          aria-live="polite"
          aria-label={packSummary}
          title={packSummary}
          style={{
            width: `${metrics.readout}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            borderInline: "1px solid #d1d5db",
            color: "#02051f",
            fontFamily: '"Montserrat", sans-serif',
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: `${metrics.font + 2}px`, fontWeight: 700 }}>
            {localQuantity}
          </span>
          {piecesPerPack > 1 && (
            <span
              aria-hidden="true"
              style={{
                color: "#596172",
                fontSize: `${metrics.font - 2}px`,
                fontWeight: 700,
              }}
            >
              &times;{piecesPerPack}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          style={stepButtonStyle}
          onClick={(event) => applyQuantity(event, localQuantity + 1)}
        >
          +
        </button>
      </div>

      <Link
        href={href}
        onClick={(event) => event.stopPropagation()}
        style={{
          display: "inline-flex",
          flex: "1 1 auto",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          minWidth: 0,
          height: `${metrics.height}px`,
          padding: size === "sm" ? "0 6px" : "0 10px",
          background: "#17803d",
          borderRadius: "6px",
          color: "#fff",
          fontFamily: '"Montserrat", sans-serif',
          fontSize: `${metrics.font}px`,
          fontWeight: 800,
          lineHeight: 1,
          textDecoration: "none",
          textTransform: "uppercase",
        }}
      >
        {/* Truncates rather than spilling out of a narrow card. */}
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {goToCartLabel}
        </span>
        {size !== "sm" && (
          <svg
            width={metrics.font + 2}
            height={metrics.font + 2}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path
              d="m9 6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </Link>
    </div>
  );
}

export default CartQuantityControl;
