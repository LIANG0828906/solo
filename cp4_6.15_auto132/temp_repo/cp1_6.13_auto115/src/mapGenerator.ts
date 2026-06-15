import { TileType, MapTile, GameMap, MAP_SIZE } from './types';

const OBSTACLE_COUNT = 20;
const COVER_COUNT = 15;
const TRAP_COUNT = 10;
const CHEST_COUNT = 5;

function createEmptyTile(): MapTile {
  return {
    type: TileType.EMPTY,
    revealed: false,
    trapTriggered: false,
    chestCollected: false,
    trapEffectTimer: 0
  };
}

function createEmptyMap(): GameMap {
  const map: GameMap = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      map[y][x] = createEmptyTile();
    }
  }
  return map;
}

function getEmptyPositions(map: GameMap): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x].type === TileType.EMPTY) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

function isNearCorner(x: number, y: number, distance: number = 3): boolean {
  return (x < distance || x >= MAP_SIZE - distance) &&
         (y < distance || y >= MAP_SIZE - distance);
}

function isSpawnArea(x: number, y: number): boolean {
  const player1Spawn = { x: 1, y: 1 };
  const player2Spawn = { x: MAP_SIZE - 2, y: MAP_SIZE - 2 };
  const dist1 = Math.abs(x - player1Spawn.x) + Math.abs(y - player1Spawn.y);
  const dist2 = Math.abs(x - player2Spawn.x) + Math.abs(y - player2Spawn.y);
  return dist1 <= 2 || dist2 <= 2;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function placeElements(
  map: GameMap,
  type: TileType,
  count: number,
  excludeSpawns: boolean = true,
  excludeCorners: boolean = false
): void {
  let emptyPositions = getEmptyPositions(map);

  if (excludeSpawns) {
    emptyPositions = emptyPositions.filter(p => !isSpawnArea(p.x, p.y));
  }

  if (excludeCorners) {
    emptyPositions = emptyPositions.filter(p => !isNearCorner(p.x, p.y));
  }

  const shuffled = shuffleArray(emptyPositions);
  const toPlace = shuffled.slice(0, Math.min(count, shuffled.length));

  for (const pos of toPlace) {
    map[pos.y][pos.x].type = type;
  }
}

function revealArea(map: GameMap, centerX: number, centerY: number, radius: number): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
        if (Math.abs(dx) + Math.abs(dy) <= radius) {
          map[y][x].revealed = true;
        }
      }
    }
  }
}

export function generateMap(): GameMap {
  const map = createEmptyMap();

  placeElements(map, TileType.OBSTACLE, OBSTACLE_COUNT, true, false);
  placeElements(map, TileType.COVER, COVER_COUNT, true, false);
  placeElements(map, TileType.TRAP, TRAP_COUNT, true, true);
  placeElements(map, TileType.CHEST, CHEST_COUNT, true, true);

  const player1Spawn = { x: 1, y: 1 };
  const player2Spawn = { x: MAP_SIZE - 2, y: MAP_SIZE - 2 };
  map[player1Spawn.y][player1Spawn.x].type = TileType.EMPTY;
  map[player2Spawn.y][player2Spawn.x].type = TileType.EMPTY;

  revealArea(map, player1Spawn.x, player1Spawn.y, 3);
  revealArea(map, player2Spawn.x, player2Spawn.y, 3);

  return map;
}

export function revealAroundPosition(map: GameMap, x: number, y: number, radius: number): void {
  revealArea(map, x, y, radius);
}

export function isWalkable(map: GameMap, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
    return false;
  }
  const tile = map[y][x];
  return tile.type !== TileType.OBSTACLE;
}

export function isObstacle(map: GameMap, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
    return true;
  }
  return map[y][x].type === TileType.OBSTACLE;
}

export function getTile(map: GameMap, x: number, y: number): MapTile | null {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
    return null;
  }
  return map[y][x];
}
