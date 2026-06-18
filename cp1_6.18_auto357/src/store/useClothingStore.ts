import { create } from 'zustand';

export interface DesignParams {
  sleeveLength: number;
  clothingLength: number;
  waistFit: number;
}

export interface ClothingItem {
  id: string | null;
  imageUrl: string | null;
  originalColor: string | null;
  currentColor: string | null;
  size?: {
    shoulder: number;
    chest: number;
    length: number;
    sleeve: number;
  };
}

interface ClothingState {
  clothing: ClothingItem;
  designParams: DesignParams;
  isDragging: boolean;
  setClothing: (item: Partial<ClothingItem>) => void;
  setDesignParams: (params: Partial<DesignParams>) => void;
  setIsDragging: (dragging: boolean) => void;
  resetClothing: () => void;
}

export const useClothingStore = create<ClothingState>((set) => ({
  clothing: {
    id: null,
    imageUrl: null,
    originalColor: null,
    currentColor: null,
  },
  designParams: {
    sleeveLength: 50,
    clothingLength: 50,
    waistFit: 50,
  },
  isDragging: false,
  setClothing: (item) =>
    set((state) => ({
      clothing: { ...state.clothing, ...item },
    })),
  setDesignParams: (params) =>
    set((state) => ({
      designParams: { ...state.designParams, ...params },
    })),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  resetClothing: () =>
    set({
      clothing: {
        id: null,
        imageUrl: null,
        originalColor: null,
        currentColor: null,
      },
      designParams: {
        sleeveLength: 50,
        clothingLength: 50,
        waistFit: 50,
      },
    }),
}));
