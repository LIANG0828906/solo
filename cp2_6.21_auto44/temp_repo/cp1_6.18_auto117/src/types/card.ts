export interface Card {
  id: string;
  title: string;
  body: string;
  color: string;
  keywords: string[];
  x: number;
  y: number;
  createdAt: number;
}

export interface CardCollection {
  id: string;
  name: string;
  cardIds: string[];
  createdAt: number;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export type FilterState = {
  keyword: string;
  color: string | null;
};

export const PRESET_COLORS = [
  '#FF658B',
  '#FFB84D',
  '#4ECDC4',
  '#6C63FF',
  '#A29BFE',
  '#FD79A8',
] as const;

export const DEFAULT_COLOR = PRESET_COLORS[3];

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 200;
export const CARD_GAP = 24;
export const SNAP_THRESHOLD = 8;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2;
export const MIN_WINDOW_WIDTH = 1280;
