import type { StrokePoint, ScoreDimension, DeviationMarker, StylePreset } from '../types';

const calcDistance = (a: StrokePoint, b: StrokePoint): number => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

const calcAngle = (a: StrokePoint, b: StrokePoint, c: StrokePoint): number => {
  const v1x = b.x - a.x;
  const v1y = b.y - a.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (mag1 < 0.001 || mag2 < 0.001) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
};

const standardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const getSmoothnessLabel = (score: number): string => {
  if (score >= 90) return '流畅自然';
  if (score >= 75) return '较为顺滑';
  if (score >= 60) return '略有抖动';
  if (score >= 40) return '抖动明显';
  return '需要练习';
};

const getStructureLabel = (score: number): string => {
  if (score >= 90) return '结构精准';
  if (score >= 75) return '重心稳定';
  if (score >= 60) return '略有偏差';
  if (score >= 40) return '偏离较多';
  return '结构待改';
};

const getPressureLabel = (score: number): string => {
  if (score >= 90) return '力度得当';
  if (score >= 75) return '张弛有度';
  if (score >= 60) return '力度尚可';
  if (score >= 40) return '变化不足';
  return '需要加强';
};

export const calcSmoothness = (points: StrokePoint[]): ScoreDimension => {
  if (points.length < 3) {
    return { score: points.length === 0 ? 0 : 60, label: points.length < 2 ? '笔画过短' : getSmoothnessLabel(60) };
  }

  const angles: number[] = [];
  for (let i = 0; i < points.length - 2; i++) {
    const ang = calcAngle(points[i], points[i + 1], points[i + 2]);
    if (!isNaN(ang) && isFinite(ang)) {
      angles.push(ang);
    }
  }

  if (angles.length === 0) {
    return { score: 70, label: getSmoothnessLabel(70) };
  }

  const sd = standardDeviation(angles);
  const maxSd = 45;
  let score = Math.max(0, Math.min(100, 100 - (sd / maxSd) * 100));
  const avgAngle = angles.reduce((s, v) => s + v, 0) / angles.length;
  if (avgAngle < 3) score = Math.min(100, score + 8);
  if (avgAngle > 25) score = Math.max(0, score - 10);

  score = Math.round(score);
  return { score, label: getSmoothnessLabel(score) };
};

export const calcStructure = (
  points: StrokePoint[],
  reference: StrokePoint[]
): { dimension: ScoreDimension; markers: DeviationMarker[] } => {
  const markers: DeviationMarker[] = [];

  if (points.length < 2 || reference.length < 2) {
    return { dimension: { score: 0, label: '缺少参照' }, markers };
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bboxW = Math.max(1, maxX - minX);
  const bboxH = Math.max(1, maxY - minY);

  let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
  for (const p of reference) {
    if (p.x < rMinX) rMinX = p.x;
    if (p.x > rMaxX) rMaxX = p.x;
    if (p.y < rMinY) rMinY = p.y;
    if (p.y > rMaxY) rMaxY = p.y;
  }
  const rW = Math.max(1, rMaxX - rMinX);
  const rH = Math.max(1, rMaxY - rMinY);

  const scaleX = rW / bboxW;
  const scaleY = rH / bboxH;
  const scale = (scaleX + scaleY) / 2;
  const offsetX = rMinX - minX * scale;
  const offsetY = rMinY - minY * scale;

  const normalized = points.map((p) => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
    timestamp: p.timestamp,
    speed: p.speed,
  }));

  let totalDist = 0;
  const refLen = reference.length;
  const now = Date.now();

  for (let i = 0; i < normalized.length; i++) {
    const p = normalized[i];
    const refIdx = Math.min(refLen - 1, Math.floor((i / normalized.length) * refLen));
    const refP = reference[refIdx];
    const dist = Math.sqrt((p.x - refP.x) ** 2 + (p.y - refP.y) ** 2);
    totalDist += dist;

    if (i > 0 && i < normalized.length - 1 && refIdx > 0 && refIdx < refLen - 1) {
      const prevRef = reference[refIdx - 1];
      const nextRef = reference[refIdx + 1];
      const prevP = normalized[i - 1];
      const nextP = normalized[i + 1];
      const userAngle = calcAngle(prevP, p, nextP);
      const refAngle = calcAngle(prevRef, refP, nextRef);
      const angleDiff = Math.abs(userAngle - refAngle);
      if (angleDiff > 10) {
        markers.push({
          x: points[i].x,
          y: points[i].y,
          angleDiff,
          createdAt: now,
        });
      }
    }
  }

  const avgDist = totalDist / normalized.length;
  const maxAllowed = 80;
  let score = Math.max(0, Math.min(100, 100 - (avgDist / maxAllowed) * 100));

  if (normalized.length >= 10) {
    const ratio = normalized.length / refLen;
    if (ratio > 0.7 && ratio < 1.5) {
      score = Math.min(100, score + 5);
    }
  }

  score = Math.round(score);
  return { dimension: { score, label: getStructureLabel(score) }, markers };
};

