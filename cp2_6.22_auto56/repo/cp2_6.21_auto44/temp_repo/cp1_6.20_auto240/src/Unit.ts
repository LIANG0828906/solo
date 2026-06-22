export type Faction = 'blue' | 'red';
export type UnitType = 'swordsman' | 'archer' | 'cavalry' | 'mage';

export interface UnitStats {
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
  splashRadius: number;
  knockback: number;
  skillCooldown: number;
}

export interface UnitData {
  id: string;
  faction: Faction;
  type: UnitType;
  x: number;
  y: number;
  renderX: number;
  renderY: number;
  hp: number;
  stats: UnitStats;
  targetId: string | null;
  lastAttackTime: number;
  flashUntil: number;
  knockbackUntil: number;
  knockbackVelocity: { x: number; y: number };
  spawnTime: number;
  damageNumbers: { value: number; time: number; y: number }[];
}

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  swordsman: {
    maxHp: 150,
    attack: 20,
    defense: 10,
    attackSpeed: 1.0,
    moveSpeed: 60,
    range: 25,
    splashRadius: 0,
    knockback: 0,
    skillCooldown: 5
  },
  archer: {
    maxHp: 70,
    attack: 10,
    defense: 3,
    attackSpeed: 2.5,
    moveSpeed: 50,
    range: 150,
    splashRadius: 0,
    knockback: 0,
    skillCooldown: 4
  },
  cavalry: {
    maxHp: 100,
    attack: 25,
    defense: 6,
    attackSpeed: 0.8,
    moveSpeed: 120,
    range: 30,
    splashRadius: 0,
    knockback: 40,
    skillCooldown: 6
  },
  mage: {
    maxHp: 60,
    attack: 18,
    defense: 2,
    attackSpeed: 0.7,
    moveSpeed: 45,
    range: 120,
    splashRadius: 50,
    knockback: 0,
    skillCooldown: 8
  }
};

export const UNIT_COLORS: Record<UnitType, number> = {
  swordsman: 0x757575,
  archer: 0x388e3c,
  cavalry: 0xfbc02d,
  mage: 0x8e24aa
};

export const UNIT_LABELS: Record<UnitType, string> = {
  swordsman: '剑士',
  archer: '弓箭手',
  cavalry: '骑兵',
  mage: '法师'
};

let unitIdCounter = 0;

export function createUnit(
  faction: Faction,
  type: UnitType,
  x: number,
  y: number
): UnitData {
  const stats = { ...UNIT_STATS[type] };
  unitIdCounter += 1;
  return {
    id: `unit_${Date.now()}_${unitIdCounter}`,
    faction,
    type,
    x,
    y,
    renderX: x,
    renderY: y,
    hp: stats.maxHp,
    stats,
    targetId: null,
    lastAttackTime: 0,
    flashUntil: 0,
    knockbackUntil: 0,
    knockbackVelocity: { x: 0, y: 0 },
    spawnTime: performance.now(),
    damageNumbers: []
  };
}

export function resetUnitIdCounter(): void {
  unitIdCounter = 0;
}

export function getHpColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return '#4caf50';
  if (ratio > 0.3) return '#ff9800';
  return '#f44336';
}

export function getHpColorNum(hp: number, maxHp: number): number {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return 0x4caf50;
  if (ratio > 0.3) return 0xff9800;
  return 0xf44336;
}

export function moveTo(unit: UnitData, targetX: number, targetY: number, dt: number): void {
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

export function takeDamage(unit: UnitData, damage: number, now: number): boolean {
  unit.hp -= damage;
  unit.flashUntil = now + 100;
  unit.damageNumbers.push({ value: Math.round(damage), time: now, y: 0 });
  return unit.hp <= 0;
}

export function isInRange(attacker: UnitData, target: UnitData): boolean {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const distSq = dx * dx + dy * dy;
  const r = attacker.stats.range;
  return distSq <= r * r;
}

export function applyKnockback(
  unit: UnitData,
  sourceX: number,
  sourceY: number,
  force: number,
  now: number
): void {
  const dx = unit.x - sourceX;
  const dy = unit.y - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  unit.knockbackVelocity.x = (dx / dist) * force;
  unit.knockbackVelocity.y = (dy / dist) * force;
  unit.knockbackUntil = now + 150;
}
