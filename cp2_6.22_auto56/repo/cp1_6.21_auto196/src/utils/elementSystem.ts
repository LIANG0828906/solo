export type ElementType = 'fire' | 'water' | 'wind' | 'earth';

export type TerrainType = 'normal' | 'grass' | 'lava';

export interface HexCoord {
  q: number;
  r: number;
}

export interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun';
  duration: number;
  startTime: number;
}

export interface Rune {
  id: string;
  element: ElementType;
  position: HexCoord;
  placedAt: number;
}

export interface Enemy {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  progress: number;
  position: { x: number; y: number };
  statusEffects: StatusEffect[];
}

export interface ComboEffect {
  id: string;
  position: HexCoord;
  type: ElementType;
  comboType: string;
  startTime: number;
  duration: number;
  radius: number;
  damage: number;
  statusType?: 'burn' | 'freeze' | 'stun';
  statusDuration?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  wind: '#10B981',
  earth: '#F59E0B',
};

export const ELEMENT_SYMBOLS: Record<ElementType, string> = {
  fire: '▲',
  water: '◆',
  wind: '✦',
  earth: '■',
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  normal: 'transparent',
  grass: '#4ADE80',
  lava: '#DC2626',
};

const SQRT3 = Math.sqrt(3);

export function hexToPixel(
  coord: HexCoord,
  hexSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number } {
  const x = hexSize * SQRT3 * (coord.q + coord.r / 2) + offsetX;
  const y = hexSize * 1.5 * coord.r + offsetY;
  return { x, y };
}

export function pixelToHex(
  x: number,
  y: number,
  hexSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): HexCoord {
  const px = x - offsetX;
  const py = y - offsetY;
  const q = ((SQRT3 / 3) * px - (1 / 3) * py) / hexSize;
  const r = ((2 / 3) * py) / hexSize;
  return hexRound({ q, r });
}

function hexRound(coord: { q: number; r: number }): HexCoord {
  const s = -coord.q - coord.r;
  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  let rs = Math.round(s);
  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
}

export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function getNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((dir) => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

export function areNeighbors(a: HexCoord, b: HexCoord): boolean {
  return distanceBetweenHex(a, b) === 1;
}

export function distanceBetweenHex(a: HexCoord, b: HexCoord): number {
  return (
    (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2
  );
}

export function getComboType(
  elements: ElementType[]
): {
  name: string;
  damage: number;
  duration: number;
  radius: number;
  statusType?: 'burn' | 'freeze' | 'stun';
  statusDuration?: number;
} | null {
  const counts: Record<ElementType, number> = {
    fire: 0,
    water: 0,
    wind: 0,
    earth: 0,
  };
  elements.forEach((e) => (counts[e] += 1));

  if (counts.fire >= 1 && counts.wind >= 1) {
    return {
      name: '扩散燃烧',
      damage: 40,
      duration: 2000,
      radius: 1.8,
      statusType: 'burn',
      statusDuration: 3000,
    };
  }
  if (counts.water >= 1 && counts.earth >= 1) {
    return {
      name: '生长障碍',
      damage: 25,
      duration: 2000,
      radius: 1.5,
      statusType: 'stun',
      statusDuration: 1000,
    };
  }
  if (counts.water >= 1 && counts.wind >= 1) {
    return {
      name: '冰霜风暴',
      damage: 20,
      duration: 2000,
      radius: 1.5,
      statusType: 'freeze',
      statusDuration: 2000,
    };
  }
  if (counts.fire >= 1 && counts.earth >= 1) {
    return {
      name: '熔岩喷发',
      damage: 60,
      duration: 2000,
      radius: 1.2,
      statusType: 'stun',
      statusDuration: 500,
    };
  }
  if (counts.fire >= 2) {
    return {
      name: '烈焰强化',
      damage: 35,
      duration: 2000,
      radius: 1.5,
      statusType: 'burn',
      statusDuration: 3000,
    };
  }
  if (counts.water >= 2) {
    return {
      name: '潮汐涌动',
      damage: 30,
      duration: 2000,
      radius: 2.0,
      statusType: 'freeze',
      statusDuration: 2000,
    };
  }
  if (counts.wind >= 2) {
    return {
      name: '飓风加速',
      damage: 15,
      duration: 2000,
      radius: 2.5,
    };
  }
  if (counts.earth >= 2) {
    return {
      name: '岩石崩塌',
      damage: 70,
      duration: 2000,
      radius: 1.2,
      statusType: 'stun',
      statusDuration: 1500,
    };
  }

  return null;
}

export function createParticles(
  x: number,
  y: number,
  element: ElementType,
  count: number = 4
): Particle[] {
  const color = ELEMENT_COLORS[element];
  const particles: Particle[] = [];

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 0.5 + Math.random() * 1.5;
    particles.push({
      id: `p-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 3,
    });
  }

  return particles;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTerrainModifier(
  terrain: TerrainType,
  element?: ElementType
): { speedMultiplier: number; damageMultiplier: number } {
  if (terrain === 'grass') {
    if (element === 'water' || element === 'earth') {
      return { speedMultiplier: 0.8, damageMultiplier: 1.3 };
    }
    return { speedMultiplier: 0.8, damageMultiplier: 1.0 };
  }
  if (terrain === 'lava') {
    if (element === 'fire') {
      return { speedMultiplier: 1.3, damageMultiplier: 1.5 };
    }
    return { speedMultiplier: 1.3, damageMultiplier: 1.0 };
  }
  return { speedMultiplier: 1.0, damageMultiplier: 1.0 };
}
