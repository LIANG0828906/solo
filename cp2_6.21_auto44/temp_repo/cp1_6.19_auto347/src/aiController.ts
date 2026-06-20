import { Pirate, Turret, Ship, Vector2 } from './types';

export function findNearestTarget(
  pirate: Pirate,
  turrets: Turret[],
  ship: Ship
): { target: Turret | Ship; type: 'turret' | 'ship'; distance: number } | null {
  let nearest: { target: Turret | Ship; type: 'turret' | 'ship'; distance: number } | null = null;
  let minDist = Infinity;

  for (const turret of turrets) {
    if (turret.health <= 0) continue;
    const dx = turret.x - pirate.x;
    const dy = turret.y - pirate.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = { target: turret, type: 'turret', distance: dist };
    }
  }

  const shipDx = ship.x - pirate.x;
  const shipDy = ship.y - pirate.y;
  const shipDist = Math.sqrt(shipDx * shipDx + shipDy * shipDy);
  if (shipDist < minDist) {
    nearest = { target: ship, type: 'ship', distance: shipDist };
  }

  return nearest;
}

export function updatePirateAI(
  pirate: Pirate,
  turrets: Turret[],
  ship: Ship,
  currentTime: number
): { pirate: Pirate; attackTargetId?: string; attackTargetType?: 'turret' | 'ship' } {
  if (pirate.isDying) {
    return { pirate: { ...pirate, deathTimer: pirate.deathTimer - 16.67 } };
  }

  const updatedPirate = { ...pirate };
  let attackTargetId: string | undefined;
  let attackTargetType: 'turret' | 'ship' | undefined;

  const target = findNearestTarget(pirate, turrets, ship);

  if (target) {
    const dx = target.target.x - pirate.x;
    const dy = target.target.y - pirate.y;
    const dist = target.distance;
    updatedPirate.angle = Math.atan2(dy, dx);

    if (dist > pirate.range) {
      let speed = pirate.speed;
      if (pirate.slowTimer > 0) {
        speed *= 1 - pirate.slowAmount;
        updatedPirate.slowTimer -= 16.67;
      }
      updatedPirate.x += (dx / dist) * speed;
      updatedPirate.y += (dy / dist) * speed;
    } else {
      if (currentTime - pirate.lastAttackTime >= 1000) {
        updatedPirate.lastAttackTime = currentTime;
        attackTargetType = target.type;
        if (target.type === 'turret') {
          attackTargetId = (target.target as Turret).id;
        } else {
          attackTargetId = 'ship';
        }
      }
      if (pirate.slowTimer > 0) {
        updatedPirate.slowTimer -= 16.67;
      }
    }
  } else {
    if (pirate.slowTimer > 0) {
      updatedPirate.slowTimer -= 16.67;
    }
  }

  updatedPirate.targetType = target?.type || 'ship';
  if (target?.type === 'turret') {
    updatedPirate.targetId = (target.target as Turret).id;
  }

  return { pirate: updatedPirate, attackTargetId, attackTargetType };
}

export function calculatePath(
  start: Vector2,
  target: Vector2,
  obstacles: { x: number; y: number; radius: number }[]
): Vector2 {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return { x: 0, y: 0 };

  return { x: dx / dist, y: dy / dist };
}
