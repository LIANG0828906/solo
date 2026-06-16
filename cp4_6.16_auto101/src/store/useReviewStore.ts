import { create } from 'zustand';
import type { Review } from '../types';
import { ReviewModule } from '../modules/review/ReviewModule';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;

  loadUserReviews: (userId: string) => Promise<void>;
  createReview: (
    data: Omit<Review, 'id' | 'createdAt'>
  ) => Promise<Review | null>;
  getUserReviews: (userId: string) => Review[];
  getExchangeReviews: (exchangeRequestId: string) => Review[];
  hasUserReviewed: (
    exchangeRequestId: string,
    reviewerId: string
  ) => boolean;
  refreshReviews: () => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  loadUserReviews: async (userId: string) => {
    set({ isLoading: true });
    try {
      const reviews = await ReviewModule.getUserReviews(userId);
      set({ reviews });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createReview: async (data) => {
    set({ isLoading: true });
    try {
      const review = await ReviewModule.createReview(data);
      if (review) {
        set((state) => ({
          reviews: [review, ...state.reviews],
        }));
      }
      return review;
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  getUserReviews: (userId: string) => {
    const { reviews } = get();
    return reviews
      .filter((r) => r.revieweeId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getExchangeReviews: (exchangeRequestId: string) => {
    const { reviews } = get();
    return reviews.filter((r) => r.exchangeRequestId === exchangeRequestId);
  },

  hasUserReviewed: (exchangeRequestId: string, reviewerId: string) => {
    const { reviews } = get();
    return reviews.some(
      (r) =>
        r.exchangeRequestId === exchangeRequestId &&
        r.reviewerId === reviewerId
    );
  },

  refreshReviews: async () => {
    const allReviews = await ReviewModule.getUserReviews('');
    set({ reviews: allReviews });
  },
}));
