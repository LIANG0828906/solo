import { create } from 'zustand';

export type StitchType = 0 | 1 | 2 | 3 | 4;

export const STITCH_NAMES: Record<StitchType, string> = {
  0: '空',
  1: '下针',
  2: '上针',
  3: '加针',
  4: '减针'
};

export const STITCH_COLORS: Record<StitchType, string> = {
  0: 'transparent',
  1: '#E8D5C4',
  2: '#C9B8A8',
  3: '#D4A574',
  4: '#B8956E'
};

export const DEFAULT_PALETTE = [
  '#D2B48C', '#8B7355', '#6B4E3D', '#FAF0E6',
  '#A67C52', '#C4A484', '#E8C4A0', '#5C4033',
  '#9B7653', '#CD853F', '#DEB887', '#4A3728'
];

export const GRID_ROWS = 60;
export const GRID_COLS = 40;
export const CELL_SIZE = 12;

export interface CellData {
  stitch: StitchType;
  color: string;
}

interface DesignState {
  activeStitch: StitchType;
  activeColor: string;
  palette: string[];
  zoom: number;
  setActiveStitch: (stitch: StitchType) => void;
  setActiveColor: (color: string) => void;
  setPalette: (colors: string[]) => void;
  setZoom: (zoom: number) => void;
}

export const useDesignStore = create<DesignState>((set) => ({
  activeStitch: 1,
  activeColor: DEFAULT_PALETTE[0],
  palette: DEFAULT_PALETTE,
  zoom: 1,
  setActiveStitch: (stitch) => set({ activeStitch: stitch }),
  setActiveColor: (color) => set({ activeColor: color }),
  setPalette: (colors) => set({ palette: colors }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) })
}));
