export type BrickSize = '1x1' | '1x2' | '1x4' | '2x2' | '2x3' | '2x4';

export type BrickColor = 'red' | 'yellow' | 'blue' | 'green' | 'white';

export type Rotation = 0 | 90 | 180 | 270;

export interface BrickData {
  id: string;
  type: BrickSize;
  color: BrickColor;
  x: number;
  y: number;
  rotation: Rotation;
  justPlaced?: boolean;
  deleting?: boolean;
}

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface WorkData {
  id: string;
  name: string;
  createdAt: number;
  bricks: BrickData[];
  viewport: Viewport;
}

export interface ColorMeta {
  key: BrickColor;
  name: string;
  primary: string;
  dark: string;
  light: string;
  border: string;
  studHighlight: string;
  shadow: string;
}

export interface SizeMeta {
  key: BrickSize;
  w: number;
  h: number;
  studsX: number;
  studsY: number;
  label: string;
}
