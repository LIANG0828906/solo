import type { HexCoord, TowerConfig, MonsterConfig, WaveConfig, TowerType, TowerLevel } from './types';

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 8;
export const HEX_SIZE = 36;
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const MAX_PARTICLES = 200;
export const INITIAL_LIVES = 10;
export const INITIAL_ENERGY = 150;
export const TOTAL_WAVES = 10;
export const WAVE_PREP_TIME = 5;
export const TRAIL_LENGTH = 8;
export const UPGRADE_MULTIPLIER = 1.2;
export const SELL_REFUND_RATIO = 0.7;

export const COLORS = {
  backgroundStart: '#0a0a2e',
  backgroundEnd: '#1a1a4e',
  gridDefault: '#2a2a4e',
  gridHover: '#3a3a6e',
  path: '#f0d060',
  pathBorder: '#c0a040',
  health: '#ff4060',
  energy: '#40fff0',
  text: '#ffffff',
  textSecondary: '#a0a0c0',
  panelBg: 'rgba(20, 20, 50, 0.85)',
  panelBorder: 'rgba(100, 100, 180, 0.5)',
  buttonBg: 'rgba(60, 60, 120, 0.9)',
  buttonHover: 'rgba(80, 80, 160, 0.9)',
  buttonDisabled: 'rgba(40, 40, 80, 0.6)',
  warning: '#ff4040',
} as const;

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  frost: {
    name: '冰霜塔',
    cost: 50,
    damage: 20,
    range: 2.5,
    cooldown: 1.2,
    color: '#60d0ff',
    darkColor: '#2080c0',
    effect: { type: 'slow', factor: 0.5, duration: 2 },
    upgradeCosts: [30, 50, 70]
  },
  fire: {
    name: '火焰塔',
    cost: 70,
    damage: 40,
    range: 2,
    cooldown: 2,
    color: '#ff6040',
    darkColor: '#c03020',
    effect: { type: 'burn', damagePerSecond: 10, duration: 3, aoeRadius: 2 },
    upgradeCosts: [30, 50, 70]
  },
  lightning: {
    name: '雷电塔',
    cost: 90,
    damage: 80,
    range: 3,
    cooldown: 2.5,
    color: '#c060ff',
    darkColor: '#8030a0',
    effect: { type: 'stun', chance: 0.2, duration: 1 },
    upgradeCosts: [30, 50, 70]
  }
};

export function getTowerDamage(type: TowerType, level: TowerLevel): number {
  const base = TOWER_CONFIGS[type].damage;
  return Math.floor(base * Math.pow(UPGRADE_MULTIPLIER, level - 1));
}

export function getTowerRange(type: TowerType, level: TowerLevel): number {
  const base = TOWER_CONFIGS[type].range;
  return base * Math.pow(UPGRADE_MULTIPLIER, level - 1);
}

export function getTowerUpgradeCost(type: TowerType, currentLevel: TowerLevel): number | null {
  if (currentLevel >= 3) return null;
  return TOWER_CONFIGS[type].upgradeCosts[currentLevel - 1];
}

export function getTowerSellValue(type: TowerType, level: TowerLevel): number {
  let totalCost = TOWER_CONFIGS[type].cost;
  for (let i = 1; i < level; i++) {
    totalCost += TOWER_CONFIGS[type].upgradeCosts[i - 1];
  }
  return Math.floor(totalCost * SELL_REFUND_RATIO);
}

export const MONSTER_CONFIGS: Record<'normal' | 'elite', MonsterConfig> = {
  normal: {
    health: 100,
    speed: 1.5,
    reward: 5,
    resistances: { frost: 0, fire: 0, lightning: 0, none: 0 }
  },
  elite: {
    health: 300,
    speed: 1.2,
    reward: 15,
    resistances: { frost: 0.3, fire: 0.3, lightning: 0.3, none: 0 }
  }
};

export const WAVE_CONFIGS: WaveConfig[] = Array.from({ length: TOTAL_WAVES }, (_, i) => ({
  waveNumber: i + 1,
  monsterCount: 5 + i,
  spawnInterval: 1,
  eliteChance: Math.min(0.1 + i * 0.05, 0.5),
  healthMultiplier: 1 + i * 0.15,
  speedMultiplier: 1 + i * 0.03
}));

export const DEFAULT_PATH: HexCoord[] = [
  { q: 0, r: 3 },
  { q: 1, r: 3 },
  { q: 2, r: 3 },
  { q: 2, r: 4 },
  { q: 3, r: 4 },
  { q: 4, r: 4 },
  { q: 4, r: 3 },
  { q: 4, r: 2 },
  { q: 5, r: 2 },
  { q: 6, r: 2 },
  { q: 6, r: 3 },
  { q: 6, r: 4 },
  { q: 6, r: 5 },
  { q: 7, r: 5 },
  { q: 8, r: 5 },
  { q: 8, r: 4 },
  { q: 9, r: 4 },
];

export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
  const y = size * (3 / 2 * hex.r);
  return { x, y };
}

export function pixelToHex(x: number, y: number, size: number): HexCoord {
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return hexRound({ q, r });
}

export function hexRound(hex: { q: number; r: number }): HexCoord {
  const s = -hex.q - hex.r;
  let rq = Math.round(hex.q);
  let rr = Math.round(hex.r);
  const rs = Math.round(s);
  
  const qDiff = Math.abs(rq - hex.q);
  const rDiff = Math.abs(rr - hex.r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  
  return { q: rq, r: rr };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function getHexCorners(cx: number, cy: number, size: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: cx + size * Math.cos(angle),
      y: cy + size * Math.sin(angle)
    });
  }
  return corners;
}

export function isOnPath(hex: HexCoord, path: HexCoord[]): boolean {
  return path.some(p => p.q === hex.q && p.r === hex.r);
}

export function getGridOffset(): { x: number; y: number } {
  const gridPixelWidth = HEX_SIZE * (Math.sqrt(3) * GRID_WIDTH + Math.sqrt(3) / 2);
  const gridPixelHeight = HEX_SIZE * (3 / 2 * GRID_HEIGHT + 1);
  return {
    x: (CANVAS_WIDTH - gridPixelWidth) / 2 + HEX_SIZE * Math.sqrt(3) / 2,
    y: (CANVAS_HEIGHT - gridPixelHeight) / 2 + HEX_SIZE
  };
}

export function getPositionOnPath(progress: number, path: HexCoord[], hexSize: number): { x: number; y: number } {
  const totalSegments = path.length - 1;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const segment = Math.min(Math.floor(clampedProgress * totalSegments), totalSegments - 1);
  const segmentProgress = (clampedProgress * totalSegments) - segment;
  
  const start = hexToPixel(path[segment], hexSize);
  const end = hexToPixel(path[segment + 1], hexSize);
  
  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
