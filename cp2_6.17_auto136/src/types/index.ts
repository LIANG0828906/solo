export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  size: number;
  blendMode: BlendMode;
  points: Point[];
}

export interface Doodle {
  id: string;
  name: string;
  thumbnail: string;
  strokes: Stroke[];
  createdAt: number;
  updatedAt: number;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
}

export interface BrushSettings {
  color: string;
  size: number;
  blendMode: BlendMode;
}

export const PRESET_COLORS: string[] = [
  '#E74C3C',
  '#E67E22',
  '#F1C40F',
  '#2ECC71',
  '#1ABC9C',
  '#3498DB',
  '#9B59B6',
  '#E91E63',
  '#000000',
  '#FFFFFF',
  '#95A5A6',
  '#795548',
];

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
];

export const CANVAS_SIZE = { width: 2000, height: 2000 };
export const THUMBNAIL_SIZE = { width: 100, height: 80 };
export const MAX_HISTORY = 20;
export const GALLERY_PAGE_SIZE = 20;
