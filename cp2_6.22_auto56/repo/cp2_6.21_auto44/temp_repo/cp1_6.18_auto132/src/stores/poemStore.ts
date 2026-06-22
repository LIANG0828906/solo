import { create } from 'zustand';

export type ShapeType = 'bamboo' | 'bird' | 'mountain' | 'water' | 'boat' | 'flower' | 'moon' | 'cloud' | 'tree' | 'sun' | 'rain' | 'wind' | 'default';

export interface Imagery {
  id: string;
  name: string;
  color: string;
  shape: ShapeType;
  position: { x: number; y: number };
  size: number;
  opacity: number;
  meaning: string;
  source: string;
  author: string;
  similarPoems: string[];
}

interface PoemState {
  poemText: string;
  imageries: Imagery[];
  selectedImageryId: string | null;
  setPoemText: (text: string) => void;
  setImageries: (list: Imagery[]) => void;
  updateImagery: (id: string, updates: Partial<Imagery>) => void;
  selectImagery: (id: string | null) => void;
  clearCanvas: () => void;
}

export const usePoemStore = create<PoemState>((set) => ({
  poemText: '',
  imageries: [],
  selectedImageryId: null,
  setPoemText: (text) => set({ poemText: text }),
  setImageries: (list) => set({ imageries: list, selectedImageryId: null }),
  updateImagery: (id, updates) =>
    set((state) => ({
      imageries: state.imageries.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    })),
  selectImagery: (id) => set({ selectedImageryId: id }),
  clearCanvas: () => set({ imageries: [], poemText: '', selectedImageryId: null }),
}));
