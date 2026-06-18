import type { Vector2D } from '../types';

export const MathUtils = {
  add(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  sub(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  mul(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x * scalar, y: v.y * scalar };
  },

  div(v: Vector2D, scalar: number): Vector2D {
    return { x: v.x / scalar, y: v.y / scalar };
  },

  addInPlace(a: Vector2D, b: Vector2D): void {
    a.x += b.x;
    a.y += b.y;
  },

  mulInPlace(v: Vector2D, scalar: number): void {
    v.x *= scalar;
    v.y *= scalar;
  },

  length(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  lengthSq(v: Vector2D): number {
    return v.x * v.x + v.y * v.y;
  },

  normalize(v: Vector2D): Vector2D {
    const len = this.length(v);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  distance(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distanceSq(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  },

  dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
  },

  reflect(v: Vector2D, normal: Vector2D): Vector2D {
    const d = 2 * this.dot(v, normal);
    return { x: v.x - d * normal.x, y: v.y - d * normal.y };
  },

  fromAngle(angle: number, magnitude: number = 1): Vector2D {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
  },

  toAngle(v: Vector2D): number {
    return Math.atan2(v.y, v.x);
  },

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  },

  random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  },

  degToRad(deg: number): number {
    return deg * Math.PI / 180;
  },

  radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
  }
};
