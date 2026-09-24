import React, { useState } from "react";
import { toast } from "react-toastify";
import StarRating from "./StarRating";
import reviewService, { Review } from "../../../services/reviews";

interface Props {
  productId: string;
  // Present when editing the caller's existing review.
  existing?: Review | null;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

/**
 * Write / edit B2B review form in dark theme mode.
 */
const ReviewForm: React.FC<Props> = ({ productId, existing, onSubmitted, onCancel }) => {
  const [rating, setRating] = useState<number>(existing?.rating || 0);
  const [title, setTitle] = useState<string>(existing?.title || "");
  const [comment, setComment] = useState<string>(existing?.comment || "");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!existing;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.warn("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 3) {
      toast.warn("Please write a few words about the product.");
      return;
    }
    setSubmitting(true);
    const res = isEdit
      ? await reviewService.update(existing!._id, { rating, title: title.trim(), comment: comment.trim() })
      : await reviewService.create({ productId, rating, title: title.trim(), comment: comment.trim() });
    setSubmitting(false);

    if (res?.data?.success) {
      toast.success(res.data.message || "Review submitted.");
      onSubmitted?.();
    }
  };

  return (
    <form onSubmit={submit} className="tw-bg-slate-50 tw-rounded-xl tw-p-6 tw-border tw-border-solid tw-border-slate-200 tw-mb-6">
      <h4 className="tw-text-slate-900 tw-font-bold tw-text-[16px] tw-m-0 tw-mb-4">
        {isEdit ? "Edit your B2B review" : "Write a B2B review"}
      </h4>

      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <span className="tw-text-[14px] tw-text-slate-700 tw-font-medium">Your rating:</span>
        <StarRating value={rating} onChange={setRating} size={24} activeColor="#f59e0b" emptyColor="#cbd5e1" />
      </div>

      <input
        type="text"
        value={title}
        maxLength={150}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Job Title & Company (e.g. Logistics Manager, TechHub)"
        className="tw-w-full tw-bg-white tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-px-3.5 tw-py-2.5 tw-text-[14px] tw-text-slate-900 placeholder:tw-text-slate-400 tw-mb-3 focus:tw-outline-none focus:tw-border-slate-900"
      />

      <textarea
        value={comment}
        maxLength={3000}
        rows={4}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share detailed feedback on performance, durability, shipping speed, etc…"
        className="tw-w-full tw-bg-white tw-border tw-border-solid tw-border-slate-200 tw-rounded-lg tw-px-3.5 tw-py-2.5 tw-text-[14px] tw-text-slate-900 placeholder:tw-text-slate-400 tw-resize-y focus:tw-outline-none focus:tw-border-slate-900"
      />

      <div className="tw-flex tw-items-center tw-gap-3 tw-mt-4">
        <button
          type="submit"
          disabled={submitting}
          className="tw-bg-slate-900 tw-text-white tw-font-bold tw-text-[13px] tw-px-5 tw-py-2.5 tw-rounded-lg tw-border-0 tw-cursor-pointer hover:tw-bg-slate-800 disabled:tw-opacity-60 tw-transition-colors tw-shadow-sm"
        >
          {submitting ? "Submitting…" : isEdit ? "Update Review" : "Submit B2B Review"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="tw-bg-white tw-text-slate-700 tw-text-[13px] tw-px-4 tw-py-2.5 tw-rounded-lg tw-border tw-border-solid tw-border-slate-200 tw-cursor-pointer hover:tw-bg-slate-100 tw-transition-colors"
          >
            Cancel
          </button>
        ) : null}
      </div>
      <p className="tw-text-[12px] tw-text-slate-500 tw-mt-3 tw-m-0">
        Verified reviews are evaluated prior to publication.
      </p>
    </form>
  );
};

export default ReviewForm;
