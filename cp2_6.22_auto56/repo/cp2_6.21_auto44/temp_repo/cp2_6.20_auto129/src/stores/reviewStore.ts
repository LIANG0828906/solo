import { create } from 'zustand';
import { Review } from '../types';
import { reviewApi } from '../api/reviewApi';

interface ReviewState {
  reviews: Review[];
  total: number;
  isLoading: boolean;
  page: number;
  pageSize: number;

  fetchReviews: (page?: number, pageSize?: number) => Promise<void>;
  likeReview: (reviewId: string) => Promise<void>;
  createReview: (data: {
    bookIsbn: string;
    content: string;
    tags: string[];
  }) => Promise<Review | null>;
  loadMore: () => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  total: 0,
  isLoading: false,
  page: 1,
  pageSize: 10,

  fetchReviews: async (page = 1, pageSize = 10) => {
    set({ isLoading: true, page, pageSize });
    try {
      const result = await reviewApi.getReviews(page, pageSize);
      set({ reviews: result.list, total: result.total, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  likeReview: async (reviewId: string) => {
    const review = get().reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const wasLiked = review.isLiked;
    const prevLikes = review.likes;

    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === reviewId
          ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 }
          : r
      )
    }));

    try {
      await reviewApi.likeReview(reviewId);
    } catch (error) {
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === reviewId ? { ...r, isLiked: wasLiked, likes: prevLikes } : r
        )
      }));
    }
  },

  createReview: async (data) => {
    set({ isLoading: true });
    try {
      const newReview = await reviewApi.createReview(data);
      set((state) => ({
        reviews: [newReview, ...state.reviews],
        total: state.total + 1,
        isLoading: false
      }));
      return newReview;
    } catch (error) {
      set({ isLoading: false });
      return null;
    }
  },

  loadMore: async () => {
    const { page, pageSize, reviews, total, isLoading } = get();
    if (isLoading || reviews.length >= total) return;

    const nextPage = page + 1;
    set({ isLoading: true, page: nextPage });
    try {
      const result = await reviewApi.getReviews(nextPage, pageSize);
      set((state) => ({
        reviews: [...state.reviews, ...result.list],
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));
