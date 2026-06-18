import { Vector3, Obstacle } from '../types/acoustic';
import * as THREE from 'three';

export const vec3 = (x: number = 0, y: number = 0, z: number = 0): Vector3 => ({ x, y, z });

export const vec3Add = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const vec3Sub = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const vec3Scale = (v: Vector3, s: number): Vector3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s,
});

export const vec3Length = (v: Vector3): number =>
  Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

export const vec3Normalize = (v: Vector3): Vector3 => {
  const len = vec3Length(v);
  if (len === 0) return vec3(0, 0, 0);
  return vec3Scale(v, 1 / len);
};

export const vec3Dot = (a: Vector3, b: Vector3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

export const vec3Cross = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const vec3Distance = (a: Vector3, b: Vector3): number =>
  vec3Length(vec3Sub(a, b));

export const vec3Reflect = (direction: Vector3, normal: Vector3): Vector3 => {
  const d = vec3Dot(direction, normal);
  return vec3Sub(direction, vec3Scale(normal, 2 * d));
};

export const vec3Lerp = (a: Vector3, b: Vector3, t: number): Vector3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const easeOutCubic = (t: number): number =>
  1 - Math.pow(1 - t, 3);

export const easeOutQuad = (t: number): number =>
  1 - (1 - t) * (1 - t);

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11);

export const rayIntersectsBox = (
  origin: Vector3,
  direction: Vector3,
  boxMin: Vector3,
  boxMax: Vector3
): { distance: number; normal: Vector3 } | null => {
  let tmin = -Infinity;
  let tmax = Infinity;
  let hitAxis = 0;
  let hitSign = 1;

  const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
  for (let i = 0; i < 3; i++) {
    const axis = axes[i];
    const d = direction[axis];
    if (Math.abs(d) < 1e-8) {
      if (origin[axis] < boxMin[axis] || origin[axis] > boxMax[axis]) {
        return null;
      }
    } else {
      const t1 = (boxMin[axis] - origin[axis]) / d;
      const t2 = (boxMax[axis] - origin[axis]) / d;
      const tNear = Math.min(t1, t2);
      const tFar = Math.max(t1, t2);

      if (tNear > tmin) {
        tmin = tNear;
        hitAxis = i;
        hitSign = t1 < t2 ? -1 : 1;
      }
      tmax = Math.min(tmax, tFar);
      if (tmin > tmax) return null;
    }
  }

  if (tmin < 0) return null;

  const normal = vec3(0, 0, 0);
  if (hitAxis === 0) normal.x = hitSign;
  else if (hitAxis === 1) normal.y = hitSign;
  else normal.z = hitSign;

  return { distance: tmin, normal };
};

export const rayIntersectsObstacle = (
  origin: Vector3,
  direction: Vector3,
  obstacle: Obstacle
): { distance: number; normal: Vector3 } | null => {
  const halfSize = vec3Scale(obstacle.size, 0.5);
  const boxMin = vec3Sub(obstacle.position, halfSize);
  const boxMax = vec3Add(obstacle.position, halfSize);
  return rayIntersectsBox(origin, direction, boxMin, boxMax);
};

export const rayIntersectsRoom = (
  origin: Vector3,
  direction: Vector3,
  roomSize: Vector3
): { distance: number; normal: Vector3 } | null => {
  const boxMin = vec3(0, 0, 0);
  const boxMax = roomSize;
  return rayIntersectsBox(origin, direction, boxMin, boxMax);
};

export const getObstacleEdges = (obstacle: Obstacle): Array<{ start: Vector3; end: Vector3; normal: Vector3 }> => {
  const half = vec3Scale(obstacle.size, 0.5);
  const p = obstacle.position;
  const v = [
    vec3(p.x - half.x, p.y - half.y, p.z - half.z),
    vec3(p.x + half.x, p.y - half.y, p.z - half.z),
    vec3(p.x + half.x, p.y - half.y, p.z + half.z),
    vec3(p.x - half.x, p.y - half.y, p.z + half.z),
    vec3(p.x - half.x, p.y + half.y, p.z - half.z),
    vec3(p.x + half.x, p.y + half.y, p.z - half.z),
    vec3(p.x + half.x, p.y + half.y, p.z + half.z),
    vec3(p.x - half.x, p.y + half.y, p.z + half.z),
  ];

  const edges = [
    { start: v[0], end: v[1], normal: vec3(0, 0, -1) },
    { start: v[1], end: v[2], normal: vec3(1, 0, 0) },
    { start: v[2], end: v[3], normal: vec3(0, 0, 1) },
    { start: v[3], end: v[0], normal: vec3(-1, 0, 0) },
    { start: v[4], end: v[5], normal: vec3(0, 0, -1) },
    { start: v[5], end: v[6], normal: vec3(1, 0, 0) },
    { start: v[6], end: v[7], normal: vec3(0, 0, 1) },
    { start: v[7], end: v[4], normal: vec3(-1, 0, 0) },
    { start: v[0], end: v[4], normal: vec3(-1, 0, 0) },
    { start: v[1], end: v[5], normal: vec3(1, 0, 0) },
    { start: v[2], end: v[6], normal: vec3(1, 0, 0) },
    { start: v[3], end: v[7], normal: vec3(-1, 0, 0) },
  ];

  return edges;
};

export const pointToLineDistance = (
  point: Vector3,
  lineStart: Vector3,
  lineEnd: Vector3
): { distance: number; closestPoint: Vector3; t: number } => {
  const ab = vec3Sub(lineEnd, lineStart);
  const ap = vec3Sub(point, lineStart);
  const abSq = vec3Dot(ab, ab);
  if (abSq === 0) {
    return {
      distance: vec3Distance(point, lineStart),
      closestPoint: lineStart,
      t: 0,
    };
  }
  let t = vec3Dot(ap, ab) / abSq;
  t = clamp(t, 0, 1);
  const closestPoint = vec3Add(lineStart, vec3Scale(ab, t));
  return {
    distance: vec3Distance(point, closestPoint),
    closestPoint,
    t,
  };
};

export const toTHREEVector3 = (v: Vector3): THREE.Vector3 =>
  new THREE.Vector3(v.x, v.y, v.z);

export const fromTHREEVector3 = (v: THREE.Vector3): Vector3 =>
  vec3(v.x, v.y, v.z);

export const secondOrderExponentialFit = (
  t: number,
  a: number,
  b: number,
  c: number,
  d: number
): number => a * Math.exp(-b * t) + c * Math.exp(-d * t);
