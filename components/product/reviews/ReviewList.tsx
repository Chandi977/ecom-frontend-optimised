import React, { useState } from "react";
import StarRating from "./StarRating";
import reviewService, { Review } from "../../../services/reviews";
import { getToken } from "../../../services/token";
import { toast } from "react-toastify";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso || "";
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    { bg: "#1a73e8", text: "#ffffff" }, // Google Blue
    { bg: "#e37400", text: "#ffffff" }, // Google Orange
    { bg: "#137333", text: "#ffffff" }, // Google Green
    { bg: "#a142f4", text: "#ffffff" }, // Google Purple
    { bg: "#d93025", text: "#ffffff" }, // Google Red
    { bg: "#007b83", text: "#ffffff" }, // Google Teal
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitial = (name: string) => {
  if (!name) return "U";
  return name.trim().charAt(0).toUpperCase();
};

const ReviewItem: React.FC<{ review: Review; isHorizontal?: boolean }> = ({
  review,
  isHorizontal = false,
}) => {
  const [helpful, setHelpful] = useState(review.helpfulCount || 0);
  const [voted, setVoted] = useState(false);

  const vote = async () => {
    if (voted) return;
    if (!getToken()) {
      toast.info("Please log in to mark reviews as helpful.");
      return;
    }
    setVoted(true);
    const res = await reviewService.markHelpful(review._id);
    if (res?.data?.data?.helpfulCount != null) {
      setHelpful(res.data.data.helpfulCount);
    } else {
      setHelpful((n) => n + 1);
    }
  };

  const rawTitle = review.title || "";
  const company = (review as any).company || (review as any).companyName || "";
  const name = review.reviewerName || company || rawTitle || "Industrial Customer";
  const displayTitle = rawTitle && rawTitle !== name ? rawTitle : "";
  const avatarStyle = getAvatarColor(name);
  const initial = getInitial(name);

  return (
    <div
      className={
        isHorizontal
          ? "tw-w-[300px] sm:tw-w-[360px] tw-shrink-0 tw-snap-start tw-bg-white tw-border tw-border-solid tw-border-[#dadce0] tw-rounded-2xl tw-p-5 tw-shadow-[0_1px_3px_rgba(60,64,67,0.08),0_1px_2px_rgba(60,64,67,0.16)] tw-transition-all hover:tw-shadow-[0_4px_12px_rgba(60,64,67,0.15)] tw-flex tw-flex-col tw-justify-between"
          : "tw-bg-white tw-border tw-border-solid tw-border-[#dadce0] tw-rounded-2xl tw-p-5 sm:tw-p-6 tw-mb-4 tw-shadow-[0_1px_3px_rgba(60,64,67,0.08),0_1px_2px_rgba(60,64,67,0.16)] tw-transition-all hover:tw-shadow-[0_4px_12px_rgba(60,64,67,0.15)]"
      }
    >
      <div>
        {/* Google Maps Style Header: Avatar + Author Info + Google G Accent */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-3">
          <div className="tw-flex tw-items-center tw-gap-3">
            {/* User Avatar Circle */}
            <div
              className="tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm tw-shrink-0 tw-shadow-inner"
              style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
            >
              {initial}
            </div>

            <div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <h4 className="tw-text-[#202124] tw-font-semibold tw-text-[15px] tw-m-0 tw-leading-snug">
                  {name}
                </h4>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-mt-0.5">
                {company && company !== name && (
                  <span className="tw-text-[#70757a] tw-text-[12px] tw-font-medium">
                    {company}
                  </span>
                )}
                {review.verifiedPurchase !== false && (
                  <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-font-bold tw-tracking-wider tw-uppercase tw-text-emerald-700 tw-bg-emerald-50 tw-border tw-border-solid tw-border-emerald-200 tw-px-1.5 tw-py-0.5 tw-rounded-md">
                    VERIFIED B2B
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rating Stars & Timestamp */}
        <div className="tw-flex tw-items-center tw-gap-2.5 tw-mb-3">
          <StarRating value={review.rating} size={16} activeColor="#f4b400" emptyColor="#dadce0" />
          <span className="tw-text-[12px] tw-text-[#70757a] tw-font-normal">
            {formatDate(review.createdAt)}
          </span>
        </div>

        {/* Optional Review Title / Headline */}
        {displayTitle && (
          <h5 className="tw-text-[#202124] tw-font-bold tw-text-[14px] tw-m-0 tw-mb-1.5">
            {displayTitle}
          </h5>
        )}

        {/* Review Comment (Google Maps style clean text) */}
        <p className="tw-text-[#3c4043] tw-text-[14px] tw-leading-relaxed tw-m-0 tw-whitespace-pre-wrap tw-font-normal">
          {review.comment}
        </p>

        {/* Response from Store / Owner (Sleek Threaded Response) */}
        {review.adminReply?.message ? (
          <div className="tw-mt-4 tw-p-3.5 tw-bg-slate-50 tw-rounded-xl tw-border-0">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1.5">
              <div className="tw-w-6 tw-h-6 tw-rounded-full tw-bg-[#182c5a] tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[11px] tw-font-bold tw-shrink-0">
                P
              </div>
              <span className="tw-text-[13px] tw-font-bold tw-text-slate-900">
                Response from Prem Packaging
              </span>
            </div>
            <p className="tw-text-[13px] tw-text-slate-600 tw-m-0 tw-leading-relaxed tw-whitespace-pre-wrap tw-pl-8">
              {review.adminReply.message}
            </p>
          </div>
        ) : null}
      </div>

      {/* Helpful Action (Frameless / No Outer Border) */}
      <div className="tw-mt-4 tw-flex tw-items-center tw-justify-end">
        <button
          type="button"
          onClick={vote}
          disabled={voted}
          className={
            voted
              ? "tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-medium tw-text-indigo-600 tw-bg-transparent tw-border-0 tw-p-1 tw-cursor-default"
              : "tw-inline-flex tw-items-center tw-gap-1.5 tw-text-[13px] tw-font-medium tw-text-slate-500 hover:tw-text-slate-900 tw-bg-transparent tw-border-0 tw-p-1 tw-cursor-pointer tw-transition-colors"
          }
        >
          <span>👍</span>
          <span>Helpful</span>
          {helpful > 0 && <span className="tw-text-slate-600">({helpful})</span>}
        </button>
      </div>
    </div>
  );
};

interface Props {
  reviews: Review[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
}

const SORT_OPTIONS = [
  { label: "Most recent", value: "recent" },
  { label: "Most helpful", value: "helpful" },
  { label: "Highest rated", value: "rating_high" },
  { label: "Lowest rated", value: "rating_low" },
];

const ReviewList: React.FC<Props> = ({
  reviews,
  hasMore,
  loadingMore,
  onLoadMore,
  sort,
  onSortChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reviews.length) {
    return (
      <div className="tw-text-center tw-text-slate-500 tw-text-[14px] tw-py-12 tw-bg-white tw-border tw-border-solid tw-border-slate-200 tw-rounded-xl">
        No industrial reviews yet. Be the first to review this product.
      </div>
    );
  }

  return (
    <div>
      {/* Optional Sort options bar if passed explicitly */}
      {sort && onSortChange ? (
        <div className="tw-flex tw-items-center tw-justify-end tw-mb-3">
          <label className="tw-text-[12px] tw-text-slate-500 tw-mr-2 tw-font-medium">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="tw-text-[12px] tw-bg-white tw-text-slate-800 tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-px-2.5 tw-py-1 focus:tw-outline-none focus:tw-border-slate-400 tw-font-medium"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="tw-bg-white tw-text-slate-800">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!isExpanded ? (
        /* Horizontal Scroll List View */
        <div className="tw-w-full">
          <div className="tw-flex tw-overflow-x-auto tw-gap-4 tw-pb-4 tw-pt-1 tw-snap-x tw-snap-mandatory tw-scroll-smooth reviews-horizontal-scroll">
            {reviews.map((r) => (
              <ReviewItem key={r._id} review={r} isHorizontal />
            ))}
          </div>

          {/* Read More / View All Reviews Button */}
          <div className="tw-mt-4 tw-flex tw-justify-center tw-items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="tw-bg-slate-900 hover:tw-bg-slate-800 tw-text-white tw-font-bold tw-text-xs sm:tw-text-sm tw-uppercase tw-tracking-wider tw-px-6 tw-py-3 tw-rounded-xl tw-border-0 tw-cursor-pointer tw-transition-all tw-shadow-sm hover:tw-shadow-md tw-flex tw-items-center tw-gap-2"
            >
              <span>Read More Reviews ({reviews.length})</span>
              <span className="material-symbols-outlined tw-text-base">expand_more</span>
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Full Vertical List View */
        <div>
          <div className="tw-space-y-4">
            {reviews.map((r) => (
              <ReviewItem key={r._id} review={r} isHorizontal={false} />
            ))}
          </div>

          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-3">
            {hasMore && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="tw-text-white tw-font-bold tw-text-xs sm:tw-text-sm tw-bg-slate-900 hover:tw-bg-slate-800 tw-border-0 tw-rounded-xl tw-px-6 tw-py-3 tw-cursor-pointer disabled:tw-opacity-60 tw-transition-colors tw-shadow-sm"
              >
                {loadingMore ? "Loading…" : "Load more reviews"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="tw-bg-slate-100 hover:tw-bg-slate-200 tw-text-slate-800 tw-font-bold tw-text-xs sm:tw-text-sm tw-uppercase tw-tracking-wider tw-px-6 tw-py-3 tw-rounded-xl tw-border tw-border-solid tw-border-slate-300 tw-cursor-pointer tw-transition-colors tw-flex tw-items-center tw-gap-2"
            >
              <span>Show Less</span>
              <span className="material-symbols-outlined tw-text-base">expand_less</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .reviews-horizontal-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .reviews-horizontal-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .reviews-horizontal-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .reviews-horizontal-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .reviews-horizontal-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ReviewList;
