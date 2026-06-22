export type ShapeType = 'circle' | 'triangle' | 'star' | 'diamond';
export type TextureType = 'none' | 'noise' | 'stripes' | 'waves' | 'dots';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  color: string;
  texture: TextureType;
  rotation: number;
}

export interface GradientConnection {
  id: string;
  fromShapeId: string;
  toShapeId: string;
}

export interface GalleryItem {
  id: string;
  artId: string;
  title: string;
  author: string;
  thumbnail: string;
  shapes: Shape[];
  gradientConnections: GradientConnection[];
  createdAt: number;
}

export interface RippleEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8D8EA',
];

export const CANVAS_SIZE = 64;
export const PIXEL_SIZE = 10;
export const CANVAS_PIXEL_SIZE = CANVAS_SIZE * PIXEL_SIZE;
