export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'dark';
export type TerrainType = 'normal' | 'lava' | 'ice' | 'wind' | 'stone' | 'light' | 'shadow';
export type WeatherType = 'sunny' | 'rainy' | 'stormy' | 'calm';

export interface HexCoord {
  q: number;
  r: number;
}

export interface TerrainEffect {
  damage?: number;
  moveCost?: number;
  dodge?: number;
  defense?: number;
  heal?: number;
  attack?: number;
  hpLoss?: number;
}

export interface Terrain {
  type: TerrainType;
  position: HexCoord;
  effect: TerrainEffect;
}

export const HEX_SIZE = 40;
export const BOARD_SIZE = 6;

const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const TERRAIN_CONFIG: Record<TerrainType, {
  colors: [string, string];
  effect: TerrainEffect;
  name: string;
}> = {
  normal: {
    colors: ['#D4A574', '#D4A574'],
    effect: {},
    name: '普通'
  },
  lava: {
    colors: ['#FF6B35', '#8B2500'],
    effect: { damage: 5 },
    name: '熔岩'
  },
  ice: {
    colors: ['#A8D8EA', '#6EBFDB'],
    effect: { moveCost: 0.5 },
    name: '冰面'
  },
  wind: {
    colors: ['#C9E4C5', '#8CC084'],
    effect: { dodge: 0.2 },
    name: '风场'
  },
  stone: {
    colors: ['#B0A8A0', '#7D756D'],
    effect: { defense: 3 },
    name: '石林'
  },
  light: {
    colors: ['#FFFACD', '#FFD700'],
    effect: { heal: 5 },
    name: '圣光'
  },
  shadow: {
    colors: ['#4A4A5A', '#2A2A3A'],
    effect: { attack: 2, hpLoss: 3 },
    name: '暗影'
  }
};

export const WEATHER_CONFIG: Record<WeatherType, { name: string; modifier: number }> = {
  sunny: { name: '晴朗', modifier: 1 },
  rainy: { name: '阴雨', modifier: 0.5 },
  stormy: { name: '风暴', modifier: 2 },
  calm: { name: '平静', modifier: 1 }
};

export function hexToPixel(hex: HexCoord, size: number = HEX_SIZE): { x: number; y: number } {
  const x = size * (3 / 2 * hex.q);
  const y = size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
  return { x, y };
}

export function pixelToHex(x: number, y: number, size: number = HEX_SIZE): HexCoord {
  const q = (2 / 3 * x) / size;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
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

export function getHexCorners(center: { x: number; y: number }, size: number = HEX_SIZE): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle)
    });
  }
  return corners;
}

export function getNeighbors(hex: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r
  }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function isInBoard(hex: HexCoord, size: number = BOARD_SIZE): boolean {
  return hex.q >= 0 && hex.q < size && hex.r >= 0 && hex.r < size;
}

export function generateTerrainBoard(boardSize: number = BOARD_SIZE): Terrain[][] {
  const terrainTypes: TerrainType[] = ['lava', 'ice', 'wind', 'stone', 'light', 'shadow', 'normal', 'normal'];
  const board: Terrain[][] = [];

  for (let q = 0; q < boardSize; q++) {
    const row: Terrain[] = [];
    for (let r = 0; r < boardSize; r++) {
      const type = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
      const config = TERRAIN_CONFIG[type];
      row.push({
        type,
        position: { q, r },
        effect: { ...config.effect }
      });
    }
    board.push(row);
  }

  return board;
}

export function getRandomWeather(): WeatherType {
  const weathers: WeatherType[] = ['sunny', 'rainy', 'stormy', 'calm'];
  return weathers[Math.floor(Math.random() * weathers.length)];
}

export function hexEquals(a: HexCoord | null, b: HexCoord | null): boolean {
  if (!a || !b) return false;
  return a.q === b.q && a.r === b.r;
}

export function getHexKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}
