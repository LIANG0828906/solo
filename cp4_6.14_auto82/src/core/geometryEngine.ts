import type {
  Shape,
  PointShape,
  SegmentShape,
  CircleShape,
  Constraint,
  ParallelConstraint,
  PerpendicularConstraint,
  MidpointConstraint,
  AngleConstraint,
} from '../types';

export function getPointById(shapes: Shape[], id: string): PointShape | undefined {
  const shape = shapes.find((s) => s.id === id);
  return shape?.type === 'point' ? shape : undefined;
}

export function getSegmentById(shapes: Shape[], id: string): SegmentShape | undefined {
  const shape = shapes.find((s) => s.id === id);
  return shape?.type === 'segment' ? shape : undefined;
}

export function getCircleById(shapes: Shape[], id: string): CircleShape | undefined {
  const shape = shapes.find((s) => s.id === id);
  return shape?.type === 'circle' ? shape : undefined;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
}

export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { distance: number; t: number; closestX: number; closestY: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { distance: distance(px, py, x1, y1), t: 0, closestX: x1, closestY: y1 };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return {
    distance: distance(px, py, closestX, closestY),
    t,
    closestX,
    closestY,
  };
}

export function areSegmentsParallel(
  shapes: Shape[],
  seg1Id: string,
  seg2Id: string
): boolean {
  const seg1 = getSegmentById(shapes, seg1Id);
  const seg2 = getSegmentById(shapes, seg2Id);

  if (!seg1 || !seg2) return false;

  const p1 = getPointById(shapes, seg1.startPointId);
  const p2 = getPointById(shapes, seg1.endPointId);
  const p3 = getPointById(shapes, seg2.startPointId);
  const p4 = getPointById(shapes, seg2.endPointId);

  if (!p1 || !p2 || !p3 || !p4) return false;

  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const cross = dx1 * dy2 - dy1 * dx2;
  return Math.abs(cross) < 0.001;
}

export function areSegmentsPerpendicular(
  shapes: Shape[],
  seg1Id: string,
  seg2Id: string
): boolean {
  const seg1 = getSegmentById(shapes, seg1Id);
  const seg2 = getSegmentById(shapes, seg2Id);

  if (!seg1 || !seg2) return false;

  const p1 = getPointById(shapes, seg1.startPointId);
  const p2 = getPointById(shapes, seg1.endPointId);
  const p3 = getPointById(shapes, seg2.startPointId);
  const p4 = getPointById(shapes, seg2.endPointId);

  if (!p1 || !p2 || !p3 || !p4) return false;

  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const dot = dx1 * dx2 + dy1 * dy2;
  return Math.abs(dot) < 0.001;
}

export function isPointOnSegment(
  shapes: Shape[],
  pointId: string,
  segmentId: string,
  tolerance: number = 1
): boolean {
  const point = getPointById(shapes, pointId);
  const segment = getSegmentById(shapes, segmentId);

  if (!point || !segment) return false;

  const start = getPointById(shapes, segment.startPointId);
  const end = getPointById(shapes, segment.endPointId);

  if (!start || !end) return false;

  const result = pointToSegmentDistance(point.x, point.y, start.x, start.y, end.x, end.y);
  return result.distance < tolerance;
}

export function isPointAtMidpoint(
  shapes: Shape[],
  pointId: string,
  segmentId: string,
  tolerance: number = 1
): boolean {
  const point = getPointById(shapes, pointId);
  const segment = getSegmentById(shapes, segmentId);

  if (!point || !segment) return false;

  const start = getPointById(shapes, segment.startPointId);
  const end = getPointById(shapes, segment.endPointId);

  if (!start || !end) return false;

  const mid = midpoint(start.x, start.y, end.x, end.y);
  const dist = distance(point.x, point.y, mid.x, mid.y);
  return dist < tolerance;
}

