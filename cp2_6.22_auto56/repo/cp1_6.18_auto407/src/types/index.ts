export type GestureType =
  | 'CIRCLE'
  | 'TRIANGLE'
  | 'S_SHAPE'
  | 'Z_SHAPE'
  | 'CUSTOM'
  | 'UNKNOWN';

export type AnimationType = 'VORTEX' | 'PULSE' | 'WAVE' | 'FLASH' | 'NONE';

export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureMapping {
  gesture: GestureType;
  animation: AnimationType;
  customLabel?: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  points: Point[];
  thumbnailData: string;
  createdAt: number;
  gestureType: GestureType;
}

export interface RecognitionResult {
  type: GestureType;
  confidence: number;
  matchPercentage: number;
  matchedTemplateId?: string;
  gestureName?: string;
}

export interface HistoryItem {
  id: string;
  gesture: GestureType;
  animation: AnimationType;
  timestamp: number;
}

export interface TrailParticle {
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
}

export interface AnimationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  angle?: number;
  radius?: number;
  angularSpeed?: number;
}

export const GESTURE_LABELS: Record<GestureType, string> = {
  CIRCLE: '圆形',
  TRIANGLE: '三角形',
  S_SHAPE: 'S形',
  Z_SHAPE: 'Z形',
  CUSTOM: '自定义',
  UNKNOWN: '未知',
};

export const ANIMATION_LABELS: Record<AnimationType, string> = {
  VORTEX: '粒子涡旋',
  PULSE: '脉冲几何',
  WAVE: '波浪浮动',
  FLASH: '闪烁弹窗',
  NONE: '无效果',
};

export const DEFAULT_MAPPINGS: GestureMapping[] = [
  { gesture: 'CIRCLE', animation: 'VORTEX' },
  { gesture: 'TRIANGLE', animation: 'PULSE' },
  { gesture: 'S_SHAPE', animation: 'WAVE' },
  { gesture: 'Z_SHAPE', animation: 'FLASH' },
];

export const CANVAS_CONFIG = {
  WIDTH: 900,
  HEIGHT: 600,
  BG_COLOR: '#0F0F23',
  TRAIL_COLOR: '#00FFAA',
  TRAIL_MIN_SIZE: 3,
  TRAIL_MAX_SIZE: 6,
  TRAIL_MAX_PARTICLES: 30,
};

export const VORTEX_CONFIG = {
  DURATION: 3000,
  PARTICLE_COUNT: 100,
  COLOR_START: '#FF6B6B',
  COLOR_END: '#4ECDC4',
};

export const PULSE_CONFIG = {
  AMPLITUDE: 1.2,
  PERIOD: 1000,
  REPEAT: 3,
};

export const WAVE_CONFIG = {
  AMPLITUDE: 80,
  PERIOD: 2000,
};

export const STORAGE_KEY = 'gesture-app-state-v1';
export const MAX_CUSTOM_TEMPLATES = 5;

export const GESTURE_TYPE_VALUES: GestureType[] = [
  'CIRCLE',
  'TRIANGLE',
  'S_SHAPE',
  'Z_SHAPE',
  'CUSTOM',
];

export const ANIMATION_TYPE_VALUES: AnimationType[] = [
  'VORTEX',
  'PULSE',
  'WAVE',
  'FLASH',
  'NONE',
];
