export const TILE_SIZE = 32;
export const MAP_WIDTH = 25;
export const MAP_HEIGHT = 18;
export const PLAYER_SPEED = 60;
export const PLAYER_RADIUS = 12;

export enum TileType {
  WALL = 0,
  DIGGABLE = 1,
  COAL = 2,
  IRON = 3,
  GOLD = 4,
  DIAMOND = 5,
  EMPTY = 6,
}

export type OreType = 'coal' | 'iron' | 'gold' | 'diamond';
export type IngotType = 'steel' | 'ironIngot' | 'goldIngot' | 'diamondRaw';

export interface Player {
  x: number;
  y: number;
  speed: number;
  pickaxeLevel: number;
  lampLevel: number;
  backpackLevel: number;
}

export interface Inventory {
  coal: number;
  iron: number;
  gold: number;
  diamond: number;
  steel: number;
  ironIngot: number;
  goldIngot: number;
  diamondRaw: number;
}

export interface OreParticle {
  id: string;
  type: OreType;
  x: number;
  y: number;
  startX: number;
  startY: number;
  scatterOffsetX: number;
  scatterOffsetY: number;
  phase: 'scatter' | 'collect';
  startTime: number;
}

export interface MiningAnimation {
  id: string;
  tileX: number;
  tileY: number;
  startTime: number;
  duration: number;
}

export const TILE_COLORS: Record<TileType, string> = {
  [TileType.WALL]: '#3E2723',
  [TileType.DIGGABLE]: '#6D4C41',
  [TileType.COAL]: '#5D4037',
  [TileType.IRON]: '#5D4037',
  [TileType.GOLD]: '#5D4037',
  [TileType.DIAMOND]: '#5D4037',
  [TileType.EMPTY]: '#212121',
};

export const ORE_COLORS: Record<OreType, string> = {
  coal: '#424242',
  iron: '#A1887F',
  gold: '#FFD700',
  diamond: '#00BCD4',
};

export const ORE_SHAPES: Record<OreType, 'square' | 'triangle' | 'circle' | 'diamond'> = {
  coal: 'square',
  iron: 'triangle',
  gold: 'circle',
  diamond: 'diamond',
};

export const INGOT_COLORS: Record<IngotType, string> = {
  steel: '#B0BEC5',
  ironIngot: '#78909C',
  goldIngot: '#FFD700',
  diamondRaw: '#81D4FA',
};

export const ORE_TO_INGOT: Record<OreType, IngotType> = {
  coal: 'steel',
  iron: 'ironIngot',
  gold: 'goldIngot',
  diamond: 'diamondRaw',
};

export const ORE_TILE_MAP: Record<TileType, OreType | null> = {
  [TileType.WALL]: null,
  [TileType.DIGGABLE]: null,
  [TileType.COAL]: 'coal',
  [TileType.IRON]: 'iron',
  [TileType.GOLD]: 'gold',
  [TileType.DIAMOND]: 'diamond',
  [TileType.EMPTY]: null,
};

export const SOUND_FREQUENCIES: Record<OreType, number> = {
  coal: 261.63,
  iron: 293.66,
  gold: 329.63,
  diamond: 392.0,
};

export function generateMap(depth: number): TileType[][] {
  const map: TileType[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        row.push(TileType.WALL);
      } else {
        row.push(TileType.DIGGABLE);
      }
    }
    map.push(row);
  }

  const wallCount = Math.floor(MAP_WIDTH * MAP_HEIGHT * 0.25);
  for (let i = 0; i < wallCount; i++) {
    const x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
    const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
    if (x !== 1 || y !== 1) {
      map[y][x] = TileType.WALL;
    }
  }

  for (let i = 1; i < MAP_HEIGHT - 1; i++) {
    for (let j = 1; j < MAP_WIDTH - 1; j++) {
      if (map[i][j] === TileType.DIGGABLE) {
        const rand = Math.random();
        const coalChance = 0.15 + depth * 0.01;
        const ironChance = coalChance + 0.08 + depth * 0.02;
        const goldChance = ironChance + 0.04 + depth * 0.02;
        const diamondChance = goldChance + 0.02 + depth * 0.015;

        if (rand < coalChance) map[i][j] = TileType.COAL;
        else if (rand < ironChance) map[i][j] = TileType.IRON;
        else if (rand < goldChance) map[i][j] = TileType.GOLD;
        else if (rand < diamondChance) map[i][j] = TileType.DIAMOND;
      }
    }
  }

  map[1][1] = TileType.EMPTY;
  map[1][2] = TileType.EMPTY;
  map[2][1] = TileType.EMPTY;

  ensureConnectivity(map);

  return map;
}

