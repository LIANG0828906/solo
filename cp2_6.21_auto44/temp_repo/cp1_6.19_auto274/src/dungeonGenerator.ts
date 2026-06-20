export type TileType = 'wall' | 'floor' | 'chest' | 'entrance' | 'exit' | 'specialChest';

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  x: number;
  y: number;
}

export interface DungeonResult {
  map: TileType[][];
  monsters: Monster[];
  entrance: { x: number; y: number };
  exit: { x: number; y: number };
}

const MAP_SIZE = 8;
const MONSTER_NAMES = ['史莱姆', '哥布林', '骷髅兵', '蝙蝠', '蜘蛛'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function createEmptyMap(): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      row.push('wall');
    }
    map.push(row);
  }
  return map;
}

function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
}

function carveRoom(
  map: TileType[][],
  x: number,
  y: number,
  width: number,
  height: number
): void {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (isInBounds(nx, ny)) {
        map[ny][nx] = 'floor';
      }
    }
  }
}

function carveCorridor(
  map: TileType[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  random: () => number
): void {
  let x = x1;
  let y = y1;

  const horizontalFirst = random() > 0.5;

  if (horizontalFirst) {
    while (x !== x2) {
      if (isInBounds(x, y)) {
        map[y][x] = 'floor';
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (isInBounds(x, y)) {
        map[y][x] = 'floor';
      }
      y += y < y2 ? 1 : -1;
    }
  } else {
    while (y !== y2) {
      if (isInBounds(x, y)) {
        map[y][x] = 'floor';
      }
      y += y < y2 ? 1 : -1;
    }
    while (x !== x2) {
      if (isInBounds(x, y)) {
        map[y][x] = 'floor';
      }
      x += x < x2 ? 1 : -1;
    }
  }
  if (isInBounds(x, y)) {
    map[y][x] = 'floor';
  }
}

function getFloorTiles(map: TileType[][]): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (map[y][x] === 'floor') {
        tiles.push({ x, y });
      }
    }
  }
  return tiles;
}

function bfsReachable(
  map: TileType[][],
  startX: number,
  startY: number
): Set<string> {
  const visited = new Set<string>();
  const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
  visited.add(`${startX},${startY}`);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = `${nx},${ny}`;
      if (
        isInBounds(nx, ny) &&
        !visited.has(key) &&
        map[ny][nx] !== 'wall'
      ) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return visited;
}

export function generateDungeon(
  seed: number,
  level: number
): DungeonResult {
  const random = seededRandom(seed);
  const map = createEmptyMap();

  const numRooms = 2 + Math.floor(random() * 2);
  const rooms: { x: number; y: number; w: number; h: number; cx: number; cy: number }[] = [];

  for (let i = 0; i < numRooms; i++) {
    const w = 2 + Math.floor(random() * 3);
    const h = 2 + Math.floor(random() * 3);
    const x = Math.floor(random() * (MAP_SIZE - w - 1)) + 1;
    const y = Math.floor(random() * (MAP_SIZE - h - 1)) + 1;
    const cx = Math.floor(x + w / 2);
    const cy = Math.floor(y + h / 2);

    carveRoom(map, x, y, w, h);
    rooms.push({ x, y, w, h, cx, cy });
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    carveCorridor(
      map,
      rooms[i].cx,
      rooms[i].cy,
      rooms[i + 1].cx,
      rooms[i + 1].cy,
      random
    );
  }

  const floorTiles = getFloorTiles(map);
  if (floorTiles.length < 5) {
    return generateDungeon(seed + 1, level);
  }

  const shuffled = [...floorTiles].sort(() => random() - 0.5);

  const entrance = shuffled.shift()!;
  const exit = shuffled.shift()!;

  const reachable = bfsReachable(map, entrance.x, entrance.y);
  if (!reachable.has(`${exit.x},${exit.y}`)) {
    return generateDungeon(seed + 1, level);
  }

  map[entrance.y][entrance.x] = 'entrance';
  map[exit.y][exit.x] = 'exit';

  const baseMonsterCount = 2 + Math.floor(random() * 2);
  const difficultyMultiplier = 1 + Math.floor((level - 1) / 3) * 0.2;
  const monsterCount = Math.min(
    Math.floor(baseMonsterCount * difficultyMultiplier),
    Math.floor(shuffled.length / 2)
  );

  const monsters: Monster[] = [];
  for (let i = 0; i < monsterCount && i < shuffled.length; i++) {
    const pos = shuffled[i];
    const baseHp = 30 + Math.floor(random() * 20);
    const baseAtk = 5 + Math.floor(random() * 5);
    const baseDef = 1 + Math.floor(random() * 3);

    monsters.push({
      id: `monster-${i}-${seed}`,
      name: MONSTER_NAMES[Math.floor(random() * MONSTER_NAMES.length)],
      hp: Math.floor(baseHp * difficultyMultiplier),
      maxHp: Math.floor(baseHp * difficultyMultiplier),
      attack: Math.floor(baseAtk * difficultyMultiplier),
      defense: Math.floor(baseDef * difficultyMultiplier),
      x: pos.x,
      y: pos.y,
    });
  }

  const remainingTiles = shuffled.slice(monsterCount);
  if (remainingTiles.length > 0) {
    const chestPos = remainingTiles[0];
    map[chestPos.y][chestPos.x] = 'chest';
  }

  if (remainingTiles.length > 2 && level % 3 === 0) {
    const specialChestPos = remainingTiles[2];
    map[specialChestPos.y][specialChestPos.x] = 'specialChest';
  }

  return { map, monsters, entrance, exit };
}

export function isWalkable(tile: TileType): boolean {
  return tile !== 'wall';
}
