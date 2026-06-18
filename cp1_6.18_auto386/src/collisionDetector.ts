import {
  Vector2D,
  PendulumState,
  Mechanism,
  RectMechanism,
  CircleMechanism,
  CollisionResult,
} from './types';

function sub(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(a: Vector2D, s: number): Vector2D {
  return { x: a.x * s, y: a.y * s };
}

function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

function len(a: Vector2D): number {
  return Math.hypot(a.x, a.y);
}

function normalize(a: Vector2D): Vector2D {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
}

function rotate(p: Vector2D, center: Vector2D, angleRad: number): Vector2D {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const c = Math.cos(-angleRad);
  const s = Math.sin(-angleRad);
  return {
    x: center.x + dx * c - dy * s,
    y: center.y + dx * s + dy * c,
  };
}

function invRotate(p: Vector2D, center: Vector2D, angleRad: number): Vector2D {
  return rotate(p, center, -angleRad);
}

export function circleVsCircle(
  c1: Vector2D,
  r1: number,
  c2: Vector2D,
  r2: number
): CollisionResult {
  const diff = sub(c1, c2);
  const d = len(diff);
  const total = r1 + r2;
  if (d < total) {
    const normal = d > 0.001 ? normalize(diff) : { x: 0, y: -1 };
    const point = add(c2, scale(normal, r2));
    return {
      collided: true,
      point,
      normal,
      penetrationDepth: total - d,
    };
  }
  return { collided: false };
}

export function circleVsSegment(
  center: Vector2D,
  r: number,
  a: Vector2D,
  b: Vector2D
): CollisionResult {
  const ab = sub(b, a);
  const len2 = dot(ab, ab) || 1;
  let t = dot(sub(center, a), ab) / len2;
  t = Math.max(0, Math.min(1, t));
  const closest = add(a, scale(ab, t));
  const diff = sub(center, closest);
  const d = len(diff);
  if (d < r) {
    const normal = d > 0.001 ? normalize(diff) : { x: 0, y: -1 };
    return {
      collided: true,
      point: closest,
      normal,
      penetrationDepth: r - d,
    };
  }
  return { collided: false };
}

export function circleVsRect(
  center: Vector2D,
  r: number,
  rect: RectMechanism
): CollisionResult {
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const local = invRotate(center, rect.position, rect.rotation);
  const rel = sub(local, rect.position);
  const clamped = {
    x: Math.max(-hw, Math.min(hw, rel.x)),
    y: Math.max(-hh, Math.min(hh, rel.y)),
  };
  const diff = sub(rel, clamped);
  const d = len(diff);
  if (d < r) {
    let localNormal: Vector2D;
    if (d > 0.001) {
      localNormal = normalize(diff);
    } else {
      const dxMin = Math.abs(rel.x - (-hw));
      const dxMax = Math.abs(rel.x - hw);
      const dyMin = Math.abs(rel.y - (-hh));
      const dyMax = Math.abs(rel.y - hh);
      const mn = Math.min(dxMin, dxMax, dyMin, dyMax);
      if (mn === dxMin) localNormal = { x: -1, y: 0 };
      else if (mn === dxMax) localNormal = { x: 1, y: 0 };
      else if (mn === dyMin) localNormal = { x: 0, y: -1 };
      else localNormal = { x: 0, y: 1 };
    }
    const worldNormal = rotate(
      { x: rect.position.x + localNormal.x, y: rect.position.y + localNormal.y },
      rect.position,
      rect.rotation
    );
    const normal = normalize(sub(worldNormal, rect.position));
    const localPoint = add(rect.position, clamped);
    const worldPoint = rotate(localPoint, rect.position, rect.rotation);
    return {
      collided: true,
      point: worldPoint,
      normal,
      penetrationDepth: r - d,
    };
  }
  return { collided: false };
}

export function circleVsMechanism(
  center: Vector2D,
  r: number,
  mechanism: Mechanism
): CollisionResult {
  if (!mechanism.active) return { collided: false };
  if (mechanism.shape === 'rectangle') {
    return circleVsRect(center, r, mechanism as RectMechanism);
  }
  if (mechanism.shape === 'circle') {
    const cm = mechanism as CircleMechanism;
    return circleVsCircle(center, r, cm.position, cm.radius);
  }
  return { collided: false };
}

export function circleVsRope(
  pendulum: PendulumState,
  segments: Array<{ a: Vector2D; b: Vector2D }> = []
): CollisionResult[] {
  const results: CollisionResult[] = [];
  for (const seg of segments) {
    const res = circleVsSegment(
      pendulum.bobPosition,
      pendulum.bobRadius,
      seg.a,
      seg.b
    );
    if (res.collided) results.push(res);
  }
  return results;
}

export function detectAllCollisions(
  pendulum: PendulumState,
  mechanisms: Mechanism[]
): Array<CollisionResult & { mechanism: Mechanism }> {
  const out: Array<CollisionResult & { mechanism: Mechanism }> = [];
  for (const m of mechanisms) {
    if (!m.active) continue;
    const res = circleVsMechanism(pendulum.bobPosition, pendulum.bobRadius, m);
    if (res.collided) {
      out.push({ ...res, mechanism: m });
    }
  }
  return out;
}
