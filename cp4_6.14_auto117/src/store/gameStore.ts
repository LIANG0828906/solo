import { create } from 'zustand';
import { Fragment, generateFragments } from '@/modules/puzzleManager';

interface GameStore {
  fragments: Fragment[];
  draggingId: string | null;
  correctStreak: number;
  showSuccess: boolean;
  flashOrange: boolean;
  flashRed: string | null;

  setFragments: (fragments: Fragment[]) => void;
  updateFragmentPosition: (id: string, x: number, y: number) => void;
  setFragmentCorrect: (id: string, correct: boolean) => void;
  setDraggingId: (id: string | null) => void;
  incrementStreak: () => number;
  resetStreak: () => void;
  setShowSuccess: (show: boolean) => void;
  setFlashOrange: (flash: boolean) => void;
  setFlashRed: (id: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  fragments: generateFragments(),
  draggingId: null,
  correctStreak: 0,
  showSuccess: false,
  flashOrange: false,
  flashRed: null,

  setFragments: (fragments) => set({ fragments }),

  updateFragmentPosition: (id, x, y) =>
    set((state) => ({
      fragments: state.fragments.map((f) =>
        f.id === id ? { ...f, currentX: x, currentY: y, isPlaced: true } : f
      ),
    })),

  setFragmentCorrect: (id, correct) =>
    set((state) => ({
      fragments: state.fragments.map((f) =>
        f.id === id ? { ...f, isCorrect: correct } : f
      ),
    })),

  setDraggingId: (id) => set({ draggingId: id }),

  incrementStreak: () => {
    const newStreak = get().correctStreak + 1;
    set({ correctStreak: newStreak });
    return newStreak;
  },

  resetStreak: () => set({ correctStreak: 0 }),

  setShowSuccess: (show) => set({ showSuccess: show }),

  setFlashOrange: (flash) => set({ flashOrange: flash }),

  setFlashRed: (id) => set({ flashRed: id }),

  resetGame: () =>
    set({
      fragments: generateFragments(),
      draggingId: null,
      correctStreak: 0,
      showSuccess: false,
      flashOrange: false,
      flashRed: null,
    }),
}));

export default useGameStore;
