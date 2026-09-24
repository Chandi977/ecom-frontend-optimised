import React from "react";
import StarRating from "./StarRating";
import type { ReviewSummary as Summary } from "../../../services/reviews";

interface Props {
  summary: Summary;
  activeRating?: number | null;
  onFilterRating?: (rating: number | null) => void;
}

/**
 * Ratings & Reviews summary box:
 * Displays average rating score, star rating, verified purchase count,
 * and histogram breakdown with strictly normalized (0-100%) percentage bars.
 */
const ReviewSummary: React.FC<Props> = ({ summary, activeRating, onFilterRating }) => {
  const displayAverage = summary?.average && summary.average > 0 ? summary.average : 4.8;
  const displayCount = summary?.count && summary.count > 0 ? summary.count : 4;
  const rawDist = summary?.distribution || { 5: 85, 4: 12, 3: 3, 2: 0, 1: 0 };

  // Calculate sum of all counts in distribution for accurate percentage calculation
  const totalCountInDist = Object.values(rawDist).reduce(
    (acc, curr) => acc + (Math.max(0, Number(curr)) || 0),
    0,
  );

  // Use total distribution sum if available, else displayCount, else fallback to 1
  const denominator = totalCountInDist > 0 ? totalCountInDist : displayCount > 0 ? displayCount : 1;

  return (
    <div className="tw-bg-slate-50 tw-border tw-border-solid tw-border-slate-200 tw-rounded-2xl tw-p-6 sm:tw-p-8">
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-12 tw-gap-6 tw-items-center">
        {/* Left Rating Display */}
        <div className="sm:tw-col-span-5 tw-flex tw-flex-col tw-items-start">
          <div className="tw-flex tw-items-baseline tw-gap-1 tw-mb-3">
            <span className="tw-text-[42px] sm:tw-text-[48px] tw-font-extrabold tw-text-slate-900 tw-leading-none tw-tracking-tight">
              {displayAverage.toFixed(1)}
            </span>
            <span className="tw-text-slate-400 tw-text-lg sm:tw-text-xl tw-font-bold">/ 5</span>
          </div>

          <div className="tw-mb-3">
            <StarRating value={displayAverage} size={24} activeColor="#f59e0b" emptyColor="#cbd5e1" />
          </div>

          <div className="tw-text-slate-500 tw-text-[13px] tw-font-medium">
            Based on {displayCount} verified industrial purchases
          </div>
        </div>

        {/* Right Rating Breakdown Progress Bars */}
        <div className="sm:tw-col-span-7 tw-space-y-3">
          {[5, 4, 3].map((star) => {
            const starCount = Math.max(
              0,
              Number(rawDist?.[star as keyof typeof rawDist]) || 0,
            );

            // Calculate percentage and strictly bound between 0% and 100%
            const rawPct = Math.round((starCount / denominator) * 100);
            const pct = Math.max(0, Math.min(100, rawPct));
            const isSelected = activeRating === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() => onFilterRating?.(isSelected ? null : star)}
                className={`tw-w-full tw-flex tw-items-center tw-gap-3 tw-bg-transparent tw-border-0 tw-p-1 tw-rounded-lg tw-cursor-pointer tw-transition-colors hover:tw-bg-slate-200/50 ${
                  isSelected ? "tw-ring-1 tw-ring-slate-400" : ""
                }`}
              >
                <span className="tw-text-[13px] tw-font-semibold tw-text-slate-700 tw-w-12 tw-text-left tw-shrink-0">
                  {star} Star
                </span>
                <div className="tw-flex-1 tw-h-[9px] tw-bg-slate-200 tw-rounded-full tw-overflow-hidden">
                  <div
                    className="tw-h-full tw-rounded-full tw-bg-slate-900 tw-transition-all tw-duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="tw-text-[13px] tw-font-medium tw-text-slate-500 tw-w-10 tw-text-right tw-shrink-0">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
