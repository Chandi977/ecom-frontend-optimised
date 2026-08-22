import React, { useState } from "react";

interface StarRatingProps {
  // Display value (supports halves, e.g. 4.5) when not interactive.
  value?: number;
  // When provided the widget is interactive and calls this on click.
  onChange?: (value: number) => void;
  size?: number;
  activeColor?: string;
  emptyColor?: string;
  className?: string;
}

// A single star that can render full / half / empty via a clipped overlay.
const Star = ({
  fill,
  size,
  activeColor = "#eab308",
  emptyColor = "#3f3f46",
}: {
  fill: number;
  size: number;
  activeColor?: string;
  emptyColor?: string;
}) => (
  <span
    style={{
      position: "relative",
      display: "inline-block",
      width: size,
      height: size,
      lineHeight: `${size}px`,
    }}
  >
    <span style={{ color: emptyColor, fontSize: size, display: "block", lineHeight: `${size}px` }}>★</span>
    <span
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "hidden",
        width: `${Math.max(0, Math.min(1, fill)) * 100}%`,
        color: activeColor,
        fontSize: size,
        lineHeight: `${size}px`,
      }}
    >
      ★
    </span>
  </span>
);

/**
 * StarRating — read-only when `onChange` is omitted, interactive otherwise.
 * Read-only mode supports fractional values (rating averages); interactive
 * mode snaps to whole stars.
 */
const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  size = 18,
  activeColor = "#eab308",
  emptyColor = "#3f3f46",
  className = "",
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const shown = interactive && hover !== null ? hover : value;

  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-[2px] ${className}`}
      role={interactive ? "radiogroup" : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, shown - (star - 1)));
        if (!interactive)
          return <Star key={star} fill={fill} size={size} activeColor={activeColor} emptyColor={emptyColor} />;
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer tw-leading-none"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange?.(star)}
          >
            <Star
              fill={fill >= 0.5 || shown >= star ? 1 : 0}
              size={size}
              activeColor={activeColor}
              emptyColor={emptyColor}
            />
          </button>
        );
      })}
    </span>
  );
};

export default StarRating;
