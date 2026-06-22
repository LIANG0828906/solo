import type { CellType, DungeonCell, DungeonRoom, DungeonData } from './types';

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function seedHashHex(seed: string): string {
  const h = cyrb53(seed);
  return (h >>> 0).toString(16).padStart(8, '0');
}

class SeededPRNG {
  private state: number;

  constructor(seed: string) {
    this.state = cyrb53(seed, 0);
  }

  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s;
    return (this.state >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

interface RoomPlacement {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GenerationSettings {
  gridWidth: number;
  gridHeight: number;
  roomCount: number;
  chestCount: number;
  trapCount: number;
}

function createGrid(width: number, height: number): DungeonCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: 'wall' as CellType,
      roomId: null,
      revealed: false,
    }))
  );
}

function roomsOverlap(a: RoomPlacement, b: RoomPlacement): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function placeRoom(grid: DungeonCell[][], room: RoomPlacement): void {
  for (let dy = 0; dy < room.height; dy++) {
    for (let dx = 0; dx < room.width; dx++) {
      const cy = room.y + dy;
      const cx = room.x + dx;
      grid[cy][cx] = {
        type: 'floor',
        roomId: room.id,
        revealed: false,
      };
    }
  }
}

function roomCenter(room: RoomPlacement): [number, number] {
  return [
    Math.floor(room.x + room.width / 2),
    Math.floor(room.y + room.height / 2),
  ];
}

function carveLCorridor(
  grid: DungeonCell[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rooms: RoomPlacement[]
): void {
  const horizontalFirst = x1 !== x2 && y1 !== y2
    ? grid[y1][x1].type === 'corridor' || grid[y1][x1].type === 'room_entrance'
    : true;

  if (horizontalFirst) {
    carveHorizontal(grid, y1, x1, x2, rooms);
    carveVertical(grid, x2, y1, y2, rooms);
  } else {
    carveVertical(grid, x1, y1, y2, rooms);
    carveHorizontal(grid, y2, x1, x2, rooms);
  }
}

function carveHorizontal(
  grid: DungeonCell[][],
  y: number,
  x1: number,
  x2: number,
  rooms: RoomPlacement[]
): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  for (let x = startX; x <= endX; x++) {
    const cell = grid[y][x];
    if (cell.type === 'floor') {
      const room = rooms.find(
        (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
      );
      if (room && isRoomEdge(room, x, y)) {
        cell.type = 'room_entrance';
      }
    } else if (cell.type !== 'room_entrance') {
      cell.type = 'corridor';
    }
  }
}

function carveVertical(
  grid: DungeonCell[][],
  x: number,
  y1: number,
  y2: number,
  rooms: RoomPlacement[]
): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  for (let y = startY; y <= endY; y++) {
    const cell = grid[y][x];
    if (cell.type === 'floor') {
      const room = rooms.find(
        (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
      );
      if (room && isRoomEdge(room, x, y)) {
        cell.type = 'room_entrance';
      }
    } else if (cell.type !== 'room_entrance') {
      cell.type = 'corridor';
    }
  }
}

function isRoomEdge(room: RoomPlacement, x: number, y: number): boolean {
  return (
    x === room.x ||
    x === room.x + room.width - 1 ||
    y === room.y ||
    y === room.y + room.height - 1
  );
}

function markEntrances(grid: DungeonCell[][], rooms: RoomPlacement[]): void {
  for (const room of rooms) {
    const edges: [number, number][] = [];
    for (let dx = 0; dx < room.width; dx++) {
      edges.push([room.y, room.x + dx]);
      edges.push([room.y + room.height - 1, room.x + dx]);
    }
    for (let dy = 1; dy < room.height - 1; dy++) {
      edges.push([room.y + dy, room.x]);
      edges.push([room.y + dy, room.x + room.width - 1]);
    }
    for (const [ey, ex] of edges) {
      const cell = grid[ey][ex];
      if (cell.type !== 'floor' && cell.type !== 'room_entrance') continue;
      const neighbors: [number, number][] = [
        [ey - 1, ex],
        [ey + 1, ex],
        [ey, ex - 1],
        [ey, ex + 1],
      ];
      const hasCorridorNeighbor = neighbors.some(([ny, nx]) => {
        if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length)
          return false;
        return grid[ny][nx].type === 'corridor';
      });
      if (hasCorridorNeighbor) {
        cell.type = 'room_entrance';
      }
    }
  }
}

