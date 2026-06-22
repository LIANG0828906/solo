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
  animState: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  targetScale: number;
  opacity: number;
  haloAngle: number;
  particles: BurstParticle[];
  offsetDX: number;
  offsetDY: number;
  quantumScale: number;
  quantumRotation: number;
  quantumAlpha: number;

  constructor(color: PhotonColor, gridX: number, gridY: number) {
    this.color = color;
    this.gridX = gridX;
    this.gridY = gridY;
    this.energyLevel = 1;
    this.state = PhotonState.Normal;
    this.stateTime = 0;
    this.animState = 0;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.opacity = 1;
    this.haloAngle = 0;
    this.particles = [];
    this.offsetDX = 0;
    this.offsetDY = 0;
    this.quantumScale = 1;
    this.quantumRotation = 0;
    this.quantumAlpha = 1;
  }

  updateAnimation(dt: number) {
    this.animState += dt;
    switch (this.color) {
      case 'red': {
        this.offsetDY = Math.sin(this.animState * 8) * 4;
        this.offsetDX = 0;
        this.quantumScale = 1;
        this.quantumRotation = 0;
        this.quantumAlpha = 1;
        break;
      }
      case 'blue': {
        const s = this.easeInOutSine(0.5 + 0.5 * Math.sin(this.animState * 2));
        this.offsetDX = 0;
        this.offsetDY = 0;
        this.quantumScale = 0.9 + s * 0.2;
        this.quantumRotation = 0;
        this.quantumAlpha = 0.7 + s * 0.3;
        break;
      }
      case 'green': {
        this.offsetDX = 0;
        this.offsetDY = 0;
        this.quantumScale = 1;
        this.quantumRotation = this.animState * 2;
        this.quantumAlpha = 1;
        break;
      }
      case 'purple': {
        const s = 0.5 + Math.abs(Math.sin(this.animState * 6)) * 0.5;
        const eased = this.easeInOutSine(s);
        this.offsetDX = 0;
        this.offsetDY = 0;
        this.quantumScale = 1;
        this.quantumRotation = 0;
        this.quantumAlpha = 0.4 + eased * 0.6;
        break;
      }
    }
  }

  easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  getQuantumOffset(_time: number): { dx: number; dy: number; extraScale: number; rotation: number; extraAlpha: number } {
    return {
      dx: this.offsetDX,
      dy: this.offsetDY,
      extraScale: this.quantumScale,
      rotation: this.quantumRotation,
      extraAlpha: this.quantumAlpha,
    };
  }

  static randomColor(): PhotonColor {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
}
