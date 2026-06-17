import { create } from 'zustand';

export interface Gallery {
  id: string;
  name: string;
  themeName: string;
  themeColor: string;
  createdAt: string;
  artworkCount?: number;
  reviewCount?: number;
  averageRating?: number;
  artworks?: Artwork[];
}

export interface Artwork {
  id: string;
  galleryId: string;
  title: string;
  artist: string;
  boothNumber: string;
  position: { x: number; y: number };
  imageUrl: string;
  description: string;
}

export interface Review {
  id: string;
  galleryId: string;
  username: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface Theme {
  name: string;
  color: string;
}

interface AppState {
  galleries: Gallery[];
  currentGallery: Gallery | null;
  artworks: Artwork[];
  reviews: Review[];
  reviewPage: number;
  reviewTotalPages: number;
  reviewCount: number;
  averageRating: number;
  themes: Theme[];
  loading: boolean;

  fetchGalleries: () => Promise<void>;
  fetchGalleryDetail: (id: string) => Promise<void>;
  createGallery: (data: { name: string; themeName: string; themeColor: string }) => Promise<Gallery>;
  updateGallery: (id: string, data: Partial<Gallery>) => Promise<Gallery | null>;
  deleteGallery: (id: string) => Promise<boolean>;
  setCurrentGallery: (gallery: Gallery | null) => void;

  fetchArtworks: (galleryId?: string) => Promise<void>;
  createArtwork: (data: { galleryId: string; title: string; artist: string; imageUrl?: string; description?: string }) => Promise<Artwork | null>;

  fetchReviews: (galleryId: string, page?: number) => Promise<void>;
  loadMoreReviews: (galleryId: string) => Promise<void>;
  createReview: (data: { galleryId: string; username: string; content: string; rating: number }) => Promise<Review | null>;

  fetchThemes: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  galleries: [],
  currentGallery: null,
  artworks: [],
  reviews: [],
  reviewPage: 1,
  reviewTotalPages: 0,
  reviewCount: 0,
  averageRating: 0,
  themes: [],
  loading: false,

  fetchGalleries: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      set({ galleries: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchGalleryDetail: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/galleries/${id}`);
      const data = await res.json();
      set({
        currentGallery: data,
        artworks: data.artworks || [],
        averageRating: data.averageRating || 0,
        reviewCount: data.reviewCount || 0,
        loading: false
      });
    } catch {
      set({ loading: false });
    }
  },

  createGallery: async (data) => {
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('创建失败');
      const gallery = await res.json();
      set((state) => ({ galleries: [gallery, ...state.galleries] }));
      return gallery;
    } catch {
      return null as any;
    }
  },

  updateGallery: async (id, data) => {
    try {
      const res = await fetch(`/api/galleries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('更新失败');
      const updated = await res.json();
      set((state) => ({
        galleries: state.galleries.map((g) => (g.id === id ? updated : g)),
        currentGallery: state.currentGallery?.id === id ? updated : state.currentGallery
      }));
      return updated;
    } catch {
      return null;
    }
  },

  deleteGallery: async (id: string) => {
    try {
      const res = await fetch(`/api/galleries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      set((state) => ({
        galleries: state.galleries.filter((g) => g.id !== id),
        currentGallery: state.currentGallery?.id === id ? null : state.currentGallery
      }));
      return true;
    } catch {
      return false;
    }
  },

  setCurrentGallery: (gallery) => set({ currentGallery: gallery }),

  fetchArtworks: async (galleryId) => {
    try {
      const url = galleryId ? `/api/artworks?galleryId=${galleryId}` : '/api/artworks';
      const res = await fetch(url);
      const data = await res.json();
      set({ artworks: data });
    } catch {
    }
  },

  createArtwork: async (data) => {
    try {
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('上传失败');
      const artwork = await res.json();
      set((state) => ({
        artworks: [...state.artworks, artwork],
        currentGallery: state.currentGallery
          ? {
              ...state.currentGallery,
              artworks: [...(state.currentGallery.artworks || []), artwork],
              artworkCount: (state.currentGallery.artworkCount || 0) + 1
            }
          : state.currentGallery
      }));
      return artwork;
    } catch {
      return null;
    }
  },

  fetchReviews: async (galleryId, page = 1) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/reviews?galleryId=${galleryId}&page=${page}&limit=5`);
      const data = await res.json();
      set({
        reviews: data.data,
        reviewPage: data.page,
        reviewTotalPages: data.totalPages,
        reviewCount: data.reviewCount,
        averageRating: data.averageRating,
        loading: false
      });
    } catch {
      set({ loading: false });
    }
  },

  loadMoreReviews: async (galleryId) => {
    const { reviewPage, reviews } = get();
    const nextPage = reviewPage + 1;
    try {
      const res = await fetch(`/api/reviews?galleryId=${galleryId}&page=${nextPage}&limit=5`);
      const data = await res.json();
      set({
        reviews: [...reviews, ...data.data],
        reviewPage: data.page,
        reviewTotalPages: data.totalPages
      });
    } catch {
    }
  },

  createReview: async (data) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('提交失败');
      const review = await res.json();
      set((state) => ({
        reviews: [review, ...state.reviews],
        reviewCount: state.reviewCount + 1
      }));
      await get().fetchReviews(data.galleryId, 1);
      return review;
    } catch {
      return null;
    }
  },

  fetchThemes: async () => {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      set({ themes: data });
    } catch {
    }
  }
}));
