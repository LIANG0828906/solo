import {
  Point,
  RecognitionResult,
  GestureType,
  CustomTemplate,
} from './types';

const RESAMPLE_SIZE = 64;
const RECOGNITION_THRESHOLD = 0.72;
const ANGLE_BINS = 8;

export function resamplePoints(points: Point[], n: number = RESAMPLE_SIZE): Point[] {
  if (points.length < 2) return points.slice();

  const totalLength = pathLength(points);
  const interval = totalLength / (n - 1);
  const resampled: Point[] = [points[0]];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i]);
    if (accumulated + d >= interval) {
      const t = (interval - accumulated) / d;
      const newPoint: Point = {
        x: points[i - 1].x + t * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + t * (points[i].y - points[i - 1].y),
        timestamp: points[i].timestamp,
      };
      resampled.push(newPoint);
      points.splice(i, 0, newPoint);
      accumulated = 0;
    } else {
      accumulated += d;
    }
  }

  while (resampled.length < n) {
    resampled.push({ ...resampled[resampled.length - 1] });
  }

  return resampled.slice(0, n);
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function normalizeToUnit(points: Point[]): Point[] {
  if (points.length === 0) return [];

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const size = Math.max(maxX - minX, maxY - minY) || 1;

  return points.map((p) => ({
    x: (p.x - cx) / size,
    y: (p.y - cy) / size,
    timestamp: p.timestamp,
  }));
}

export function computeDirectionHistogram(points: Point[]): number[] {
  const bins = new Array(ANGLE_BINS).fill(0);
  if (points.length < 2) return bins;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI * 2;
    const idx = Math.floor((angle / (Math.PI * 2)) * ANGLE_BINS) % ANGLE_BINS;
    bins[idx]++;
  }

  const total = bins.reduce((a, b) => a + b, 0) || 1;
  return bins.map((b) => b / total);
}

export function computeStartAngle(points: Point[]): number {
  if (points.length < 5) return 0;
  const p0 = points[0];
  const pn = points[Math.min(4, points.length - 1)];
  return Math.atan2(pn.y - p0.y, pn.x - p0.x);
}

export function computeClosure(points: Point[]): number {
  if (points.length < 2) return 0;
  const d = distance(points[0], points[points.length - 1]);
  const len = pathLength(points) || 1;
  return 1 - Math.min(1, d / (len * 0.2));
}

export function computeCorners(points: Point[]): number {
  if (points.length < 5) return 0;
  let corners = 0;
  const threshold = Math.PI / 3;

  for (let i = 2; i < points.length - 2; i++) {
    const a = points[i - 2];
    const b = points[i];
    const c = points[i + 2];
    const v1x = b.x - a.x;
    const v1y = b.y - a.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
    const m2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
    const cosAng = dot / (m1 * m2);
    const ang = Math.acos(Math.max(-1, Math.min(1, cosAng)));
    if (ang > threshold) corners++;
  }

  return corners / points.length;
}

export interface FeatureVector {
  histogram: number[];
  startAngle: number;
  closure: number;
  corners: number;
  aspectRatio: number;
}

export function extractFeatures(points: Point[]): FeatureVector {
  const resampled = resamplePoints(points, RESAMPLE_SIZE);
  const normalized = normalizeToUnit(resampled);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of normalized) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;

  return {
    histogram: computeDirectionHistogram(normalized),
    startAngle: computeStartAngle(normalized),
    closure: computeClosure(normalized),
    corners: computeCorners(normalized),
    aspectRatio: w / h,
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    ma = 0,
    mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  ma = Math.sqrt(ma);
  mb = Math.sqrt(mb);
  if (ma === 0 || mb === 0) return 0;
  return dot / (ma * mb);
}

export function compareFeatures(a: FeatureVector, b: FeatureVector): number {
  const histSim = cosineSimilarity(a.histogram, b.histogram);
  const angleDiff = Math.abs(a.startAngle - b.startAngle);
  const angleSim = 1 - Math.min(angleDiff, Math.PI * 2 - angleDiff) / Math.PI;
  const closureSim = 1 - Math.abs(a.closure - b.closure);
  const cornerSim = 1 - Math.min(1, Math.abs(a.corners - b.corners) * 3);
  const aspectSim = 1 - Math.min(1, Math.abs(a.aspectRatio - b.aspectRatio) * 0.5);

  return (
    histSim * 0.45 +
    angleSim * 0.1 +
    closureSim * 0.2 +
    cornerSim * 0.15 +
    aspectSim * 0.1
  );
}

const BUILTIN_TEMPLATES: Record<GestureType, FeatureVector[]> = {
  CIRCLE: [buildCircleFeatures()],
  TRIANGLE: [buildTriangleFeatures()],
  S_SHAPE: [buildSShapeFeatures()],
  Z_SHAPE: [buildZShapeFeatures()],
  CUSTOM: [],
  UNKNOWN: [],
};

