import { v4 as uuidv4 } from 'uuid';
import { Season, Particle, SmokeParticle, SeasonColors } from './types';

export const SEASON_COLORS: Record<Season, SeasonColors> = {
  [Season.SPRING]: {
    sky: '#BBDEFB',
    skyGradient: '#E3F2FD',
    grass: '#7CB342',
    treeCrown: '#AED581',
    houseRoof: '#E53935',
    houseWall: '#F5F5F5',
    particle: '#F48FB1',
  },
  [Season.SUMMER]: {
    sky: '#BBDEFB',
    skyGradient: '#90CAF9',
    grass: '#7CB342',
    treeCrown: '#4CAF50',
    houseRoof: '#E53935',
    houseWall: '#F5F5F5',
    particle: '#FFF176',
  },
  [Season.AUTUMN]: {
    sky: '#CFD8DC',
    skyGradient: '#B0BEC5',
    grass: '#8D6E63',
    treeCrown: '#FFB74D',
    houseRoof: '#E53935',
    houseWall: '#F5F5F5',
    particle: '#FFB74D',
  },
  [Season.WINTER]: {
    sky: '#CFD8DC',
    skyGradient: '#ECEFF1',
    grass: '#8D6E63',
    treeCrown: '#FFFFFF',
    treeShadow: '#B0BEC5',
    houseRoof: '#E53935',
    houseRoofSnow: true,
    houseWall: '#F5F5F5',
    particle: '#FFFFFF',
  },
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function createParticle(season: Season): Particle {
  const color = SEASON_COLORS[season].particle;
  return {
    id: uuidv4(),
    x: Math.random() * CANVAS_WIDTH,
    y: -10 - Math.random() * 50,
    size: 2 + Math.random() * 4,
    color,
    speed: 0.5 + Math.random() * 1.2,
    angle: Math.random() * Math.PI * 2,
    spiralRadius: 8 + Math.random() * 15,
    opacity: 0.7 + Math.random() * 0.3,
  };
}

export function syncParticles(
  currentParticles: Particle[],
  targetCount: number,
  season: Season
): Particle[] {
  let particles = [...currentParticles];

  if (particles.length < targetCount) {
    const toAdd = targetCount - particles.length;
    for (let i = 0; i < toAdd; i++) {
      const p = createParticle(season);
      p.y = Math.random() * CANVAS_HEIGHT;
      particles.push(p);
    }
  } else if (particles.length > targetCount) {
    particles = particles.slice(0, targetCount);
  }

  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => {
      const newAngle = p.angle + 0.03;
      const spiralX = Math.sin(newAngle) * p.spiralRadius * 0.1;
      const newX = p.x + spiralX;
      const newY = p.y + p.speed;

      let newOpacity = p.opacity;
      if (newY > CANVAS_HEIGHT - 80) {
        newOpacity = Math.max(0, p.opacity - 0.02);
      }

      return {
        ...p,
        x: newX,
        y: newY,
        angle: newAngle,
        opacity: newOpacity,
      };
    })
    .filter((p) => p.y < CANVAS_HEIGHT + 20 && p.opacity > 0);
}

export function createSmokeParticle(x: number, y: number): SmokeParticle {
  return {
    id: uuidv4(),
    x: x + (Math.random() - 0.5) * 4,
    y,
    radius: 4,
    maxRadius: 12,
    opacity: 0.4,
    speedY: 0.5 + Math.random() * 0.3,
  };
}

export function updateSmokeParticles(smokes: SmokeParticle[]): SmokeParticle[] {
  return smokes
    .map((s) => ({
      ...s,
      y: s.y - s.speedY,
      radius: Math.min(s.maxRadius, s.radius + 0.15),
      opacity: Math.max(0, s.opacity - 0.008),
    }))
    .filter((s) => s.opacity > 0);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}
