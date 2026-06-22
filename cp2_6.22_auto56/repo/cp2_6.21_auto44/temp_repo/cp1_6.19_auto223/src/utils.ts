import { RuneType, BezierPoint, TrajectoryPoint } from './types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const cubicBezier = (
  t: number,
  p0: BezierPoint,
  p1: BezierPoint,
  p2: BezierPoint,
  p3: BezierPoint
): BezierPoint => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
};

export const generateBezierPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  canvasWidth: number
): BezierPoint[] => {
  const p0: BezierPoint = { x: startX, y: startY };
  const p1: BezierPoint = {
    x: startX + (Math.random() - 0.5) * canvasWidth * 0.4,
    y: startY + (endY - startY) * 0.3,
  };
  const p2: BezierPoint = {
    x: endX + (Math.random() - 0.5) * canvasWidth * 0.4,
    y: startY + (endY - startY) * 0.7,
  };
  const p3: BezierPoint = { x: endX, y: endY };
  return [p0, p1, p2, p3];
};

export const getPointOnPath = (
  path: BezierPoint[],
  progress: number
): BezierPoint => {
  return cubicBezier(progress, path[0], path[1], path[2], path[3]);
};

const normalizePoints = (points: TrajectoryPoint[], n: number = 32): { x: number; y: number }[] => {
  if (points.length < 2) return [];

  const normalized: { x: number; y: number }[] = [];
  let totalLength = 0;
  const segments: { start: TrajectoryPoint; end: TrajectoryPoint; length: number }[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    segments.push({ start: points[i], end: points[i + 1], length });
    totalLength += length;
  }

  if (totalLength === 0) return [];

  const step = totalLength / (n - 1);
  let currentPos = 0;
  let segmentIndex = 0;
  let segmentProgress = 0;

  for (let i = 0; i < n; i++) {
    const targetDist = i * step;

    while (segmentIndex < segments.length && currentPos + segments[segmentIndex].length < targetDist) {
      currentPos += segments[segmentIndex].length;
      segmentIndex++;
    }

    if (segmentIndex >= segments.length) {
      normalized.push({
        x: points[points.length - 1].x,
        y: points[points.length - 1].y,
      });
      continue;
    }

    const segment = segments[segmentIndex];
    segmentProgress = segment.length > 0
      ? (targetDist - currentPos) / segment.length
      : 0;

    normalized.push({
      x: segment.start.x + (segment.end.x - segment.start.x) * segmentProgress,
      y: segment.start.y + (segment.end.y - segment.start.y) * segmentProgress,
    });
  }

  return normalized;
};

const translateToCenter = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (points.length === 0) return [];
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return points.map((p) => ({ x: p.x - cx, y: p.y - cy }));
};

const scaleToUnit = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (points.length === 0) return [];
  const maxDist = Math.max(
    ...points.map((p) => Math.sqrt(p.x * p.x + p.y * p.y))
  );
  if (maxDist === 0) return points;
  return points.map((p) => ({ x: p.x / maxDist, y: p.y / maxDist }));
};

const calculateAngles = (points: { x: number; y: number }[]): number[] => {
  const angles: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    angles.push(Math.atan2(dy, dx));
  }
  return angles;
};

const calculateAngleDifferences = (angles1: number[], angles2: number[]): number => {
  let totalDiff = 0;
  const len = Math.min(angles1.length, angles2.length);
  for (let i = 0; i < len; i++) {
    let diff = Math.abs(angles1[i] - angles2[i]);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    totalDiff += diff;
  }
  return totalDiff / len;
};

const createCircleTemplate = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const n = 32;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    points.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }
  return points;
};

const createTriangleTemplate = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const n = 32;
  const vertices = [
    { x: 0, y: -1 },
    { x: 0.866, y: 0.5 },
    { x: -0.866, y: 0.5 },
  ];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 3;
    const idx = Math.floor(t);
    const frac = t - idx;
    const v1 = vertices[idx % 3];
    const v2 = vertices[(idx + 1) % 3];
    points.push({
      x: v1.x + (v2.x - v1.x) * frac,
      y: v1.y + (v2.y - v1.y) * frac,
    });
  }
  return points;
};

const createLightningTemplate = (): { x: number; y: number }[] => {
  return [
    { x: 0, y: -1 },
    { x: -0.2, y: -0.6 },
    { x: 0.1, y: -0.5 },
    { x: -0.3, y: -0.1 },
    { x: 0.2, y: 0 },
    { x: -0.1, y: 0.4 },
    { x: 0.3, y: 0.5 },
    { x: 0, y: 1 },
  ];
};

const createSpiralTemplate = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const n = 64;
  const turns = 2;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const angle = t * Math.PI * 2 * turns;
    const radius = t;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return points;
};

const createStarTemplate = (): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  const n = 32;
  const outerRadius = 1;
  const innerRadius = 0.4;
  const spikes = 5;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * spikes * 2;
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const idx = Math.floor(t) % 2;
    const radius = idx === 0 ? outerRadius : innerRadius;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return points;
};

const runeTemplates: Map<RuneType, { x: number; y: number }[]> = new Map([
  [RuneType.CIRCLE, createCircleTemplate()],
  [RuneType.TRIANGLE, createTriangleTemplate()],
  [RuneType.LIGHTNING, createLightningTemplate()],
  [RuneType.SPIRAL, createSpiralTemplate()],
  [RuneType.STAR, createStarTemplate()],
]);

const precomputedTemplateAngles: Map<RuneType, number[]> = new Map();

runeTemplates.forEach((points, type) => {
  const scaled = scaleToUnit(translateToCenter(points));
  precomputedTemplateAngles.set(type, calculateAngles(scaled));
});

export const matchRune = (trajectory: TrajectoryPoint[]): { type: RuneType; similarity: number } | null => {
  if (trajectory.length < 5) return null;

  const normalized = normalizePoints(trajectory);
  if (normalized.length === 0) return null;

  const centered = translateToCenter(normalized);
  const scaled = scaleToUnit(centered);
  const angles = calculateAngles(scaled);

  let bestMatch: RuneType | null = null;
  let bestSimilarity = 0;
  const threshold = 0.5;

  precomputedTemplateAngles.forEach((templateAngles, type) => {
    const diff = calculateAngleDifferences(angles, templateAngles);
    const similarity = 1 - diff / Math.PI;

    if (similarity > bestSimilarity && similarity > threshold) {
      bestSimilarity = similarity;
      bestMatch = type;
    }
  });

  return bestMatch ? { type: bestMatch, similarity: bestSimilarity } : null;
};

export const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

export const circleCollision = (
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean => {
  return getDistance(x1, y1, x2, y2) < r1 + r2;
};
