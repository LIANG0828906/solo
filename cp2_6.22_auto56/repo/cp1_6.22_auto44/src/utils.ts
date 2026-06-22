import type { Rect } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

export function checkRectCollision(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

export function isOnScreen(x: number, y: number, padding: number = 50): boolean {
  return (
    x >= -padding &&
    x <= CANVAS_WIDTH + padding &&
    y >= -padding &&
    y <= CANVAS_HEIGHT + padding
  );
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