function ensureConnectivity(map: TileType[][]): void {
  const visited = new Set<string>();
  const queue: [number, number][] = [[1, 1]];
  visited.add('1,1');

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      const key = `${nx},${ny}`;
      if (
        nx > 0 &&
        ny > 0 &&
        nx < MAP_WIDTH - 1 &&
        ny < MAP_HEIGHT - 1 &&
        !visited.has(key) &&
        map[ny][nx] !== TileType.WALL
      ) {
        visited.add(key);
        queue.push([nx, ny]);
      }
    }
  }

  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (map[y][x] !== TileType.WALL && !visited.has(`${x},${y}`)) {
        let curX = x;
        let curY = y;
        while (!visited.has(`${curX},${curY}`)) {
          map[curY][curX] = TileType.EMPTY;
          visited.add(`${curX},${curY}`);
          if (curX > 1 && !visited.has(`${curX - 1},${curY}`) && map[curY][curX - 1] === TileType.WALL) {
            curX--;
          } else if (curY > 1 && !visited.has(`${curX},${curY - 1}`) && map[curY - 1][curX] === TileType.WALL) {
            curY--;
          } else if (curX < MAP_WIDTH - 2 && !visited.has(`${curX + 1},${curY}`)) {
            curX++;
          } else if (curY < MAP_HEIGHT - 2 && !visited.has(`${curX},${curY + 1}`)) {
            curY++;
          } else {
            break;
          }
        }
      }
    }
  }
}

export function checkCollision(
  playerX: number,
  playerY: number,
  map: TileType[][]
): boolean {
  const tileX = Math.floor(playerX / TILE_SIZE);
  const tileY = Math.floor(playerY / TILE_SIZE);

  const checkPoints = [
    [playerX - PLAYER_RADIUS + 1, playerY],
    [playerX + PLAYER_RADIUS - 1, playerY],
    [playerX, playerY - PLAYER_RADIUS + 1],
    [playerX, playerY + PLAYER_RADIUS - 1],
  ];

  for (const [px, py] of checkPoints) {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return true;
    if (map[ty][tx] === TileType.WALL) return true;
  }

  return tileX < 0 || tileY < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT || map[tileY][tileX] === TileType.WALL;
}

export function getTileAtPosition(
  x: number,
  y: number,
  map: TileType[][]
): TileType | null {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  if (tileX < 0 || tileY < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) {
    return null;
  }
  return map[tileY][tileX];
}

export function isDiggable(tile: TileType): boolean {
  return (
    tile === TileType.DIGGABLE ||
    tile === TileType.COAL ||
    tile === TileType.IRON ||
    tile === TileType.GOLD ||
    tile === TileType.DIAMOND
  );
}

export function createOreParticles(
  tileX: number,
  tileY: number,
  oreType: OreType,
  now: number
): OreParticle[] {
  const particles: OreParticle[] = [];
  const count = oreType === 'diamond' ? 5 : oreType === 'gold' ? 4 : 3;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 20 + Math.random() * 20;
    particles.push({
      id: `${now}-${tileX}-${tileY}-${i}-${Math.random()}`,
      type: oreType,
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
      startX: tileX * TILE_SIZE + TILE_SIZE / 2,
      startY: tileY * TILE_SIZE + TILE_SIZE / 2,
      scatterOffsetX: Math.cos(angle) * dist,
      scatterOffsetY: Math.sin(angle) * dist,
      phase: 'scatter',
      startTime: now,
    });
  }

  return particles;
}

export function playMiningSound(type: OreType): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = SOUND_FREQUENCIES[type];

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);

    setTimeout(() => {
      ctx.close();
    }, 200);
  } catch (e) {
    // Audio not supported
  }
}

export function getUpgradeCost(
  level: number
): { steel: number; ironIngot: number; goldIngot: number; diamondRaw: number } {
  return {
    steel: Math.floor(level * 1.5),
    ironIngot: level,
    goldIngot: Math.floor(level * 0.5),
    diamondRaw: Math.floor(level * 0.3),
  };
}

export function canAfford(
  inventory: Inventory,
  cost: { steel: number; ironIngot: number; goldIngot: number; diamondRaw: number }
): boolean {
  return (
    inventory.steel >= cost.steel &&
    inventory.ironIngot >= cost.ironIngot &&
    inventory.goldIngot >= cost.goldIngot &&
    inventory.diamondRaw >= cost.diamondRaw
  );
}
