export type HotspotType = 'blink' | 'glow';

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: HotspotType;
}

export interface ComicPage {
  id: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

export interface Book {
  id: string;
  title: string;
  totalPages: number;
  pages: ComicPage[];
}

export interface FlipStyle {
  transform: string;
  boxShadow: string;
  backfaceVisibility: string;
  transformOrigin: string;
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  currentX: number;
  dragDirection: 'next' | 'prev' | null;
  startTime: number;
  lastX: number;
  lastTime: number;
}

export interface MeshGrid {
  cols: number;
  rows: number;
  vertices: CurvePoint[][];
  foldX: number;
  curlRadius: number;
}

export interface ShadowContour {
  points: CurvePoint[];
  innerPoints: CurvePoint[];
  gradientStops: { offset: number; opacity: number }[];
}
