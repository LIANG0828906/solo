export const TILE = {
  WALL: 1,
  FLOOR: 0,
  CORRIDOR: 2,
} as const;

export type TileType = typeof TILE[keyof typeof TILE];

export interface Room {
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  explored: boolean;
  connected: Set<number>;
}

export interface DungeonMap {
  tiles: TileType[][];
  rooms: Room[];
  width: number;
  height: number;
  tileSize: number;
  gridCols: number;
  gridRows: number;
}

const GRID_COLS = 5;
const GRID_ROWS = 5;
const ROOM_SIZE = 8;
const CORRIDOR_WIDTH = 2;
const GAP = 2;

export function generateDungeon(): DungeonMap {
  const totalRoomW = ROOM_SIZE + GAP;
  const totalRoomH = ROOM_SIZE + GAP;
  const mapWidth = GRID_COLS * totalRoomW + GAP;
  const mapHeight = GRID_ROWS * totalRoomH + GAP;

  const tiles: TileType[][] = [];
  for (let y = 0; y < mapHeight; y++) {
    tiles[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      tiles[y][x] = TILE.WALL;
    }
  }

  const rooms: Room[] = [];

  for (let gy = 0; gy < GRID_ROWS; gy++) {
    for (let gx = 0; gx < GRID_COLS; gx++) {
      const roomX = GAP + gx * totalRoomW;
      const roomY = GAP + gy * totalRoomH;
      const room: Room = {
        gridX: gx,
        gridY: gy,
        x: roomX,
        y: roomY,
        width: ROOM_SIZE,
        height: ROOM_SIZE,
        explored: false,
        connected: new Set(),
      };
      rooms.push(room);

      for (let ry = 0; ry < ROOM_SIZE; ry++) {
        for (let rx = 0; rx < ROOM_SIZE; rx++) {
          tiles[roomY + ry][roomX + rx] = TILE.FLOOR;
        }
      }
    }
  }

  const getRoomIndex = (gx: number, gy: number): number => gy * GRID_COLS + gx;

  const shuffle = <T>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const visited = new Set<number>();
  const stack: number[] = [];
  const startIdx = 0;
  visited.add(startIdx);
  stack.push(startIdx);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const room = rooms[current];
    const neighbors: { dx: number; dy: number; idx: number }[] = [];

    const dirs = shuffle([
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ]);

    for (const d of dirs) {
      const ngx = room.gridX + d.dx;
      const ngy = room.gridY + d.dy;
      if (ngx >= 0 && ngx < GRID_COLS && ngy >= 0 && ngy < GRID_ROWS) {
        const nIdx = getRoomIndex(ngx, ngy);
        if (!visited.has(nIdx)) {
          neighbors.push({ dx: d.dx, dy: d.dy, idx: nIdx });
        }
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[0];
      connectRooms(tiles, rooms[current], rooms[next.idx]);
      rooms[current].connected.add(next.idx);
      rooms[next.idx].connected.add(current);
      visited.add(next.idx);
      stack.push(next.idx);
    } else {
      stack.pop();
    }
  }

  const extraConnections = Math.floor(GRID_COLS * GRID_ROWS * 0.3);
  for (let i = 0; i < extraConnections; i++) {
    const ri = Math.floor(Math.random() * rooms.length);
    const room = rooms[ri];
    const dirs = shuffle([
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ]);
    for (const d of dirs) {
      const ngx = room.gridX + d.dx;
      const ngy = room.gridY + d.dy;
      if (ngx >= 0 && ngx < GRID_COLS && ngy >= 0 && ngy < GRID_ROWS) {
        const nIdx = getRoomIndex(ngx, ngy);
        if (!room.connected.has(nIdx)) {
          connectRooms(tiles, room, rooms[nIdx]);
          room.connected.add(nIdx);
          rooms[nIdx].connected.add(ri);
          break;
        }
      }
    }
  }

  const tileSize = 32;

  return {
    tiles,
    rooms,
    width: mapWidth,
    height: mapHeight,
    tileSize,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
  };
}

function connectRooms(tiles: TileType[][], r1: Room, r2: Room): void {
  const centerX1 = r1.x + Math.floor(r1.width / 2);
  const centerY1 = r1.y + Math.floor(r1.height / 2);
  const centerX2 = r2.x + Math.floor(r2.width / 2);
  const centerY2 = r2.y + Math.floor(r2.height / 2);

  const halfW = Math.floor(CORRIDOR_WIDTH / 2);

  if (r1.gridX !== r2.gridX) {
    const startX = Math.min(centerX1, centerX2);
    const endX = Math.max(centerX1, centerX2);
    const yStart = centerY1 - halfW;
    for (let x = startX; x <= endX; x++) {
      for (let wy = 0; wy < CORRIDOR_WIDTH; wy++) {
        const ty = yStart + wy;
        if (ty >= 0 && ty < tiles.length && x >= 0 && x < tiles[0].length) {
          if (tiles[ty][x] === TILE.WALL) {
            tiles[ty][x] = TILE.CORRIDOR;
          }
        }
      }
    }
  }

  if (r1.gridY !== r2.gridY) {
    const startY = Math.min(centerY1, centerY2);
    const endY = Math.max(centerY1, centerY2);
    const xStart = centerX2 - halfW;
    for (let y = startY; y <= endY; y++) {
      for (let wx = 0; wx < CORRIDOR_WIDTH; wx++) {
        const tx = xStart + wx;
        if (y >= 0 && y < tiles.length && tx >= 0 && tx < tiles[0].length) {
          if (tiles[y][tx] === TILE.WALL) {
            tiles[y][tx] = TILE.CORRIDOR;
          }
        }
      }
    }
  }
}

export function getRoomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2),
  };
}

export function findRoomAt(rooms: Room[], tx: number, ty: number): Room | null {
  for (const room of rooms) {
    if (
      tx >= room.x &&
      tx < room.x + room.width &&
      ty >= room.y &&
      ty < room.y + room.height
    ) {
      return room;
    }
  }
  return null;
}
