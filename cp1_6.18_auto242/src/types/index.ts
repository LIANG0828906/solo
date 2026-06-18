export type InkColor = '#1A1A1A' | '#333333' | '#4D4D4D' | '#808080' | '#BFBFBF';
export type BrushStyle = 'ripple' | 'vortex' | 'splash';
export type DiffusionSpeed = 0.5 | 1 | 2 | 4;

export interface BrushConfig {
  inkColor: InkColor;
  brushStyle: BrushStyle;
  diffusionSpeed: DiffusionSpeed;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  angle: number;
  phase: number;
  style: BrushStyle;
  originX: number;
  originY: number;
}

export interface DrawPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
  brushConfig: BrushConfig;
}

export interface Artwork {
  id: string;
  shareCode: string;
  thumbnail: string;
  fullImage: string;
  drawSequence: DrawPoint[];
  createdAt: number;
  duration: number;
}

export interface DrawCommand {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pressure: number;
  brushConfig: BrushConfig;
}

export const INK_COLORS: InkColor[] = ['#1A1A1A', '#333333', '#4D4D4D', '#808080', '#BFBFBF'];
export const INK_COLOR_NAMES: Record<InkColor, string> = {
  '#1A1A1A': '焦墨',
  '#333333': '浓墨',
  '#4D4D4D': '重墨',
  '#808080': '淡墨',
  '#BFBFBF': '清墨',
};
export const DIFFUSION_SPEEDS: DiffusionSpeed[] = [0.5, 1, 2, 4];
export const BRUSH_STYLES: { value: BrushStyle; label: string; icon: string }[] = [
  { value: 'ripple', label: '轻柔波纹', icon: 'waves' },
  { value: 'vortex', label: '激烈旋涡', icon: 'tornado' },
  { value: 'splash', label: '随机飞溅', icon: 'spray-can' },
];
export const PARTICLE_MAX_LIFE = 5000;
export const PARTICLE_COUNT_THRESHOLD = 2000;
