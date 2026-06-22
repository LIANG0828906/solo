export interface Point {
  x: number;
  y: number;
}

export interface RecognitionResult {
  type: 'circle' | 'rect' | 'triangle' | 'polygon';
  confidence: number;
  fittedPoints: Point[];
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx: number, yy: number;
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function rdpSimplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points.slice();
  let dmax = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilon) {
    const rec1 = rdpSimplify(points.slice(0, index + 1), epsilon);
    const rec2 = rdpSimplify(points.slice(index), epsilon);
    return rec1.slice(0, -1).concat(rec2);
  }
  return [points[0], points[end]];
}

function getBoundingBox(points: Point[]): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number; center: Point } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY,
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  };
}

function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  return length;
}

function isClosed(points: Point[]): { closed: boolean; closure: number } {
  if (points.length < 3) return { closed: false, closure: 0 };
  const startEndDist = distance(points[0], points[points.length - 1]);
  const pathLength = calculatePathLength(points);
  if (pathLength === 0) return { closed: false, closure: 0 };
  const closure = 1 - (startEndDist / pathLength);
  return { closed: closure > 0.8, closure };
}

function checkCircle(points: Point[], bbox: ReturnType<typeof getBoundingBox>): { isCircle: boolean; confidence: number; fittedPoints: Point[] } {
  const center = bbox.center;
  const radius = (bbox.width + bbox.height) / 4;
  const distances = points.map(p => distance(p, center));
  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const variance = distances.reduce((s, d) => s + (d - avgDist) ** 2, 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  const normalizedStdDev = stdDev / avgDist;
  const aspectRatio = Math.min(bbox.width, bbox.height) / Math.max(bbox.width, bbox.height);
  const confidence = Math.max(0, Math.min(1, (1 - normalizedStdDev * 3) * aspectRatio));
  const isCircle = confidence > 0.65;
  const fittedPoints: Point[] = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    fittedPoints.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return { isCircle, confidence, fittedPoints };
}

function findCorners(points: Point[], expectedCorners: number, bbox: ReturnType<typeof getBoundingBox>): Point[] {
  const corners: Point[] = [];
  const threshold = Math.min(bbox.width, bbox.height) * 0.15;
  const simplified = rdpSimplify(points, threshold);
  const candidates: { point: Point; angle: number }[] = [];
  for (let i = 1; i < simplified.length - 1; i++) {
    const prev = simplified[i - 1];
    const curr = simplified[i];
    const next = simplified[i + 1];
    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const m2 = Math.sqrt(v2x * v2x + v2y * v2y);
    if (m1 === 0 || m2 === 0) continue;
    const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
    const angle = Math.acos(cos) * 180 / Math.PI;
    if (angle < 160) {
      candidates.push({ point: curr, angle });
    }
  }
  candidates.sort((a, b) => a.angle - b.angle);
  for (let i = 0; i < Math.min(expectedCorners, candidates.length); i++) {
    corners.push(candidates[i].point);
  }
  if (corners.length < expectedCorners) {
    corners.push(
      { x: bbox.minX, y: bbox.minY },
      { x: bbox.maxX, y: bbox.minY },
      { x: bbox.maxX, y: bbox.maxY },
      { x: bbox.minX, y: bbox.maxY }
    );
  }
  return corners.slice(0, expectedCorners);
}

function sortPointsClockwise(points: Point[], center: Point): Point[] {
  return points.slice().sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}

function checkRectangle(points: Point[], bbox: ReturnType<typeof getBoundingBox>): { isRect: boolean; confidence: number; fittedPoints: Point[] } {
  const aspectRatio = Math.min(bbox.width, bbox.height) / Math.max(bbox.width, bbox.height);
  if (aspectRatio < 0.1) return { isRect: false, confidence: 0, fittedPoints: [] };
  const rectPoints: Point[] = [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY }
  ];
  let totalDist = 0;
  const sampleCount = Math.min(points.length, 50);
  const step = Math.floor(points.length / sampleCount);
  for (let i = 0; i < points.length; i += step) {
    let minDist = Infinity;
    for (let j = 0; j < 4; j++) {
      const p1 = rectPoints[j];
      const p2 = rectPoints[(j + 1) % 4];
      const d = perpendicularDistance(points[i], p1, p2);
      minDist = Math.min(minDist, d);
    }
    totalDist += minDist;
  }
  const avgDist = totalDist / sampleCount;
  const diag = Math.sqrt(bbox.width ** 2 + bbox.height ** 2);
  const normalizedDist = avgDist / diag;
  const confidence = Math.max(0, 1 - normalizedDist * 8);
  const isRect = confidence > 0.6;
  const fittedPoints = [...rectPoints, rectPoints[0]];
  return { isRect, confidence, fittedPoints };
}

