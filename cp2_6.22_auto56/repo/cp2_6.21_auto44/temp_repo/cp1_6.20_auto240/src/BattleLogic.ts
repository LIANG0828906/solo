import type { UnitData } from './Unit';
import { isInRange, applyKnockback, takeDamage } from './Unit';

export function findNearestEnemy(unit: UnitData, allUnits: UnitData[]): UnitData | null {
  let nearest: UnitData | null = null;
  let nearestDistSq = Infinity;
  for (const u of allUnits) {
    if (u.faction === unit.faction) continue;
    if (u.hp <= 0) continue;
    const dx = u.x - unit.x;
    const dy = u.y - unit.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = u;
    }
  }
  return nearest;
}

export function calculateDamage(attacker: UnitData, target: UnitData): number {
  const rawDamage = attacker.stats.attack;
  const defense = target.stats.defense;
  const damage = Math.max(1, rawDamage - defense * 0.5);
  return damage;
}

export interface AttackResult {
  targetKilled: boolean;
  splashHits: string[];
  knockbackApplied: boolean;
  damage: number;
}

export function performAttack(
  attacker: UnitData,
  target: UnitData,
  allUnits: UnitData[],
  now: number
): AttackResult {
  const damage = calculateDamage(attacker, target);
  const result: AttackResult = {
    targetKilled: false,
    splashHits: [],
    knockbackApplied: false,
    damage
  };

  result.targetKilled = takeDamage(target, damage, now);

  if (attacker.stats.knockback > 0) {
    applyKnockback(target, attacker.x, attacker.y, attacker.stats.knockback, now);
    result.knockbackApplied = true;
  }

  if (attacker.stats.splashRadius > 0) {
    const splashTargets = getSplashTargets(
      target.x,
      target.y,
      attacker.stats.splashRadius,
      allUnits,
      attacker.faction
    );
    for (const st of splashTargets) {
      if (st.id === target.id) continue;
      const splashDamage = damage * 0.5;
      takeDamage(st, splashDamage, now);
      result.splashHits.push(st.id);
    }
  }

  return result;
}

export function getSplashTargets(
  cx: number,
  cy: number,
  radius: number,
  allUnits: UnitData[],
  excludeFaction: string
): UnitData[] {
  const result: UnitData[] = [];
  const rSq = radius * radius;
  for (const u of allUnits) {
    if (u.faction === excludeFaction) continue;
    if (u.hp <= 0) continue;
    const dx = u.x - cx;
    const dy = u.y - cy;
    if (dx * dx + dy * dy <= rSq) {
      result.push(u);
    }
  }
  return result;
}

export function moveTowards(unit: UnitData, targetX: number, targetY: number, dt: number): void {
  const dx = targetX - unit.x;
  const dy = targetY - unit.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.5) return;
  const speed = unit.stats.moveSpeed * dt;
  if (dist <= speed) {
    unit.x = targetX;
    unit.y = targetY;
  } else {
    unit.x += (dx / dist) * speed;
    unit.y += (dy / dist) * speed;
  }
}

export function clampToArena(unit: UnitData, radius: number): void {
  const dist = Math.sqrt(unit.x * unit.x + unit.y * unit.y);
  const maxR = radius - 20;
  if (dist > maxR) {
    const scale = maxR / dist;
    unit.x *= scale;
    unit.y *= scale;
  }
}

export function updateKnockback(unit: UnitData, dt: number, now: number): void {
  if (now > unit.knockbackUntil) return;
  const remaining = (unit.knockbackUntil - now) / 150;
  const decay = Math.max(0, remaining);
  unit.x += unit.knockbackVelocity.x * dt * decay * 4;
  unit.y += unit.knockbackVelocity.y * dt * decay * 4;
}

export function canAttack(unit: UnitData, now: number): boolean {
  const cooldown = 1000 / unit.stats.attackSpeed;
  return now - unit.lastAttackTime >= cooldown;
}

export interface BattleStats {
  blueAlive: number;
  redAlive: number;
  totalKills: number;
}

export function computeStats(units: UnitData[]): BattleStats {
  let blueAlive = 0;
  let redAlive = 0;
  let totalKills = 0;
  for (const u of units) {
    if (u.hp > 0) {
      if (u.faction === 'blue') blueAlive++;
      else redAlive++;
    } else {
      totalKills++;
    }
  }
  return { blueAlive, redAlive, totalKills };
}
