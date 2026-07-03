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
        className="tw-flex tw-flex-col tw-w-full tw-min-h-[288px] tw-bg-[#f9f9f9]"
        aria-hidden="true"
      >
        <div
          className="tw-relative tw-flex tw-justify-center tw-items-center tw-w-full tw-overflow-hidden"
          style={{ height: "150px" }}
        >
          <div className="pp-skel" style={{ width: "110px", height: "103px" }} />
        </div>
        <div
          className="tw-flex tw-flex-col tw-w-full tw-flex-1"
          style={{ gap: "10px", padding: "14px 12px 10px" }}
        >
          <div className="pp-skel" style={{ height: "12px", width: "90%" }} />
          <div className="pp-skel" style={{ height: "12px", width: "70%" }} />
          <div
            className="pp-skel"
            style={{ height: "14px", width: "45%", margin: "6px auto 0" }}
          />
        </div>
        <div
          className="pp-skel"
          style={{ height: "38px", width: "100%", borderRadius: 0 }}
        />
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
    <div style={{ display: "flex", flexDirection: "column" }} aria-hidden="true">
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "200px", width: "300px" }}
      >
        <div className="pp-skel" style={{ width: "250px", height: "150px" }} />
      </div>
      <div
        className="d-flex flex-column justify-content-evenly align-items-center"
        style={{ height: "120px", width: "300px", paddingTop: "20px", gap: "10px" }}
      >
        <div className="pp-skel" style={{ height: "14px", width: "80%" }} />
        <div className="pp-skel" style={{ height: "14px", width: "60%" }} />
        <div className="pp-skel" style={{ height: "16px", width: "40%" }} />
      </div>
      <div
        className="pp-skel"
        style={{ height: "50px", width: "300px", borderRadius: 0 }}
      />
      {shimmerStyles}
    </div>
  );
}

export default ProductCardSkeleton;
