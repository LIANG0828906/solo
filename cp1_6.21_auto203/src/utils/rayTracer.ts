import type {
  Wall,
  Mechanism,
  LightEmitter,
  LightSensor,
  LightSegment,
  Vector3,
} from '@/types/game';
import {
  degToRad,
  v3Add,
  v3Sub,
  v3Scale,
  v3Dot,
  v3Cross,
  v3Length,
  v3Normalize,
  v3Clone,
  reflect,
  rotateY,
} from '@/utils/helpers';

const EPSILON = 0.001;

interface RayHitResult {
  hit: boolean;
  point: Vector3;
  t: number;
}

interface MechanismIntersectResult {
  mechanism: Mechanism;
  hit: RayHitResult;
  normal: Vector3;
}

interface SensorIntersectResult {
  hit: RayHitResult;
}

const BOUNDS_PADDING = 10;
const MAX_DISTANCE = 1000;

function getWallsBounds(walls: Wall[]): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  if (walls.length === 0) {
    return { minX: -50, maxX: 50, minZ: -50, maxZ: 50, minY: -50, maxY: 50 };
  }
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const w of walls) {
    const hx = w.size.x / 2;
    const hy = w.size.y / 2;
    const hz = w.size.z / 2;
    minX = Math.min(minX, w.position.x - hx);
    maxX = Math.max(maxX, w.position.x + hx);
    minZ = Math.min(minZ, w.position.z - hz);
    maxZ = Math.max(maxZ, w.position.z + hz);
    minY = Math.min(minY, w.position.y - hy);
    maxY = Math.max(maxY, w.position.y + hy);
  }
  return { minX, maxX, minZ, maxZ, minY, maxY };
}

export function isOutsideBounds(point: Vector3, mazeSize: { width: number; depth: number }): boolean {
  const halfW = mazeSize.width / 2 + BOUNDS_PADDING;
  const halfD = mazeSize.depth / 2 + BOUNDS_PADDING;
  return (
    point.x < -halfW ||
    point.x > halfW ||
    point.z < -halfD ||
    point.z > halfD ||
    point.y < -BOUNDS_PADDING ||
    point.y > BOUNDS_PADDING * 2
  );
}

export function isOutsideWalls(point: Vector3, walls: Wall[]): boolean {
  const bounds = getWallsBounds(walls);
  return (
    point.x < bounds.minX - BOUNDS_PADDING ||
    point.x > bounds.maxX + BOUNDS_PADDING ||
    point.z < bounds.minZ - BOUNDS_PADDING ||
    point.z > bounds.maxZ + BOUNDS_PADDING ||
    point.y < bounds.minY - BOUNDS_PADDING ||
    point.y > bounds.maxY + BOUNDS_PADDING
  );
}

export function intersectRayPlane(
  rayOrigin: Vector3,
  rayDir: Vector3,
  planeCenter: Vector3,
  planeNormal: Vector3,
  planeSize: Vector3
): RayHitResult | null {
  const rotationRad = -Math.atan2(planeNormal.x, planeNormal.z);
  
  const cos = Math.cos(-rotationRad);
  const sin = Math.sin(-rotationRad);
  
  const originLocal = {
    x: (rayOrigin.x - planeCenter.x) * cos - (rayOrigin.z - planeCenter.z) * sin,
    y: rayOrigin.y - planeCenter.y,
    z: (rayOrigin.x - planeCenter.x) * sin + (rayOrigin.z - planeCenter.z) * cos,
  };
  
  const dirLocal = v3Normalize({
    x: rayDir.x * cos - rayDir.z * sin,
    y: rayDir.y,
    z: rayDir.x * sin + rayDir.z * cos,
  });
  
  const localNormal: Vector3 = { x: 0, y: 0, z: 1 };
  const denom = v3Dot(dirLocal, localNormal);
  
  if (Math.abs(denom) < EPSILON) {
    return null;
  }
  
  const tLocal = -v3Dot(originLocal, localNormal) / denom;
  
  if (tLocal < EPSILON) {
    return null;
  }
  
  const hitLocal = {
    x: originLocal.x + dirLocal.x * tLocal,
    y: originLocal.y + dirLocal.y * tLocal,
    z: originLocal.z + dirLocal.z * tLocal,
  };
  
  const halfX = planeSize.x / 2;
  const halfY = planeSize.y / 2;
  
  if (
    hitLocal.x < -halfX - EPSILON ||
    hitLocal.x > halfX + EPSILON ||
    hitLocal.y < -halfY - EPSILON ||
    hitLocal.y > halfY + EPSILON
  ) {
    return null;
  }
  
  const cosW = Math.cos(rotationRad);
  const sinW = Math.sin(rotationRad);
  const hitWorld = {
    x: planeCenter.x + hitLocal.x * cosW - hitLocal.z * sinW,
    y: planeCenter.y + hitLocal.y,
    z: planeCenter.z + hitLocal.x * sinW + hitLocal.z * cosW,
  };
  
  return {
    hit: true,
    point: hitWorld,
    t: tLocal,
  };
}

