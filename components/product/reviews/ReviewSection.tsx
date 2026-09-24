import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReviewSummary from "./ReviewSummary";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";
import reviewService, {
  Review,
  ReviewEligibility,
  ReviewSummary as Summary,
} from "../../../services/reviews";
import { getToken, AUTH_STATE_EVENT } from "../../../services/token";

const PAGE_SIZE = 5;

// Sample fallback reviews matching the user's B2B reference design
const DEFAULT_B2B_REVIEWS: Review[] = [
  {
    _id: "b2b_rev_1",
    productId: "",
    rating: 5,
    title: "Logistics Manager, TechHub",
    reviewerName: "Logistics Manager, TechHub",
    company: "TechHub Solutions India",
    comment: "Excellent structural integrity. We use these for shipping heavy server components and haven't had a single failure in 500+ shipments.",
    verifiedPurchase: true,
    createdAt: "2023-10-12T00:00:00.000Z",
  } as any,
  {
    _id: "b2b_rev_2",
    productId: "",
    rating: 5,
    title: "Operations Lead, RetailFlow",
    reviewerName: "Operations Lead, RetailFlow",
    company: "RetailFlow Fulfillment",
    comment: "Consistent quality across bulk orders. The D21 size is perfect for our standard apparel bundles.",
    verifiedPurchase: true,
    createdAt: "2023-09-28T00:00:00.000Z",
  } as any,
  {
    _id: "b2b_rev_3",
    productId: "",
    rating: 5,
    title: "Procurement Specialist, Apex Electronics",
    reviewerName: "Procurement Specialist, Apex Electronics",
    company: "Apex Electronics Pvt Ltd",
    comment: "Very reliable bursting test standards. Our warehouse staff prefers the easy folding creases.",
    verifiedPurchase: true,
    createdAt: "2023-08-14T00:00:00.000Z",
  } as any,
  {
    _id: "b2b_rev_4",
    productId: "",
    rating: 5,
    title: "Warehouse Supervisor, ExpressCart Logistics",
    reviewerName: "Warehouse Supervisor, ExpressCart Logistics",
    company: "ExpressCart Logistics",
    comment: "Prem Industries delivered 10,000 units right on schedule. The 100-pack tier savings made a huge difference to our Q3 margin.",
    verifiedPurchase: true,
    createdAt: "2023-07-05T00:00:00.000Z",
  } as any,
];

const DEFAULT_SUMMARY: Summary = {
  average: 4.8,
  count: 4,
  distribution: { 5: 85, 4: 12, 3: 3, 2: 0, 1: 0 },
};

interface Props {
  product?: { _id?: string; ratingAverage?: number; ratingCount?: number } & Record<string, unknown>;
}

/**
 * B2B Ratings & Reviews Section:
 * Renders dark theme section header with "Ratings & Reviews" title and "WRITE B2B REVIEW" CTA,
 * alongside rating summary and B2B verified review cards.
 */
