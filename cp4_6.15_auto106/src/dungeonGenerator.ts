import { TileType, Room, DungeonMap, GeneratorParams } from './types';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

function createTiles(width: number, height: number): TileType[][] {
  const tiles: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = TileType.WALL;
    }
  }
  return tiles;
}

function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  return (
    a.x - padding < b.x + b.width &&
    a.x + a.width + padding > b.x &&
    a.y - padding < b.y + b.height &&
    a.y + a.height + padding > b.y
  );
}

function carveRoom(tiles: TileType[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      tiles[y][x] = TileType.FLOOR;
    }
  }
}

function carveHCorridor(tiles: TileType[][], x1: number, x2: number, y: number): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  for (let x = startX; x <= endX; x++) {
    if (tiles[y][x] === TileType.WALL) {
      tiles[y][x] = TileType.CORRIDOR;
    }
  }
}

function carveVCorridor(tiles: TileType[][], y1: number, y2: number, x: number): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  for (let y = startY; y <= endY; y++) {
    if (tiles[y][x] === TileType.WALL) {
      tiles[y][x] = TileType.CORRIDOR;
    }
  }
}

function connectRooms(
  tiles: TileType[][],
  rooms: Room[],
  rng: SeededRandom
): void {
  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];
    const horizFirst = rng.next() > 0.5;
    if (horizFirst) {
      carveHCorridor(tiles, prev.centerX, curr.centerX, prev.centerY);
      carveVCorridor(tiles, prev.centerY, curr.centerY, curr.centerX);
    } else {
      carveVCorridor(tiles, prev.centerY, curr.centerY, prev.centerX);
      carveHCorridor(tiles, prev.centerX, curr.centerX, curr.centerY);
    }
  }
}

export function generateDungeon(params: GeneratorParams): DungeonMap {
  const {
    width,
    height,
    roomCount,
    seed = Math.floor(Math.random() * 1000000),
  } = params;

  const rng = new SeededRandom(seed);
  const tiles = createTiles(width, height);
  const rooms: Room[] = [];

  const maxAttempts = roomCount * 10;
  let attempts = 0;

  const minRoomSize = 3;
  const maxRoomSize = 5;

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  while (rooms.length < roomCount && attempts < maxAttempts) {
    attempts++;

    const roomWidth = rng.nextInt(minRoomSize, maxRoomSize);
    const roomHeight = rng.nextInt(minRoomSize, maxRoomSize);

    let roomX: number;
    let roomY: number;

    if (rooms.length === 0) {
      roomX = centerX - Math.floor(roomWidth / 2);
      roomY = centerY - Math.floor(roomHeight / 2);
    } else {
      const angle = rng.next() * Math.PI * 2;
      const distance = rng.nextInt(2, Math.max(2, Math.floor(Math.min(width, height) / 3)));
      const baseX = centerX + Math.floor(Math.cos(angle) * distance);
      const baseY = centerY + Math.floor(Math.sin(angle) * distance);
      roomX = Math.max(1, Math.min(width - roomWidth - 1, baseX - Math.floor(roomWidth / 2)));
      roomY = Math.max(1, Math.min(height - roomHeight - 1, baseY - Math.floor(roomHeight / 2)));
    }

    const newRoom: Room = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      centerX: roomX + Math.floor(roomWidth / 2),
      centerY: roomY + Math.floor(roomHeight / 2),
    };

    let overlaps = false;
    for (const existing of rooms) {
      if (roomsOverlap(newRoom, existing, 1)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push(newRoom);
      carveRoom(tiles, newRoom);
    }
  }

  rooms.sort((a, b) => {
    const distA = Math.abs(a.centerX - centerX) + Math.abs(a.centerY - centerY);
    const distB = Math.abs(b.centerX - centerX) + Math.abs(b.centerY - centerY);
    return distA - distB;
  });

  connectRooms(tiles, rooms, rng);

  return {
    width,
    height,
    tiles,
    rooms,
    seed,
  };
}

export function getWalkablePositions(map: DungeonMap): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y][x] !== TileType.WALL) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}
