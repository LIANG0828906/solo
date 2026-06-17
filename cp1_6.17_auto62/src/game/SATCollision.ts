import type { Vec2, Rect, Circle, Polygon } from './types';

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function getAxes(poly: Polygon): Vec2[] {
  const axes: Vec2[] = [];
  const vertices = poly.vertices;
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    const edge = subtract(p2, p1);
    const normal = normalize({ x: -edge.y, y: edge.x });
    axes.push(normal);
  }
  return axes;
}

function projectPolygon(vertices: Vec2[], axis: Vec2): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const v of vertices) {
    const proj = dot(v, axis);
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
}

function projectCircle(circle: Circle, axis: Vec2): { min: number; max: number } {
  const centerProj = dot({ x: circle.x, y: circle.y }, axis);
  return {
    min: centerProj - circle.radius,
    max: centerProj + circle.radius,
  };
}

function overlap(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
  return a.max >= b.min && b.max >= a.min;
}

function rectToPolygon(rect: Rect): Polygon {
  return {
    vertices: [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ],
    position: { x: rect.x, y: rect.y },
  };
}

export function rectIntersectRect(a: Rect, b: Rect): boolean {
  const polyA = rectToPolygon(a);
  const polyB = rectToPolygon(b);
  const axesA = getAxes(polyA);
  const axesB = getAxes(polyB);
  const allAxes = [...axesA, ...axesB];
  for (const axis of allAxes) {
    const projA = projectPolygon(polyA.vertices, axis);
    const projB = projectPolygon(polyB.vertices, axis);
    if (!overlap(projA, projB)) return false;
  }
  return true;
}

export function circleIntersectRect(circle: Circle, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function circleIntersectCircle(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radiusSum = a.radius + b.radius;
  return dx * dx + dy * dy <= radiusSum * radiusSum;
}

export function resolveRectCollision(
  rect: Rect,
  velocity: Vec2,
  platforms: Rect[]
): {
  newX: number;
  newY: number;
  collidedX: boolean;
  collidedY: boolean;
  onGround: boolean;
} {
  let newX = rect.x + velocity.x;
  let newY = rect.y + velocity.y;
  let collidedX = false;
  let collidedY = false;
  let onGround = false;

  for (const platform of platforms) {
    const testRectX: Rect = { x: newX, y: rect.y, width: rect.width, height: rect.height };
    if (rectIntersectRect(testRectX, platform)) {
      if (velocity.x > 0) {
        newX = platform.x - rect.width;
      } else if (velocity.x < 0) {
        newX = platform.x + platform.width;
      }
      collidedX = true;
    }
  }

  for (const platform of platforms) {
    const testRectY: Rect = { x: newX, y: newY, width: rect.width, height: rect.height };
    if (rectIntersectRect(testRectY, platform)) {
      if (velocity.y > 0) {
        newY = platform.y - rect.height;
        onGround = true;
      } else if (velocity.y < 0) {
        newY = platform.y + platform.height;
      }
      collidedY = true;
    }
  }

  return { newX, newY, collidedX, collidedY, onGround };
}
