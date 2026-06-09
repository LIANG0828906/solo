import { create } from 'zustand';
import type { FlowerType, OilType, Sticker, StepType } from '@/types';

interface PerfumeStore {
  currentStep: StepType;
  selectedFlower: FlowerType | null;
  selectedOil: OilType | null;
  flowerOilRatio: number;
  fixativeAmount: number;
  thickness: number;
  transparency: number;
  heatingProgress: number;
  balmState: 'liquid' | 'solid';
  stickers: Sticker[];
  createdAt: Date;

  selectFlower: (flowerId: FlowerType | null) => void;
  selectOil: (oilId: OilType | null) => void;
  setRatio: (ratio: number) => void;
  setFixative: (amount: number) => void;
  calculateProperties: () => void;
  setHeatingProgress: (progress: number) => void;
  nextStep: () => void;
  setBalmState: (state: 'liquid' | 'solid') => void;
  addSticker: (sticker: Sticker) => void;
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  removeSticker: (id: string) => void;
  reset: () => void;
}

const steps: StepType[] = ['select', 'mix', 'heat', 'cool', 'decorate', 'complete'];

const initialState = {
  currentStep: 'select' as StepType,
  selectedFlower: null as FlowerType | null,
  selectedOil: null as OilType | null,
  flowerOilRatio: 1,
  fixativeAmount: 10,
  thickness: 0.5,
  transparency: 0.5,
  heatingProgress: 0,
  balmState: 'liquid' as const,
  stickers: [] as Sticker[],
  createdAt: new Date(),
};

export const usePerfumeStore = create<PerfumeStore>((set, get) => ({
  ...initialState,

  selectFlower: (flowerId) => set({ selectedFlower: flowerId }),

  selectOil: (oilId) => set({ selectedOil: oilId }),

  setRatio: (ratio) => set({ flowerOilRatio: ratio }),

  setFixative: (amount) => set({ fixativeAmount: amount }),

  calculateProperties: () => {
    const { flowerOilRatio, fixativeAmount } = get();
    const thickness = Math.min(1, Math.max(0, (flowerOilRatio / 5) * 0.5 + (fixativeAmount / 20) * 0.5));
    const transparency = Math.min(1, Math.max(0, 1 - (flowerOilRatio / 5) * 0.3 - (fixativeAmount / 20) * 0.3));
    set({ thickness, transparency });
  },

  setHeatingProgress: (progress) => set({ heatingProgress: progress }),

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      set({ currentStep: steps[currentIndex + 1] });
    }
  },

  setBalmState: (state) => set({ balmState: state }),

  addSticker: (sticker) => set((state) => ({ stickers: [...state.stickers, sticker] })),

  updateSticker: (id, updates) => set((state) => ({
    stickers: state.stickers.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  removeSticker: (id) => set((state) => ({
    stickers: state.stickers.filter((s) => s.id !== id),
  })),

  reset: () => set({ ...initialState, createdAt: new Date() }),
}));
