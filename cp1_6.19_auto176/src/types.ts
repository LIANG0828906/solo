export interface Point {
  x: number;
  y: number;
}

export interface BezierControlPoint {
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface NeonSegment {
  id: string;
  points: Point[];
  bezierControlPoints: BezierControlPoint[];
  color: string;
  targetColor: string;
  colorRGB: ColorRGB;
  targetColorRGB: ColorRGB;
  colorProgress: number;
  colorDuration: number;
  opacity: number;
  targetOpacity: number;
  opacityDuration: number;
  scale: number;
  targetScale: number;
  scaleDuration: number;
  centerX: number;
  centerY: number;
}

export type AnimationMode = 'static' | 'blink' | 'chase' | 'breathe';

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  glowColor: string;
  backgroundColor: string;
  colorPalette: string[];
}

export const DEFAULT_NEON_COLORS: string[] = [
  '#FF007F',
  '#00FF41',
  '#FFFF00',
  '#00D4FF',
  '#FF6600',
  '#FF00FF'
];

export const THEMES: Theme[] = [
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    primaryColor: '#FF00FF',
    glowColor: '#00FFFF',
    backgroundColor: '#0F0F23',
    colorPalette: ['#FF00FF', '#00FFFF', '#FF007F', '#00D4FF', '#FF6600', '#FFFF00']
  },
  {
    id: 'neon-city',
    name: '霓虹都市',
    primaryColor: '#FF6600',
    glowColor: '#FFFF00',
    backgroundColor: '#1A1100',
    colorPalette: ['#FF6600', '#FFFF00', '#FF007F', '#FF00FF', '#00FF41', '#00D4FF']
  },
  {
    id: 'aurora',
    name: '极光幻境',
    primaryColor: '#00FF41',
    glowColor: '#00D4FF',
    backgroundColor: '#0B1A0B',
    colorPalette: ['#00FF41', '#00D4FF', '#FF00FF', '#FFFF00', '#FF007F', '#FF6600']
  },
  {
    id: 'lava',
    name: '熔岩暗夜',
    primaryColor: '#FF0000',
    glowColor: '#FF6600',
    backgroundColor: '#1A0B0B',
    colorPalette: ['#FF0000', '#FF6600', '#FF007F', '#FFFF00', '#FF00FF', '#00D4FF']
  }
];

export const ANIMATION_MODE_LABELS: Record<AnimationMode, string> = {
  static: '静态',
  blink: '闪烁',
  chase: '追逐',
  breathe: '呼吸'
};