function applyMidpointConstraint(
  shapes: Shape[],
  constraint: MidpointConstraint,
  fixedPointIds: Set<string>
): Shape[] {
  const point = getPointById(shapes, constraint.pointId);
  const segment = getSegmentById(shapes, constraint.segmentId);

  if (!point || !segment) return shapes;

  const startPoint = getPointById(shapes, segment.startPointId);
  const endPoint = getPointById(shapes, segment.endPointId);

  if (!startPoint || !endPoint) return shapes;

  const startFixed = fixedPointIds.has(startPoint.id);
  const endFixed = fixedPointIds.has(endPoint.id);
  const midFixed = fixedPointIds.has(point.id);

  if (midFixed && !startFixed && !endFixed) {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;

    return shapes.map((s) => {
      if (s.id === startPoint.id && s.type === 'point') {
        return { ...s, x: point.x - dx / 2, y: point.y - dy / 2 };
      }
      if (s.id === endPoint.id && s.type === 'point') {
        return { ...s, x: point.x + dx / 2, y: point.y + dy / 2 };
      }
      return s;
    });
  }

  if (!midFixed) {
    const mid = midpoint(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    return shapes.map((s) => {
      if (s.id === point.id && s.type === 'point') {
        return { ...s, x: mid.x, y: mid.y };
      }
      return s;
    });
  }

  return shapes;
}

function applyParallelConstraint(
  shapes: Shape[],
  constraint: ParallelConstraint,
  fixedPointIds: Set<string>
): Shape[] {
  const seg1 = getSegmentById(shapes, constraint.segment1Id);
  const seg2 = getSegmentById(shapes, constraint.segment2Id);

  if (!seg1 || !seg2) return shapes;

  const p1 = getPointById(shapes, seg1.startPointId);
  const p2 = getPointById(shapes, seg1.endPointId);
  const p3 = getPointById(shapes, seg2.startPointId);
  const p4 = getPointById(shapes, seg2.endPointId);

  if (!p1 || !p2 || !p3 || !p4) return shapes;

  const seg1StartFixed = fixedPointIds.has(p1.id);
  const seg1EndFixed = fixedPointIds.has(p2.id);
  const seg2StartFixed = fixedPointIds.has(p3.id);
  const seg2EndFixed = fixedPointIds.has(p4.id);

  const seg1FullyFixed = seg1StartFixed && seg1EndFixed;
  const seg2FullyFixed = seg2StartFixed && seg2EndFixed;

  if (seg1FullyFixed && seg2FullyFixed) return shapes;

  if (seg1FullyFixed) {
    const dirX = p2.x - p1.x;
    const dirY = p2.y - p1.y;
    const len1 = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len1 === 0) return shapes;

    const seg2DirX = p4.x - p3.x;
    const seg2DirY = p4.y - p3.y;
    const len2 = Math.sqrt(seg2DirX * seg2DirX + seg2DirY * seg2DirY);
    if (len2 === 0) return shapes;

    const scale = len2 / len1;
    const newDirX = dirX * scale;
    const newDirY = dirY * scale;

    if (seg2StartFixed && !seg2EndFixed) {
      return shapes.map((s) => {
        if (s.id === p4.id && s.type === 'point') {
          return { ...s, x: p3.x + newDirX, y: p3.y + newDirY };
        }
        return s;
      });
    } else if (!seg2StartFixed && seg2EndFixed) {
      return shapes.map((s) => {
        if (s.id === p3.id && s.type === 'point') {
          return { ...s, x: p4.x - newDirX, y: p4.y - newDirY };
        }
        return s;
      });
    } else if (!seg2StartFixed && !seg2EndFixed) {
      const mid2 = midpoint(p3.x, p3.y, p4.x, p4.y);
      return shapes.map((s) => {
        if (s.id === p3.id && s.type === 'point') {
          return { ...s, x: mid2.x - newDirX / 2, y: mid2.y - newDirY / 2 };
        }
        if (s.id === p4.id && s.type === 'point') {
          return { ...s, x: mid2.x + newDirX / 2, y: mid2.y + newDirY / 2 };
        }
        return s;
      });
    }
  }

  if (seg2FullyFixed) {
    const dirX = p4.x - p3.x;
    const dirY = p4.y - p3.y;
    const len2 = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len2 === 0) return shapes;

    const seg1DirX = p2.x - p1.x;
    const seg1DirY = p2.y - p1.y;
    const len1 = Math.sqrt(seg1DirX * seg1DirX + seg1DirY * seg1DirY);
    if (len1 === 0) return shapes;

    const scale = len1 / len2;
    const newDirX = dirX * scale;
    const newDirY = dirY * scale;

    if (seg1StartFixed && !seg1EndFixed) {
      return shapes.map((s) => {
        if (s.id === p2.id && s.type === 'point') {
          return { ...s, x: p1.x + newDirX, y: p1.y + newDirY };
        }
        return s;
      });
    } else if (!seg1StartFixed && seg1EndFixed) {
      return shapes.map((s) => {
        if (s.id === p1.id && s.type === 'point') {
          return { ...s, x: p2.x - newDirX, y: p2.y - newDirY };
        }
        return s;
      });
    } else if (!seg1StartFixed && !seg1EndFixed) {
      const mid1 = midpoint(p1.x, p1.y, p2.x, p2.y);
      return shapes.map((s) => {
        if (s.id === p1.id && s.type === 'point') {
          return { ...s, x: mid1.x - newDirX / 2, y: mid1.y - newDirY / 2 };
        }
        if (s.id === p2.id && s.type === 'point') {
          return { ...s, x: mid1.x + newDirX / 2, y: mid1.y + newDirY / 2 };
        }
        return s;
      });
    }
  }

  if (seg1StartFixed && !seg1EndFixed) {
    const dirX = p4.x - p3.x;
    const dirY = p4.y - p3.y;
    const len2 = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len2 === 0) return shapes;

    const seg1DirX = p2.x - p1.x;
    const seg1DirY = p2.y - p1.y;
    const len1 = Math.sqrt(seg1DirX * seg1DirX + seg1DirY * seg1DirY);
    if (len1 === 0) return shapes;

    const scale = len1 / len2;
    return shapes.map((s) => {
      if (s.id === p2.id && s.type === 'point') {
        return { ...s, x: p1.x + dirX * scale, y: p1.y + dirY * scale };
      }
      return s;
    });
  }

  if (seg2StartFixed && !seg2EndFixed) {
    const dirX = p2.x - p1.x;
    const dirY = p2.y - p1.y;
    const len1 = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len1 === 0) return shapes;

    const seg2DirX = p4.x - p3.x;
    const seg2DirY = p4.y - p3.y;
    const len2 = Math.sqrt(seg2DirX * seg2DirX + seg2DirY * seg2DirY);
    if (len2 === 0) return shapes;

    const scale = len2 / len1;
    return shapes.map((s) => {
      if (s.id === p4.id && s.type === 'point') {
        return { ...s, x: p3.x + dirX * scale, y: p3.y + dirY * scale };
      }
      return s;
    });
  }

  return shapes;
}

