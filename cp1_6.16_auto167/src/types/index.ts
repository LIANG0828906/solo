export type ViewMode = 'edit' | 'preview' | 'visitor';

export type ZoneType = 'rect' | 'circle';

export interface ExhibitItem {
  id: string;
  src: string;
  name: string;
  scale: number;
  label?: string;
}

export interface Zone {
  id: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  bgColor: string;
  title: string;
  note: string;
  exhibits: ExhibitItem[];
}

export interface BezierControl {
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

export interface PathPoint {
  x: number;
  y: number;
  bezier?: BezierControl;
}

export interface Path {
  id: string;
  points: PathPoint[];
  color: string;
  width: number;
}

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface LayoutData {
  zones: Zone[];
  paths: Path[];
  canvas: CanvasState;
  version: string;
  createdAt: number;
}

export interface Exhibit {
  id: string;
  name: string;
  url: string;
  category: string;
  thumbnail: string;
}

export const THEME_COLORS: { name: string; value: string }[] = [
  { name: '古典米色', value: '#F5E6D3' },
  { name: '深邃蓝灰', value: '#2C3E50' },
  { name: '勃艮第红', value: '#8B2635' },
  { name: '森系墨绿', value: '#2D5A27' },
  { name: '沙漠琥珀', value: '#D4A574' },
  { name: '莫兰迪紫', value: '#8D87A8' },
  { name: '青金石蓝', value: '#1D4E89' },
  { name: '暖金褐', value: '#8B6914' },
];

export const MIN_ZONE_SIZE = 120;
export const ROTATION_STEP = 15;
export const PATH_COLOR = '#8E44AD';
export const PATH_WIDTH = 2;
export const HIGHLIGHT_COLOR = '#E94560';
export const BG_PRIMARY = '#1A1A2E';
export const BG_PANEL = '#16213E';
export const BG_BAR = '#0F3460';
export const TEXT_PRIMARY = '#E0E0E0';
export const RULER_COLOR = '#4A4A4A';
