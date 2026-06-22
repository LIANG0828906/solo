export interface LightTracePoint {
  x: number;
  y: number;
  z: number;
}

export interface LightTrace {
  id: string;
  points: LightTracePoint[];
  color: string;
  thickness: number;
  createdAt: number;
}

export interface Frame {
  id: string;
  index: number;
  traces: LightTrace[];
  thumbnail?: string;
  createdAt: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentFrameIndex: number;
  mode: 'loop' | 'once';
  startTime: number;
  frameDuration: number;
}

export interface DrawState {
  isDrawing: boolean;
  currentColor: string;
  currentThickness: number;
  currentTrace: LightTrace | null;
  isEditMode: boolean;
}

export const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F'
];

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