function applyPerpendicularConstraint(
  shapes: Shape[],
  constraint: PerpendicularConstraint,
  fixedPointIds: Set<string>
): Shape[] {
  const seg1 = getSegmentById(shapes, constraint.segment1Id);
  const seg2 = getSegmentById(shapes, constraint.segment2Id);

  if (!seg1 || !seg2) return shapes;

  const p1 = getPointById(shapes, seg1.startPointId);
  const p2 = getPointById(shapes, seg1.endPointId);
  const p3 = getPointById(shapes, seg2.startPointId);
  const p4 = getPointById(shapes, seg2.endPointId);

  if (!p1 || !p2 || !p3 || !p4) return shapes;

  const seg1StartFixed = fixedPointIds.has(p1.id);
  const seg1EndFixed = fixedPointIds.has(p2.id);
  const seg2StartFixed = fixedPointIds.has(p3.id);
  const seg2EndFixed = fixedPointIds.has(p4.id);

  const seg1FullyFixed = seg1StartFixed && seg1EndFixed;
  const seg2FullyFixed = seg2StartFixed && seg2EndFixed;

  if (seg1FullyFixed && seg2FullyFixed) return shapes;

  const seg1DirX = p2.x - p1.x;
  const seg1DirY = p2.y - p1.y;
  const len1 = Math.sqrt(seg1DirX * seg1DirX + seg1DirY * seg1DirY);

  const seg2DirX = p4.x - p3.x;
  const seg2DirY = p4.y - p3.y;
  const len2 = Math.sqrt(seg2DirX * seg2DirX + seg2DirY * seg2DirY);

  if (len1 === 0 || len2 === 0) return shapes;

  if (seg1FullyFixed) {
    const perpX = -seg1DirY;
    const perpY = seg1DirX;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpLen === 0) return shapes;

    const scale = len2 / perpLen;
    const newDirX = perpX * scale;
    const newDirY = perpY * scale;

    if (seg2StartFixed && !seg2EndFixed) {
      return shapes.map((s) => {
        if (s.id === p4.id && s.type === 'point') {
          return { ...s, x: p3.x + newDirX, y: p3.y + newDirY };
        }
        return s;
      });
    } else if (!seg2StartFixed && seg2EndFixed) {
      return shapes.map((s) => {
        if (s.id === p3.id && s.type === 'point') {
          return { ...s, x: p4.x - newDirX, y: p4.y - newDirY };
        }
        return s;
      });
    } else {
      const mid2 = midpoint(p3.x, p3.y, p4.x, p4.y);
      return shapes.map((s) => {
        if (s.id === p3.id && s.type === 'point') {
          return { ...s, x: mid2.x - newDirX / 2, y: mid2.y - newDirY / 2 };
        }
        if (s.id === p4.id && s.type === 'point') {
          return { ...s, x: mid2.x + newDirX / 2, y: mid2.y + newDirY / 2 };
        }
        return s;
      });
    }
  }

  if (seg2FullyFixed) {
    const perpX = -seg2DirY;
    const perpY = seg2DirX;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpLen === 0) return shapes;

    const scale = len1 / perpLen;
    const newDirX = perpX * scale;
    const newDirY = perpY * scale;

    if (seg1StartFixed && !seg1EndFixed) {
      return shapes.map((s) => {
        if (s.id === p2.id && s.type === 'point') {
          return { ...s, x: p1.x + newDirX, y: p1.y + newDirY };
        }
        return s;
      });
    } else if (!seg1StartFixed && seg1EndFixed) {
      return shapes.map((s) => {
        if (s.id === p1.id && s.type === 'point') {
          return { ...s, x: p2.x - newDirX, y: p2.y - newDirY };
        }
        return s;
      });
    } else {
      const mid1 = midpoint(p1.x, p1.y, p2.x, p2.y);
      return shapes.map((s) => {
        if (s.id === p1.id && s.type === 'point') {
          return { ...s, x: mid1.x - newDirX / 2, y: mid1.y - newDirY / 2 };
        }
        if (s.id === p2.id && s.type === 'point') {
          return { ...s, x: mid1.x + newDirX / 2, y: mid1.y + newDirY / 2 };
        }
        return s;
      });
    }
  }

  if (seg1StartFixed && !seg1EndFixed) {
    const perpX = -seg2DirY;
    const perpY = seg2DirX;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpLen === 0) return shapes;

    const scale = len1 / perpLen;
    return shapes.map((s) => {
      if (s.id === p2.id && s.type === 'point') {
        return { ...s, x: p1.x + perpX * scale, y: p1.y + perpY * scale };
      }
      return s;
    });
  }

  if (seg2StartFixed && !seg2EndFixed) {
    const perpX = -seg1DirY;
    const perpY = seg1DirX;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    if (perpLen === 0) return shapes;

    const scale = len2 / perpLen;
    return shapes.map((s) => {
      if (s.id === p4.id && s.type === 'point') {
        return { ...s, x: p3.x + perpX * scale, y: p3.y + perpY * scale };
      }
      return s;
    });
  }

  return shapes;
}

