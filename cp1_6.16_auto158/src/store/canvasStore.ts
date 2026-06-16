import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { HSV, RGB, hsvToRgb } from '@/utils/colorUtils';

export type AnimationState = 'appearing' | 'stable' | 'disappearing';

export interface ColorBlock {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: RGB;
  createdAt: number;
  isDragging: boolean;
  animationState: AnimationState;
  disappearStartTime?: number;
}

interface CanvasState {
  colorBlocks: ColorBlock[];
  selectedColor: HSV;
  isPlaying: boolean;
  userVolumes: Record<string, number>;
  currentPage: number;
  isClearing: boolean;
  showClearConfirm: boolean;
  addBlock: (x: number, y: number) => void;
  updateBlockPosition: (id: string, x: number, y: number) => void;
  setDragging: (id: string, flag: boolean) => void;
  removeBlock: (id: string) => void;
  clearAllBlocks: () => void;
  hardClear: () => void;
  setSelectedColor: (hsv: HSV) => void;
  togglePlay: () => void;
  setVolume: (id: string, value: number) => void;
  setCurrentPage: (page: number) => void;
  markBlockDisappearing: (id: string) => void;
  setShowClearConfirm: (flag: boolean) => void;
}

export const MAX_BLOCKS = 30;
export const BLOCKS_PER_PAGE = 5;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  colorBlocks: [],
  selectedColor: { h: 200, s: 0.8, v: 0.8 },
  isPlaying: true,
  userVolumes: {},
  currentPage: 1,
  isClearing: false,
  showClearConfirm: false,

  addBlock: (x: number, y: number) => {
    const state = get();
    if (state.colorBlocks.length >= MAX_BLOCKS) return;
    const radius = 30 + Math.random() * 30;
    const rgb = hsvToRgb(state.selectedColor);
    const id = uuidv4();
    set((s) => ({
      colorBlocks: [
        ...s.colorBlocks,
        {
          id,
          x,
          y,
          radius,
          color: rgb,
          createdAt: performance.now(),
          isDragging: false,
          animationState: 'appearing',
        },
      ],
      userVolumes: { ...s.userVolumes, [id]: 80 },
    }));
    setTimeout(() => {
      set((s) => ({
        colorBlocks: s.colorBlocks.map((b) =>
          b.id === id && b.animationState === 'appearing'
            ? { ...b, animationState: 'stable' }
            : b,
        ),
      }));
    }, 300);
  },

  updateBlockPosition: (id: string, x: number, y: number) => {
    set((s) => ({
      colorBlocks: s.colorBlocks.map((b) =>
        b.id === id ? { ...b, x, y } : b,
      ),
    }));
  },

  setDragging: (id: string, flag: boolean) => {
    set((s) => ({
      colorBlocks: s.colorBlocks.map((b) =>
        b.id === id ? { ...b, isDragging: flag } : b,
      ),
    }));
  },

  removeBlock: (id: string) => {
    set((s) => {
      const { [id]: _removed, ...restVolumes } = s.userVolumes;
      return {
        colorBlocks: s.colorBlocks.filter((b) => b.id !== id),
        userVolumes: restVolumes,
      };
    });
  },

  clearAllBlocks: () => {
    const state = get();
    if (state.isClearing) return;
    set({ isClearing: true });
    state.colorBlocks.forEach((block, index) => {
      const delay = index * 500;
      setTimeout(() => {
        const currentState = get();
        if (currentState.colorBlocks.find((b) => b.id === block.id)) {
          set((s) => ({
            colorBlocks: s.colorBlocks.map((b) =>
              b.id === block.id
                ? { ...b, animationState: 'disappearing', disappearStartTime: performance.now() }
                : b,
            ),
          }));
        }
      }, delay);
    });
    const totalDelay = state.colorBlocks.length * 500 + 800;
    setTimeout(() => {
      get().hardClear();
      set({ showClearConfirm: true });
      setTimeout(() => set({ showClearConfirm: false }), 2500);
    }, totalDelay);
  },

  hardClear: () => {
    set({
      colorBlocks: [],
      userVolumes: {},
      isClearing: false,
      currentPage: 1,
    });
  },

  setSelectedColor: (hsv: HSV) => {
    set({ selectedColor: hsv });
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }));
  },

  setVolume: (id: string, value: number) => {
    set((s) => ({
      userVolumes: { ...s.userVolumes, [id]: value },
    }));
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: Math.max(1, page) });
  },

  markBlockDisappearing: (id: string) => {
    set((s) => ({
      colorBlocks: s.colorBlocks.map((b) =>
        b.id === id
          ? { ...b, animationState: 'disappearing', disappearStartTime: performance.now() }
          : b,
      ),
    }));
  },

  setShowClearConfirm: (flag: boolean) => {
    set({ showClearConfirm: flag });
  },
}));
