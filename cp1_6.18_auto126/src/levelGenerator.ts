export const GRID_SIZE = 8;
export const TILE_SIZE = 60;
export const GRID_OFFSET_X = 160;
export const GRID_OFFSET_Y = 60;

export type TileType = 'wall' | 'room' | 'corridor' | 'door';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  id: number;
}

export interface Treasure {
  x: number;
  y: number;
  collected: boolean;
  blinkTimer: number;
}

export interface Exit {
  x: number;
  y: number;
}

export interface LevelData {
  grid: TileType[][];
  rooms: Room[];
  corridorNodes: { x: number; y: number }[];
  treasure: Treasure;
  exit: Exit;
  floor: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roomsOverlap(r1: Room, r2: Room): boolean {
  return !(
    r1.x + r1.w + 1 < r2.x ||
    r2.x + r2.w + 1 < r1.x ||
    r1.y + r1.h + 1 < r2.y ||
    r2.y + r2.h + 1 < r1.y
  );
}

export function generateLevel(floor: number): LevelData {
  const grid: TileType[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = 'wall';
    }
  }

  const rooms: Room[] = [];
  const numRooms = randInt(3, 5);
  let roomId = 0;
  let attempts = 0;

  while (rooms.length < numRooms && attempts < 100) {
    attempts++;
    const w = randInt(2, 4);
    const h = randInt(2, 4);
    const x = randInt(0, GRID_SIZE - w - 1);
    const y = randInt(0, GRID_SIZE - h - 1);
    const newRoom: Room = { x, y, w, h, id: roomId };

    let overlap = false;
    for (const room of rooms) {
      if (roomsOverlap(newRoom, room)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      rooms.push(newRoom);
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          grid[ry][rx] = 'room';
        }
      }
      roomId++;
    }
  }

  const corridorNodes: { x: number; y: number }[] = [];

  for (let i = 0; i < rooms.length - 1; i++) {
    const r1 = rooms[i];
    const r2 = rooms[i + 1];
    const x1 = Math.floor(r1.x + r1.w / 2);
    const y1 = Math.floor(r1.y + r1.h / 2);
    const x2 = Math.floor(r2.x + r2.w / 2);
    const y2 = Math.floor(r2.y + r2.h / 2);

    if (Math.random() < 0.5) {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (grid[y1][x] === 'wall') {
          grid[y1][x] = 'corridor';
          corridorNodes.push({ x, y: y1 });
        }
      }
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (grid[y][x2] === 'wall') {
          grid[y][x2] = 'corridor';
          corridorNodes.push({ x: x2, y });
        }
      }
    } else {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (grid[y][x1] === 'wall') {
          grid[y][x1] = 'corridor';
          corridorNodes.push({ x: x1, y });
        }
      }
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (grid[y2][x] === 'wall') {
          grid[y2][x] = 'corridor';
          corridorNodes.push({ x, y: y2 });
        }
      }
    }
  }

  for (const room of rooms) {
    const doors: { x: number; y: number }[] = [];
    for (let rx = room.x; rx < room.x + room.w; rx++) {
      if (room.y - 1 >= 0 && grid[room.y - 1][rx] === 'corridor') {
        doors.push({ x: rx, y: room.y - 1 });
      }
      if (room.y + room.h < GRID_SIZE && grid[room.y + room.h][rx] === 'corridor') {
        doors.push({ x: rx, y: room.y + room.h });
      }
    }
    for (let ry = room.y; ry < room.y + room.h; ry++) {
      if (room.x - 1 >= 0 && grid[ry][room.x - 1] === 'corridor') {
        doors.push({ x: room.x - 1, y: ry });
      }
      if (room.x + room.w < GRID_SIZE && grid[ry][room.x + room.w] === 'corridor') {
        doors.push({ x: room.x + room.w, y: ry });
      }
    }
    for (const d of doors) {
      grid[d.y][d.x] = 'door';
    }
  }

  const treasureRoom = rooms[randInt(0, rooms.length - 1)];
  const treasure: Treasure = {
    x: Math.floor(treasureRoom.x + treasureRoom.w / 2),
    y: Math.floor(treasureRoom.y + treasureRoom.h / 2),
    collected: false,
    blinkTimer: 0,
  };

  let cornerRoom = rooms[0];
  let minDist = Infinity;
  for (const room of rooms) {
    const d1 = room.x + room.y;
    const d2 = (GRID_SIZE - 1 - room.x - room.w + 1) + room.y;
    const d3 = room.x + (GRID_SIZE - 1 - room.y - room.h + 1);
    const d4 = (GRID_SIZE - 1 - room.x - room.w + 1) + (GRID_SIZE - 1 - room.y - room.h + 1);
    const md = Math.min(d1, d2, d3, d4);
    if (md < minDist) {
      minDist = md;
      cornerRoom = room;
    }
  }

  const exit: Exit = {
    x: cornerRoom.x,
    y: cornerRoom.y,
  };

  return { grid, rooms, corridorNodes, treasure, exit, floor };
}

export function isWalkable(grid: TileType[][], x: number, y: number): boolean {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  const t = grid[y][x];
  return t === 'room' || t === 'corridor' || t === 'door';
}

export function gridToPixel(gx: number, gy: number): { px: number; py: number } {
  return {
    px: GRID_OFFSET_X + gx * TILE_SIZE + TILE_SIZE / 2,
    py: GRID_OFFSET_Y + gy * TILE_SIZE + TILE_SIZE / 2,
  };
}