function applyAngleConstraint(
  shapes: Shape[],
  constraint: AngleConstraint,
  fixedPointIds: Set<string>
): Shape[] {
  const seg1 = getSegmentById(shapes, constraint.segment1Id);
  const seg2 = getSegmentById(shapes, constraint.segment2Id);

  if (!seg1 || !seg2) return shapes;

  const p1 = getPointById(shapes, seg1.startPointId);
  const p2 = getPointById(shapes, seg1.endPointId);
  const p3 = getPointById(shapes, seg2.startPointId);
  const p4 = getPointById(shapes, seg2.endPointId);

  if (!p1 || !p2 || !p3 || !p4) return shapes;

  const seg1StartFixed = fixedPointIds.has(p1.id);
  const seg1EndFixed = fixedPointIds.has(p2.id);
  const seg2StartFixed = fixedPointIds.has(p3.id);
  const seg2EndFixed = fixedPointIds.has(p4.id);

  const seg1FullyFixed = seg1StartFixed && seg1EndFixed;
  const seg2FullyFixed = seg2StartFixed && seg2EndFixed;

  if (seg1FullyFixed && seg2FullyFixed) return shapes;

  let sharedPointId: string | null = null;
  if (p1.id === p3.id || p1.id === p4.id) {
    sharedPointId = p1.id;
  } else if (p2.id === p3.id || p2.id === p4.id) {
    sharedPointId = p2.id;
  }

  if (!sharedPointId) return shapes;

  const sharedPoint = getPointById(shapes, sharedPointId);
  if (!sharedPoint) return shapes;

  const seg1OtherId = p1.id === sharedPointId ? p2.id : p1.id;
  const seg2OtherId = p3.id === sharedPointId ? p4.id : p3.id;

  const seg1Other = getPointById(shapes, seg1OtherId);
  const seg2Other = getPointById(shapes, seg2OtherId);

  if (!seg1Other || !seg2Other) return shapes;

  const seg1OtherFixed = fixedPointIds.has(seg1OtherId);
  const seg2OtherFixed = fixedPointIds.has(seg2OtherId);

  if (seg1OtherFixed && seg2OtherFixed) return shapes;

  const targetAngle = (constraint.angle * Math.PI) / 180;

  if (seg1OtherFixed && !seg2OtherFixed) {
    const len2 = distance(sharedPoint.x, sharedPoint.y, seg2Other.x, seg2Other.y);
    const angle1 = Math.atan2(seg1Other.y - sharedPoint.y, seg1Other.x - sharedPoint.x);
    const newAngle = angle1 + targetAngle;

    return shapes.map((s) => {
      if (s.id === seg2OtherId && s.type === 'point') {
        return {
          ...s,
          x: sharedPoint.x + Math.cos(newAngle) * len2,
          y: sharedPoint.y + Math.sin(newAngle) * len2,
        };
      }
      return s;
    });
  }

  if (!seg1OtherFixed && seg2OtherFixed) {
    const len1 = distance(sharedPoint.x, sharedPoint.y, seg1Other.x, seg1Other.y);
    const angle2 = Math.atan2(seg2Other.y - sharedPoint.y, seg2Other.x - sharedPoint.x);
    const newAngle = angle2 - targetAngle;

    return shapes.map((s) => {
      if (s.id === seg1OtherId && s.type === 'point') {
        return {
          ...s,
          x: sharedPoint.x + Math.cos(newAngle) * len1,
          y: sharedPoint.y + Math.sin(newAngle) * len1,
        };
      }
      return s;
    });
  }

  return shapes;
}