function buildCircleFeatures(): FeatureVector {
  const pts: Point[] = [];
  for (let i = 0; i < RESAMPLE_SIZE; i++) {
    const t = (i / RESAMPLE_SIZE) * Math.PI * 2;
    pts.push({
      x: Math.cos(t) * 0.5,
      y: Math.sin(t) * 0.5,
      timestamp: i,
    });
  }
  return extractFeatures(pts);
}

function buildTriangleFeatures(): FeatureVector {
  const pts: Point[] = [];
  const vertices = [
    { x: 0, y: -0.5 },
    { x: 0.45, y: 0.35 },
    { x: -0.45, y: 0.35 },
    { x: 0, y: -0.5 },
  ];
  const segs = RESAMPLE_SIZE / (vertices.length - 1);
  for (let s = 0; s < vertices.length - 1; s++) {
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      pts.push({
        x: vertices[s].x + t * (vertices[s + 1].x - vertices[s].x),
        y: vertices[s].y + t * (vertices[s + 1].y - vertices[s].y),
        timestamp: pts.length,
      });
    }
  }
  return extractFeatures(pts);
}

function buildSShapeFeatures(): FeatureVector {
  const pts: Point[] = [];
  for (let i = 0; i < RESAMPLE_SIZE; i++) {
    const t = (i / RESAMPLE_SIZE) * Math.PI * 2 - Math.PI;
    pts.push({
      x: t / (Math.PI * 2) * 0.9,
      y: Math.sin(t) * 0.35,
      timestamp: i,
    });
  }
  return extractFeatures(pts);
}

function buildZShapeFeatures(): FeatureVector {
  const pts: Point[] = [];
  const vertices = [
    { x: -0.5, y: -0.4 },
    { x: 0.5, y: -0.4 },
    { x: -0.5, y: 0.4 },
    { x: 0.5, y: 0.4 },
  ];
  const segs = Math.floor(RESAMPLE_SIZE / (vertices.length - 1));
  for (let s = 0; s < vertices.length - 1; s++) {
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      pts.push({
        x: vertices[s].x + t * (vertices[s + 1].x - vertices[s].x),
        y: vertices[s].y + t * (vertices[s + 1].y - vertices[s].y),
        timestamp: pts.length,
      });
    }
  }
  while (pts.length < RESAMPLE_SIZE) pts.push({ ...vertices[vertices.length - 1], timestamp: pts.length });
  return extractFeatures(pts);
}

export function recognizeGesture(
  points: Point[],
  customTemplates: CustomTemplate[] = []
): RecognitionResult {
  if (points.length < 5) {
    return { type: 'UNKNOWN', confidence: 0, matchPercentage: 0 };
  }

  const features = extractFeatures(points);
  let bestScore = 0;
  let bestType: GestureType = 'UNKNOWN';
  let bestTemplateId: string | undefined = undefined;
  let bestName: string | undefined = undefined;

  const types: GestureType[] = ['CIRCLE', 'TRIANGLE', 'S_SHAPE', 'Z_SHAPE'];
  for (const type of types) {
    for (const tmpl of BUILTIN_TEMPLATES[type]) {
      const score = compareFeatures(features, tmpl);
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }
  }

  for (const ct of customTemplates) {
    const tmplFeatures = extractFeatures(ct.points);
    const score = compareFeatures(features, tmplFeatures);
    if (score > bestScore) {
      bestScore = score;
      bestType = ct.gestureType;
      bestTemplateId = ct.id;
      bestName = ct.name;
    }
  }

  if (bestScore < RECOGNITION_THRESHOLD) {
    bestType = 'UNKNOWN';
  }

  return {
    type: bestType,
    confidence: bestScore,
    matchPercentage: Math.round(bestScore * 100),
    matchedTemplateId: bestTemplateId,
    gestureName: bestName,
  };
}

export function realtimeMatchProgress(
  currentPoints: Point[],
  targetTemplate: CustomTemplate | null
): number {
  if (!targetTemplate || currentPoints.length < 3) return 0;
  const targetFeatures = extractFeatures(targetTemplate.points);
  const currentFeatures = extractFeatures(currentPoints);
  const score = compareFeatures(currentFeatures, targetFeatures);
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export function generateThumbnail(
  points: Point[],
  size: number = 80,
  padding: number = 8
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#282840';
  ctx.fillRect(0, 0, size, size);

  if (points.length < 2) return canvas.toDataURL();

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = Math.min((size - padding * 2) / w, (size - padding * 2) / h);
  const offX = (size - w * scale) / 2 - minX * scale;
  const offY = (size - h * scale) / 2 - minY * scale;

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x * scale + offX, points[0].y * scale + offY);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * scale + offX, points[i].y * scale + offY);
  }
  ctx.stroke();

  return canvas.toDataURL();
}