export function intersectRayBox(
  rayOrigin: Vector3,
  rayDir: Vector3,
  boxCenter: Vector3,
  boxSize: Vector3
): RayHitResult | null {
  const min = {
    x: boxCenter.x - boxSize.x / 2,
    y: boxCenter.y - boxSize.y / 2,
    z: boxCenter.z - boxSize.z / 2,
  };
  const max = {
    x: boxCenter.x + boxSize.x / 2,
    y: boxCenter.y + boxSize.y / 2,
    z: boxCenter.z + boxSize.z / 2,
  };

  let tmin = -Infinity;
  let tmax = Infinity;

  for (const axis of ['x', 'y', 'z'] as const) {
    const o = rayOrigin[axis];
    const d = rayDir[axis];
    const mn = min[axis];
    const mx = max[axis];

    if (Math.abs(d) < EPSILON) {
      if (o < mn || o > mx) {
        return null;
      }
    } else {
      let t1 = (mn - o) / d;
      let t2 = (mx - o) / d;
      if (t1 > t2) {
        [t1, t2] = [t2, t1];
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) {
        return null;
      }
    }
  }

  if (tmax < EPSILON) {
    return null;
  }

  const t = tmin < EPSILON ? tmax : tmin;
  const point = {
    x: rayOrigin.x + rayDir.x * t,
    y: rayOrigin.y + rayDir.y * t,
    z: rayOrigin.z + rayDir.z * t,
  };

  return {
    hit: true,
    point,
    t,
  };
}

export function intersectRayDisc(
  rayOrigin: Vector3,
  rayDir: Vector3,
  discCenter: Vector3,
  radius: number,
  normal: Vector3
): RayHitResult | null {
  const denom = v3Dot(rayDir, normal);

  if (Math.abs(denom) < EPSILON) {
    return null;
  }

  const t = v3Dot(v3Sub(discCenter, rayOrigin), normal) / denom;

  if (t < EPSILON) {
    return null;
  }

  const point = {
    x: rayOrigin.x + rayDir.x * t,
    y: rayOrigin.y + rayDir.y * t,
    z: rayOrigin.z + rayDir.z * t,
  };

  const distSq =
    (point.x - discCenter.x) ** 2 +
    (point.y - discCenter.y) ** 2 +
    (point.z - discCenter.z) ** 2;

  if (distSq > radius * radius + EPSILON) {
    return null;
  }

  return {
    hit: true,
    point,
    t,
  };
}

export function getMechanismNormal(m: Mechanism): Vector3 {
  const baseNormal: Vector3 = { x: 0, y: 0, z: 1 };
  return v3Normalize(rotateY(baseNormal, degToRad(m.rotation)));
}

function intersectMechanism(
  rayOrigin: Vector3,
  rayDir: Vector3,
  m: Mechanism
): MechanismIntersectResult | null {
  const normal = getMechanismNormal(m);
  const result = intersectRayPlane(rayOrigin, rayDir, m.position, normal, m.size);
  if (!result) return null;
  return { mechanism: m, hit: result, normal };
}

