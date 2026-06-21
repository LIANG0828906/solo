import { create } from 'zustand';
import type { Star, Lens } from './core';
import { generateStars, CANVAS_CENTER } from './core';

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  targetLens: Partial<Lens>;
  tolerance: number;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '爱因斯坦十字',
    description: '将透镜置于恒星群中心，强度调至7，观察四重像',
    targetLens: { x: CANVAS_CENTER, y: CANVAS_CENTER, strength: 7, ellipticity: 0 },
    tolerance: 0.05
  },
  {
    id: 2,
    name: '爱因斯坦环',
    description: '最大化引力强度，让背景恒星形成完整光环',
    targetLens: { x: CANVAS_CENTER, y: CANVAS_CENTER, strength: 10, ellipticity: 0 },
    tolerance: 0.05
  },
  {
    id: 3,
    name: '双像干涉',
    description: '将透镜偏移至左上方，强度5，观察双子像',
    targetLens: { x: CANVAS_CENTER - 100, y: CANVAS_CENTER - 100, strength: 5, ellipticity: 0 },
    tolerance: 0.05
  },
  {
    id: 4,
    name: '弧形拉伸',
    description: '使用椭圆形透镜（椭圆率0.4），产生弧形虚像',
    targetLens: { x: CANVAS_CENTER, y: CANVAS_CENTER, strength: 6, ellipticity: 0.4 },
    tolerance: 0.05
  },
  {
    id: 5,
    name: '多重像阵列',
    description: '高强度（9）+ 椭圆透镜（0.3）旋转45度，观察多重像',
    targetLens: { x: CANVAS_CENTER, y: CANVAS_CENTER, strength: 9, ellipticity: 0.3 },
    tolerance: 0.05
  }
];

export interface GameState {
  stars: Star[];
  lens: Lens;
  zoom: number;
  currentLevel: number | null;
  completedLevels: number[];
  showSuccess: boolean;
  showLevelSelect: boolean;
  lensTrail: { x: number; y: number }[];

  setLensStrength: (strength: number) => void;
  moveLens: (x: number, y: number) => void;
  setLensEllipticity: (ellipticity: number) => void;
  setLensRotation: (rotation: number) => void;
  setZoom: (zoom: number) => void;
  selectLevel: (id: number | null) => void;
  completeLevel: (id: number) => void;
  resetLevel: () => void;
  setShowSuccess: (show: boolean) => void;
  setShowLevelSelect: (show: boolean) => void;
  pushTrail: (x: number, y: number) => void;
  clearTrail: () => void;
}

const DEFAULT_LENS: Lens = {
  x: CANVAS_CENTER,
  y: CANVAS_CENTER,
  radius: 30,
  strength: 5,
  ellipticity: 0,
  rotation: 0
};

export const useGameStore = create<GameState>((set, get) => ({
  stars: generateStars(300),
  lens: { ...DEFAULT_LENS },
  zoom: 1,
  currentLevel: null,
  completedLevels: [],
  showSuccess: false,
  showLevelSelect: false,
  lensTrail: [],

  setLensStrength: (strength: number) =>
    set((state) => ({ lens: { ...state.lens, strength: Math.max(1, Math.min(10, strength)) } })),

  moveLens: (x: number, y: number) =>
    set((state) => ({ lens: { ...state.lens, x, y } })),

  setLensEllipticity: (ellipticity: number) =>
    set((state) => ({ lens: { ...state.lens, ellipticity: Math.max(0, Math.min(0.8, ellipticity)) } })),

  setLensRotation: (rotation: number) =>
    set((state) => ({ lens: { ...state.lens, rotation } })),

  setZoom: (zoom: number) =>
    set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  selectLevel: (id: number | null) => {
    if (id === null) {
      set({ currentLevel: null, lens: { ...DEFAULT_LENS } });
      return;
    }
    const level = LEVELS.find((l) => l.id === id);
    if (!level) return;
    set({
      currentLevel: id,
      lens: {
        ...DEFAULT_LENS,
        ...level.targetLens,
        x: level.targetLens.x ?? DEFAULT_LENS.x,
        y: level.targetLens.y ?? DEFAULT_LENS.y,
        strength: level.targetLens.strength ?? DEFAULT_LENS.strength,
        ellipticity: level.targetLens.ellipticity ?? DEFAULT_LENS.ellipticity,
        rotation: level.targetLens.rotation ?? DEFAULT_LENS.rotation
      },
      showLevelSelect: false
    });
  },

  completeLevel: (id: number) =>
    set((state) => {
      if (state.completedLevels.includes(id)) return {};
      return {
        completedLevels: [...state.completedLevels, id],
        showSuccess: true
      };
    }),

  resetLevel: () => {
    const state = get();
    if (state.currentLevel !== null) {
      state.selectLevel(state.currentLevel);
    } else {
      set({ lens: { ...DEFAULT_LENS }, zoom: 1 });
    }
  },

  setShowSuccess: (show: boolean) => set({ showSuccess: show }),

  setShowLevelSelect: (show: boolean) => set({ showLevelSelect: show }),

  pushTrail: (x: number, y: number) =>
    set((state) => {
      const newTrail = [...state.lensTrail, { x, y }];
      if (newTrail.length > 30) newTrail.shift();
      return { lensTrail: newTrail };
    }),

  clearTrail: () => set({ lensTrail: [] })
}));
