import { create } from 'zustand';

interface SundialState {
  solarTermIndex: number;
  targetSolarTermIndex: number;
  sunAngle: number;
  isDraggingSun: boolean;
  isTransitioning: boolean;
  transitionProgress: number;
  setSolarTerm: (index: number) => void;
  updateTransition: (delta: number) => boolean;
  setSunAngle: (angle: number) => void;
  setIsDraggingSun: (dragging: boolean) => void;
  snapSunToNearest: () => void;
}

export const useSundialStore = create<SundialState>((set, get) => ({
  solarTermIndex: 6,
  targetSolarTermIndex: 6,
  sunAngle: 90,
  isDraggingSun: false,
  isTransitioning: false,
  transitionProgress: 0,

  setSolarTerm: (index: number) => {
    set({
      targetSolarTermIndex: index,
      isTransitioning: true,
      transitionProgress: 0,
    });
  },

  updateTransition: (delta: number): boolean => {
    const state = get();
    if (!state.isTransitioning) return true;

    const newProgress = state.transitionProgress + delta;
    if (newProgress >= 1) {
      set({
        solarTermIndex: state.targetSolarTermIndex,
        transitionProgress: 1,
        isTransitioning: false,
      });
      return true;
    }

    const totalTerms = 24;
    let diff = state.targetSolarTermIndex - state.solarTermIndex;
    if (diff > 12) diff -= 24;
    if (diff < -12) diff += 24;

    const currentIndex =
      (state.solarTermIndex + diff * newProgress + totalTerms) % totalTerms;

    set({
      transitionProgress: newProgress,
      solarTermIndex: currentIndex,
    });
    return false;
  },

  setSunAngle: (angle: number) => {
    const normalizedAngle = ((angle % 180) + 180) % 180;
    set({ sunAngle: normalizedAngle });
  },

  setIsDraggingSun: (dragging: boolean) => {
    set({ isDraggingSun: dragging });
  },

  snapSunToNearest: () => {
    const { sunAngle } = get();
    const snapped = Math.round(sunAngle / 7.5) * 7.5;
    set({ sunAngle: snapped });
  },
}));
