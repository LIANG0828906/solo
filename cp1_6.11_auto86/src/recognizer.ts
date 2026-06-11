import { Point, RecognizedShape, ShapeType } from './types';

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function resamplePoints(points: Point[], numPoints: number): { x: number; y: number }[] {
  if (points.length < 2) return points.map(p => ({ x: p.x, y: p.y }));

  const totalLen = pathLength(points);
  const interval = totalLen / (numPoints - 1);
  const resampled: { x: number; y: number }[] = [{ x: points[0].x, y: points[0].y }];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i]);
    if (accumulated + d >= interval) {
      const ratio = (interval - accumulated) / d;
      const nx = points[i - 1].x + ratio * (points[i].x - points[i - 1].x);
      const ny = points[i - 1].y + ratio * (points[i].y - points[i - 1].y);
      resampled.push({ x: nx, y: ny });
      const remaining = points.slice(i);
      remaining.unshift({ ...points[i - 1], x: nx, y: ny } as Point);
      points = remaining;
      accumulated = 0;
    } else {
      accumulated += d;
    }
  }

  while (resampled.length < numPoints) {
    resampled.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
  }

  return resampled.slice(0, numPoints);
}

function pathLength(points: { x: number; y: number }[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

function perpendicularDistance(point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(point, lineStart);
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = lineStart.x + clampedT * dx;
  const projY = lineStart.y + clampedT * dy;
  return distance(point, { x: projX, y: projY });
}

function douglasPeucker(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  if (points.length <= 2) return [...points];

  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

function shoelaceArea(points: { x: number; y: number }[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function mergeNearbyCorners(corners: { x: number; y: number }[], threshold: number): { x: number; y: number }[] {
  if (corners.length <= 1) return corners;
  const merged: { x: number; y: number }[] = [{ ...corners[0] }];
  for (let i = 1; i < corners.length; i++) {
    const last = merged[merged.length - 1];
    if (distance(last, corners[i]) < threshold) {
      last.x = (last.x + corners[i].x) / 2;
      last.y = (last.y + corners[i].y) / 2;
    } else {
      merged.push({ ...corners[i] });
    }
  }
  if (merged.length > 1 && distance(merged[0], merged[merged.length - 1]) < threshold) {
    merged[0].x = (merged[0].x + merged[merged.length - 1].x) / 2;
    merged[0].y = (merged[0].y + merged[merged.length - 1].y) / 2;
    merged.pop();
  }
  return merged;
}

function angleBetween(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
}

export function recognizeShape(points: Point[]): RecognizedShape {
  if (points.length < 2) {
    return { type: 'line', cx: points[0]?.x ?? 0, cy: points[0]?.y ?? 0, width: 0, height: 0, rotation: 0 };
  }

  const resampled = resamplePoints(points, 64);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of resampled) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const bboxWidth = maxX - minX;
  const bboxHeight = maxY - minY;
  const aspectRatio = bboxHeight === 0 ? Infinity : bboxWidth / bboxHeight;

  const totalPathLen = pathLength(resampled);

  const first = points[0];
  const last = points[points.length - 1];
  const straightness = distance(first, last) / totalPathLen;

  const area = shoelaceArea(resampled);
  const perimeter = totalPathLen;
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);

  const diagonal = Math.sqrt(bboxWidth * bboxWidth + bboxHeight * bboxHeight);
  const tolerance = 0.05 * diagonal;
  const simplified = douglasPeucker(resampled, tolerance);
  const mergedCorners = mergeNearbyCorners(simplified, 15);
  const numCorners = mergedCorners.length;

  if (straightness > 0.85) {
    const midX = (first.x + last.x) / 2;
    const midY = (first.y + last.y) / 2;
    const rotation = angleBetween(first, last);
    return { type: 'line', cx: midX, cy: midY, width: totalPathLen, height: 0, rotation };
  }

  if (circularity > 0.75) {
    if (aspectRatio >= 0.8 && aspectRatio <= 1.25) {
      const avg = (bboxWidth + bboxHeight) / 2;
      return { type: 'circle', cx, cy, width: avg, height: avg, rotation: 0 };
    }
    return { type: 'ellipse', cx, cy, width: bboxWidth, height: bboxHeight, rotation: 0 };
  }

  if (numCorners === 3) {
    const vertices = mergedCorners.map(v => ({ x: v.x - cx, y: v.y - cy }));
    return { type: 'triangle', cx, cy, width: bboxWidth, height: bboxHeight, rotation: 0, vertices };
  }

  if (numCorners === 4) {
    const vertices = mergedCorners.map(v => ({ x: v.x - cx, y: v.y - cy }));
    const rotation = angleBetween(mergedCorners[0], mergedCorners[1]);
    return { type: 'rectangle', cx, cy, width: bboxWidth, height: bboxHeight, rotation, vertices };
  }

  if (numCorners === 5) {
    const vertices = mergedCorners.map(v => ({ x: v.x - cx, y: v.y - cy }));
    return { type: 'pentagon', cx, cy, width: bboxWidth, height: bboxHeight, rotation: 0, vertices };
  }

  const midX = (first.x + last.x) / 2;
  const midY = (first.y + last.y) / 2;
  const rotation = angleBetween(first, last);
  return { type: 'line', cx: midX, cy: midY, width: totalPathLen, height: 0, rotation };
}
