export type ThemeType = 'fire' | 'ice' | 'sand' | 'petal';

export interface ParticleParams {
  particleSize: number;
  dissipateSpeed: number;
  directionRandomness: number;
}

export interface AnimationState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  remainingTime: number;
  speedMultiplier: number;
  triggerMode: 'click' | 'auto';
}

export interface TextConfig {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

export interface ThemeConfig {
  type: ThemeType;
  name: string;
  colors: string[];
  glowColor: string;
  bgGradient: { start: string; end: string };
  defaultDirection: { x: number; y: number };
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'square' | 'ellipse' | 'triangle';
  lifetime: number;
  maxLifetime: number;
  phase: number;
}

export interface ExportConfig {
  textConfig: TextConfig;
  theme: ThemeType;
  particleParams: ParticleParams;
  animationConfig: {
    speedMultiplier: number;
    triggerMode: 'click' | 'auto';
  };
  timestamp: number;
  version: string;
}
