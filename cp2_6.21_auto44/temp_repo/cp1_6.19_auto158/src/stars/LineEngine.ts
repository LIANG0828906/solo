import type { StarPoint } from '../store';

export function generateStars(count: number, width: number, height: number): StarPoint[] {
  const stars: StarPoint[] = [];
  const margin = 30;
  const minDist = 20;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let placed = false;
    while (!placed && attempts < 100) {
      const x = margin + Math.random() * (width - 2 * margin);
      const y = margin + Math.random() * (height - 2 * margin);
      const tooClose = stars.some(s => {
        const dx = s.x - x;
        const dy = s.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDist;
      });
      if (!tooClose) {
        const diameter = 4 + Math.random() * 8;
        const brightness = 0.3 + Math.random() * 0.7;
        const t = Math.random();
        const r1 = 0xD0, g1 = 0xE4, b1 = 0xF5;
        const r2 = 0xFF, g2 = 0xF3, b2 = 0xCD;
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        const color = `rgb(${r},${g},${b})`;
        const breathPeriod = 3 + Math.random() * 2;
        stars.push({ id: i, x, y, diameter, brightness, color, breathPeriod });
        placed = true;
      }
      attempts++;
    }
  }
  return stars;
}

export function manhattanDistance(a: StarPoint, b: StarPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function euclideanDistance(a: StarPoint, b: StarPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calcPolygonArea(points: StarPoint[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function segmentsIntersect(
  p1x: number, p1y: number, p2x: number, p2y: number,
  p3x: number, p3y: number, p4x: number, p4y: number
): { x: number; y: number } | null {
  const d1x = p2x - p1x, d1y = p2y - p1y;
  const d2x = p4x - p3x, d2y = p4y - p3y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;
  const t = ((p3x - p1x) * d2y - (p3y - p1y) * d2x) / cross;
  const u = ((p3x - p1x) * d1y - (p3y - p1y) * d1x) / cross;
  if (t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999) {
    return { x: p1x + t * d1x, y: p1y + t * d1y };
  }
  return null;
}

export function findSelfIntersections(points: StarPoint[]): { x: number; y: number }[] {
  const intersections: { x: number; y: number }[] = [];
  const n = points.length;
  if (n < 4) return intersections;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 2; j < n - 1; j++) {
      if (i === 0 && j === n - 2) continue;
      const pt = segmentsIntersect(
        points[i].x, points[i].y, points[i + 1].x, points[i + 1].y,
        points[j].x, points[j].y, points[j + 1].x, points[j + 1].y
      );
      if (pt) intersections.push(pt);
    }
  }
  return intersections;
}
