import type { BombType, Position, Obstacle, Bomb, Shockwave, Debris } from '../shared/types';

const GRID_SIZE = 30;

export function calculateExplosionRadius(bombType: BombType): number {
  const radiusMap: Record<BombType, number> = {
    basic: 3,
    delayed: 5,
    directed: 4,
  };
  return radiusMap[bombType] * GRID_SIZE;
}

export function isPointInExplosion(
  point: Position,
  explosionPos: Position,
  bombType: BombType,
  direction?: number,
  currentRadius?: number
): boolean {
  const maxRadius = currentRadius ?? calculateExplosionRadius(bombType);
  const dx = point.x - explosionPos.x;
  const dy = point.y - explosionPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > maxRadius) {
    return false;
  }

  if (bombType === 'directed' && direction !== undefined) {
    const angle = Math.atan2(dy, dx);
    const targetAngle = (direction * Math.PI) / 180;
    const halfSectorAngle = Math.PI / 6;
    let angleDiff = Math.abs(angle - targetAngle);
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }
    return angleDiff <= halfSectorAngle;
  }

  return true;
}

export function checkLineOfSight(
  from: Position,
  to: Position,
  obstacles: Obstacle[],
  maxPenetration: number
): { blocked: boolean; penetrated: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(distance / 5);
  let penetrated = 0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    const checkPos = { x, y