function intersectAllWalls(
  rayOrigin: Vector3,
  rayDir: Vector3,
  walls: Wall[]
): { wall: Wall; hit: RayHitResult } | null {
  let closest: { wall: Wall; hit: RayHitResult } | null = null;
  let minT = Infinity;

  for (const w of walls) {
    const r = intersectRayBox(rayOrigin, rayDir, w.position, w.size);
    if (r && r.t < minT && r.t > EPSILON) {
      minT = r.t;
      closest = { wall: w, hit: r };
    }
  }
  return closest;
}

function intersectAllMechanisms(
  rayOrigin: Vector3,
  rayDir: Vector3,
  mechanisms: Mechanism[]
): MechanismIntersectResult | null {
  let closest: MechanismIntersectResult | null = null;
  let minT = Infinity;

  for (const m of mechanisms) {
    const r = intersectMechanism(rayOrigin, rayDir, m);
    if (r && r.hit.t < minT && r.hit.t > EPSILON) {
      minT = r.hit.t;
      closest = r;
    }
  }
  return closest;
}

function intersectSensor(
  rayOrigin: Vector3,
  rayDir: Vector3,
  sensor: LightSensor
): SensorIntersectResult | null {
  const normal: Vector3 = { x: 0, y: 1, z: 0 };
  const r = intersectRayDisc(rayOrigin, rayDir, sensor.position, sensor.radius, normal);
  if (r) return { hit: r };
  const normal2: Vector3 = { x: 0, y: -1, z: 0 };
  const r2 = intersectRayDisc(rayOrigin, rayDir, sensor.position, sensor.radius, normal2);
  if (r2) return { hit: r2 };
  return null;
}

interface TraceContext {
  segments: LightSegment[];
  reachedSensor: boolean;
  walls: Wall[];
  mechanisms: Mechanism[];
  sensor: LightSensor;
  mazeSize: { width: number; depth: number };
}

