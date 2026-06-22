export interface Vector2 {
  x: number;
  y: number;
}

export type CrystalColor = 'red' | 'blue' | 'green' | 'purple';

export const CRYSTAL_COLORS: Record<CrystalColor, string> = {
  red: '#ff4466',
  blue: '#4488ff',
  green: '#44ff88',
  purple: '#cc44ff'
};

export const CRYSTAL_SCORES: Record<CrystalColor, number> = {
  red: 10,
  blue: 20,
  green: 30,
  purple: 50
};

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomCrystalColor(): CrystalColor {
  const colors: CrystalColor[] = ['red', 'blue', 'green', 'purple'];
  return randomChoice(colors);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function dist(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function circleCollision(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number
): boolean {
  const r = ar + br;
  return distSq(ax, ay, bx, by) <= r * r;
}

export function pointInCircle(
  px: number, py: number,
  cx: number, cy: number, cr: number
): boolean {
  return distSq(px, py, cx, cy) <= cr * cr;
}

export function lineCircleCollision(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, cr: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - cr * cr;

  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(clamp(x, 0, 255)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t)
  );
}

export function generatePolygonPoints(sides: number, radius: number, irregularity: number = 0.3): Vector2[] {
  const points: Vector2[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = radius * (1 - irregularity / 2 + Math.random() * irregularity);
    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }
  return points;
}

export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}