export const calcPressure = (points: StrokePoint[]): ScoreDimension => {
  if (points.length < 3) {
    return { score: points.length === 0 ? 0 : 55, label: getPressureLabel(55) };
  }

  const speeds = points.map((p) => p.speed);
  const speedSd = standardDeviation(speeds);

  const accelerations: number[] = [];
  for (let i = 1; i < speeds.length; i++) {
    const dt = Math.max(1, points[i].timestamp - points[i - 1].timestamp);
    accelerations.push((speeds[i] - speeds[i - 1]) / dt);
  }
  const accSd = standardDeviation(accelerations);

  const startSpeed = speeds.slice(0, Math.min(5, speeds.length)).reduce((s, v) => s + v, 0) / Math.min(5, speeds.length);
  const endSpeed = speeds.slice(Math.max(0, speeds.length - 5)).reduce((s, v) => s + v, 0) / Math.min(5, speeds.length);
  const midStart = Math.floor(speeds.length * 0.3);
  const midEnd = Math.ceil(speeds.length * 0.7);
  const midSpeed =
    midEnd > midStart
      ? speeds.slice(midStart, midEnd).reduce((s, v) => s + v, 0) / (midEnd - midStart)
      : startSpeed;

  let shapeScore = 50;
  if (startSpeed < midSpeed && endSpeed < midSpeed) {
    shapeScore = 95;
  } else if (startSpeed <= midSpeed * 1.2 && endSpeed <= midSpeed * 1.2) {
    shapeScore = 80;
  } else if (Math.abs(startSpeed - endSpeed) < midSpeed * 0.5) {
    shapeScore = 65;
  }

  const normSpeedSd = Math.max(0, Math.min(100, 100 - speedSd * 3));
  const normAccSd = Math.max(0, Math.min(100, 100 - accSd * 80));

  let score = normSpeedSd * 0.2 + normAccSd * 0.2 + shapeScore * 0.6;
  score = Math.round(Math.max(0, Math.min(100, score)));
  return { score, label: getPressureLabel(score) };
};

export const scoreStroke = (
  points: StrokePoint[],
  style: StylePreset
): {
  totalScore: number;
  smoothness: ScoreDimension;
  structure: ScoreDimension;
  pressure: ScoreDimension;
  deviationMarkers: DeviationMarker[];
} => {
  const smoothness = calcSmoothness(points);
  const { dimension: structure, markers } = calcStructure(points, style.referencePath);
  const pressure = calcPressure(points);

  const total = Math.round(smoothness.score * 0.4 + structure.score * 0.4 + pressure.score * 0.2);

  return {
    totalScore: Math.max(0, Math.min(100, total)),
    smoothness,
    structure,
    pressure,
    deviationMarkers: markers,
  };
};
