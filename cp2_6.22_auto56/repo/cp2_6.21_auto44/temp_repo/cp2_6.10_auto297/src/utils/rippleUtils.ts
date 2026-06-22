import type { Ripple } from '../types';

export const RIPPLE_SPEED = 120;
export const RIPPLE_LIFETIME = 4000;
export const MAX_RIPPLES = 64;
export const RING_WIDTH = 3;

export function getRippleRadius(ripple: Ripple, currentTime: number): number {
  const elapsed = currentTime - ripple.startTime;
  return RIPPLE_SPEED * (elapsed / 1000);
}

export function getRippleAlpha(ripple: Ripple, currentTime: number): number {
  const elapsed = currentTime - ripple.startTime;
  const lifeRatio = elapsed / ripple.lifetime;
  return Math.max(0, 1 - lifeRatio * lifeRatio);
}

export function isRippleExpired(ripple: Ripple, currentTime: number): boolean {
  return currentTime - ripple.startTime > ripple.lifetime;
}

export function checkCollision(r1: Ripple, r2: Ripple, currentTime: number): boolean {
  const dx = r2.x - r1.x;
  const dy = r2.y - r1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const radius1 = getRippleRadius(r1, currentTime);
  const radius2 = getRippleRadius(r2, currentTime);
  const collisionThreshold = Math.abs(radius1 + radius2 - distance);
  return collisionThreshold < 15 && collisionThreshold > 0;
}

export function generateId(): number {
  return Date.now() + Math.random() * 10000;
}
