import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, ColorScheme, PathPoint } from '@/types';

const defaultColorSchemes: ColorScheme[] = [
  { id: 'ocean', name: '海洋蓝调', primary: '#0077B6', secondary: '#CAF0F8' },
  { id: 'sunset', name: '日落暖橙', primary: '#FF6B35', secondary: '#F7D59C' },
  { id: 'forest', name: '森林绿韵', primary: '#2D6A4F', secondary: '#D8F3DC' },
  { id: 'aurora', name: '极光紫蓝', primary: '#7209B7', secondary: '#E0AAFF' },
  { id: 'sakura', name: '樱花粉嫩', primary: '#FFB6C1', secondary: '#FFE4E1' },
  { id: 'cyber', name: '赛博霓虹', primary: '#FF006E', secondary: '#8338EC' },
];

const initialScheme = defaultColorSchemes[0];

export const useAppStore = create<AppState>((set, get) => ({
  pathPoints: [],
  drawTool: 'pen',
  addPathPoint: (point) =>
    set((state) => ({
      pathPoints: [
        ...state.pathPoints,
        { ...point, id: uuidv4(), timestamp: Date.now() },
      ],
    })),
  clearCanvas: () => set({ pathPoints: [] }),
  setDrawTool: (tool) => set({ drawTool: tool }),

  keyframes: [],
  addKeyframe: (point) => {
    const currentKeyframes = get().keyframes;
    if (currentKeyframes.length >= 10) return;
    set((state) => ({
      keyframes: [
        ...state.keyframes,
        { ...point, id: uuidv4(), index: state.keyframes.length },
      ],
    }));
  },
  removeKeyframe: (id) =>
    set((state) => ({
      keyframes: state.keyframes
        .filter((kf) => kf.id !== id)
        .map((kf, idx) => ({ ...kf, index: idx })),
    })),
  clearKeyframes: () => set({ keyframes: [] }),

  colorSchemes: defaultColorSchemes,
  currentScheme: initialScheme,
  setColorScheme: (scheme) => set({ currentScheme: scheme }),
  setCustomColors: (primary, secondary) =>
    set({
      currentScheme: {
        id: 'custom',
        name: '自定义',
        primary,
        secondary,
      },
    }),

  animation: {
    isPlaying: false,
    speed: 1,
    currentFrame: 0,
    trailPoints: [] as PathPoint[],
  },
  setAnimationPlaying: (isPlaying) =>
    set((state) => ({
      animation: { ...state.animation, isPlaying },
    })),
  setAnimationSpeed: (speed) =>
    set((state) => ({
      animation: { ...state.animation, speed },
    })),
  setCurrentFrame: (frame) =>
    set((state) => ({
      animation: { ...state.animation, currentFrame: frame },
    })),
  setTrailPoints: (points) =>
    set((state) => ({
      animation: { ...state.animation, trailPoints: points },
    })),
}));
