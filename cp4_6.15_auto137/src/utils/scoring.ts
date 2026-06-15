import type { Point, CharacterStroke, Stroke } from '../types';

const pointDistance = (a: Point, b: Point): number => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

const resamplePoints = (points: Point[], targetCount: number): Point[] => {
  if (points.length < 2 || targetCount < 2) return points;

  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + pointDistance(points[i - 1], p);
  }, 0);

  const interval = totalLength / (targetCount - 1);
  const result: Point[] = [points[0]];
  let accumulated = 0;
  let prevPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const current = points[i];
    let segmentLength = pointDistance(prevPoint, current);

    while (accumulated + segmentLength >= interval && result.length < targetCount) {
      const ratio = (interval - accumulated) / segmentLength;
      const newPoint: Point = {
        x: prevPoint.x + (current.x - prevPoint.x) * ratio,
        y: prevPoint.y + (current.y - prevPoint.y) * ratio
      };
      result.push(newPoint);
      prevPoint = newPoint;
      segmentLength = pointDistance(prevPoint, current);
      accumulated = 0;
    }

    accumulated += segmentLength;
    prevPoint = current;
  }

  while (result.length < targetCount) {
    result.push({ ...points[points.length - 1] });
  }

  return result;
};

export const calculateStrokeSimilarity = (
  userStroke: Stroke,
  targetStroke: CharacterStroke,
  tolerance: number = 25
): number => {
  if (userStroke.points.length < 2 || targetStroke.points.length < 2) {
    return 0;
  }

  const sampleCount = 50;
  const userPoints = resamplePoints(userStroke.points, sampleCount);
  const targetPoints = resamplePoints(targetStroke.points, sampleCount);

  let forwardScore = 0;
  for (let i = 0; i < sampleCount; i++) {
    const dist = pointDistance(userPoints[i], targetPoints[i]);
    if (dist <= tolerance) {
      forwardScore += 1 - dist / tolerance;
    }
  }

  let reverseScore = 0;
  for (let i = 0; i < sampleCount; i++) {
    const dist = pointDistance(userPoints[sampleCount - 1 - i], targetPoints[i]);
    if (dist <= tolerance) {
      reverseScore += 1 - dist / tolerance;
    }
  }

  const bestScore = Math.max(forwardScore, reverseScore);
  return Math.round((bestScore / sampleCount) * 100);
};

export const isStrokeMatch = (
  userStroke: Stroke,
  targetStroke: CharacterStroke,
  threshold: number = 80
): boolean => {
  return calculateStrokeSimilarity(userStroke, targetStroke) >= threshold;
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  if (score >= 40) return '#FF9800';
  return '#F44336';
};

export const getScoreGradient = (score: number): string => {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 80) {
    const t = (clamped - 80) / 20;
    return interpolateColor('#66BB6A', '#2E7D32', t);
  }
  if (clamped >= 60) {
    const t = (clamped - 60) / 20;
    return interpolateColor('#FFB74D', '#FFA000', t);
  }
  if (clamped >= 40) {
    const t = (clamped - 40) / 20;
    return interpolateColor('#FF8A65', '#F57C00', t);
  }
  const t = clamped / 40;
  return interpolateColor('#EF5350', '#E64A19', t);
};

const interpolateColor = (color1: string, color2: string, t: number): string => {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const calculateOverallScore = (strokeScores: number[]): number => {
  if (strokeScores.length === 0) return 0;
  const sum = strokeScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / strokeScores.length);
};

export const detectPointNearStroke = (
  point: Point,
  targetStroke: CharacterStroke,
  threshold: number = 20
): boolean => {
  for (const sp of targetStroke.points) {
    if (pointDistance(point, sp) <= threshold) {
      return true;
    }
  }
  return false;
};