function checkTriangle(points: Point[], bbox: ReturnType<typeof getBoundingBox>): { isTriangle: boolean; confidence: number; fittedPoints: Point[] } {
  const corners = findCorners(points, 3, bbox);
  if (corners.length < 3) return { isTriangle: false, confidence: 0, fittedPoints: [] };
  const sorted = sortPointsClockwise(corners, bbox.center);
  let totalDist = 0;
  const sampleCount = Math.min(points.length, 50);
  const step = Math.floor(points.length / sampleCount);
  for (let i = 0; i < points.length; i += step) {
    let minDist = Infinity;
    for (let j = 0; j < 3; j++) {
      const p1 = sorted[j];
      const p2 = sorted[(j + 1) % 3];
      const d = perpendicularDistance(points[i], p1, p2);
      minDist = Math.min(minDist, d);
    }
    totalDist += minDist;
  }
  const avgDist = totalDist / sampleCount;
  const diag = Math.sqrt(bbox.width ** 2 + bbox.height ** 2);
  const normalizedDist = avgDist / diag;
  const confidence = Math.max(0, 1 - normalizedDist * 8);
  const isTriangle = confidence > 0.55;
  const fittedPoints = [...sorted, sorted[0]];
  return { isTriangle, confidence, fittedPoints };
}

export function recognizeShape(rawPoints: Point[]): RecognitionResult {
  if (rawPoints.length < 5) {
    return { type: 'polygon', confidence: 0, fittedPoints: [] };
  }
  const simplified = rdpSimplify(rawPoints, 5);
  const bbox = getBoundingBox(rawPoints);
  const { closure } = isClosed(rawPoints);
  const circleResult = checkCircle(rawPoints, bbox);
  if (circleResult.isCircle && closure > 0.7) {
    return { type: 'circle', confidence: circleResult.confidence, fittedPoints: circleResult.fittedPoints };
  }
  const rectResult = checkRectangle(rawPoints, bbox);
  if (rectResult.isRect) {
    return { type: 'rect', confidence: rectResult.confidence, fittedPoints: rectResult.fittedPoints };
  }
  const triResult = checkTriangle(simplified.length >= 3 ? simplified : rawPoints, bbox);
  if (triResult.isTriangle) {
    return { type: 'triangle', confidence: triResult.confidence, fittedPoints: triResult.fittedPoints };
  }
  const polyPoints = simplified.length >= 3 ? simplified : rawPoints;
  const closedPoly = [...polyPoints];
  if (distance(closedPoly[0], closedPoly[closedPoly.length - 1]) > 5) {
    closedPoly.push(closedPoly[0]);
  }
  return { type: 'polygon', confidence: 0.4 + closure * 0.3, fittedPoints: closedPoly };
}

export function getClosure(points: Point[]): number {
  return isClosed(points).closure;
}

export function getAspectRatio(points: Point[]): number {
  const bbox = getBoundingBox(points);
  if (bbox.height === 0) return 1;
  return bbox.width / bbox.height;
}
