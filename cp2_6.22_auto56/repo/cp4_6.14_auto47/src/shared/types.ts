export interface Layer {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  visible: boolean;
  filter: FilterType;
  filterIntensity: number;
  cropRect?: CropRect;
  zIndex: number;
}

export type FilterType =
  | 'none'
  | 'vintage'
  | 'grayscale'
  | 'warm'
  | 'cool'
  | 'blur'
  | 'emboss'
  | 'pixelate'
  | 'watercolor';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
}

export interface RoomState {
  id: string;
  layers: Layer[];
  users: User[];
}

export const FILTER_PRESETS: Record<FilterType, { name: string; css: string }> = {
  none: { name: '原图', css: 'none' },
  vintage: {
    name: '复古',
    css: 'sepia(0.7) contrast(1.1) brightness(0.9)',
  },
  grayscale: { name: '黑白', css: 'grayscale(1)' },
  warm: { name: '暖色调', css: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)' },
  cool: { name: '冷色调', css: 'saturate(0.8) hue-rotate(20deg) brightness(1.05)' },
  blur: { name: '模糊', css: 'blur(3px)' },
  emboss: {
    name: '浮雕',
    css: 'contrast(2) brightness(1.5) saturate(0)',
  },
  pixelate: { name: '像素化', css: 'contrast(1.2)' },
  watercolor: {
    name: '水彩',
    css: 'saturate(1.5) brightness(1.1) contrast(0.9)',
  },
};

export const USER_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#fcbad3',
  '#a8d8ea',
];
