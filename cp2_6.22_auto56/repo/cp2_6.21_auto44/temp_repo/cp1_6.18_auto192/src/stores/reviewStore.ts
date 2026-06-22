import { create } from 'zustand';
import axios from 'axios';

export interface Movie {
  id: string;
  title: string;
  year: number;
  director: string;
  poster: string;
  overview: string;
}

export interface Review {
  id: string;
  movieId: string;
  text: string;
  rating: number;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export type SortType = 'rating' | 'date';

interface ReviewStore {
  movies: Movie[];
  reviews: Review[];
  stats: ReviewStats;
  searchQuery: string;
  sortType: SortType;
  isLoading: boolean;
  searchMovies: (query: string) => Promise<void>;
  fetchReviews: (movieId: string) => Promise<void>;
  fetchStats: (movieId: string) => Promise<void>;
  addReview: (movieId: string, text: string, rating: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortType: (type: SortType) => void;
  getSortedReviews: () => Review[];
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  movies: [],
  reviews: [],
  stats: { averageRating: 0, totalReviews: 0 },
  searchQuery: '',
  sortType: 'date',
  isLoading: false,

  searchMovies: async (query: string) => {
    set({ isLoading: true, searchQuery: query });
    try {
      const res = await axios.get('/api/movies/search', { params: { q: query } });
      set({ movies: res.data });
    } catch (err) {
      console.error('搜索电影失败', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReviews: async (movieId: string) => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/api/reviews', { params: { movieId } });
      set({ reviews: res.data });
    } catch (err) {
      console.error('获取影评失败', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async (movieId: string) => {
    try {
      const res = await axios.get('/api/reviews/stats', { params: { movieId } });
      set({ stats: res.data });
    } catch (err) {
      console.error('获取评分统计失败', err);
    }
  },

  addReview: async (movieId: string, text: string, rating: number) => {
    try {
      await axios.post('/api/reviews', { movieId, text, rating });
      await get().fetchReviews(movieId);
      await get().fetchStats(movieId);
    } catch (err) {
      console.error('添加影评失败', err);
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSortType: (type: SortType) => set({ sortType: type }),

  getSortedReviews: () => {
    const { reviews, sortType } = get();
    const sorted = [...reviews];
    if (sortType === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  },
}));
