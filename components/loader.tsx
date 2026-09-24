// Loader.js
import React from "react";

const Loader = ({ variant = "card", count = 1 }) => {
  if (variant === "spinner") {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-p-3">
        {/* data-motion-keep: progress feedback survives the reduced-motion
            guard in styles/globals.css — a frozen spinner reads as a hang. */}
        <div className="spinner" data-motion-keep role="status" aria-label="Loading"></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #e6e6e6;
            border-top: 3px solid #e92227;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="tw-w-full">
      <div className="tw-w-full tw-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {Array.from({ length: count }).map((_, index) => (
          <div className="tw-bg-white tw-border tw-border-[#ececec] tw-rounded-lg tw-p-3 tw-flex tw-flex-col" style={{ gap: '10px' }} key={index}>
            <div className="shimmer" style={{ height: '140px' }} />
            <div className="shimmer" style={{ height: '12px' }} />
            <div className="shimmer" style={{ height: '12px', width: '60%' }} />
            <div className="shimmer" style={{ height: '36px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #ececec 25%, #f5f5f5 37%, #ececec 63%);
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default Loader;
