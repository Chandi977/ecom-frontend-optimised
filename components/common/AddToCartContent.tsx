import React from "react";

import type { AddToCartState } from "../../hooks/useAddToCart";

/**
 * The three stacked labels of an add-to-cart button. Only one is in flow (so it
 * still sizes the button); the other two are pinned on top and slide in and out
 * as the state changes.
 *
 * The host button must be `position: relative; overflow: hidden` —
 * {@link useAddToCart} supplies both through its `buttonProps.style`.
 */

const layerBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  lineHeight: 1,
  whiteSpace: "nowrap",
  transition: "transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
  willChange: "transform, opacity",
};

const overlayLayer: React.CSSProperties = {
  ...layerBase,
  position: "absolute",
  inset: 0,
};

const shown: React.CSSProperties = { transform: "translateY(0)", opacity: 1 };
const above: React.CSSProperties = {
  transform: "translateY(-140%)",
  opacity: 0,
};
const below: React.CSSProperties = {
  transform: "translateY(140%)",
  opacity: 0,
};

export function CartGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3 3h2l2.4 10.2a2 2 0 0 0 1.95 1.54h7.93a2 2 0 0 0 1.94-1.5L21 6H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17.5 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      // Keeps spinning even under prefers-reduced-motion: the rotation is the
      // only signal that the add is still in flight (see the guard in
      // styles/globals.css).
      data-motion-keep
      style={{
        boxSizing: "border-box",
        display: "inline-block",
        flexShrink: 0,
        width: `${size}px`,
        height: `${size}px`,
        border: "2px solid rgba(255, 255, 255, 0.35)",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        animation: "pi-atc-spin 700ms linear infinite",
      }}
    />
  );
}

type AddToCartContentProps = {
  state: AddToCartState;
  idleLabel: React.ReactNode;
  addingLabel?: React.ReactNode;
  addedLabel?: React.ReactNode;
  /** Pass `false` to drop the leading cart icon, or a node to replace it. */
  icon?: React.ReactNode | false;
  iconSize?: number;
};

export function AddToCartContent({
  state,
  idleLabel,
  addingLabel = "Adding...",
  addedLabel = "Added",
  icon,
  iconSize = 16,
}: AddToCartContentProps) {
  const idleIcon =
    icon === false ? null : icon !== undefined ? icon : <CartGlyph size={iconSize} />;

  return (
    <>
      <span
        style={{ ...layerBase, ...(state === "idle" ? shown : above) }}
        aria-hidden={state !== "idle"}
      >
        {idleIcon}
        {idleLabel}
      </span>

      <span
        style={{
          ...overlayLayer,
          ...(state === "adding" ? shown : state === "idle" ? below : above),
        }}
        aria-hidden={state !== "adding"}
      >
        <Spinner size={iconSize} />
        {addingLabel}
      </span>

      <span
        style={{ ...overlayLayer, ...(state === "added" ? shown : below) }}
        aria-hidden={state !== "added"}
      >
        <CheckGlyph size={iconSize} />
        {addedLabel}
      </span>
    </>
  );
}

export default AddToCartContent;
