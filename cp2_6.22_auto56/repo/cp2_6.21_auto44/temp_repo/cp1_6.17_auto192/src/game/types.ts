export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: RGBColor;
  createdAt: number;
  lifespan: number;
}

export interface GameEvents {
  particleCreated: Particle;
  particleUpdated: Particle[];
  particlesFused: { particleA: Particle; particleB: Particle; result: Particle };
  scoreUpdated: { score: number; fusionCount: number; progress: number };
  gameWon: void;
  gameLost: void;
}

export const COLOR_PALETTE: string[] = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#FF8C42',
  '#6C5CE7',
  '#00B894',
  '#FD79A8',
];

export const GRAVITY = 0.5;
export const ELASTICITY = 0.7;
export const PARTICLE_LIFESPAN = 5000;
export const TARGET_RADIUS = 50;
export const GAME_DURATION = 60;
export const MAX_PARTICLES_LOD = 200;
export const LOD_DISTANCE = 200;
export const FUSION_RADIUS_MULTIPLIER = 1.2;

export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

export function rgbToHex(color: RGBColor): string {
  return (
    '#' +
    [color.r, color.g, color.b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function rgbToString(color: RGBColor, alpha = 1): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