export function solveConstraints(
  shapes: Shape[],
  constraints: Constraint[],
  fixedPointIds: Set<string> = new Set(),
  iterations: number = 10
): Shape[] {
  let result = [...shapes];

  for (let i = 0; i < iterations; i++) {
    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'midpoint':
          result = applyMidpointConstraint(result, constraint, fixedPointIds);
          break;
        case 'parallel':
          result = applyParallelConstraint(result, constraint, fixedPointIds);
          break;
        case 'perpendicular':
          result = applyPerpendicularConstraint(result, constraint, fixedPointIds);
          break;
        case 'angle':
          result = applyAngleConstraint(result, constraint, fixedPointIds);
          break;
      }
    }
  }

  return result;
}

export function circleLineIntersection(
  cx: number,
  cy: number,
  r: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Array<{ x: number; y: number }> {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return [];

  discriminant = Math.sqrt(discriminant);

  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  const intersections: Array<{ x: number; y: number }> = [];

  if (t1 >= 0 && t1 <= 1) {
    intersections.push({ x: x1 + t1 * dx, y: y1 + t1 * dy });
  }
  if (t2 >= 0 && t2 <= 1 && Math.abs(t1 - t2) > 0.001) {
    intersections.push({ x: x1 + t2 * dx, y: y1 + t2 * dy });
  }

  return intersections;
}

export function exportToSVG(shapes: Shape[], width: number, height: number): string {
  const svgParts: string[] = [];

  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`
  );

  const pointMap = new Map<string, { x: number; y: number }>();
  for (const shape of shapes) {
    if (shape.type === 'point') {
      pointMap.set(shape.id, { x: shape.x, y: shape.y });
    }
  }

  for (const shape of shapes) {
    switch (shape.type) {
      case 'point':
        svgParts.push(
          `<circle cx="${shape.x}" cy="${shape.y}" r="4" fill="#3b82f6" />`
        );
        break;
      case 'segment': {
        const start = pointMap.get(shape.startPointId);
        const end = pointMap.get(shape.endPointId);
        if (start && end) {
          svgParts.push(
            `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#475569" stroke-width="1.5" />`
          );
        }
        break;
      }
      case 'circle': {
        const center = pointMap.get(shape.centerId);
        const radiusPt = pointMap.get(shape.radiusPointId);
        if (center && radiusPt) {
          const r = distance(center.x, center.y, radiusPt.x, radiusPt.y);
          svgParts.push(
            `<circle cx="${center.x}" cy="${center.y}" r="${r}" stroke="#8b5cf6" stroke-width="1.5" fill="#8b5cf633" />`
          );
        }
        break;
      }
      case 'line': {
        const p1 = pointMap.get(shape.point1Id);
        const p2 = pointMap.get(shape.point2Id);
        if (p1 && p2) {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const ex = (dx / len) * 10000;
            const ey = (dy / len) * 10000;
            svgParts.push(
              `<line x1="${p1.x - ex}" y1="${p1.y - ey}" x2="${p1.x + ex}" y2="${p1.y + ey}" stroke="#475569" stroke-width="1.5" />`
            );
          }
        }
        break;
      }
      case 'ray': {
        const start = pointMap.get(shape.startPointId);
        const dir = pointMap.get(shape.directionPointId);
        if (start && dir) {
          const dx = dir.x - start.x;
          const dy = dir.y - start.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const ex = (dx / len) * 10000;
            const ey = (dy / len) * 10000;
            svgParts.push(
              `<line x1="${start.x}" y1="${start.y}" x2="${start.x + ex}" y2="${start.y + ey}" stroke="#475569" stroke-width="1.5" />`
            );
          }
        }
        break;
      }
      case 'polygon': {
        const points = shape.pointIds
          .map((id) => pointMap.get(id))
          .filter((p): p is { x: number; y: number } => p !== undefined);
        if (points.length >= 2) {
          const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
          svgParts.push(
            `<polygon points="${pointsStr}" stroke="#475569" stroke-width="1.5" fill="none" />`
          );
        }
        break;
      }
    }
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
}

