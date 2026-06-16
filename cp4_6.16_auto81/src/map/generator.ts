import { TileType, MapData, Room, RoomType } from './types';

const GRID_SIZE = 4;
const ROOM_SIZE = 10;
const TILE_SIZE = 32;
const CORRIDOR_WIDTH = 2;

export function generateDungeon(): MapData {
  const totalWidth = GRID_SIZE * ROOM_SIZE + (GRID_SIZE - 1) * CORRIDOR_WIDTH + 2;
  const totalHeight = GRID_SIZE * ROOM_SIZE + (GRID_SIZE - 1) * CORRIDOR_WIDTH + 2;

  const tiles: TileType[][] = [];
  for (let y = 0; y < totalHeight; y++) {
    tiles[y] = [];
    for (let x = 0; x < totalWidth; x++) {
      tiles[y][x] = TileType.WALL;
    }
  }

  const rooms: Room[] = [];

  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const gridX = 1 + gx * (ROOM_SIZE + CORRIDOR_WIDTH);
      const gridY = 1 + gy * (ROOM_SIZE + CORRIDOR_WIDTH);

      for (let y = 0; y < ROOM_SIZE; y++) {
        for (let x = 0; x < ROOM_SIZE; x++) {
          tiles[gridY + y][gridX + x] = TileType.FLOOR;
        }
      }

      rooms.push({
        x: gx,
        y: gy,
        gridX,
        gridY,
        width: ROOM_SIZE,
        height: ROOM_SIZE,
        type: 'normal',
        visited: false,
        corridors: {}
      });
    }
  }

  generateCorridors(tiles, rooms);

  assignRoomTypes(rooms);

  return {
    width: totalWidth,
    height: totalHeight,
    tileSize: TILE_SIZE,
    tiles,
    rooms,
    gridSize: GRID_SIZE,
    roomSize: ROOM_SIZE
  };
}

function generateCorridors(tiles: TileType[][], rooms: Room[]): void {
  const visited = new Set<string>();
  const stack: Room[] = [];

  const startRoom = rooms[0];
  visited.add(`${startRoom.x},${startRoom.y}`);
  stack.push(startRoom);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, rooms, visited);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    connectRooms(current, next, tiles, rooms);
    visited.add(`${next.x},${next.y}`);
    stack.push(next);
  }

  addExtraConnections(tiles, rooms);
}

function getUnvisitedNeighbors(room: Room, rooms: Room[], visited: Set<string>): Room[] {
  const neighbors: Room[] = [];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  for (const dir of directions) {
    const nx = room.x + dir.dx;
    const ny = room.y + dir.dy;
    const key = `${nx},${ny}`;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && !visited.has(key)) {
      const neighbor = rooms.find(r => r.x === nx && r.y === ny);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
}

function connectRooms(roomA: Room, roomB: Room, tiles: TileType[][], rooms: Room[]): void {
  const a = getRoomCenter(roomA);
  const b = getRoomCenter(roomB);

  const corridorStartX = Math.min(a.x, b.x);
  const corridorEndX = Math.max(a.x, b.x);
  const corridorStartY = Math.min(a.y, b.y);
  const corridorEndY = Math.max(a.y, b.y);

  if (roomA.x === roomB.x) {
    for (let y = corridorStartY; y <= corridorEndY; y++) {
      for (let dx = -1; dx <= 0; dx++) {
        const px = a.x + dx;
        if (px >= 0 && px < tiles[0].length && y >= 0 && y < tiles.length) {
          if (tiles[y][px] === TileType.WALL) {
            tiles[y][px] = TileType.CORRIDOR;
          }
        }
      }
    }
  } else {
    for (let x = corridorStartX; x <= corridorEndX; x++) {
      for (let dy = -1; dy <= 0; dy++) {
        const py = a.y + dy;
        if (x >= 0 && x < tiles[0].length && py >= 0 && py < tiles.length) {
          if (tiles[py][x] === TileType.WALL) {
            tiles[py][x] = TileType.CORRIDOR;
          }
        }
      }
    }
  }

  if (roomB.y < roomA.y) {
    roomA.corridors.north = true;
    roomB.corridors.south = true;
  } else if (roomB.y > roomA.y) {
    roomA.corridors.south = true;
    roomB.corridors.north = true;
  } else if (roomB.x < roomA.x) {
    roomA.corridors.west = true;
    roomB.corridors.east = true;
  } else if (roomB.x > roomA.x) {
    roomA.corridors.east = true;
    roomB.corridors.west = true;
  }
}

function addExtraConnections(tiles: TileType[][], rooms: Room[]): void {
  const extraConnections = Math.floor(Math.random() * 3) + 2;

  for (let i = 0; i < extraConnections; i++) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const neighbors = getAdjacentRooms(room, rooms);

    for (const neighbor of neighbors) {
      const hasCorridor =
        (room.corridors.north && neighbor.y < room.y) ||
        (room.corridors.south && neighbor.y > room.y) ||
        (room.corridors.west && neighbor.x < room.x) ||
        (room.corridors.east && neighbor.x > room.x);

      if (!hasCorridor && Math.random() < 0.3) {
        connectRooms(room, neighbor, tiles, rooms);
        break;
      }
    }
  }
}

function getAdjacentRooms(room: Room, rooms: Room[]): Room[] {
  const adjacent: Room[] = [];
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  for (const dir of directions) {
    const nx = room.x + dir.dx;
    const ny = room.y + dir.dy;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      const neighbor = rooms.find(r => r.x === nx && r.y === ny);
      if (neighbor) {
        adjacent.push(neighbor);
      }
    }
  }

  return adjacent;
}

function getRoomCenter(room: Room): { x: number; y: number } {
  return {
    x: room.gridX + Math.floor(room.width / 2),
    y: room.gridY + Math.floor(room.height / 2