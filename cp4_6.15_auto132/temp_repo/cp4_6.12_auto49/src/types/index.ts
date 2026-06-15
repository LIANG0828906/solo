export type PatternType = 'wave' | 'spiral' | 'random';
export type ThemeType = 'warm' | 'cool' | 'neon';

export interface IconItem {
  id: string;
  name: string;
  type: 'emoji' | 'image';
  content: string;
}

export interface PatternPoint {
  x: number;
  y: number;
  rotation?: number;
  alpha?: number;
  scale?: number;
}

export interface ThemeConfig {
  background: string;
  primaryColors: string[];
  accentColor: string;
}

export interface AppState {
  iconList: IconItem[];
  pattern: PatternType;
  theme: ThemeType;
  density: number;
  iconSize: number;
}
