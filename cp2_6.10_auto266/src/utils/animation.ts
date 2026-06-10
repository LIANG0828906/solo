import type { Particle } from '../types';

export function createParticle(x: number, y: number, color: string): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 3 + 1;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    maxLife: 60 + Math.random() * 60,
    color,
    size: Math.random() * 4 + 2,
  };
}

export function updateParticle(particle: Particle): boolean {
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.vy += 0.05;
  particle.life -= 1 / particle.maxLife;
  return particle.life > 0;
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
