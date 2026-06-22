import { Turret, TurretType, Pirate, Projectile, TURRET_CONFIG, Vector2 } from './types';
import { v4 as uuidv4 } from 'uuid';

export function createTurret(x: number, y: number, type: TurretType): Turret {
  const config = TURRET_CONFIG[type];
  return {
    id: uuidv4(),
    x,
    y,
    type,
    health: 100,
    maxHealth: 100,
    range: config.range,
    fireRate: config.fireRate,
    damage: config.damage,
    lastFireTime: 0,
    flashTimer: 0,
    angle: 0,
  };
}

export function findNearestPirate(
  turret: Turret,
  pirates: Pirate[]
): Pirate | null {
  let nearest: Pirate | null = null;
  let minDist = Infinity;

  for (const pirate of pirates) {
    if (pirate.isDying) continue;
    const dx = pirate.x - turret.x;
    const dy = pirate.y - turret.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= turret.range && dist < minDist) {
      minDist = dist;
      nearest = pirate;
    }
  }

  return nearest;
}

export function updateTurret(
  turret: Turret,
  pirates: Pirate[],
  currentTime: number
): { turret: Turret; projectiles: Projectile[] } {
  const newProjectiles: Projectile[] = [];
  const updatedTurret = { ...turret };

  if (updatedTurret.flashTimer > 0) {
    updatedTurret.flashTimer -= 16.67;
  }

  const target = findNearestPirate(turret, pirates);

  if (target) {
    const dx = target.x - turret.x;
    const dy = target.y - turret.y;
    updatedTurret.angle = Math.atan2(dy, dx);

    if (currentTime - turret.lastFireTime >= turret.fireRate) {
      updatedTurret.lastFireTime = currentTime;
      const projectile = createProjectile(turret, target);
      newProjectiles.push(projectile);
    }
  }

  return { turret: updatedTurret, projectiles: newProjectiles };
}

function createProjectile(turret: Turret, target: Pirate): Projectile {
  const config = TURRET_CONFIG[turret.type];
  const dx = target.x - turret.x;
  const dy = target.y - turret.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = turret.type === 'missile' ? 4 : turret.type === 'em' ? 8 : 12;

  return {
    id: uuidv4(),
    x: turret.x,
    y: turret.y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    damage: turret.damage,
    type: turret.type,
    targetId: target.id,
    aoeRadius: config.aoeRadius,
    slowEffect: config.slowEffect,
    slowDuration: config.slowDuration,
    life: 3000,
  };
}

export function updateProjectiles(
  projectiles: Projectile[],
  pirates: Pirate[],
  deltaTime: number
): {
  projectiles: Projectile[];
  damagedPirates: { pirateId: string; damage: number; slowEffect?: number; slowDuration?: number; aoeCenter?: Vector2; aoeRadius?: number }[];
} {
  const updatedProjectiles: Projectile[] = [];
  const damagedPirates: { pirateId: string; damage: number; slowEffect?: number; slowDuration?: number; aoeCenter?: Vector2; aoeRadius?: number }[] = [];

  for (const proj of projectiles) {
    let hit = false;
    const newProj = { ...proj };
    newProj.x += newProj.vx;
    newProj.y += newProj.vy;
    newProj.life -= deltaTime;

    if (newProj.life <= 0) continue;

    for (const pirate of pirates) {
      if (pirate.isDying) continue;
      const dx = pirate.x - newProj.x;
      const dy = pirate.y - newProj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        hit = true;
        if (newProj.aoeRadius) {
          damagedPirates.push({
            pirateId: pirate.id,
            damage: newProj.damage,
            aoeCenter: { x: newProj.x, y: newProj.y },
            aoeRadius: newProj.aoeRadius,
          });
        } else {
          damagedPirates.push({
            pirateId: pirate.id,
            damage: newProj.damage,
            slowEffect: newProj.slowEffect,
            slowDuration: newProj.slowDuration,
          });
        }
        break;
      }
    }

    if (!hit) {
      updatedProjectiles.push(newProj);
    }
  }

  return { projectiles: updatedProjectiles, damagedPirates };
}

export function applyAoeDamage(
  pirates: Pirate[],
  center: Vector2,
  radius: number,
  damage: number
): Pirate[] {
  return pirates.map((pirate) => {
    if (pirate.isDying) return pirate;
    const dx = pirate.x - center.x;
    const dy = pirate.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius) {
      return { ...pirate, health: pirate.health - damage };
    }
    return pirate;
  });
}
