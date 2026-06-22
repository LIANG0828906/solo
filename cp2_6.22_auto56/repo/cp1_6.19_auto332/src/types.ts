export type PixelColor = string;

export interface Tile {
  id: string;
  name: string;
  data: PixelColor[][];
  width: number;
  height: number;
}

export type ToolType = 'brush' | 'tile' | 'select';

export interface ToolState {
  currentTool: ToolType;
  brushColor: PixelColor;
  selectedTileId: string | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const GRID_SIZE = 32;
export const CELL_SIZE = 16;
export const GRID_BG_COLOR = '#333333';
export const CANVAS_BG_COLOR = '#1e1e1e';
export const PANEL_BG_COLOR = '#2a2a2a';
export const TEXT_COLOR = '#ecf0f1';

export const PRESET_COLORS: PixelColor[] = [
  '#e74c3c',
  '#2ecc71',
  '#3498db',
  '#f1c40f',
  '#9b59b6',
  '#e67e22',
  '#1abc9c',
  '#e91e63',
  '#795548',
  '#ffffff',
  '#bdc3c7',
  '#2c3e50',
];
