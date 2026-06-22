import { create } from 'zustand';
import * as T from '@shared/types';
import * as API from '../lib/api';

interface CommentState {
  comments: T.Comment[];
  page: number;
  size: number;
  total: number;
  loadingMore: boolean;
  hasMore: boolean;
  reset: () => void;
  loadPage: (dishId: string, page?: number, size?: number) => Promise<void>;
  add: (dishId: string, payload: { username: string; text: string }) => Promise<void>;
  like: (dishId: string, cid: string) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  page: 1,
  size: 5,
  total: 0,
  loadingMore: false,
  hasMore: false,

  reset: () => {
    set({
      comments: [],
      page: 1,
      size: 5,
      total: 0,
      loadingMore: false,
      hasMore: false,
    });
  },

  loadPage: async (dishId: string, page: number = 1, size: number = 5) => {
    set({ loadingMore: true });
    try {
      const result = await API.listComments(dishId, page, size);
      if (page === 1) {
        set({
          comments: result.data,
          page: result.page,
          size: result.size,
          total: result.total,
          hasMore: result.hasMore,
        });
      } else {
        set((state) => ({
          comments: [...state.comments, ...result.data],
          page: result.page,
          size: result.size,
          total: result.total,
          hasMore: result.hasMore,
        }));
      }
    } finally {
      set({ loadingMore: false });
    }
  },

  add: async (dishId: string, payload: { username: string; text: string }) => {
    const created = await API.createComment(dishId, payload);
    set((state) => ({
      comments: [created, ...state.comments],
      total: state.total + 1,
    }));
  },

  like: async (dishId: string, cid: string) => {
    const updated = await API.likeComment(dishId, cid);
    set((state) => ({
      comments: state.comments.map((c) => (c.id === cid ? updated : c)),
    }));
  },
}));
