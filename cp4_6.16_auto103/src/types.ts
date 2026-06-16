export type ExplosionShape = 'circle' | 'star' | 'heart';

export interface ParticleConfig {
  id: string;
  launchPosition: { x: number; y: number; z: number };
  explosionHeight: number;
  colors: string[];
  shape: ExplosionShape;
  particleCount: number;
  timestamp: number;
}

export interface ExplosionHistory {
  config: ParticleConfig;
  snapshot: string;
  timestamp: number;
}

export interface ControlCallbacks {
  onColorChange: (colors: string[]) => void;
  onShapeChange: (shape: ExplosionShape) => void;
  onParticleCountChange: (count: number) => void;
  onAutoFireChange: (enabled: boolean) => void;
  onReplay: (config: ParticleConfig) => void;
}

export interface ParticleData {
  position: Float32Array;
  velocity: Float32Array;
  color: Float32Array;
  life: Float32Array;
  maxLife: number;
  initialSize: number;
  distanceFromCenter: number;
}

export interface FireworkInstance {
  config: ParticleConfig;
  phase: 'rising' | 'exploded';
  risePosition: { x: number; y: number; z: number };
  riseVelocity: number;
  riseProgress: number;
  trailParticles: ParticleData[];
  explosionParticles: ParticleData[] | null;
  explosionTime: number;
  flashLight: { intensity: number; duration: number; elapsed: number } | null;
}

export const COLOR_PALETTE = [
  { name: '柔和粉', color: '#FFB6C1' },
  { name: '日落橙', color: '#FF6B35' },
  { name: '柠檬黄', color: '#FFE66D' },
  { name: '草坪绿', color: '#7CB342' },
  { name: '天蓝', color: '#4FC3F7' },
  { name: '靛紫', color: '#7E57C2' },
  { name: '玫瑰红', color: '#E91E63' },
  { name: '青绿', color: '#26A69A' },
  { name: '雪白', color: '#FFFFFF' },
  { name: '金色', color: '#FFD700' },
  { name: '珊瑚', color: '#FF7F50' },
  { name: '银灰', color: '#B0BEC5' },
];
