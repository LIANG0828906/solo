export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface Point {
  x: number;
  y: number;
}

export function bezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  };
}

export function generateBezierControlPoints(start: Point, length: number): { p1: Point; p2: Point; p3: Point } {
  const angle = random(0, Math.PI * 2);
  const endX = start.x + Math.cos(angle) * length;
  const endY = start.y + Math.sin(angle) * length;
  const p3 = { x: endX, y: endY };

  const cp1Dist = random(length * 0.2, length * 0.5);
  const cp1Angle = angle + random(-Math.PI / 3, Math.PI / 3);
  const p1 = {
    x: start.x + Math.cos(cp1Angle) * cp1Dist,
    y: start.y + Math.sin(cp1Angle) * cp1Dist
  };

  const cp2Dist = random(length * 0.3, length * 0.6);
  const cp2Angle = angle + random(-Math.PI / 4, Math.PI / 4);
  const p2 = {
    x: endX - Math.cos(cp2Angle) * cp2Dist,
    y: endY - Math.sin(cp2Angle) * cp2Dist
  };

  return { p1, p2, p3 };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
