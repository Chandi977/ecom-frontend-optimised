import {
  getService,
  postService,
  patchService,
  deleteService,
} from "./service";

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

export interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  reviewerName: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  adminReply?: { message: string; repliedAt: string; repliedBy?: string } | null;
  images?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibility {
  verifiedPurchase: boolean;
  alreadyReviewed: boolean;
  canReview: boolean;
  review: Review | null;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

// `silent` on the eligibility / mine reads: guests hit these behind the axios
// interceptor and a 401 shouldn't spawn an error toast or a login redirect.
const quiet = { silent: true, suppressAuthRedirect: true, suppressErrorStatuses: [401, 403] };

export const reviewService = {
  getForProduct: (
    productId: string,
    params: { skip?: number; limit?: number; sort?: string; rating?: number } = {},
  ) => getService(`review/product/${encodeURIComponent(productId)}`, { params }),

  getSummary: (productId: string) =>
    getService(`review/summary/${encodeURIComponent(productId)}`, {}, { silent: true }),

  getEligibility: (productId: string) =>
    getService(`review/eligibility/${encodeURIComponent(productId)}`, {}, quiet),

  getMine: (productId: string) =>
    getService(`review/mine/${encodeURIComponent(productId)}`, {}, quiet),

  create: (payload: CreateReviewPayload) => postService("review/create", payload),

  update: (id: string, payload: Partial<CreateReviewPayload>) =>
    patchService(`review/${encodeURIComponent(id)}`, payload),

  remove: (id: string) => deleteService(`review/${encodeURIComponent(id)}`),

  markHelpful: (id: string) =>
    postService(`review/${encodeURIComponent(id)}/helpful`, {}, { silent: true }),
};

export default reviewService;
