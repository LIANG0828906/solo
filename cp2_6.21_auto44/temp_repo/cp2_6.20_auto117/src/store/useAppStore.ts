import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface GalleryItem {
  id: string;
  title: string;
  poem: string;
  imagery: string[];
  thumbnail: string;
  annotation: string;
  createdAt: number;
  brushDensity: number;
  theme: string;
  animSpeed: number;
}

export interface Annotation {
  id: string;
  text: string;
  galleryItemId?: string;
}

interface AppState {
  currentPoem: string;
  currentImagery: string[];
  brushDensity: number;
  theme: 'autumn' | 'spring' | 'winter';
  animSpeed: number;
  gallery: GalleryItem[];
  isAnimating: boolean;
  isPaused: boolean;
  annotations: Annotation[];
  selectedImagery: string | null;
  showAnnotationInput: boolean;
  showGalleryModal: boolean;

  setPoem: (poem: string) => void;
  setImagery: (imagery: string[]) => void;
  setBrushDensity: (d: number) => void;
  setTheme: (t: 'autumn' | 'spring' | 'winter') => void;
  setAnimSpeed: (s: number) => void;
  setIsAnimating: (v: boolean) => void;
  setIsPaused: (v: boolean) => void;
  setSelectedImagery: (k: string | null) => void;
  setShowAnnotationInput: (v: boolean) => void;
  setShowGalleryModal: (v: boolean) => void;

  addToGallery: (item: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  removeFromGallery: (id: string) => void;
  clearGallery: () => void;
  loadFromGallery: (id: string) => void;

  addAnnotation: (text: string, galleryItemId?: string) => void;
  removeAnnotation: (id: string) => void;

  removeImageryItem: (keyword: string) => void;

  loadGalleryFromStorage: () => void;
  saveGalleryToStorage: () => void;
}

const GALLERY_KEY = 'ink-poetry-gallery';
const STORAGE_LIMIT = 10 * 1024 * 1024;

function estimateSize(items: GalleryItem[]): number {
  return new Blob([JSON.stringify(items)]).size;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPoem: '',
  currentImagery: [],
  brushDensity: 5,
  theme: 'autumn',
  animSpeed: 1,
  gallery: [],
  isAnimating: false,
  isPaused: false,
  annotations: [],
  selectedImagery: null,
  showAnnotationInput: false,
  showGalleryModal: false,

  setPoem: (poem) => set({ currentPoem: poem }),
  setImagery: (imagery) => set({ currentImagery: imagery }),
  setBrushDensity: (d) => set({ brushDensity: d }),
  setTheme: (t) => set({ theme: t }),
  setAnimSpeed: (s) => set({ animSpeed: s }),
  setIsAnimating: (v) => set({ isAnimating: v }),
  setIsPaused: (v) => set({ isPaused: v }),
  setSelectedImagery: (k) => set({ selectedImagery: k }),
  setShowAnnotationInput: (v) => set({ showAnnotationInput: v }),
  setShowGalleryModal: (v) => set({ showGalleryModal: v }),

  addToGallery: (item) => {
    const state = get();
    const lastAnnotation = state.annotations[state.annotations.length - 1];
    const annotationText = lastAnnotation ? lastAnnotation.text : item.annotation || '';
    const newItem: GalleryItem = {
      ...item,
      annotation: annotationText,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    set((s) => {
      let updated = [newItem, ...s.gallery];
      while (updated.length > 0 && estimateSize(updated) > STORAGE_LIMIT) {
        updated.pop();
      }
      return { gallery: updated };
    });
    try {
      get().saveGalleryToStorage();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, gallery item may not persist');
      } else {
        throw e;
      }
    }
  },

  removeFromGallery: (id) => {
    set((state) => ({
      gallery: state.gallery.filter((g) => g.id !== id),
    }));
    get().saveGalleryToStorage();
  },

  clearGallery: () => {
    set({ gallery: [] });
    get().saveGalleryToStorage();
  },

  loadFromGallery: (id) => {
    const item = get().gallery.find((g) => g.id === id);
    if (item) {
      set({
        currentPoem: item.poem,
        currentImagery: item.imagery,
        brushDensity: item.brushDensity,
        theme: item.theme as 'autumn' | 'spring' | 'winter',
        animSpeed: item.animSpeed,
        isAnimating: true,
      });
    }
  },

  addAnnotation: (text, galleryItemId) => {
    const annotation: Annotation = {
      id: uuidv4(),
      text,
      galleryItemId,
    };
    set((state) => ({ annotations: [...state.annotations, annotation] }));
  },

  removeAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    }));
  },

  removeImageryItem: (keyword) => {
    set((state) => ({
      currentImagery: state.currentImagery.filter((i) => i !== keyword),
    }));
  },

  loadGalleryFromStorage: () => {
    try {
      const data = localStorage.getItem(GALLERY_KEY);
      if (data) {
        const gallery = JSON.parse(data) as GalleryItem[];
        const sorted = gallery.sort((a, b) => b.createdAt - a.createdAt);
        set({ gallery: sorted });
      }
    } catch {
      set({ gallery: [] });
    }
  },

  saveGalleryToStorage: () => {
    try {
      let { gallery } = get();
      const trimmed = [...gallery];
      while (trimmed.length > 0 && estimateSize(trimmed) > STORAGE_LIMIT) {
        trimmed.pop();
      }
      if (trimmed.length !== gallery.length) {
        set({ gallery: trimmed });
      }
      localStorage.setItem(GALLERY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, trimming further');
        try {
          let { gallery } = get();
          const trimmed = [...gallery];
          while (trimmed.length > 1) {
            trimmed.pop();
            try {
              localStorage.setItem(GALLERY_KEY, JSON.stringify(trimmed));
              set({ gallery: trimmed });
              break;
            } catch {
              continue;
            }
          }
        } catch {
          console.warn('localStorage save failed completely');
        }
      } else {
        console.warn('localStorage save failed');
      }
    }
  },
}));
