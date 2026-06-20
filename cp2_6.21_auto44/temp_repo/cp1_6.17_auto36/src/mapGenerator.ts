import { v4 as uuidv4 } from 'uuid';
import type { DungeonMap, Room, Corridor, CellType } from './types';

interface GenerateOptions {
  width?: number;
  height?: number;
  minRooms?: number;
  maxRooms?: number;
  minRoomSize?: number;
  maxRoomSize?: number;
}

export function generateDungeonMap(options: GenerateOptions = {}): DungeonMap {
  const {
    width = 6,
    height = 6,
    minRooms = 4,
    maxRooms = 6,
    minRoomSize = 2,
    maxRoomSize = 4,
  } = options;

  const grid: CellType[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = 'wall';
    }
  }

  const rooms: Room[] = [];
  const targetRoomCount = minRooms + Math.floor(Math.random() * (maxRooms - minRooms + 1));
  const maxAttempts = 100;
  let attempts = 0;

  while (rooms.length < targetRoomCount && attempts < maxAttempts) {
    attempts++;
    const roomWidth = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
    const roomHeight = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
    const roomX = Math.floor(Math.random() * (width - roomWidth));
    const roomY = Math.floor(Math.random() * (height - roomHeight));

    const newRoom: Room = {
      id: uuidv4(),
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      explored: false,
      eventTriggered: false,
    };

    let overlaps = false;
    for (const room of rooms) {
      if (roomsOverlap(newRoom, room)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push(newRoom);
      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          grid[y][x] = 'room';
        }
      }
    }
  }

  const corridors: Corridor[] = [];
  if (rooms.length >= 2) {
    const connected = new Set<string>([rooms[0].id]);

    while (connected.size < rooms.length) {
      let minDist = Infinity;
      let fromRoom: Room | null = null;
      let toRoom: Room | null = null;

      for (const roomA of rooms) {
        if (!connected.has(roomA.id)) continue;
        for (const roomB of rooms) {
          if (connected.has(roomB.id)) continue;
          const dist = roomDistance(roomA, roomB);
          if (dist < minDist) {
            minDist = dist;
            fromRoom = roomA;
            toRoom = roomB;
          }
        }
      }

      if (fromRoom && toRoom) {
        const corridor = connectRooms(fromRoom, toRoom, grid, width, height);
        corridors.push(corridor);
        connected.add(toRoom.id);
      } else {
        break;
      }
    }
  }

  return {
    grid,
    rooms,
    corridors,
    width,
    height,
  };
}

function roomsOverlap(a: Room, b: Room): boolean {
  const margin = 1;
  return !(
    a.x + a.width + margin <= b.x ||
    b.x + b.width + margin <= a.x ||
    a.y + a.height + margin <= b.y ||
    b.y + b.height + margin <= a.y
  );
}

function roomDistance(a: Room, b: Room): number {
  const aCenterX = a.x + Math.floor(a.width / 2);
  const aCenterY = a.y + Math.floor(a.height / 2);
  const bCenterX = b.x + Math.floor(b.width / 2);
  const bCenterY = b.y + Math.floor(b.height / 2);
  return Math.abs(aCenterX - bCenterX) + Math.abs(aCenterY - bCenterY);
}

function connectRooms(
  from: Room,
  to: Room,
  grid: CellType[][],
  mapWidth: number,
  mapHeight: number
): Corridor {
  const cells: { x: number; y: number }[] = [];

  const fromCenterX = from.x + Math.floor(from.width / 2);
  const fromCenterY = from.y + Math.floor(from.height / 2);
  const toCenterX = to.x + Math.floor(to.width / 2);
  const toCenterY = to.y + Math.floor(to.height / 2);

  let x = fromCenterX;
  let y = fromCenterY;

  const horizontalFirst = Math.random() > 0.5;

  if (horizontalFirst) {
    while (x !== toCenterX) {
      if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight && grid[y][x] === 'wall') {
        grid[y][x] = 'corridor';
        cells.push({ x, y });
      }
      x += x < toCenterX ? 1 : -1;
    }
    while (y !== toCenterY) {
      if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight && grid[y][x] === 'wall') {
        grid[y][x] = 'corridor';
        cells.push({ x, y });
      }
      y += y < toCenterY ? 1 : -1;
    }
  } else {
    while (y !== toCenterY) {
      if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight && grid[y][x] === 'wall') {
        grid[y][x] = 'corridor';
        cells.push({ x, y });
      }
      y += y < toCenterY ? 1 : -1;
    }
    while (x !== toCenterX) {
      if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight && grid[y][x] === 'wall') {
        grid[y][x] = 'corridor';
        cells.push({ x, y });
      }
      x += x < toCenterX ? 1 : -1;
    }
  }

  return {
    id: uuidv4(),
    cells,
  };
}

export function findStartPosition(map: DungeonMap): { x: number; y: number } {
  if (map.rooms.length > 0) {
    const firstRoom = map.rooms[0];
    return {
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2),
    };
  }
  return { x: 1, y: 1 };
}

export function getRoomAt(map: DungeonMap, x: number, y: number): Room | null {
  for (const room of map.rooms) {
    if (
      x >= room.x &&
      x < room.x + room.width &&
      y >= room.y &&
      y < room.y + room.height
    ) {
      return room;
    }
  }
  return null;
}