export function generateDungeon(
  seed: string,
  settings?: {
    gridWidth?: number;
    gridHeight?: number;
    roomCount?: number;
    chestCount?: number;
    trapCount?: number;
  }
): DungeonData {
  const cfg: GenerationSettings = {
    gridWidth: settings?.gridWidth ?? 10,
    gridHeight: settings?.gridHeight ?? 10,
    roomCount: settings?.roomCount ?? 0,
    chestCount: settings?.chestCount ?? 0,
    trapCount: settings?.trapCount ?? 0,
  };

  const rng = new SeededPRNG(seed);
  const grid = createGrid(cfg.gridWidth, cfg.gridHeight);

  const roomCount = cfg.roomCount > 0
    ? cfg.roomCount
    : rng.nextInt(2, 4);
  const chestCount = cfg.chestCount > 0
    ? cfg.chestCount
    : rng.nextInt(1, 2);
  const trapCount = cfg.trapCount > 0
    ? cfg.trapCount
    : rng.nextInt(1, 2);

  const rooms: RoomPlacement[] = [];
  const maxAttempts = 500;

  for (let id = 0; id < roomCount; id++) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const width = rng.nextInt(2, 4);
      const height = rng.nextInt(2, 4);
      const x = rng.nextInt(0, cfg.gridWidth - width);
      const y = rng.nextInt(0, cfg.gridHeight - height);
      const candidate: RoomPlacement = { id, x, y, width, height };
      const overlaps = rooms.some((r) => roomsOverlap(candidate, r));
      if (!overlaps) {
        rooms.push(candidate);
        placeRoom(grid, candidate);
        placed = true;
        break;
      }
    }
    if (!placed) break;
  }

  if (rooms.length >= 2) {
    const indices = rng.shuffle(rooms.map((_, i) => i));
    for (let i = 0; i < indices.length - 1; i++) {
      const [cx1, cy1] = roomCenter(rooms[indices[i]]);
      const [cx2, cy2] = roomCenter(rooms[indices[i + 1]]);
      carveLCorridor(grid, cx1, cy1, cx2, cy2, rooms);
    }
    if (rooms.length > 2) {
      const [cxF, cyF] = roomCenter(rooms[indices[0]]);
      const [cxL, cyL] = roomCenter(rooms[indices[indices.length - 1]]);
      carveLCorridor(grid, cxF, cyF, cxL, cyL, rooms);
    }
  }

  markEntrances(grid, rooms);

  const floorTiles: [number, number, number][] = [];
  for (const room of rooms) {
    for (let dy = 0; dy < room.height; dy++) {
      for (let dx = 0; dx < room.width; dx++) {
        const cy = room.y + dy;
        const cx = room.x + dx;
        if (grid[cy][cx].type === 'floor') {
          floorTiles.push([cx, cy, room.id]);
        }
      }
    }
  }

  if (floorTiles.length > 0) {
    const shuffledFloors = rng.shuffle(floorTiles);
    const placedChests = Math.min(chestCount, shuffledFloors.length);
    for (let i = 0; i < placedChests; i++) {
      const [cx, cy, rid] = shuffledFloors[i];
      grid[cy][cx] = { type: 'chest', roomId: rid, revealed: false };
    }
  }

  const corridorTiles: [number, number][] = [];
  for (let y = 0; y < cfg.gridHeight; y++) {
    for (let x = 0; x < cfg.gridWidth; x++) {
      if (grid[y][x].type === 'corridor') {
        corridorTiles.push([x, y]);
      }
    }
  }

  if (corridorTiles.length > 0) {
    const shuffledCorridors = rng.shuffle(corridorTiles);
    const placedTraps = Math.min(trapCount, shuffledCorridors.length);
    for (let i = 0; i < placedTraps; i++) {
      const [cx, cy] = shuffledCorridors[i];
      grid[cy][cx] = { type: 'trap', roomId: null, revealed: false };
    }
  }

  return {
    grid,
    rooms: rooms.map((r) => ({
      id: r.id,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    })),
    seed,
    seedHash: seedHashHex(seed),
  };
}
