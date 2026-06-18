import { Vector2D, PendulumState, CollisionResult } from './types';

export const GRAVITY = 9.8 * 50;
export const AIR_RESISTANCE = 0.01;
export const BOUNCE_COEFFICIENT = 0.6;
export const BOB_RADIUS = 10;

export function computeBobPosition(pivot: Vector2D, angle: number, ropeLength: number): Vector2D {
  return {
    x: pivot.x + ropeLength * Math.sin(angle),
    y: pivot.y + ropeLength * Math.cos(angle),
  };
}

export function computeTangentialVelocity(angularVelocity: number, ropeLength: number): number {
  return angularVelocity * ropeLength;
}

export function computeBobVelocityVector(
  angle: number,
  angularVelocity: number,
  ropeLength: number
): Vector2D {
  const speed = computeTangentialVelocity(angularVelocity, ropeLength);
  return {
    x: speed * Math.cos(angle),
    y: -speed * Math.sin(angle),
  };
}

export function angleFromPosition(pivot: Vector2D, bob: Vector2D, ropeLength: number): number {
  const dx = bob.x - pivot.x;
  const dy = bob.y - pivot.y;
  let angle = Math.atan2(dx, dy);
  const actualLen = Math.hypot(dx, dy);
  if (actualLen > 0 && Math.abs(actualLen - ropeLength) > 1) {
    const scale = ropeLength / actualLen;
    angle = Math.atan2(dx * scale, dy * scale);
  }
  return angle;
}

export function mapDragToInitialVelocity(
  pendulum: PendulumState,
  dragStart: Vector2D,
  dragEnd: Vector2D
): { angle: number; angularVelocity: number } {
  const { pivot, ropeLength } = pendulum;
  const startRel = {
    x: dragStart.x - pivot.x,
    y: dragStart.y - pivot.y,
  };
  const endRel = {
    x: dragEnd.x - pivot.x,
    y: dragEnd.y - pivot.y,
  };
  const startAngle = Math.atan2(startRel.x, startRel.y);
  const endAngle = Math.atan2(endRel.x, endRel.y);
  let newAngle = endAngle;
  const scale = ropeLength / Math.max(Math.hypot(endRel.x, endRel.y), 1);
  const clampedEndRel = {
    x: endRel.x * scale,
    y: endRel.y * scale,
  };
  newAngle = Math.atan2(clampedEndRel.x, clampedEndRel.y);
  const angleDelta = endAngle - startAngle;
  const gain = 2.5;
  const maxOmega = 8;
  const angularVelocity = Math.max(-maxOmega, Math.min(maxOmega, angleDelta * gain));
  return { angle: newAngle, angularVelocity };
}

export function stepPhysics(
  pendulum: PendulumState,
  dtSeconds: number,
  collisions: CollisionResult[] = []
): PendulumState {
  let { angle, angularVelocity, ropeLength, pivot, bobRadius } = pendulum;
  const g = GRAVITY;
  const L = ropeLength;
  const k = AIR_RESISTANCE;
  const alpha = -(g / L) * Math.sin(angle) - k * angularVelocity;
  angularVelocity = angularVelocity + alpha * dtSeconds;
  angle = angle + angularVelocity * dtSeconds;
  if (collisions.length > 0) {
    const vel = computeBobVelocityVector(angle, angularVelocity, L);
    for (const col of collisions) {
      if (!col.collided || !col.normal) continue;
      if (col.mechanism?.type === 'gem' || col.mechanism?.type === 'portal' || col.mechanism?.type === 'goal') {
        continue;
      }
      const n = col.normal;
      const vn = vel.x * n.x + vel.y * n.y;
      if (vn < 0) {
        const e = BOUNCE_COEFFICIENT;
        const vnx = vn * n.x;
        const vny = vn * n.y;
        const vtx = vel.x - vnx;
        const vty = vel.y - vny;
        const newVx = -e * vnx + vtx;
        const newVy = -e * vny + vty;
        const tangDir = { x: Math.cos(angle), y: -Math.sin(angle) };
        const newTangSpeed = newVx * tangDir.x + newVy * tangDir.y;
        angularVelocity = newTangSpeed / L;
        if (col.penetrationDepth && col.normal) {
          const pushOut = col.penetrationDepth + 0.5;
          const curPos = computeBobPosition(pivot, angle, L);
          const newPos = {
            x: curPos.x + col.normal.x * pushOut,
            y: curPos.y + col.normal.y * pushOut,
          };
          angle = angleFromPosition(pivot, newPos, L);
        }
      }
    }
  }
  const dampingThreshold = 0.0005;
  if (Math.abs(angularVelocity) < dampingThreshold && Math.abs(Math.sin(angle)) < 0.01) {
    angularVelocity = 0;
    angle = Math.round(angle * 100) / 100;
  }
  const bobPosition = computeBobPosition(pivot, angle, ropeLength);
  return {
    pivot,
    angle,
    angularVelocity,
    ropeLength,
    bobRadius,
    bobPosition,
  };
}

export class PhysicsEngine {
  private state: PendulumState;
  constructor(initial: PendulumState) {
    this.state = initial;
  }
  getState(): PendulumState {
    return this.state;
  }
  setState(s: PendulumState): void {
    this.state = s;
  }
  applyInitialVelocity(dragStart: Vector2D, dragEnd: Vector2D): void {
    const { angle, angularVelocity } = mapDragToInitialVelocity(
      this.state,
      dragStart,
      dragEnd
    );
    this.state.angle = angle;
    this.state.angularVelocity = angularVelocity;
    this.state.bobPosition = computeBobPosition(
      this.state.pivot,
      this.state.angle,
      this.state.ropeLength
    );
  }
  step(dt: number, collisions: CollisionResult[] = []): PendulumState {
    this.state = stepPhysics(this.state, dt, collisions);
    return this.state;
  }
}
