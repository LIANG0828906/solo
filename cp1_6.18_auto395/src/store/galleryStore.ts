import { create } from 'zustand';
import type { Gallery } from '@/api';
import { galleryApi } from '@/api/gallery';

interface GalleryState {
  galleries: Gallery[];
  currentGallery: Gallery | null;
  loading: boolean;
  fetchGalleries: () => Promise<void>;
  setCurrentGallery: (gallery: Gallery | null) => void;
  addGallery: (gallery: Gallery) => void;
  removeGallery: (id: number) => void;
  updateGallery: (
    id: number,
    data: Partial<Pick<Gallery, 'name' | 'description' | 'cover_image' | 'exhibition_start' | 'exhibition_end' | 'background_music' | 'theme_style'>>
  ) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  galleries: [],
  currentGallery: null,
  loading: false,

  fetchGalleries: async () => {
    set({ loading: true });
    try {
      const galleries = await galleryApi.getGalleries();
      set({ galleries });
    } catch {
      set({ galleries: [] });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentGallery: (gallery) => {
    set({ currentGallery: gallery });
  },

  addGallery: (gallery) => {
    set((state) => ({
      galleries: [gallery, ...state.galleries],
    }));
  },

  removeGallery: (id) => {
    set((state) => ({
      galleries: state.galleries.filter((g) => g.id !== id),
      currentGallery:
        state.currentGallery?.id === id ? null : state.currentGallery,
    }));
  },

  updateGallery: (id, data) => {
    set((state) => ({
      galleries: state.galleries.map((g) =>
        g.id === id ? { ...g, ...data } : g
      ),
      currentGallery:
        state.currentGallery?.id === id
          ? { ...state.currentGallery, ...data }
          : state.currentGallery,
    }));
  },
}));
