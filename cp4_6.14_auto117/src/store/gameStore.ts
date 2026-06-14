import { create } from 'zustand';
import {
  Fragment,
  generateFragments,
  addFragment,
  getPlacedCount,
  getTotalCount,
  getProgress,
  isComplete,
  resetFragments,
} from '@/modules/puzzleManager';

interface GameStore {
  fragments: Fragment[];
  draggingId: string | null;
  correctStreak: number;
  showSuccess: boolean;
  flashOrange: boolean;
  flashRed: string | null;

  setFragments: (fragments: Fragment[]) => void;
  addFragment: (fragment: Omit<Fragment, 'id'> & Partial<Pick<Fragment, 'id'>>) => void;
  updateFragmentPosition: (id: string, x: number, y: number) => void;
  setFragmentCorrect: (id: string, correct: boolean) => void;
  setDraggingId: (id: string | null) => void;
  incrementStreak: () => number;
  resetStreak: () => void;
  setShowSuccess: (show: boolean) => void;
  setFlashOrange: (flash: boolean) => void;
  setFlashRed: (id: string | null) => void;
  resetGame: () => void;

  getPlacedCount: () => number;
  getTotalCount: () => number;
  getProgress: () => number;
  isComplete: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  fragments: generateFragments(),
  draggingId: null,
  correctStreak: 0,
  showSuccess: false,
  flashOrange: false,
  flashRed: null,

  setFragments: (fragments) => set({ fragments }),

  addFragment: (fragment) =>
    set((state) => ({
      fragments: addFragment(state.fragments, fragment),
    })),

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
    set((state) => ({
      fragments: resetFragments(state.fragments),
      draggingId: null,
      correctStreak: 0,
      showSuccess: false,
      flashOrange: false,
      flashRed: null,
    })),

  getPlacedCount: () => getPlacedCount(get().fragments),
  getTotalCount: () => getTotalCount(get().fragments),
  getProgress: () => getProgress(get().fragments),
  isComplete: () => isComplete(get().fragments),
}));

export default useGameStore;
