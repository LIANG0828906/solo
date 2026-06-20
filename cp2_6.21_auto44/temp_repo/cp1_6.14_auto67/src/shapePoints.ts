export interface Point2D {
  x: number;
  y: number;
}

export type ShapeType = 'circle' | 'heart' | 'star';

export interface CircleOptions {
  count: number;
  radius: number;
  centerX?: number;
  centerY?: number;
  density?: number;
}

export interface HeartOptions {
  count: number;
  scale: number;
  centerX?: number;
  centerY?: number;
  density?: number;
}

export interface StarOptions {
  count: number;
  outerRadius: number;
  innerRadius: number;
  points?: number;
  centerX?: number;
  centerY?: number;
  density?: number;
}

export function generateCirclePoints(options: CircleOptions): Point2D[] {
  const { count, radius, centerX = 0, centerY = 0, density = 1 } = options;
  const actualCount = Math.max(1, Math.floor(count * density));
  const points: Point2D[] = [];
  for (let i = 0; i < actualCount; i++) {
    const angle = (i / actualCount) * Math.PI * 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }
  return points;
}

export function generateHeartPoints(options: HeartOptions): Point2D[] {
  const { count, scale, centerX = 0, centerY = 0, density = 1 } = options;
  const actualCount = Math.max(1, Math.floor(count * density));
  const points: Point2D[] = [];
  for (let i = 0; i < actualCount; i++) {
    const t = (i / actualCount) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    points.push({
      x: centerX + x * scale,
      y: centerY + y * scale,
    });
  }
  return points;
}

export function generateStarPoints(options: StarOptions): Point2D[] {
  const {
    count,
    outerRadius,
    innerRadius,
    points = 5,
    centerX = 0,
    centerY = 0,
    density = 1,
  } = options;
  const actualCount = Math.max(1, Math.floor(count * density));
  const result: Point2D[] = [];
  const totalVertices = points * 2;
  const angleStep = Math.PI / points;

  const vertices: Point2D[] = [];
  for (let i = 0; i < totalVertices; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  const edges: { start: Point2D; end: Point2D; length: number }[] = [];
  let totalLength = 0;
  for (let i = 0; i < totalVertices; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % totalVertices];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    edges.push({ start, end, length });
    totalLength += length;
  }

  const stepLength = totalLength / actualCount;
  let currentEdgeIndex = 0;
  let currentEdgeProgress = 0;

  for (let i = 0; i < actualCount; i++) {
    let remainingDistance = i * stepLength;

    while (currentEdgeIndex < edges.length - 1 && remainingDistance > edges[currentEdgeIndex].length) {
      remainingDistance -= edges[currentEdgeIndex].length;
      currentEdgeIndex++;
    }

    currentEdgeProgress = remainingDistance / edges[currentEdgeIndex].length;
    const edge = edges[currentEdgeIndex];

    result.push({
      x: edge.start.x + (edge.end.x - edge.start.x) * currentEdgeProgress,
      y: edge.start.y + (edge.end.y - edge.start.y) * currentEdgeProgress,
    });
  }

  return result;
}

export interface GenerateShapeOptions {
  shape: ShapeType;
  count: number;
  centerX?: number;
  centerY?: number;
  density?: number;
  baseSize?: number;
}

export function generateShapePoints(options: GenerateShapeOptions): Point2D[] {
  const { shape, count, centerX = 0, centerY = 0, density = 1, baseSize = 180 } = options;
  switch (shape) {
    case 'circle':
      return generateCirclePoints({ count, radius: baseSize, centerX, centerY, density });
    case 'heart':
      return generateHeartPoints({ count, scale: baseSize / 17, centerX, centerY, density });
    case 'star':
      return generateStarPoints({
        count,
        outerRadius: baseSize,
        innerRadius: baseSize * 0.45,
        points: 5,
        centerX,
        centerY,
        density,
      });
    default:
      return generateCirclePoints({ count, radius: baseSize, centerX, centerY, density });
  }
}

export const shapeColors: Record<ShapeType, { h: number; s: number; l: number }> = {
  circle: { h: 210, s: 80, l: 60 },
  heart: { h: 340, s: 80, l: 65 },
  star: { h: 45, s: 90, l: 60 },
};
