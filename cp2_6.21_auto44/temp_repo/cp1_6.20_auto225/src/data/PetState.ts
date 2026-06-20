import { create } from 'zustand';
import type { SkillId } from '../game/SkillManager';

export interface PetStats {
  hunger: number;
  cleanliness: number;
  happiness: number;
}

export type StatKey = keyof PetStats;

export type AnimationType =
  | 'idle'
  | 'breathing'
  | 'shaking'
  | 'dance'
  | 'roll'
  | 'sing'
  | 'yawn'
  | 'look_around'
  | 'scratch';

export interface PetState {
  hunger: number;
  cleanliness: number;
  happiness: number;
  learnedSkills: SkillId[];
  isAnimating: boolean;
  currentAnimation: AnimationType | null;
  lastInteractionTime: number;
  worker: Worker | null;
}

export interface PetActions {
  feed: () => void;
  clean: () => void;
  play: () => void;
  updateStats: (stats: Partial<PetStats>) => void;
  learnSkill: (skillId: SkillId) => void;
  setAnimation: (anim: AnimationType | null, duration?: number) => void;
  initWorker: () => void;
  cleanupWorker: () => void;
  touch: () => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const initialStats: PetStats = {
  hunger: 50,
  cleanliness: 50,
  happiness: 50,
};

export const usePetStore = create<PetState & PetActions>((set, get) => ({
  ...initialStats,
  learnedSkills: [],
  isAnimating: false,
  currentAnimation: null,
  lastInteractionTime: Date.now(),
  worker: null,

  feed: () => {
    const state = get();
    if (state.isAnimating) return;
    set({
      hunger: clamp(state.hunger + 15, 0, 100),
      lastInteractionTime: Date.now(),
    });
  },

  clean: () => {
    const state = get();
    if (state.isAnimating) return;
    set({
      cleanliness: clamp(state.cleanliness + 15, 0, 100),
      lastInteractionTime: Date.now(),
    });
  },

  play: () => {
    const state = get();
    if (state.isAnimating) return;
    set({
      happiness: clamp(state.happiness + 15, 0, 100),
      lastInteractionTime: Date.now(),
    });
  },

  updateStats: (stats) => {
    set((state) => ({
      hunger: stats.hunger !== undefined ? clamp(stats.hunger, 0, 100) : state.hunger,
      cleanliness: stats.cleanliness !== undefined ? clamp(stats.cleanliness, 0, 100) : state.cleanliness,
      happiness: stats.happiness !== undefined ? clamp(stats.happiness, 0, 100) : state.happiness,
    }));
  },

  learnSkill: (skillId) => {
    set((state) => {
      if (state.learnedSkills.includes(skillId)) return state;
      return {
        learnedSkills: [...state.learnedSkills, skillId],
      };
    });
  },

  setAnimation: (anim, duration) => {
    set({ isAnimating: anim !== null, currentAnimation: anim });
    if (anim !== null && duration !== undefined) {
      setTimeout(() => {
        set({ isAnimating: false, currentAnimation: null });
      }, duration);
    }
  },

  touch: () => {
    set({ lastInteractionTime: Date.now() });
  },

  initWorker: () => {
    if (typeof Worker === 'undefined') return;

    const worker = new Worker(new URL('../worker/stateWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'decay') {
        get().updateStats(event.data.stats);
      }
    };

    worker.postMessage({
      type: 'init',
      stats: {
        hunger: get().hunger,
        cleanliness: get().cleanliness,
        happiness: get().happiness,
      },
    });

    set({ worker });
  },

  cleanupWorker: () => {
    const state = get();
    if (state.worker) {
      state.worker.terminate();
      set({ worker: null });
    }
  },
}));
