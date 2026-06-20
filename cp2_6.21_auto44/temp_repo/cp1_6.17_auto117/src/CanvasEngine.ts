import type { Point } from "./RuneData";
import { getRuneById } from "./RuneData";

export interface StrokeMatchResult {
  strokeIndex: number;
  score: number;
}

const RESAMPLE_COUNT = 32;

function resamplePoints(points: { x: number; y: number }[], n: number): { x: number; y: number }[] {
  if (points.length < 2) return points.map((p) => ({ x: p.x, y: p.y }));

  const pts = points.map((p) => ({ x: p.x, y: p.y }));
  let totalLen = 0;
  for (let i = 1; i < pts.length; i++) {
    totalLen += dist(pts[i - 1], pts[i]);
  }

  const interval = totalLen / (n - 1);
  const resampled: { x: number; y: number }[] = [{ ...pts[0] }];
  let accumulated = 0;

  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (accumulated + d >= interval) {
      let remaining = interval - accumulated;
      let prev = { ...pts[i - 1] };
      while (accumulated + d >= interval && resampled.length < n) {
        const ratio = remaining / d;
        const nx = prev.x + ratio * (pts[i].x - prev.x);
        const ny = prev.y + ratio * (pts[i].y - prev.y);
        resampled.push({ x: nx, y: ny });
        prev = { x: nx, y: ny };
        accumulated = 0;
        const newD = dist(prev, pts[i]);
        if (newD < 0.001) break;
        remaining = interval;
      }
      accumulated = dist(prev, pts[i]);
    } else {
      accumulated += d;
    }
  }

  while (resampled.length < n) {
    resampled.push({ ...pts[pts.length - 1] });
  }

  return resampled.slice(0, n);
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalizePoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length === 0) return [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.max(rangeX, rangeY);

  return points.map((p) => ({
    x: (p.x - minX + (rangeX - rangeX) / 2) / scale,
    y: (p.y - minY + (rangeY - rangeY) / 2) / scale,
  }));
}

function computeDirections(points: { x: number; y: number }[]): number[] {
  const dirs: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    dirs.push(Math.atan2(dy, dx));
  }
  return dirs;
}

function directionSimilarity(dirsA: number[], dirsB: number[]): number {
  if (dirsA.length === 0 || dirsB.length === 0) return 0;
  const len = Math.min(dirsA.length, dirsB.length);
  let totalDiff = 0;
  for (let i = 0; i < len; i++) {
    let diff = Math.abs(dirsA[i] - dirsB[i]);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    totalDiff += diff;
  }
  const avgDiff = totalDiff / len;
  return Math.max(0, 1 - avgDiff / Math.PI);
}

function extractKeyPoints(points: { x: number; y: number }[], maxKeys: number): { x: number; y: number }[] {
  if (points.length <= maxKeys) return [...points];

  const keyIndices = new Set<number>();
  keyIndices.add(0);
  keyIndices.add(points.length - 1);

  const dirs = computeDirections(points);
  const dirChanges: { index: number; change: number }[] = [];
  for (let i = 1; i < dirs.length; i++) {
    let change = Math.abs(dirs[i] - dirs[i - 1]);
    if (change > Math.PI) change = 2 * Math.PI - change;
    dirChanges.push({ index: i, change });
  }
  dirChanges.sort((a, b) => b.change - a.change);

  for (const dc of dirChanges) {
    if (keyIndices.size >= maxKeys) break;
    keyIndices.add(dc.index);
  }

  return Array.from(keyIndices)
    .sort((a, b) => a - b)
    .map((i) => points[i]);
}

export function matchStroke(
  userPoints: Point[],
  templateKeyPoints: { x: number; y: number }[],
  canvasWidth: number,
  canvasHeight: number
): number {
  if (userPoints.length < 2) return 0;

  const normalizedUser = userPoints.map((p) => ({
    x: p.x / canvasWidth,
    y: p.y / canvasHeight,
  }));

  const resampled = resamplePoints(normalizedUser, RESAMPLE_COUNT);
  const normResampled = normalizePoints(resampled);

  const templateNorm = normalizePoints(templateKeyPoints);

  const userKeys = extractKeyPoints(normResampled, templateNorm.length);

  let pointDist = 0;
  const compareLen = Math.min(userKeys.length, templateNorm.length);
  if (compareLen === 0) return 0;

  for (let i = 0; i < compareLen; i++) {
    pointDist += dist(userKeys[i], templateNorm[i]);
  }
  const avgPointDist = pointDist / compareLen;
  const pointScore = Math.max(0, 1 - avgPointDist * 2);

  const userDirs = computeDirections(normResampled);
  const templateDirs = computeDirections(templateNorm);
  const dirScore = directionSimilarity(userDirs, templateDirs);

  return pointScore * 0.6 + dirScore * 0.4;
}

export function matchAllStrokes(
  userStrokes: Point[][],
  runeId: string,
  canvasWidth: number,
  canvasHeight: number
): StrokeMatchResult[] {
  const rune = getRuneById(runeId);
  if (!rune) return [];

  const results: StrokeMatchResult[] = [];
  const strokeCount = Math.min(userStrokes.length, rune.strokes.length);

  for (let i = 0; i < strokeCount; i++) {
    const score = matchStroke(
      userStrokes[i],
      rune.strokes[i].keyPoints,
      canvasWidth,
      canvasHeight
    );
    results.push({ strokeIndex: i, score: Math.round(score * 100) });
  }

  return results;
}

export function getAverageScore(results: StrokeMatchResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((s, r) => s + r.score, 0);
  return Math.round(sum / results.length);
}

export function getTrailPoints(
  currentStroke: Point[],
  trailLength: number
): { points: Point[]; alphas: number[] } {
  if (currentStroke.length === 0) return { points: [], alphas: [] };

  const start = Math.max(0, currentStroke.length - trailLength);
  const points = currentStroke.slice(start);
  const alphas = points.map((_, i) => (i + 1) / points.length);

  return { points, alphas };
}
