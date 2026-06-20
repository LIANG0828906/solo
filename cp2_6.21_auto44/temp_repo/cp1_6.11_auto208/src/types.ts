export interface WarpThread {
  id: number;
  color: string;
  position: number;
  isUp: boolean;
  harnessId: number;
}

export interface WeftPick {
  id: number;
  color: string;
  direction: 'left' | 'right';
  interlacements: Interlacement[];
}

export interface Interlacement {
  warpIndex: number;
  isWarpFaced: boolean;
  color: string;
}

export interface HarnessState {
  id: number;
  isUp: boolean;
  warpIndices: number[];
}

export interface HistoryEntry {
  harnessChanges: { id: number; wasUp: boolean }[];
  weftPick: WeftPick;
}

export interface LoomState {
  warps: WarpThread[];
  harnesses: HarnessState[];
  weftPicks: WeftPick[];
  currentWeftColor: string;
  pickDirection: 'left' | 'right';
  history: HistoryEntry[];
}

export interface RenderConfig {
  scale: number;
  offsetX: number;
  offsetY: number;
  cellWidth: number;
  cellHeight: number;
}

export const WARP_COUNT = 48;
export const HARNESS_COUNT = 8;
export const MAX_HISTORY = 30;
export const MAX_ROWS = 600;
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;
export const ROW_HEIGHT = 8;

export const PRESET_COLORS = [
  '#DC143C',
  '#FF8C00',
  '#4B0082',
  '#228B22',
  '#2F2F2F',
  '#FFF8DC',
  '#B8860B',
  '#5F9EA0'
];

export const COLOR_NAMES = [
  '胭脂红',
  '姜黄',
  '靛蓝',
  '翠绿',
  '墨黑',
  '米白',
  '金棕',
  '石青'
];
