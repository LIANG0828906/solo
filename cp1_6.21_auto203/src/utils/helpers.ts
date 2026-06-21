import type { Vector3 } from '../types/game';

export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

export function normalizeAngle(deg: number): number {
  let result: number = deg % 360;
  if (result < 0) {
    result += 360;
  }
  return result;
}

export function v3(x: number, y: number, z: number): Vector3 {
  return { x, y, z };
}

export function v3Add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function v3Sub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function v3Scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function v3Dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function v3Cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function v3Length(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function v3Normalize(v: Vector3): Vector3 {
  const len: number = v3Length(v);
  if (len === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function v3Clone(v: Vector3): Vector3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function v3Distance(a: Vector3, b: Vector3): number {
  return v3Length(v3Sub(a, b));
}

export function reflect(direction: Vector3, normal: Vector3): Vector3 {
  const dot: number = v3Dot(direction, normal);
  return v3Sub(direction, v3Scale(normal, 2 * dot));
}

export function rotateY(v: Vector3, angleDeg: number): Vector3 {
  const rad: number = degToRad(angleDeg);
  const cos: number = Math.cos(rad);
  const sin: number = Math.sin(rad);
  return {
    x: v.x * cos + v.z * sin,
    y: v.y,
    z: -v.x * sin + v.z * cos,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h: string = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c: string): string => c + c).join('');
  }
  const num: number = parseInt(h, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
