import { create } from 'zustand';
import axios from 'axios';
import type { CanvasComponent, CanvasText } from '../utils/componentRenderer';

export interface Meme {
  id: string;
  imageUrl: string;
  author: string;
  authorAvatar: string;
  likes: number;
  commentsCount: number;
  tags: string[];
  description: string;
  createdAt: number;
  components: CanvasComponent[];
  text: CanvasText | null;
}

export interface Comment {
  id: string;
  memeId: string;
  author: string;
  content: string;
  createdAt: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface GalleryState {
  memes: Meme[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  toast: Toast | null;
  comments: Record<string, Comment[]>;
  likedMemes: Record<string, boolean>;
  canvasComponents: CanvasComponent[];
  canvasText: CanvasText | null;
  selectedComponentId: string | null;
  addMeme: (meme: Meme) => void;
  setMemes: (memes: Meme[]) => void;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  fetchMemes: (page?: number) => Promise<void>;
  likeMeme: (memeId: string) => Promise<void>;
  fetchComments: (memeId: string) => Promise<void>;
  addComment: (memeId: string, author: string, content: string) => Promise<void>;
  addCanvasComponent: (component: CanvasComponent) => void;
  updateCanvasComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  removeCanvasComponent: (id: string) => void;
  setCanvasText: (text: CanvasText | null) => void;
  updateCanvasText: (updates: Partial<CanvasText>) => void;
  setSelectedComponentId: (id: string | null) => void;
  clearCanvas: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useGalleryStore = create<GalleryState>((set, get) => ({
  memes: [],
  loading: false,
  hasMore: true,
  page: 1,
  toast: null,
  comments: {},
  likedMemes: {},
  canvasComponents: [],
  canvasText: null,
  selectedComponentId: null,

  addMeme: (meme) => set((state) => ({ memes: [meme, ...state.memes] })),
  setMemes: (memes) => set({ memes }),
  setLoading: (loading) => set({ loading }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),

  showToast: (message, type = 'success') => {
    const id = generateId();
    set({ toast: { id, message, type } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 2000);
  },
  hideToast: () => set({ toast: null }),

  fetchMemes: async (page) => {
    const currentPage = page || get().page;
    const currentMemes = get().memes;

    if (get().loading) return;
    set({ loading: true });

    try {
      const res = await axios.get('/api/gallery', {
        params: { page: currentPage, limit: 8 }
      });
      const { memes, hasMore } = res.data;

      const enrichedMemes = memes.map((m: Meme) => {
        if (m.imageUrl) return m;
        const placeholderColors = ['#FF80AB', '#64B5F6', '#81C784', '#FFB74D', '#BA68C8', '#4DD0E1'];
        const colorIdx = Math.floor(Math.random() * placeholderColors.length);
        return {
          ...m,
          imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280"><rect width="280" height="280" fill="${placeholderColors[colorIdx]}" opacity="0.3"/><circle cx="140" cy="140" r="80" fill="${placeholderColors[colorIdx]}" opacity="0.5"/><text x="140" y="155" font-size="50" text-anchor="middle">😊</text></svg>`
          )}`
        };
      });

      set({
        memes: page === 1 ? enrichedMemes : [...currentMemes, ...enrichedMemes],
        hasMore,
        page: currentPage + 1,
        loading: false
      });
    } catch (err) {
      console.error('Failed to fetch memes:', err);
      set({ loading: false });
    }
  },

  likeMeme: async (memeId) => {
    try {
      const res = await axios.post(`/api/interact/like/${memeId}`, {
        userId: 'local-user'
      });
      const { liked, likes } = res.data;
      set((state) => ({
        memes: state.memes.map((m) => (m.id === memeId ? { ...m, likes } : m)),
        likedMemes: { ...state.likedMemes, [memeId]: liked }
      }));
    } catch (err) {
      console.error('Failed to like meme:', err);
    }
  },

  fetchComments: async (memeId) => {
    try {
      const res = await axios.get(`/api/interact/comments/${memeId}`);
      set((state) => ({
        comments: { ...state.comments, [memeId]: res.data }
      }));
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  },

  addComment: async (memeId, author, content) => {
    try {
      const res = await axios.post(`/api/interact/comments/${memeId}`, { author, content });
      set((state) => ({
        comments: {
          ...state.comments,
          [memeId]: [...(state.comments[memeId] || []), res.data]
        },
        memes: state.memes.map((m) =>
          m.id === memeId ? { ...m, commentsCount: m.commentsCount + 1 } : m
        )
      }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  },

  addCanvasComponent: (component) =>
    set((state) => ({
      canvasComponents: [...state.canvasComponents, component],
      selectedComponentId: component.id
    })),

  updateCanvasComponent: (id, updates) =>
    set((state) => ({
      canvasComponents: state.canvasComponents.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    })),

  removeCanvasComponent: (id) =>
    set((state) => ({
      canvasComponents: state.canvasComponents.filter((c) => c.id !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId
    })),

  setCanvasText: (text) => set({ canvasText: text }),

  updateCanvasText: (updates) =>
    set((state) => ({
      canvasText: state.canvasText ? { ...state.canvasText, ...updates } : state.canvasText
    })),

  setSelectedComponentId: (id) => set({ selectedComponentId: id }),

  clearCanvas: () =>
    set({
      canvasComponents: [],
      canvasText: null,
      selectedComponentId: null
    })
}));
