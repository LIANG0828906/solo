import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface PlacedFurniture {
  id: string;
  modelId: string;
  x: number;
  y: number;
  scale: number;
}

interface StoreState {
  imageId: string | null;
  imageUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  placedFurniture: PlacedFurniture[];
  selectedId: string | null;
  isUploading: boolean;
  shareUrl: string | null;
  shareModalOpen: boolean;
}

interface StoreActions {
  setImage: (id: string, url: string, w: number, h: number) => void;
  addFurniture: (modelId: string) => void;
  updateFurniturePosition: (id: string, x: number, y: number) => void;
  updateFurnitureScale: (id: string, scale: number) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  setUploading: (value: boolean) => void;
  setShareUrl: (url: string | null) => void;
  setShareModalOpen: (value: boolean) => void;
  clearAll: () => void;
}

type Store = StoreState & StoreActions;

const initialState: StoreState = {
  imageId: null,
  imageUrl: null,
  imageWidth: 0,
  imageHeight: 0,
  placedFurniture: [],
  selectedId: null,
  isUploading: false,
  shareUrl: null,
  shareModalOpen: false,
};

export const useStore = create<Store>((set) => ({
  ...initialState,

  setImage: (id, url, w, h) =>
    set({ imageId: id, imageUrl: url, imageWidth: w, imageHeight: h }),

  addFurniture: (modelId) =>
    set((state) => ({
      placedFurniture: [
        ...state.placedFurniture,
        { id: uuidv4(), modelId, x: 0.5, y: 0.5, scale: 1 },
      ],
    })),

  updateFurniturePosition: (id, x, y) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.map((f) =>
        f.id === id ? { ...f, x, y } : f
      ),
    })),

  updateFurnitureScale: (id, scale) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.map((f) =>
        f.id === id ? { ...f, scale } : f
      ),
    })),

  removeFurniture: (id) =>
    set((state) => ({
      placedFurniture: state.placedFurniture.filter((f) => f.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectFurniture: (id) => set({ selectedId: id }),

  setUploading: (value) => set({ isUploading: value }),

  setShareUrl: (url) => set({ shareUrl: url }),

  setShareModalOpen: (value) => set({ shareModalOpen: value }),

  clearAll: () => set(initialState),
}));
