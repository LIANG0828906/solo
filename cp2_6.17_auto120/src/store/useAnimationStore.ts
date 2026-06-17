import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AnimationState, Keyframe, EasingCurve } from '../types/animation';
import { clampTime, sortKeyframes, MAX_DURATION } from '../utils/animationUtils';
import { generateCSS } from '../utils/cssGenerator';

const createDefaultKeyframe = (time: number): Keyframe => ({
  id: uuidv4(),
  time: clampTime(time),
  transform: {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    scale: 1,
  },
  opacity: 1,
  backgroundColor: '#6C63FF',
});

const initialKeyframes: Keyframe[] = [
  { ...createDefaultKeyframe(0), transform: { translateX: -100, translateY: 0, rotate: 0, scale: 1 }, opacity: 1, backgroundColor: '#6C63FF' },
  { ...createDefaultKeyframe(2), transform: { translateX: 100, translateY: -50, rotate: 180, scale: 1.2 }, opacity: 0.8, backgroundColor: '#FF6B6B' },
  { ...createDefaultKeyframe(4), transform: { translateX: 0, translateY: 0, rotate: 360, scale: 1 }, opacity: 1, backgroundColor: '#6C63FF' },
];

export const useAnimationStore = create<AnimationState>((set, get) => ({
  keyframes: initialKeyframes,
  selectedKeyframeId: initialKeyframes[0]?.id ?? null,
  isPlaying: false,
  currentTime: 0,
  playbackSpeed: 1,
  animationConfig: {
    duration: MAX_DURATION,
    easing: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
    iterations: 'infinite',
  },
  isExportModalOpen: false,

  addKeyframe: (time: number) => {
    const newKf = createDefaultKeyframe(time);
    set((state) => ({
      keyframes: sortKeyframes([...state.keyframes, newKf]),
      selectedKeyframeId: newKf.id,
    }));
  },

  deleteKeyframe: (id: string) => {
    set((state) => {
      const remaining = state.keyframes.filter((k) => k.id !== id);
      return {
        keyframes: remaining,
        selectedKeyframeId:
          state.selectedKeyframeId === id
            ? remaining[0]?.id ?? null
            : state.selectedKeyframeId,
      };
    });
  },

  updateKeyframe: (id: string, updates: Partial<Keyframe>) => {
    set((state) => ({
      keyframes: sortKeyframes(
        state.keyframes.map((k) =>
          k.id === id
            ? { ...k, ...updates, time: updates.time !== undefined ? clampTime(updates.time) : k.time }
            : k
        )
      ),
    }));
  },

  selectKeyframe: (id: string | null) => {
    set({ selectedKeyframeId: id });
  },

  setPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: clampTime(time) });
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: Math.max(0.1, Math.min(5, speed)) });
  },

  setEasing: (curve: EasingCurve) => {
    set((state) => ({
      animationConfig: { ...state.animationConfig, easing: curve },
    }));
  },

  setExportModalOpen: (open: boolean) => {
    set({ isExportModalOpen: open });
  },

  resetAnimation: () => {
    set({ isPlaying: false, currentTime: 0 });
  },

  generateCSS: () => {
    const state = get();
    return generateCSS(state.keyframes, state.animationConfig);
  },
}));
