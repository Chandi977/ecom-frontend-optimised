import React from "react";

const InfiniteScrollSentinel = ({ loadMoreRef, isFetchingMore }) => (
  <>
    <div ref={loadMoreRef} style={{ height: "1px" }} />
    {isFetchingMore && (
      <div className="row">
        <div
          className="col d-flex flex-column align-items-center justify-content-center"
          style={{ paddingBottom: "24px", gap: "8px" }}
        >
          <div className="pp-sentinel-skel" style={{ width: "180px" }} />
          <div className="pp-sentinel-skel" style={{ width: "120px" }} />
        </div>
        <style jsx>{`
          .pp-sentinel-skel {
            height: 12px;
            border-radius: 6px;
            background: linear-gradient(
              90deg,
              #e9e9e9 25%,
              #f5f5f5 37%,
              #e9e9e9 63%
            );
            background-size: 400% 100%;
            animation: pp-sentinel-shimmer 1.4s ease infinite;
          }
          @keyframes pp-sentinel-shimmer {
            0% {
              background-position: 100% 0;
            }
            100% {
              background-position: -100% 0;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .pp-sentinel-skel {
              animation: none;
              background: #ececec;
            }
          }
        `}</style>
      </div>
    )}
  </>
);

export default InfiniteScrollSentinel;
