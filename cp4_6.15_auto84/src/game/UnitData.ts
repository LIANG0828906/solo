export type ShipType = 'frigate' | 'cruiser' | 'battleship';

export type Faction = 'player' | 'enemy';

export type WeaponType = 'kinetic' | 'laser' | 'missile';

export interface Weapon {
  name: string;
  damage: number;
  range: number;
  type: WeaponType;
}

export interface Skill {
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
}

export interface UnitData {
  id: string;
  type: ShipType;
  faction: Faction;
  shield: number;
  maxShield: number;
  armor: number;
  maxArmor: number;
  weapons: Weapon[];
  skills: Skill[];
  speed: number;
  gridPos: { q: number; r: number };
  hasActed: boolean;
  isDestroyed: boolean;
}

export type TerrainType = 'empty' | 'nebula' | 'asteroid' | 'station';

export interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
  occupantId: string | null;
}

const SQRT3 = Math.sqrt(3);

export function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * (SQRT3 * q + SQRT3 / 2 * r);
  const y = size * (3 / 2 * r);
  return { x, y };
}

export function hexRound(q: number, r: number): { q: number; r: number } {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
}

export function pixelToAxial(x: number, y: number, size: number): { q: number; r: number } {
  const q = (SQRT3 / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return hexRound(q, r);
}

export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  const s1 = -q1 - r1;
  const s2 = -q2 - r2;
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
}

export function hexNeighbors(q: number, r: number): { q: number; r: number }[] {
  return [
    { q: q + 1, r: r },
    { q: q - 1, r: r },
    { q: q, r: r + 1 },
    { q: q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 },
  ];
}

export const SHIP_TEMPLATES: Record<ShipType, Omit<UnitData, 'id' | 'faction' | 'gridPos' | 'hasActed' | 'isDestroyed'>> = {
  frigate: {
    type: 'frigate',
    shield: 60,
    maxShield: 60,
    armor: 30,
    maxArmor: 30,
    speed: 4,
    weapons: [
      { name: '脉冲炮', damage: 15, range: 3, type: 'kinetic' },
      { name: '激光阵列', damage: 10, range: 4, type: 'laser' },
    ],
    skills: [
      { name: '闪避机动', description: '本回合闪避率提升50%', cooldown: 3, currentCooldown: 0 },
    ],
  },
  cruiser: {
    type: 'cruiser',
    shield: 100,
    maxShield: 100,
    armor: 60,
    maxArmor: 60,
    speed: 3,
    weapons: [
      { name: '重型激光', damage: 25, range: 4, type: 'laser' },
      { name: '导弹发射器', damage: 35, range: 5, type: 'missile' },
    ],
    skills: [
      { name: '护盾强化', description: '本回合护盾伤害减免50%', cooldown: 4, currentCooldown: 0 },
    ],
  },
  battleship: {
    type: 'battleship',
    shield: 150,
    maxShield: 150,
    armor: 100,
    maxArmor: 100,
    speed: 2,
    weapons: [
      { name: '主炮', damage: 45, range: 5, type: 'kinetic' },
      { name: '鱼雷阵列', damage: 55, range: 3, type: 'missile' },
    ],
    skills: [
      { name: '全弹齐射', description: '对所有相邻敌方单位造成30点伤害', cooldown: 5, currentCooldown: 0 },
    ],
  },
};

export function createUnit(
  id: string,
  type: ShipType,
  faction: Faction,
  gridPos: { q: number; r: number },
): UnitData {
  const template = SHIP_TEMPLATES[type];
  return {
    ...template,
    id,
    faction,
    gridPos,
    hasActed: false,
    isDestroyed: false,
  };
}
