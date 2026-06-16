import { v4 as uuidv4 } from 'uuid';
import type { Point, BezierNode, VectorPath } from '../types';

const PATH_COLORS = [
  'rgba(231, 76, 60, 0.7)',
  'rgba(52, 152, 219, 0.7)',
  'rgba(46, 204, 113, 0.7)',
  'rgba(155, 89, 182, 0.7)',
  'rgba(241, 196, 15, 0.7)',
  'rgba(230, 126, 34, 0.7)',
  'rgba(26, 188, 156, 0.7)',
  'rgba(211, 84, 0, 0.7)',
];

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function perpDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return distance(point, lineStart);
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / mag;
}

export function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = perpDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[end]];
}

export function extractPaths(edgePoints: Point[], rdpEpsilon: number = 2.0): VectorPath[] {
  if (edgePoints.length === 0) return [];

  const pointSet = new Set(edgePoints.map(p => `${p.x},${p.y}`));
  const visited = new Set<string>();
  const paths: VectorPath[] = [];
  let colorIndex = 0;

  const getNeighbors = (p: Point): Point[] => {
    const neighbors: Point[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const key = `${p.x + dx},${p.y + dy}`;
        if (pointSet.has(key) && !visited.has(key)) {
          neighbors.push({ x: p.x + dx, y: p.y + dy });
        }
      }
    }
    return neighbors;
  };

  for (const startPoint of edgePoints) {
    const startKey = `${startPoint.x},${startPoint.y}`;
    if (visited.has(startKey)) continue;

    const contour: Point[] = [startPoint];
    visited.add(startKey);
    let current = startPoint;
    let isClosed = false;

    while (true) {
      const neighbors = getNeighbors(current);
      if (neighbors.length === 0) break;

      const nextPoint = neighbors.reduce((best, curr) => {
        const distCurr = distance(current, curr);
        const distBest = distance(current, best);
        if (contour.length > 2) {
          const prev = contour[contour.length - 2];
          const angleBest = Math.abs(Math.atan2(best.y - current.y, best.x - current.x) - Math.atan2(current.y - prev.y, current.x - prev.x));
          const angleCurr = Math.abs(Math.atan2(curr.y - current.y, curr.x - current.x) - Math.atan2(current.y - prev.y, current.x - prev.x));
          return angleCurr < angleBest ? curr : best;
        }
        return distCurr < distBest ? curr : best;
      });

      const nextKey = `${nextPoint.x},${nextPoint.y}`;
      if (visited.has(nextKey)) {
        if (contour.length > 10 && distance(nextPoint, contour[0]) < 5) {
          isClosed = true;
        }
        break;
      }

      visited.add(nextKey);
      contour.push(nextPoint);
      current = nextPoint;
    }

    if (contour.length >= 8) {
      const simplified = rdpSimplify(contour, rdpEpsilon);
      if (simplified.length >= 4) {
        const nodes = fitBezierCurves(simplified, isClosed);
        const length = calculatePathLength(nodes, isClosed);
        paths.push({
          id: uuidv4(),
          nodes,
          color: PATH_COLORS[colorIndex % PATH_COLORS.length],
          length,
          isClosed,
        });
        colorIndex++;
      }
    }
  }

  return paths.sort((a, b) => b.length - a.length);
}

function estimateTangent(points: Point[], index: number, isClosed: boolean): Point {
  const n = points.length;
  const prevIdx = index === 0 ? (isClosed ? n - 1 : 1) : index - 1;
  const nextIdx = index === n - 1 ? (isClosed ? 0 : n - 2) : index + 1;
  const prev = points[prevIdx];
  const next = points[nextIdx];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: dx / len, y: dy / len };
}

export function fitBezierCurves(points: Point[], isClosed: boolean): BezierNode[] {
  const nodes: BezierNode[] = points.map((p, i) => {
    const tangent = estimateTangent(points, i, isClosed);
    const nextP = points[(i + 1) % points.length];
    const segLen = distance(p, nextP) * 0.4;
    return {
      id: uuidv4(),
      x: p.x,
      y: p.y,
      controlOut: {
        x: p.x + tangent.x * segLen,
        y: p.y + tangent.y * segLen,
      },
      controlIn: {
        x: p.x - tangent.x * segLen,
        y: p.y - tangent.y * segLen,
      },
    };
  });
  return nodes;
}

export function refitPath(nodes: BezierNode[], isClosed: boolean): BezierNode[] {
  const points = nodes.map(n => ({ x: n.x, y: n.y }));
  const refitted = fitBezierCurves(points, isClosed);
  return refitted.map((n, i) => ({
    ...n,
    id: nodes[i]?.id || n.id,
  }));
}

function cubicBezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function calculatePathLength(nodes: BezierNode[], isClosed: boolean): number {
  let length = 0;
  const n = nodes.length;
  const maxIndex = isClosed ? n : n - 1;

  for (let i = 0; i < maxIndex; i++) {
    const p0 = nodes[i];
    const p3 = nodes[(i + 1) % n];
    const p1 = p0.controlOut || p0;
    const p2 = p3.controlIn || p3;

    const steps = 20;
    let prevPoint: Point = { x: p0.x, y: p0.y };
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const point = cubicBezierPoint(t, p0, p1, p2, p3);
      length += distance(prevPoint, point);
      prevPoint = point;
    }
  }
  return Math.round(length);
}

export function generatePathThumbnail(path: VectorPath, size: number = 48): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const nodes = path.nodes;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }

  const padding = 4;
  const scale = Math.min((size - padding * 2) / (maxX - minX + 1), (size - padding * 2) / (maxY - minY + 1));
  const offsetX = padding + (size - padding * 2 - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = padding + (size - padding * 2 - (maxY - minY) * scale) / 2 - minY * scale;

  ctx.strokeStyle = path.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const n = nodes.length;
  const maxIndex = path.isClosed ? n : n - 1;
  for (let i = 0; i < maxIndex; i++) {
    const p0 = nodes[i];
    const p3 = nodes[(i + 1) % n];
    const p1 = p0.controlOut || p0;
    const p2 = p3.controlIn || p3;
    if (i === 0) ctx.moveTo(p0.x * scale + offsetX, p0.y * scale + offsetY);
    ctx.bezierCurveTo(
      p1.x * scale + offsetX, p1.y * scale + offsetY,
      p2.x * scale + offsetX, p2.y * scale + offsetY,
      p3.x * scale + offsetX, p3.y * scale + offsetY
    );
  }
  if (path.isClosed) ctx.closePath();
  ctx.stroke();

  return canvas.toDataURL();
}
