import { v4 as uuidv4 } from 'uuid';
import type { Position } from './maze';
import type { Monster } from './monster';

export type RuneType = 'fire' | 'ice' | 'lightning';

export interface Rune {
  id: string;
  type: RuneType;
  position: Position;
  damage: number;
  range: number;
  cooldown: number;
  lastAttack: number;
  slowAmount?: number;
  slowDuration?: number;
  chainCount?: number;
  chainRange?: number;
}

export const RUNE_CONFIG: Record<RuneType, {
  damage: number;
  range: number;
  cooldown: number;
  color: string;
  name: string;
  description: string;
  slowAmount?: number;
  slowDuration?: number;
  chainCount?: number;
  chainRange?: number;
}> = {
  fire: {
    damage: 30,
    range: 1.5,
    cooldown: 1000,
    color: '#FF4500',
    name: '火焰符文',
    description: '高伤害，短射程',
  },
  ice: {
    damage: 15,
    range: 2,
    cooldown: 1200,
    color: '#00BFFF',
    name: '冰冻符文',
    description: '减速敌人移动',
    slowAmount: 0.5,
    slowDuration: 2000,
  },
  lightning: {
    damage: 20,
    range: 2.5,
    cooldown: 1500,
    color: '#FFD700',
    name: '闪电符文',
    description: '链式伤害多个敌人',
    chainCount: 3,
    chainRange: 2,
  },
};

export function createRune(type: RuneType, position: Position): Rune {
  const config = RUNE_CONFIG[type];
  return {
    id: uuidv4(),
    type,
    position: { ...position },
    damage: config.damage,
    range: config.range,
    cooldown: config.cooldown,
    lastAttack: 0,
    slowAmount: config.slowAmount,
    slowDuration: config.slowDuration,
    chainCount: config.chainCount,
    chainRange: config.chainRange,
  };
}

export function canAttack(rune: Rune, currentTime: number): boolean {
  return currentTime - rune.lastAttack >= rune.cooldown;
}

function getDistance(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function findTargetsInRange(
  rune: Rune,
  monsters: Monster[],
  doubleEffect: boolean
): Monster[] {
  const range = doubleEffect ? rune.range * 1.5 : rune.range;
  return monsters.filter(
    (m) => m.status === 'alive' && getDistance(rune.position, m.position) <= range
  );
}

export function calculateDamage(
  rune: Rune,
  monster: Monster,
  doubleEffect: boolean
): { damage: number; slowAmount: number; slowDuration: number } {
  const damageMultiplier = doubleEffect ? 2 : 1;
  return {
    damage: rune.damage * damageMultiplier,
    slowAmount: rune.slowAmount || 0,
    slowDuration: rune.slowDuration || 0,
  };
}

export function findChainTargets(
  rune: Rune,
  primaryTarget: Monster,
  monsters: Monster[],
  doubleEffect: boolean
): Monster[] {
  if (!rune.chainCount || !rune.chainRange) return [];

  const chainCount = doubleEffect ? rune.chainCount * 2 : rune.chainCount;
  const chainRange = doubleEffect ? rune.chainRange * 1.5 : rune.chainRange;
  const targeted: Set<string> = new Set([primaryTarget.id]);
  const chainTargets: Monster[] = [];
  let currentTarget: Monster | null = primaryTarget;

  for (let i = 0; i < chainCount && currentTarget; i++) {
    let nearest: Monster | null = null;
    let nearestDist = Infinity;

    for (const monster of monsters) {
      if (
        monster.status !== 'alive' ||
        targeted.has(monster.id) ||
        monster.id === currentTarget.id
      )
        continue;

      const dist = getDistance(currentTarget.position, monster.position);
      if (dist <= chainRange && dist < nearestDist) {
        nearest = monster;
        nearestDist = dist;
      }
    }

    if (nearest) {
      chainTargets.push(nearest);
      targeted.add(nearest.id);
      currentTarget = nearest;
    } else {
      break;
    }
  }

  return chainTargets;
}
