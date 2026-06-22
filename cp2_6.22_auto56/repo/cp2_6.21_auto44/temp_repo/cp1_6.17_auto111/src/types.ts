export interface Fragment {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  createdAt: number;
  clusterId?: string;
}

export interface Cluster {
  id: string;
  name: string;
  keyword: string;
  color: string;
  fragmentIds: string[];
}

export interface Link {
  source: string;
  target: string;
  strength: number;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
  fragment: Fragment;
  radius: number;
  color: string;
}

export interface CanvasLink {
  source: string | CanvasNode;
  target: string | CanvasNode;
  strength: number;
}

export const ColorPalette = [
  '#5B7B6A',
  '#B88C6A',
  '#6A8CB8',
  '#B86A8C',
  '#8CB86A'
];
