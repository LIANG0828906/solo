import { create } from 'zustand';
import { generateRandomHSL, HSL } from '@/utils/colorUtils';

export interface ColorBlock {
  id: string;
  hue: number;
  saturation: number;
  lightness: number;
  position: number;
  animationSpeed: number;
}

export interface AuroraOrigin {
  x: number;
  y: number;
  hue: number;
}

interface ColorState {
  blocks: ColorBlock[];
  selectedId: string | null;
  isDragging: boolean;
  draggingId: string | null;
  dragOverPosition: number | null;
  isAuroraActive: boolean;
  auroraOrigin: AuroraOrigin | null;
  
  selectBlock: (id: string) => void;
  updateBlockColor: (id: string, h: number, s: number, l: number) => void;
  swapBlocks: (pos1: number, pos2: number) => void;
  setDragState: (isDragging: boolean, draggingId: string | null, overPos: number | null) => void;
  triggerAurora: (x: number, y: number, hue: number) => void;
  endAurora: () => void;
  resetAll: () => void;
}

const generateBlocks = (): ColorBlock[] => {
  return Array.from({ length: 16 }, (_, i) => {
    const hsl = generateRandomHSL();
    return {
      id: `block-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
      position: i,
      animationSpeed: 0.8 + Math.random() * 0.4,
    };
  });
};

export const useColorStore = create<ColorState>((set, get) => ({
  blocks: generateBlocks(),
  selectedId: null,
  isDragging: false,
  draggingId: null,
  dragOverPosition: null,
  isAuroraActive: false,
  auroraOrigin: null,

  selectBlock: (id: string) => {
    set({ selectedId: id });
  },

  updateBlockColor: (id: string, h: number, s: number, l: number) => {
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === id
          ? { ...block, hue: h, saturation: s, lightness: l }
          : block
      ),
    }));
  },

  swapBlocks: (pos1: number, pos2: number) => {
    if (pos1 === pos2) return;
    set((state) => {
      const newBlocks = [...state.blocks];
      const idx1 = newBlocks.findIndex((b) => b.position === pos1);
      const idx2 = newBlocks.findIndex((b) => b.position === pos2);
      if (idx1 !== -1 && idx2 !== -1) {
        newBlocks[idx1] = { ...newBlocks[idx1], position: pos2 };
        newBlocks[idx2] = { ...newBlocks[idx2], position: pos1 };
      }
      return { blocks: newBlocks };
    });
  },

  setDragState: (isDragging: boolean, draggingId: string | null, overPos: number | null) => {
    set({ isDragging, draggingId, dragOverPosition: overPos });
  },

  triggerAurora: (x: number, y: number, hue: number) => {
    set({ isAuroraActive: true, auroraOrigin: { x, y, hue } });
    setTimeout(() => {
      get().endAurora();
    }, 1500);
  },

  endAurora: () => {
    set({ isAuroraActive: false, auroraOrigin: null });
  },

  resetAll: () => {
    set({
      blocks: generateBlocks(),
      selectedId: null,
      isDragging: false,
      draggingId: null,
      dragOverPosition: null,
      isAuroraActive: false,
      auroraOrigin: null,
    });
  },
}));

export const useSelectedBlock = (): ColorBlock | null => {
  const blocks = useColorStore((state) => state.blocks);
  const selectedId = useColorStore((state) => state.selectedId);
  return blocks.find((b) => b.id === selectedId) || null;
};

export const useSortedBlocks = (): ColorBlock[] => {
  const blocks = useColorStore((state) => state.blocks);
  return [...blocks].sort((a, b) => a.position - b.position);
};
