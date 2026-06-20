import { Vector2, BeamSegment, TowerType } from './types';

const MAX_BOUNCES = 8;
const MAX_DISTANCE = 100;

export interface MirrorObject {
  id: string;
  position: Vector2;
  rotation: number;
  length: number;
}

export interface PrismObject {
  id: string;
  position: Vector2;
  rotation: number;
  size: number;
}

const normalize = (v: Vector2): Vector2 => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 1, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

const reflect = (direction: Vector2, normal: Vector2): Vector2 => {
  const d = dot(direction, normal) * 2;
  return {
    x: direction.x - d * normal.x,
    y: direction.y - d * normal.y,
  };
};

const getMirrorEndpoints = (mirror: MirrorObject): [Vector2, Vector2] => {
  const halfLen = mirror.length / 2;
  const cos = Math.cos(mirror.rotation);
  const sin = Math.sin(mirror.rotation);
  return [
    { x: mirror.position.x - cos * halfLen, y: mirror.position.y - sin * halfLen },
    { x: mirror.position.x + cos * halfLen, y: mirror.position.y + sin * halfLen },
  ];
};

const lineIntersection = (
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2
): { point: Vector2; t: number } | null => {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      point: {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y),
      },
      t: ub,
    };
  }
  return null;
};

const getMirrorNormal = (mirror: MirrorObject): Vector2 => {
  const normalAngle = mirror.rotation + Math.PI / 2;
  return { x: Math.cos(normalAngle), y: Math.sin(normalAngle) };
};

export const calculateBeamPath = (
  start: Vector2,
  direction: Vector2,
  color: string,
  type: TowerType,
  mirrors: MirrorObject[],
  prisms: PrismObject[],
  intensity: number = 1
): BeamSegment[] => {
  const segments: BeamSegment[] = [];
  let currentPos = { ...start };
  let currentDir = normalize(direction);
  let currentIntensity = intensity;
  let bounces = 0;
  const visitedMirrors = new Set<string>();

  while (bounces < MAX_BOUNCES) {
    const endPoint = {
      x: currentPos.x + currentDir.x * MAX_DISTANCE,
      y: currentPos.y + currentDir.y * MAX_DISTANCE,
    };

    let closestHit: {
      point: Vector2;
      distance: number;
      type: 'mirror' | 'prism' | 'none';
      object?: MirrorObject | PrismObject;
    } = { point: endPoint, distance: MAX_DISTANCE, type: 'none' };

    for (const mirror of mirrors) {
      if (visitedMirrors.has(mirror.id)) continue;
      
      const [p1, p2] = getMirrorEndpoints(mirror);
      const hit = lineIntersection(currentPos, endPoint, p1, p2);
      
      if (hit) {
        const dist = Math.sqrt(
          Math.pow(hit.point.x - currentPos.x, 2) +
          Math.pow(hit.point.y - currentPos.y, 2)
        );
        if (dist > 0.1 && dist < closestHit.distance) {
          closestHit = { point: hit.point, distance: dist, type: 'mirror', object: mirror };
        }
      }
    }

    if (closestHit.type === 'mirror' && closestHit.object) {
      const mirror = closestHit.object as MirrorObject;
      segments.push({
        start: { ...currentPos },
        end: { ...closestHit.point },
        color,
        intensity: currentIntensity,
        type,
      });

      const normal = getMirrorNormal(mirror);
      const incomingDir = normalize({
        x: closestHit.point.x - currentPos.x,
        y: closestHit.point.y - currentPos.y,
      });
      
      if (dot(incomingDir, normal) > 0) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }
      
      currentDir = reflect(incomingDir, normal);
      currentPos = {
        x: closestHit.point.x + currentDir.x * 0.01,
        y: closestHit.point.y + currentDir.y * 0.01,
      };
      
      visitedMirrors.add(mirror.id);
      currentIntensity *= 0.9;
      bounces++;
    } else {
      segments.push({
        start: { ...currentPos },
        end: endPoint,
        color,
        intensity: currentIntensity,
        type,
      });
      break;
    }
  }

  return segments;
};

export const checkBeamCircleCollision = (
  beamStart: Vector2,
  beamEnd: Vector2,
  circleCenter: Vector2,
  circleRadius: number
): { hit: boolean; point: Vector2; distance: number } => {
  const dx = beamEnd.x - beamStart.x;
  const dy = beamEnd.y - beamStart.y;
  const fx = beamStart.x - circleCenter.x;
  const fy = beamStart.y - circleCenter.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circleRadius * circleRadius;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return { hit: false, point: beamStart, distance: Infinity };
  }

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  let t = t1;
  if (t < 0 || t > 1) t = t2;
  if (t < 0 || t > 1) {
    return { hit: false, point: beamStart, distance: Infinity };
  }

  const hitPoint = {
    x: beamStart.x + t * dx,
    y: beamStart.y + t * dy,
  };

  const distance = Math.sqrt(
    Math.pow(hitPoint.x - beamStart.x, 2) +
    Math.pow(hitPoint.y - beamStart.y, 2)
  );

  return { hit: true, point: hitPoint, distance };
};
