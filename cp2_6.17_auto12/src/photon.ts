export type PhotonColor = 'red' | 'blue' | 'green' | 'purple';

export enum PhotonState {
  Normal,
  Superposing,
  Collapsing,
  Fading,
  Shifting
}

export interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Ripple {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  color: string;
  maxRadius: number;
}

export const COLOR_CONFIG: Record<PhotonColor, { base: string; dark: string; glow: string; rgb: string }> = {
  red:    { base: '#FF4444', dark: '#CC0000', glow: '#FF6666', rgb: '255,68,68' },
  blue:   { base: '#4488FF', dark: '#0044CC', glow: '#66AAFF', rgb: '68,136,255' },
  green:  { base: '#44FF88', dark: '#00CC44', glow: '#66FFAA', rgb: '68,255,136' },
  purple: { base: '#AA44FF', dark: '#7700CC', glow: '#CC66FF', rgb: '170,68,255' },
};

export const COLORS: PhotonColor[] = ['red', 'blue', 'green', 'purple'];

export class Photon {
  color: PhotonColor;
  gridX: number;
  gridY: number;
  energyLevel: number;
  state: PhotonState;
  stateTime: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  targetScale: number;
  opacity: number;
  haloAngle: number;
  particles: BurstParticle[];

  constructor(color: PhotonColor, gridX: number, gridY: number) {
    this.color = color;
    this.gridX = gridX;
    this.gridY = gridY;
    this.energyLevel = 1;
    this.state = PhotonState.Normal;
    this.stateTime = 0;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.opacity = 1;
    this.haloAngle = 0;
    this.particles = [];
  }

  getQuantumOffset(time: number): { dx: number; dy: number; extraScale: number; rotation: number; extraAlpha: number } {
    switch (this.color) {
      case 'red': {
        const dy = Math.sin(time * 8) * 4;
        return { dx: 0, dy, extraScale: 1, rotation: 0, extraAlpha: 1 };
      }
      case 'blue': {
        const s = 1 + Math.sin(time * 2) * 0.1;
        return { dx: 0, dy: 0, extraScale: s, rotation: 0, extraAlpha: 0.85 + Math.sin(time * 2) * 0.15 };
      }
      case 'green': {
        return { dx: 0, dy: 0, extraScale: 1, rotation: time * 2, extraAlpha: 1 };
      }
      case 'purple': {
        const a = 0.5 + Math.abs(Math.sin(time * 6)) * 0.5;
        return { dx: 0, dy: 0, extraScale: 1, rotation: 0, extraAlpha: a };
      }
    }
  }

  static randomColor(): PhotonColor {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
}