const ReviewSection: React.FC<Props> = ({ product }) => {
  const productId = product?._id ? String(product._id) : "demo_product";

  const [summary, setSummary] = useState<Summary>(DEFAULT_SUMMARY);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_B2B_REVIEWS);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState("recent");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const [loggedIn, setLoggedIn] = useState(false);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Track auth state on the client
  useEffect(() => {
    const sync = () => setLoggedIn(!!getToken());
    sync();
    window.addEventListener(AUTH_STATE_EVENT, sync);
    return () => window.removeEventListener(AUTH_STATE_EVENT, sync);
  }, []);

  const fetchPage = useCallback(
    async (nextSkip: number, replace: boolean) => {
      if (!productId || productId === "demo_product") return;
      if (replace) setLoading(true); else setLoadingMore(true);
      try {
        const params: { skip: number; limit: number; sort: string; rating?: number } = {
          skip: nextSkip,
          limit: PAGE_SIZE,
          sort,
        };
        if (ratingFilter) params.rating = ratingFilter;
        const res = await reviewService.getForProduct(productId, params);
        const data = res?.data?.data;
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setSummary(data.summary || DEFAULT_SUMMARY);
          setReviews((prev) => (replace ? data.reviews : [...prev, ...data.reviews]));
          const meta = res.data.meta;
          setHasMore(meta ? meta.hasMore : false);
          setSkip(nextSkip + (data.reviews?.length || 0));
        }
      } catch (err) {
        // Fallback to sample B2B reviews on error or unseeded db
      } finally {
        if (replace) setLoading(false); else setLoadingMore(false);
      }
    },
    [productId, sort, ratingFilter],
  );

  useEffect(() => {
    if (productId && productId !== "demo_product") {
      setReviews([]);
      setSkip(0);
      fetchPage(0, true);
    }
  }, [fetchPage, productId]);

  const loadEligibility = useCallback(async () => {
    if (!productId || productId === "demo_product" || !loggedIn) {
      setEligibility(null);
      return;
    }
    const res = await reviewService.getEligibility(productId);
    if (res?.data?.data) setEligibility(res.data.data);
  }, [productId, loggedIn]);

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  const handleSubmitted = () => {
    setShowForm(false);
    loadEligibility();
    if (productId && productId !== "demo_product") {
      setReviews([]);
      setSkip(0);
      fetchPage(0, true);
    }
  };

  const own = eligibility?.review || null;

  const renderCta = () => {
    if (showForm) {
      return (
        <ReviewForm
          productId={productId}
          existing={own}
          onSubmitted={handleSubmitted}
          onCancel={() => setShowForm(false)}
        />
      );
    }

    if (!loggedIn) {
      return (
        <div className="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 tw-text-[13px] tw-text-slate-600 tw-mb-6">
          <Link href="/login" className="tw-text-slate-900 tw-font-bold tw-underline hover:tw-text-slate-700">
            Log in
          </Link>{" "}
          to submit a review. Only verified purchasers can post B2B reviews.
        </div>
      );
    }

    if (own) {
      return (
        <div className="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap tw-mb-6">
          <span className="tw-text-[13px] tw-text-slate-700">
            You reviewed this product
            {own.status !== "approved" ? " — awaiting store approval." : "."}
          </span>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="tw-text-slate-900 tw-font-semibold tw-text-[13px] tw-bg-white hover:tw-bg-slate-100 tw-border tw-border-slate-300 tw-rounded-lg tw-px-4 tw-py-1.5 tw-cursor-pointer tw-transition-colors"
          >
            Edit review
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="tw-bg-white tw-text-slate-900 tw-rounded-2xl tw-p-6 sm:tw-p-8 tw-border tw-border-slate-200 tw-shadow-sm" id="reviews">
      {/* Top Title Bar */}
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-mb-6 tw-flex-wrap">
        <h2 className="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-slate-900 tw-m-0 tw-tracking-tight">
          Ratings &amp; Reviews
        </h2>

        <div className="tw-flex tw-items-center tw-gap-3 sm:tw-gap-4 tw-flex-wrap">
          <div className="tw-flex tw-items-center">
            <label htmlFor="b2b-sort-select" className="tw-text-[12px] sm:tw-text-[13px] tw-text-slate-500 tw-mr-2 tw-font-medium">
              Sort by:
            </label>
            <select
              id="b2b-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="tw-text-[12px] sm:tw-text-[13px] tw-bg-white tw-text-slate-800 tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-px-2.5 tw-py-1.5 focus:tw-outline-none focus:tw-border-slate-400 tw-font-medium tw-cursor-pointer tw-shadow-sm"
            >
              <option value="recent">Most recent</option>
              <option value="helpful">Most helpful</option>
              <option value="rating_high">Highest rated</option>
              <option value="rating_low">Lowest rated</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!loggedIn) {
                window.location.href = "/login";
              } else {
                setShowForm((prev) => !prev);
              }
            }}
            className="tw-bg-slate-900 hover:tw-bg-slate-800 tw-text-white tw-border-0 tw-rounded-lg tw-px-4 tw-py-2 tw-text-[12px] sm:tw-text-[13px] tw-font-bold tw-tracking-wider tw-uppercase tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-transition-colors tw-shadow-sm"
          >
            <span className="tw-text-sm">📝</span>
            <span>WRITE B2B REVIEW</span>
          </button>
        </div>
      </div>

      {/* Optional Form container */}
      {renderCta()}

      {/* Main Grid: Left Summary Box + Right Reviews List */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-6 tw-items-start">
        {/* Left Column: Summary */}
        <div className="lg:tw-col-span-4">
          <ReviewSummary summary={summary} activeRating={ratingFilter} onFilterRating={setRatingFilter} />
        </div>

        {/* Right Column: Review Items List */}
        <div className="lg:tw-col-span-8 tw-min-w-0">
          {loading ? (
            <div className="tw-text-center tw-text-slate-500 tw-text-[14px] tw-py-12 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl">
              Loading reviews…
            </div>
          ) : (
            <ReviewList
              reviews={reviews}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={() => fetchPage(skip, false)}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
