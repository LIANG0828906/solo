import { create } from 'zustand';
import type { Photo } from './types';
import { demoPhotos } from './modules/storage/demoData';

interface PhotoStore {
  photos: Photo[];
  currentPhotoId: string | null;
  displayedCount: number;
  isLoading: boolean;
  hasMore: boolean;
  viewerOpen: boolean;

  setPhotos: (photos: Photo[]) => void;
  addPhoto: (photo: Photo) => void;
  setCurrentPhotoId: (id: string | null) => void;
  setDisplayedCount: (count: number) => void;
  setIsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setViewerOpen: (open: boolean) => void;
  openViewer: (photoId: string) => void;
  closeViewer: () => void;
  goToPrevPhoto: () => void;
  goToNextPhoto: () => void;
  loadMorePhotos: () => void;
}

const INITIAL_DISPLAY = 20;
const LOAD_MORE_COUNT = 8;

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: demoPhotos,
  currentPhotoId: null,
  displayedCount: INITIAL_DISPLAY,
  isLoading: false,
  hasMore: demoPhotos.length > INITIAL_DISPLAY,
  viewerOpen: false,

  setPhotos: (photos) => set({ 
    photos, 
    hasMore: photos.length > INITIAL_DISPLAY,
    displayedCount: Math.min(INITIAL_DISPLAY, photos.length)
  }),

  addPhoto: (photo) => set((state) => ({
    photos: [photo, ...state.photos]
  })),

  setCurrentPhotoId: (id) => set({ currentPhotoId: id }),

  setDisplayedCount: (count) => set({ displayedCount: count }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setHasMore: (hasMore) => set({ hasMore }),

  setViewerOpen: (open) => set({ viewerOpen: open }),

  openViewer: (photoId) => set({ viewerOpen: true, currentPhotoId: photoId }),

  closeViewer: () => set({ viewerOpen: false, currentPhotoId: null }),

  goToPrevPhoto: () => {
    const { photos, currentPhotoId } = get();
    if (!currentPhotoId || photos.length === 0) return;
    const currentIndex = photos.findIndex(p => p.id === currentPhotoId);
    if (currentIndex > 0) {
      set({ currentPhotoId: photos[currentIndex - 1].id });
    }
  },

  goToNextPhoto: () => {
    const { photos, currentPhotoId } = get();
    if (!currentPhotoId || photos.length === 0) return;
    const currentIndex = photos.findIndex(p => p.id === currentPhotoId);
    if (currentIndex < photos.length - 1) {
      set({ currentPhotoId: photos[currentIndex + 1].id });
    }
  },

  loadMorePhotos: () => {
    const { photos, displayedCount, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;
    
    set({ isLoading: true });
    
    setTimeout(() => {
      const newCount = Math.min(displayedCount + LOAD_MORE_COUNT, photos.length);
      set({
        displayedCount: newCount,
        hasMore: newCount < photos.length,
        isLoading: false
      });
    }, 300);
  }
}));
