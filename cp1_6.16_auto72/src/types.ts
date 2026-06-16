export interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum SunPosition {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right'
}

export interface SunState {
  angle: number;
  x: number;
  y: number;
}

export type DragMode = 
  | 'none'
  | 'move'
  | 'resize-top'
  | 'resize-left'
  | 'resize-right'
  | 'sun';

export interface DragState {
  mode: DragMode;
  buildingId: string | null;
  startX: number;
  startY: number;
  startBuilding: Building | null;
}

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 450;
export const GROUND_Y = 400;
export const GRID_SIZE = 10;
export const SUN_RADIUS = 15;
export const RESIZE_HANDLE_SIZE = 10;
export const SUN_MIN_ANGLE = -30;
export const SUN_MAX_ANGLE = 30;
export const SUN_ARC_RADIUS = 120;
export const SUN_ARC_CENTER_X = 450;
export const SUN_ARC_CENTER_Y = 100;
