export interface Point {
  x: number;
  y: number;
}

export interface PaperState {
  vertices: Point[];
  foldLine: Point[];
  isCompleted: boolean;
  rotation: number;
}

export type LightMode = 'bonfire' | 'moonlight' | 'thunder' | 'candle' | 'neon';

export interface LightEffect {
  mode: LightMode;
  color: string;
  intensity: number;
  position?: Point;
}

export interface SilhouetteCard {
  id: string;
  vertices: Point[];
  foldLine: Point[];
  rotation: number;
  thumbnail: string;
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
}

export const VERTEX_COLORS = ['#ff6b6b', '#4ecdc4', '#95e1d3', '#fce38a'];

export const LIGHT_MODES: { mode: LightMode; name: string; color: string }[] = [
  { mode: 'bonfire', name: '篝火', color: '#ff6b35' },
  { mode: 'moonlight', name: '月光', color: '#74b9ff' },
  { mode: 'thunder', name: '雷雨', color: '#a29bfe' },
  { mode: 'candle', name: '蜡烛', color: '#fdcb6e' },
  { mode: 'neon', name: '霓虹', color: '#fd79a8' },
];