function traceRay(
  origin: Vector3,
  dir: Vector3,
  color: string,
  intensity: number,
  depth: number,
  maxDepth: number,
  ctx: TraceContext,
  ignoreMechanismId: string | null = null
): void {
  if (depth > maxDepth || intensity < 0.05) {
    return;
  }

  const normalizedDir = v3Normalize(dir);

  const activeMechanisms = ignoreMechanismId
    ? ctx.mechanisms.filter((m) => m.id !== ignoreMechanismId)
    : ctx.mechanisms;

  const wallHit = intersectAllWalls(origin, normalizedDir, ctx.walls);
  const mechHit = intersectAllMechanisms(origin, normalizedDir, activeMechanisms);
  const sensorHit = intersectSensor(origin, normalizedDir, ctx.sensor);

  type HitKind = 'wall' | 'mechanism' | 'sensor' | 'none';
  let closestKind: HitKind = 'none';
  let closestT = Infinity;
  let closestPoint: Vector3 | null = null;
  let closestMech: MechanismIntersectResult | null = null;

  if (wallHit && wallHit.hit.t < closestT) {
    closestT = wallHit.hit.t;
    closestKind = 'wall';
    closestPoint = wallHit.hit.point;
  }
  if (mechHit && mechHit.hit.t < closestT) {
    closestT = mechHit.hit.t;
    closestKind = 'mechanism';
    closestPoint = mechHit.hit.point;
    closestMech = mechHit;
  }
  if (sensorHit && sensorHit.hit.t < closestT) {
    closestT = sensorHit.hit.t;
    closestKind = 'sensor';
    closestPoint = sensorHit.hit.point;
  }

  let endPoint: Vector3;
  let pathBroken = false;

  if (closestKind === 'none') {
    endPoint = {
      x: origin.x + normalizedDir.x * MAX_DISTANCE,
      y: origin.y + normalizedDir.y * MAX_DISTANCE,
      z: origin.z + normalizedDir.z * MAX_DISTANCE,
    };
    if (
      isOutsideBounds(endPoint, ctx.mazeSize) ||
      isOutsideWalls(endPoint, ctx.walls)
    ) {
      pathBroken = true;
    }
  } else if (closestPoint) {
    endPoint = closestPoint;
  } else {
    return;
  }

  ctx.segments.push({
    start: v3Clone(origin),
    end: v3Clone(endPoint),
    color,
    intensity,
  });

  if (closestKind === 'none' && pathBroken) {
    return;
  }

  if (closestKind === 'sensor') {
    ctx.reachedSensor = true;
    return;
  }

  if (closestKind === 'wall') {
    return;
  }

  if (closestKind === 'mechanism' && closestMech) {
    const m = closestMech.mechanism;
    const hitPoint = v3Add(closestMech.hit.point, v3Scale(normalizedDir, EPSILON * 2));
    let incidentNormal = closestMech.normal;
    const dot = v3Dot(normalizedDir, incidentNormal);
    if (dot > 0) {
      incidentNormal = v3Scale(incidentNormal, -1);
    }

    switch (m.type) {
      case 'mirror': {
        const reflectedDir = reflect(normalizedDir, incidentNormal);
        traceRay(
          hitPoint,
          reflectedDir,
          color,
          intensity,
          depth + 1,
          maxDepth,
          ctx,
          m.id
        );
        break;
      }
      case 'prism': {
        const baseAngleRad = Math.atan2(normalizedDir.x, normalizedDir.z);
        const angles = [
          { offset: -15, color: '#FF6B6B' },
          { offset: 5, color: '#48DBFB' },
          { offset: 15, color: '#4ECDC4' },
        ];
        for (const { offset, color: splitColor } of angles) {
          const newAngleRad = baseAngleRad + degToRad(offset);
          const horizontalMag = Math.sqrt(normalizedDir.x ** 2 + normalizedDir.z ** 2);
          const splitDir = v3Normalize({
            x: Math.sin(newAngleRad) * horizontalMag,
            y: normalizedDir.y,
            z: Math.cos(newAngleRad) * horizontalMag,
          });
          traceRay(
            hitPoint,
            splitDir,
            splitColor,
            intensity,
            depth + 1,
            maxDepth,
            ctx,
            m.id
          );
        }
        break;
      }
      case 'translucent': {
        const refractedDir = v3Normalize(normalizedDir);
        traceRay(
          hitPoint,
          refractedDir,
          color,
          intensity * 0.6,
          depth + 1,
          maxDepth,
          ctx,
          m.id
        );
        const reflectedDir = reflect(normalizedDir, incidentNormal);
        traceRay(
          hitPoint,
          reflectedDir,
          color,
          intensity * 0.4,
          depth + 1,
          maxDepth,
          ctx,
          m.id
        );
        break;
      }
    }
  }
}

function computeMazeSize(walls: Wall[]): { width: number; depth: number } {
  const bounds = getWallsBounds(walls);
  return {
    width: Math.max(10, bounds.maxX - bounds.minX),
    depth: Math.max(10, bounds.maxZ - bounds.minZ),
  };
}

export function traceLightRays(
  emitter: LightEmitter,
  walls: Wall[],
  mechanisms: Mechanism[],
  sensor: LightSensor,
  maxDepth: number = 10
): { segments: LightSegment[]; reachedSensor: boolean } {
  const mazeSize = computeMazeSize(walls);

  const ctx: TraceContext = {
    segments: [],
    reachedSensor: false,
    walls,
    mechanisms,
    sensor,
    mazeSize,
  };

  const initialDir = v3Normalize(emitter.direction);
  const initialOrigin = v3Clone(emitter.position);

  traceRay(
    initialOrigin,
    initialDir,
    '#FFD700',
    1.0,
    0,
    maxDepth,
    ctx,
    null
  );

  return {
    segments: ctx.segments,
    reachedSensor: ctx.reachedSensor,
  };
}
