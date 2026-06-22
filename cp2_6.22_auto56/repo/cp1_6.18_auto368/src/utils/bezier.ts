import type { Keyframe, PathPoint } from '@/types';

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

export function generateBezierPath(keyframes: Keyframe[], steps: number = 100): { x: number; y: number }[] {
  if (keyframes.length < 2) {
    return keyframes.map(kf => ({ x: kf.x, y: kf.y }));
  }

  const sorted = [...keyframes].sort((a, b) => a.index - b.index);
  const path: { x: number; y: number }[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const p0 = sorted[i];
    const p3 = sorted[i + 1];
    const p1 = {
      x: p0.x + (p3.x - p0.x) * 0.33,
      y: p0.y + (p3.y - p0.y) * 0.33,
    };
    const p2 = {
      x: p0.x + (p3.x - p0.x) * 0.66,
      y: p0.y + (p3.y - p0.y) * 0.66,
    };

    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      path.push({
        x: cubicBezier(t, p0.x, p1.x, p2.x, p3.x),
        y: cubicBezier(t, p0.y, p1.y, p2.y, p3.y),
      });
    }
  }

  return path;
}

export function getPositionOnPath(
  bezierPath: { x: number; y: number }[],
  progress: number
): { x: number; y: number } {
  if (bezierPath.length === 0) return { x: 0, y: 0 };
  const index = Math.min(Math.floor(progress * (bezierPath.length - 1)), bezierPath.length - 1);
  return bezierPath[index];
}

export function offsetPathPoints(
  pathPoints: PathPoint[],
  offsetX: number,
  offsetY: number
): PathPoint[] {
  return pathPoints.map(point => ({
    ...point,
    x: point.x + offsetX,
    y: point.y + offsetY,
  }));
}
