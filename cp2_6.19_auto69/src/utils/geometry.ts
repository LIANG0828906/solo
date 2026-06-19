export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const distance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number;
  let yy: number;

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
};

export const isPointNearLine = (point: Point, linePoints: Point[], threshold: number = 8): boolean => {
  for (let i = 0; i < linePoints.length - 1; i++) {
    const dist = pointToLineDistance(point, linePoints[i], linePoints[i + 1]);
    if (dist < threshold) {
      return true;
    }
  }
  return false;
};

export const catmullRomSpline = (points: Point[], alpha: number = 0.5, resolution: number = 5): Point[] => {
  if (points.length < 2) return points;
  if (points.length === 2) {
    return interpolateLinear(points[0], points[1], resolution);
  }

  const result: Point[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i === points.length - 2 ? points[points.length - 1] : points[i + 2];

    for (let t = 0; t < 1; t += 1 / resolution) {
      const t2 = t * t;
      const t3 = t2 * t;

      const v0x = (p2.x - p0.x) * alpha;
      const v0y = (p2.y - p0.y) * alpha;
      const v1x = (p3.x - p1.x) * alpha;
      const v1y = (p3.y - p1.y) * alpha;

      const x = (2 * p1.x - 2 * p2.x + v0x + v1x) * t3 +
                (-3 * p1.x + 3 * p2.x - 2 * v0x - v1x) * t2 +
                v0x * t + p1.x;
      const y = (2 * p1.y - 2 * p2.y + v0y + v1y) * t3 +
                (-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 +
                v0y * t + p1.y;

      result.push({ x, y });
    }
  }

  result.push(points[points.length - 1]);
  return result;
};

const interpolateLinear = (p1: Point, p2: Point, resolution: number): Point[] => {
  const result: Point[] = [];
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    result.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    });
  }
  return result;
};

export const getBoundingBox = (points: Point[]): BoundingBox => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, maxX, minY, maxY };
};

export const rotatePoint = (point: Point, center: Point, angle: number): Point => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

export const getCenter = (bbox: BoundingBox): Point => ({
  x: (bbox.minX + bbox.maxX) / 2,
  y: (bbox.minY + bbox.maxY) / 2,
});

export const isPointInRect = (point: Point, rect: { x: number; y: number; width: number; height: number }): boolean => {
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
         point.y >= rect.y && point.y <= rect.y + rect.height;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const easeOut = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const getAngle = (center: Point, point: Point): number => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};