export function importFromSVG(svgContent: string): { shapes: Shape[]; constraints: Constraint[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const shapes: Shape[] = [];
  const constraints: Constraint[] = [];
  let idCounter = 0;

  const generateId = () => `imported_${idCounter++}`;

  const circles = doc.querySelectorAll('circle');
  const lines = doc.querySelectorAll('line');
  const polygons = doc.querySelectorAll('polygon');

  const pointMap = new Map<string, string>();

  const addPoint = (x: number, y: number): string => {
    const key = `${x.toFixed(2)}_${y.toFixed(2)}`;
    if (pointMap.has(key)) return pointMap.get(key)!;

    const id = generateId();
    shapes.push({
      id,
      type: 'point',
      x,
      y,
    });
    pointMap.set(key, id);
    return id;
  };

  for (const circle of circles) {
    const cx = parseFloat(circle.getAttribute('cx') || '0');
    const cy = parseFloat(circle.getAttribute('cy') || '0');
    const r = parseFloat(circle.getAttribute('r') || '0');

    const fill = circle.getAttribute('fill');
    const stroke = circle.getAttribute('stroke');

    if ((fill && fill !== 'none') || (stroke && stroke !== 'none')) {
      if (r > 0) {
        const centerId = addPoint(cx, cy);
        const radiusId = addPoint(cx + r, cy);
        const circleId = generateId();
        shapes.push({
          id: circleId,
          type: 'circle',
          centerId,
          radiusPointId: radiusId,
        });
      }
    } else {
      const pointId = addPoint(cx, cy);
    }
  }

  for (const line of lines) {
    const x1 = parseFloat(line.getAttribute('x1') || '0');
    const y1 = parseFloat(line.getAttribute('y1') || '0');
    const x2 = parseFloat(line.getAttribute('x2') || '0');
    const y2 = parseFloat(line.getAttribute('y2') || '0');

    const startId = addPoint(x1, y1);
    const endId = addPoint(x2, y2);
    const segId = generateId();

    shapes.push({
      id: segId,
      type: 'segment',
      startPointId: startId,
      endPointId: endId,
    });
  }

  for (const polygon of polygons) {
    const pointsStr = polygon.getAttribute('points') || '';
    const pointPairs = pointsStr.trim().split(/\s+/);
    const pointIds: string[] = [];

    for (const pair of pointPairs) {
      const [x, y] = pair.split(',').map(parseFloat);
      if (!isNaN(x) && !isNaN(y)) {
        pointIds.push(addPoint(x, y));
      }
    }

    if (pointIds.length >= 2) {
      const polyId = generateId();
      shapes.push({
        id: polyId,
        type: 'polygon',
        pointIds,
        closed: true,
      });
    }
  }

  const pointShapes = shapes.filter((s) => s.type === 'point') as PointShape[];
  const segmentShapes = shapes.filter((s) => s.type === 'segment') as SegmentShape[];

  for (const seg of segmentShapes) {
    const start = shapes.find((s) => s.id === seg.startPointId) as PointShape | undefined;
    const end = shapes.find((s) => s.id === seg.endPointId) as PointShape | undefined;
    if (!start || !end) continue;

    const mid = midpoint(start.x, start.y, end.x, end.y);

    for (const pt of pointShapes) {
      if (pt.id === start.id || pt.id === end.id) continue;
      if (distance(pt.x, pt.y, mid.x, mid.y) < 2) {
        const existing = constraints.find(
          (c) => c.type === 'midpoint' && (c as MidpointConstraint).pointId === pt.id
        );
        if (!existing) {
          constraints.push({
            id: generateId(),
            type: 'midpoint',
            pointId: pt.id,
            segmentId: seg.id,
          });
        }
      }
    }
  }

  for (let i = 0; i < segmentShapes.length; i++) {
    for (let j = i + 1; j < segmentShapes.length; j++) {
      const seg1 = segmentShapes[i];
      const seg2 = segmentShapes[j];

      const s1 = shapes.find((s) => s.id === seg1.startPointId) as PointShape | undefined;
      const e1 = shapes.find((s) => s.id === seg1.endPointId) as PointShape | undefined;
      const s2 = shapes.find((s) => s.id === seg2.startPointId) as PointShape | undefined;
      const e2 = shapes.find((s) => s.id === seg2.endPointId) as PointShape | undefined;

      if (!s1 || !e1 || !s2 || !e2) continue;

      const dx1 = e1.x - s1.x;
      const dy1 = e1.y - s1.y;
      const dx2 = e2.x - s2.x;
      const dy2 = e2.y - s2.y;

      const cross = dx1 * dy2 - dy1 * dx2;
      const dot = dx1 * dx2 + dy1 * dy2;

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (len1 > 0 && len2 > 0) {
        const crossNorm = Math.abs(cross) / (len1 * len2);
        const dotNorm = Math.abs(dot) / (len1 * len2);

        if (crossNorm < 0.05) {
          constraints.push({
            id: generateId(),
            type: 'parallel',
            segment1Id: seg1.id,
            segment2Id: seg2.id,
          });
        } else if (dotNorm < 0.05) {
          constraints.push({
            id: generateId(),
            type: 'perpendicular',
            segment1Id: seg1.id,
            segment2Id: seg2.id,
          });
        }
      }
    }
  }

  return { shapes, constraints };
}
