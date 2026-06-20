export enum TileType {
  WALL = 0,
  FLOOR = 1,
  START = 2,
  EXIT = 3,
  GEM = 4,
}

export interface MapData {
  grid: TileType[][];
  width: number;
  height: number;
  startPos: { x: number; y: number };
  exitPos: { x: number; y: number };
  gemPositions: { x: number; y: number }[];
  monsterSpawns: { x: number; y: number }[];
}

const MAP_WIDTH = 21;
const MAP_HEIGHT = 15;
const GEM_COUNT = 5;
const MONSTER_COUNT = 3;

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateDungeon(): MapData {
  const width = MAP_WIDTH;
  const height = MAP_HEIGHT;
  const grid: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = TileType.WALL;
    }
  }

  const visited: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    visited[y] = new Array(width).fill(false);
  }

  const startX = 1;
  const startY = 1;
  grid[startY][startX] = TileType.FLOOR;
  visited[startY][startX] = true;

  const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const dirs = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const shuffledDirs = shuffle([...dirs]);
    let moved = false;

    for (const dir of shuffledDirs) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (
        nx > 0 && nx < width - 1 &&
        ny > 0 && ny < height - 1 &&
        !visited[ny][nx]
      ) {
        grid[current.y + dir.dy / 2][current.x + dir.dx / 2] = TileType.FLOOR;
        grid[ny][nx] = TileType.FLOOR;
        visited[ny][nx] = true;
        stack.push({ x: nx, y: ny });
        moved = true;
        break;
      }
    }

    if (!moved) {
      stack.pop();
    }
  }

  const floorTiles: { x: number; y: number }[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === TileType.FLOOR) {
        floorTiles.push({ x, y });
      }
    }
  }

  const startPos = { x: startX, y: startY };
  grid[startY][startX] = TileType.START;

  let maxDist = 0;
  let exitPos = { x: width - 2, y: height - 2 };
  for (const tile of floorTiles) {
    const dist = Math.abs(tile.x - startX) + Math.abs(tile.y - startY);
    if (dist > maxDist) {
      maxDist = dist;
      exitPos = tile;
    }
  }
  grid[exitPos.y][exitPos.x] = TileType.EXIT;

  const availableForGems = floorTiles.filter(
    (t) => !(t.x === startPos.x && t.y === startPos.y) &&
           !(t.x === exitPos.x && t.y === exitPos.y)
  );
  shuffle(availableForGems);
  const gemPositions: { x: number; y: number }[] = [];
  for (let i = 0; i < Math.min(GEM_COUNT, availableForGems.length); i++) {
    const pos = availableForGems[i];
    grid[pos.y][pos.x] = TileType.GEM;
    gemPositions.push(pos);
  }

  const remaining = availableForGems.slice(GEM_COUNT);
  shuffle(remaining);
  const monsterSpawns: { x: number; y: number }[] = [];
  for (let i = 0; i < Math.min(MONSTER_COUNT, remaining.length); i++) {
    const pos = remaining[i];
    const dist = Math.abs(pos.x - startX) + Math.abs(pos.y - startY);
    if (dist >= 5) {
      monsterSpawns.push(pos);
    }
  }

  while (monsterSpawns.length < MONSTER_COUNT && remaining.length > monsterSpawns.length + 1) {
    const pos = remaining[monsterSpawns.length + 5];
    if (pos) monsterSpawns.push(pos);
  }

  return {
    grid,
    width,
    height,
    startPos,
    exitPos,
    gemPositions,
    monsterSpawns,
  };
}

export function isWalkable(map: MapData, x: number, y: number): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;
  const tile = map.grid[y][x];
  return tile !== TileType.WALL;
}
