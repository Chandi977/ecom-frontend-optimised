import React from "react";

/**
 * YouTube-style skeleton placeholders for product cards.
 *
 * A light-grey block with a highlight band that sweeps left-to-right on a
 * loop (the same "shimmer" effect YouTube uses while thumbnails load), instead
 * of MUI's default fading pulse. Each variant mirrors the real card's layout
 * and dimensions so nothing shifts once the actual product renders.
 *
 *   variant="grid"   -> DesktopLisingCard (3/4-up desktop grid)
 *   variant="mobile" -> ListingCard (2-up mobile grid)
 *   variant="list"   -> ListingCardDesktop (horizontal list row)
 */

type Variant = "grid" | "mobile" | "list";

const shimmerStyles = (
  <style jsx>{`
    .pp-skel {
      background: linear-gradient(
        90deg,
        #e9e9e9 25%,
        #f5f5f5 37%,
        #e9e9e9 63%
      );
      background-size: 400% 100%;
      animation: pp-shimmer 1.4s ease infinite;
      border-radius: 6px;
    }
    @keyframes pp-shimmer {
      0% {
        background-position: 100% 0;
      }
      100% {
        background-position: -100% 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pp-skel {
        animation: none;
        background: #ececec;
      }
    }
  `}</style>
);

function ProductCardSkeleton({ variant = "grid" }: { variant?: Variant }) {
  if (variant === "mobile") {
    return (
      <div
        className="tw-flex tw-flex-col tw-w-full tw-min-h-[326px] tw-bg-white"
        style={{ border: "1px solid #d9dde6" }}
        aria-hidden="true"
      >
        <div
          className="tw-relative tw-flex tw-justify-center tw-items-center tw-w-full tw-overflow-hidden"
          style={{ height: "164px" }}
        >
          <div className="pp-skel" style={{ width: "154px", height: "112px" }} />
        </div>
        <div
          className="tw-flex tw-flex-col tw-w-full tw-flex-1"
          style={{ gap: "9px", padding: "0 12px 12px" }}
        >
          <div className="pp-skel" style={{ height: "12px", width: "90%" }} />
          <div className="pp-skel" style={{ height: "12px", width: "70%" }} />
          <div className="pp-skel" style={{ height: "10px", width: "82%" }} />
          <div
            className="pp-skel"
            style={{ height: "18px", width: "42%", marginTop: "auto" }}
          />
          <div
            className="pp-skel"
            style={{ height: "34px", width: "100%", borderRadius: 0 }}
          />
        </div>
        {shimmerStyles}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <>
        <div className="col-4 d-flex flex-column align-items-center justify-content-center">
          <div className="pp-skel" style={{ width: "180px", height: "120px" }} />
        </div>
        <div className="col-8 py-4 px-0 d-flex flex-column align-items-start justify-content-start gap-2">
          <div className="pp-skel" style={{ height: "16px", width: "80%" }} />
          <div className="pp-skel" style={{ height: "16px", width: "55%" }} />
          <div
            className="pp-skel"
            style={{ height: "28px", width: "40%", marginTop: "6px" }}
          />
          <div
            className="pp-skel"
            style={{ height: "36px", width: "70%", marginTop: "8px" }}
          />
        </div>
        {shimmerStyles}
      </>
    );
  }

  // variant === "grid"
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "min(100%, 300px)",
        minHeight: "380px",
        border: "1px solid #d9dde6",
        background: "#fff",
      }}
      aria-hidden="true"
    >
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "250px", width: "100%", padding: "30px 12px 12px" }}
      >
        <div className="pp-skel" style={{ width: "260px", height: "170px" }} />
      </div>
      <div
        className="d-flex flex-column"
        style={{ flex: 1, width: "100%", padding: "0 18px 16px", gap: "8px" }}
      >
        <div className="pp-skel" style={{ height: "14px", width: "84%" }} />
        <div className="pp-skel" style={{ height: "14px", width: "64%" }} />
        <div className="pp-skel" style={{ height: "11px", width: "78%" }} />
        <div
          className="d-flex align-items-end justify-content-between"
          style={{ gap: "12px", marginTop: "auto" }}
        >
          <div className="pp-skel" style={{ height: "22px", width: "72px" }} />
          <div
            className="pp-skel"
            style={{ height: "38px", width: "110px", borderRadius: 0 }}
          />
        </div>
      </div>
      {shimmerStyles}
    </div>
  );
}

export default ProductCardSkeleton;
