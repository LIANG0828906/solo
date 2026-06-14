export interface Point2D {
  x: number;
  y: number;
}

export type ShapeType = 'circle' | 'heart' | 'star';

export function generateCirclePoints(count: number, radius: number): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  return points;
}

export function generateHeartPoints(count: number, scale: number): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    points.push({
      x: x * scale,
      y: y * scale,
    });
  }
  return points;
}

export function generateStarPoints(count: number, outerRadius: number, innerRadius: number, points: number = 5): Point2D[] {
  const result: Point2D[] = [];
  const totalVertices = points * 2;
  const angleStep = Math.PI / points;

  const vertices: Point2D[] = [];
  for (let i = 0; i < totalVertices; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
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

  const stepLength = totalLength / count;
  let currentEdgeIndex = 0;
  let currentEdgeProgress = 0;

  for (let i = 0; i < count; i++) {
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

export function generateShapePoints(shape: ShapeType, count: number): Point2D[] {
  const baseSize = 180;
  switch (shape) {
    case 'circle':
      return generateCirclePoints(count, baseSize);
    case 'heart':
      return generateHeartPoints(count, baseSize / 17);
    case 'star':
      return generateStarPoints(count, baseSize, baseSize * 0.45, 5);
    default:
      return generateCirclePoints(count, baseSize);
  }
}

export const shapeColors: Record<ShapeType, { h: number; s: number; l: number }> = {
  circle: { h: 210, s: 80, l: 60 },
  heart: { h: 340, s: 80, l: 65 },
  star: { h: 45, s: 90, l: 60 },
};
