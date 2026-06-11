import { create } from 'zustand';
import axios from 'axios';
import type { Dish, Comment, Paginated } from '@shared/types';

interface TagCount {
  tag: string;
  count: number;
}

interface DishStore {
  dishes: Dish[];
  tags: TagCount[];
  selectedTag: string | null;
  searchQuery: string;
  currentDish: Dish | null;
  loading: boolean;
  error: string | null;

  loadDishes: (tag?: string | null, userId?: string) => Promise<void>;
  loadTags: () => Promise<void>;
  loadDishDetail: (id: string) => Promise<Dish | null>;
  createDish: (data: Partial<Dish>) => Promise<Dish>;
  updateDish: (id: string, data: Partial<Dish>) => Promise<Dish>;
  deleteDish: (id: string) => Promise<void>;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCurrentDish: (dish: Dish | null) => void;
}

export const useDishStore = create<DishStore>((set, get) => ({
  dishes: [],
  tags: [],
  selectedTag: null,
  searchQuery: '',
  currentDish: null,
  loading: false,
  error: null,

  loadDishes: async (tag, userId) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (tag) params.tag = tag;
      if (userId) params.userId = userId;
      const res = await axios.get('/api/dishes', { params });
      set({ dishes: res.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      const mockDishes: Dish[] = [];
      set({ dishes: mockDishes, loading: false });
    }
  },

  loadTags: async () => {
    try {
      const res = await axios.get('/api/tags');
      set({ tags: res.data });
    } catch {
      const dishes = get().dishes;
      const tagMap = new Map<string, number>();
      dishes.forEach((d) => d.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
      const tags: TagCount[] = Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));
      set({ tags });
    }
  },

  loadDishDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(`/api/dishes/${id}`);
      set({ currentDish: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  createDish: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post('/api/dishes', data);
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateDish: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.put(`/api/dishes/${id}`, data);
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteDish: async (id) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`/api/dishes/${id}`);
      set((state) => ({
        dishes: state.dishes.filter((d) => d.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setSelectedTag: (tag) => set({ selectedTag: tag }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentDish: (dish) => set({ currentDish: dish }),
}));

interface CommentStore {
  comments: Comment[];
  loading: boolean;
  page: number;
  total: number;
  hasMore: boolean;

  loadComments: (dishId: string, page?: number, size?: number) => Promise<void>;
  addComment: (dishId: string, username: string, text: string) => Promise<Comment | null>;
  likeComment: (dishId: string, commentId: string) => Promise<void>;
  reset: () => void;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  loading: false,
  page: 1,
  total: 0,
  hasMore: true,

  loadComments: async (dishId, page = 1, size = 10) => {
    set({ loading: true });
    try {
      const res = await axios.get<Paginated<Comment>>(`/api/dishes/${dishId}/comments`, {
        params: { page, size },
      });
      const newComments = page === 1 ? res.data.data : [...get().comments, ...res.data.data];
      set({
        comments: newComments,
        page,
        total: res.data.total,
        hasMore: newComments.length < res.data.total,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  addComment: async (dishId, username, text) => {
    try {
      const res = await axios.post<Comment>(`/api/dishes/${dishId}/comments`, { username, text });
      set((state) => ({ comments: [res.data, ...state.comments] }));
      return res.data;
    } catch {
      return null;
    }
  },

  likeComment: async (dishId, commentId) => {
    try {
      await axios.post(`/api/dishes/${dishId}/comments/${commentId}/like`);
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, likes: c.likes + 1, liked: true } : c
        ),
      }));
    } catch {
      // ignore
    }
  },

  reset: () => set({ comments: [], page: 1, total: 0, hasMore: true }),
}));

interface UIStore {
  toast: { id: string; type: 'success' | 'error' | 'info'; message: string } | null;
  progress: boolean;
  publishModalOpen: boolean;
  editInitialData: Dish | null;

  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  hideToast: () => void;
  setProgress: (v: boolean) => void;
  openPublishModal: (initialData?: Dish | null) => void;
  closePublishModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toast: null,
  progress: false,
  publishModalOpen: false,
  editInitialData: null,

  showToast: (type, message) => {
    const id = Date.now().toString();
    set({ toast: { id, type, message } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 4000);
  },

  hideToast: () => set({ toast: null }),
  setProgress: (v) => set({ progress: v }),
  openPublishModal: (initialData = null) => set({ publishModalOpen: true, editInitialData: initialData }),
  closePublishModal: () => set({ publishModalOpen: false, editInitialData: null }),
}));
