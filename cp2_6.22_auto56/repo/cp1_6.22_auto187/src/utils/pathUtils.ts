export interface Point {
  x: number;
  y: number;
}

export interface PathData {
  id: string;
  points: Point[];
  d: string;
  strokeWidth?: number;
  stroke?: string;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface FitResult {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function pointsToBezierPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const d: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }

  return d.join(' ');
}

export function simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points.slice();

  const sqTolerance = tolerance * tolerance;

  function getSqDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx * dx + dy * dy;
  }

  function getSqSegDistance(p: Point, v: Point, w: Point): number {
    const l2 = getSqDistance(v, w);
    if (l2 === 0) return getSqDistance(p, v);

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    return getSqDistance(p, {
      x: v.x + t * (w.x - v.x),
      y: v.y + t * (w.y - v.y),
    });
  }

  function simplifyDPStep(
    pts: Point[],
    first: number,
    last: number,
    sqTol: number,
    result: Point[]
  ): void {
    let maxSqDist = sqTol;
    let index = 0;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDistance(pts[i], pts[first], pts[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTol) {
      if (index - first > 1) {
        simplifyDPStep(pts, first, index, sqTol, result);
      }
      result.push(pts[index]);
      if (last - index > 1) {
        simplifyDPStep(pts, index, last, sqTol, result);
      }
    }
  }

  const result: Point[] = [points[0]];
  simplifyDPStep(points, 0, points.length - 1, sqTolerance, result);
  result.push(points[points.length - 1]);

  return result;
}

export function getPathLength(pathData: string): number {
  if (!pathData) return 0;

  const svgNS = 'http://www.w3.org/2000/svg';
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', pathData);

  return path.getTotalLength();
}

export function getPathsBounds(paths: PathData[]): Bounds {
  if (paths.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const point of path.points) {
      const strokeOffset = (path.strokeWidth || 0) / 2;
      if (point.x - strokeOffset < minX) minX = point.x - strokeOffset;
      if (point.y - strokeOffset < minY) minY = point.y - strokeOffset;
      if (point.x + strokeOffset > maxX) maxX = point.x + strokeOffset;
      if (point.y + strokeOffset > maxY) maxY = point.y + strokeOffset;
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function fitPathsToCanvas(
  paths: PathData[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number
): FitResult {
  const bounds = getPathsBounds(paths);

  if (bounds.width === 0 && bounds.height === 0) {
    return {
      scale: 1,
      offsetX: canvasWidth / 2,
      offsetY: canvasHeight / 2,
    };
  }

  const availableWidth = canvasWidth - padding * 2;
  const availableHeight = canvasHeight - padding * 2;

  const scaleX = bounds.width > 0 ? availableWidth / bounds.width : 1;
  const scaleY = bounds.height > 0 ? availableHeight / bounds.height : 1;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = bounds.width * scale;
  const scaledHeight = bounds.height * scale;

  const offsetX = padding + (availableWidth - scaledWidth) / 2 - bounds.minX * scale;
  const offsetY = padding + (availableHeight - scaledHeight) / 2 - bounds.minY * scale;

  return {
    scale,
    offsetX,
    offsetY,
  };
}
