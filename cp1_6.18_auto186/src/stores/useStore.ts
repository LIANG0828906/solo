import { create } from 'zustand';
import type { Photo, Comment, Stats } from '../data/photoStore';

interface AppState {
  photos: Photo[];
  loading: boolean;
  activeCategory: string;
  modalPhotoIndex: number | null;
  stats: Stats;

  setPhotos: (photos: Photo[]) => void;
  setLoading: (loading: boolean) => void;
  setActiveCategory: (category: string) => void;
  setModalPhotoIndex: (index: number | null) => void;
  setStats: (stats: Stats) => void;

  fetchPhotos: (category?: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  uploadPhotos: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  deletePhoto: (id: string) => Promise<boolean>;
  submitBooking: (data: Record<string, string>) => Promise<{ success: boolean; error?: string; bookingId?: string }>;
  fetchComments: (photoId: string) => Promise<Comment[]>;
  submitComment: (photoId: string, username: string, content: string) => Promise<{ success: boolean; error?: string; comment?: Comment }>;
}

export const useStore = create<AppState>((set, get) => ({
  photos: [],
  loading: false,
  activeCategory: 'all',
  modalPhotoIndex: null,
  stats: { totalPhotos: 0, totalBookings: 0, totalComments: 0 },

  setPhotos: (photos) => set({ photos }),
  setLoading: (loading) => set({ loading }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setModalPhotoIndex: (index) => set({ modalPhotoIndex: index }),
  setStats: (stats) => set({ stats }),

  fetchPhotos: async (category) => {
    set({ loading: true });
    try {
      const url = category && category !== 'all'
        ? `/api/photos?category=${category}`
        : '/api/photos';
      const res = await fetch(url);
      const data = await res.json();
      set({ photos: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      set({ stats: data });
    } catch {
      // ignore
    }
  },

  uploadPhotos: async (formData) => {
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchPhotos(get().activeCategory);
        await get().fetchStats();
        return { success: true };
      }
      return { success: false, error: data.error || '上传失败' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败';
      return { success: false, error: message };
    }
  },

  deletePhoto: async (id) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await get().fetchPhotos(get().activeCategory);
        await get().fetchStats();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  submitBooking: async (data) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        await get().fetchStats();
        return { success: true, bookingId: result.bookingId };
      }
      return { success: false, error: result.error || '预约失败' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '预约失败';
      return { success: false, error: message };
    }
  },

  fetchComments: async (photoId) => {
    try {
      const res = await fetch(`/api/comments?photoId=${photoId}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  submitComment: async (photoId, username, content) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, username, content })
      });
      const data = await res.json();
      if (data.success) {
        await get().fetchStats();
        return { success: true, comment: data.comment };
      }
      return { success: false, error: data.error || '评论失败' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '评论失败';
      return { success: false, error: message };
    }
  }
}));
