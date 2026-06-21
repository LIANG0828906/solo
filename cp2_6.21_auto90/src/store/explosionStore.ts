import { create } from 'zustand';
import { ExplosionState } from '@/types';
import { BRONZE_DING_PARTS, MAX_SELECTED_PARTS } from '@/utils/modelData';
import { easeOutCubic } from '@/utils/easing';

const initOffsets = (): Record<string, number> => {
  const offsets: Record<string, number> = {};
  BRONZE_DING_PARTS.forEach((p) => {
    offsets[p.id] = 0;
  });
  return offsets;
};

export const useExplosionStore = create<ExplosionState>((set, get) => ({
  partOffsets: initOffsets(),
  selectedParts: [],
  autoRotate: false,
  isAnimating: false,

  setPartOffset: (partId: string, value: number) => {
    set((state) => ({
      partOffsets: { ...state.partOffsets, [partId]: value },
    }));
  },

  togglePartSelection: (partId: string) => {
    set((state) => {
      const exists = state.selectedParts.includes(partId);
      if (exists) {
        return {
          selectedParts: state.selectedParts.filter((id) => id !== partId),
        };
      }
      const next = [...state.selectedParts, partId];
      if (next.length > MAX_SELECTED_PARTS) {
        next.shift();
      }
      return { selectedParts: next };
    });
  },

  toggleAutoRotate: () => {
    set((state) => ({ autoRotate: !state.autoRotate }));
  },

  explodeAll: async () => {
    const state = get();
    if (state.isAnimating) return;
    set({ isAnimating: true });

    const targets: Record<string, { start: number; end: number }> = {};
    BRONZE_DING_PARTS.forEach((p) => {
      targets[p.id] = {
        start: state.partOffsets[p.id] || 0,
        end: p.explodeTargetOffset,
      };
    });

    const duration = 2000;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const nextOffsets: Record<string, number> = {};
        BRONZE_DING_PARTS.forEach((p) => {
          const t = targets[p.id];
          nextOffsets[p.id] = t.start + (t.end - t.start) * eased;
        });
        set({ partOffsets: nextOffsets });
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

    set({ isAnimating: false });
  },

  resetAll: async () => {
    const state = get();
    if (state.isAnimating) return;
    set({ isAnimating: true });

    const starts: Record<string, number> = { ...state.partOffsets };
    const duration = 1500;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const nextOffsets: Record<string, number> = {};
        BRONZE_DING_PARTS.forEach((p) => {
          nextOffsets[p.id] = starts[p.id] * (1 - eased);
        });
        set({ partOffsets: nextOffsets });
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

    set({ isAnimating: false });
  },
}));
