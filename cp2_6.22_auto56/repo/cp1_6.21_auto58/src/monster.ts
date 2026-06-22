import { v4 as uuidv4 } from 'uuid';
import type { Position } from './maze';

export type MonsterStatus = 'alive' | 'dead' | 'reached';

export interface Monster {
  id: string;
  position: Position;
  path: Position[];
  pathIndex: number;
  health: number;
  maxHealth: number;
  speed: number;
  status: MonsterStatus;
  slowEffect: number;
  slowEndTime: number;
}

const BASE_HEALTH = 100;
const BASE_SPEED = 1.5;

export function createMonster(
  path: Position[],
  healthMultiplier: number = 1
): Monster {
  return {
    id: uuidv4(),
    position: { ...path[0] },
    path,
    pathIndex: 0,
    health: BASE_HEALTH * healthMultiplier,
    maxHealth: BASE_HEALTH * healthMultiplier,
    speed: BASE_SPEED,
    status: 'alive',
    slowEffect: 1,
    slowEndTime: 0,
  };
}

export function updateMonster(
  monster: Monster,
  deltaTime: number,
  currentTime: number
): { moved: boolean; reachedEnd: boolean } {
  if (monster.status !== 'alive') {
    return { moved: false, reachedEnd: false };
  }

  if (currentTime > monster.slowEndTime) {
    monster.slowEffect = 1;
  }

  if (monster.pathIndex >= monster.path.length - 1) {
    monster.status = 'reached';
    return { moved: false, reachedEnd: true };
  }

  const target = monster.path[monster.pathIndex + 1];
  const dx = target.x - monster.position.x;
  const dy = target.y - monster.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.05) {
    monster.position.x = target.x;
    monster.position.y = target.y;
    monster.pathIndex++;
    return { moved: true, reachedEnd: false };
  }

  const effectiveSpeed = monster.speed * monster.slowEffect;
  const moveDistance = effectiveSpeed * (deltaTime / 1000);
  const ratio = Math.min(moveDistance / distance, 1);

  monster.position.x += dx * ratio;
  monster.position.y += dy * ratio;

  return { moved: true, reachedEnd: false };
}

export function damageMonster(
  monster: Monster,
  damage: number
): { killed: boolean } {
  if (monster.status !== 'alive') {
    return { killed: false };
  }

  monster.health -= damage;

  if (monster.health <= 0) {
    monster.health = 0;
    monster.status = 'dead';
    return { killed: true };
  }

  return { killed: false };
}

export function applySlowEffect(
  monster: Monster,
  slowAmount: number,
  duration: number,
  currentTime: number
): void {
  if (monster.status !== 'alive') return;

  const newSlowEffect = 1 - slowAmount;
  if (newSlowEffect < monster.slowEffect) {
    monster.slowEffect = newSlowEffect;
  }
  monster.slowEndTime = Math.max(monster.slowEndTime, currentTime + duration);
}

export function getMonsterColor(monster: Monster): string {
  const healthPercent = monster.health / monster.maxHealth;
  if (healthPercent > 0.6) return '#2ECC71';
  if (healthPercent > 0.3) return '#E74C3C';
  return '#F1C40F';
}
