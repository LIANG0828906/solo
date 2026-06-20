import { CONFIG } from './types';
import type { DungeonMap, Room, TileType, Position } from './types';
import { TileType as TileTypeEnum } from './types';

export class DungeonGenerator {
  generate(): DungeonMap {
    const startTime = performance.now();

    const width = this.randomInt(CONFIG.MAP_MIN_SIZE, CONFIG.MAP_MAX_SIZE);
    const height = this.randomInt(CONFIG.MAP_MIN_SIZE, CONFIG.MAP_MAX_SIZE);

    const tiles: TileType[][] = [];
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = TileTypeEnum.WALL;
      }
    }

    const rooms: Room[] = [];
    this.recursiveSplit(tiles, 1, 1, width - 2, height - 2, rooms);

    if (rooms.length < CONFIG.MIN_ROOMS) {
      return this.generate();
    }

    this.connectRooms(tiles, rooms);

    const endTime = performance.now();
    if (endTime - startTime > 50) {
      console.warn(`Map generation took ${endTime - startTime}ms, exceeding 50ms limit`);
    }

    return {
      width,
      height,
      tiles,
      rooms,
    };
  }

  private recursiveSplit(
    tiles: TileType[][],
    x: number,
    y: number,
    w: number,
    h: number,
    rooms: Room[],
    depth: number = 0
  ): void {
    const minRoomSize = 4;
    const maxSplitRatio = 0.75;

    if (w < minRoomSize * 2 || h < minRoomSize * 2 || depth > 4) {
      this.createRoom(tiles, x, y, w, h, rooms);
      return;
    }

    const splitHorizontally = Math.random() > 0.5;

    if (splitHorizontally) {
      const minSplit = Math.floor(h * (1 - maxSplitRatio));
      const maxSplit = Math.floor(h * maxSplitRatio);
      const split = this.randomInt(minSplit, maxSplit);

      this.recursiveSplit(tiles, x, y, w, split, rooms, depth + 1);
      this.recursiveSplit(tiles, x, y + split, w, h - split, rooms, depth + 1);

      const doorX = this.randomInt(x + 1, x + w - 2);
      tiles[y + split][doorX] = TileTypeEnum.FLOOR;
      if (y + split + 1 < tiles.length) {
        tiles[y + split + 1][doorX] = TileTypeEnum.FLOOR;
      }
    } else {
      const minSplit = Math.floor(w * (1 - maxSplitRatio));
      const maxSplit = Math.floor(w * maxSplitRatio);
      const split = this.randomInt(minSplit, maxSplit);

      this.recursiveSplit(tiles, x, y, split, h, rooms, depth + 1);
      this.recursiveSplit(tiles, x + split, y, w - split, h, rooms, depth + 1);

      const doorY = this.randomInt(y + 1, y + h - 2);
      tiles[doorY][x + split] = TileTypeEnum.FLOOR;
      if (x + split + 1 < tiles[0].length) {
        tiles[doorY][x + split + 1] = TileTypeEnum.FLOOR;
      }
    }
  }

  private createRoom(
    tiles: TileType[][],
    x: number,
    y: number,
    w: number,
    h: number,
    rooms: Room[]
  ): void {
    const roomPadding = 1;
    const roomX = x + roomPadding;
    const roomY = y + roomPadding;
    const roomW = w - roomPadding * 2;
    const roomH = h - roomPadding * 2;

    if (roomW < 3 || roomH < 3) return;

    for (let dy = 0; dy < roomH; dy++) {
      for (let dx = 0; dx < roomW; dx++) {
        const tileY = roomY + dy;
        const tileX = roomX + dx;
        if (tileY >= 0 && tileY < tiles.length && tileX >= 0 && tileX < tiles[0].length) {
          tiles[tileY][tileX] = TileTypeEnum.FLOOR;
        }
      }
    }

    const room: Room = {
      x: roomX,
      y: roomY,
      width: roomW,
      height: roomH,
      centerX: Math.floor(roomX + roomW / 2),
      centerY: Math.floor(roomY + roomH / 2),
    };

    rooms.push(room);
  }

  private connectRooms(tiles: TileType[][], rooms: Room[]): void {
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];

      const startX = roomA.centerX;
      const startY = roomA.centerY;
      const endX = roomB.centerX;
      const endY = roomB.centerY;

      this.drawCorridor(tiles, startX, startY, endX, endY);
    }
  }

  private drawCorridor(
    tiles: TileType[][],
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    let x = x1;
    let y = y1;

    while (x !== x2) {
      this.setFloor(tiles, x, y);
      this.setFloor(tiles, x, y + 1);
      x += x < x2 ? 1 : -1;
    }

    while (y !== y2) {
      this.setFloor(tiles, x, y);
      this.setFloor(tiles, x + 1, y);
      y += y < y2 ? 1 : -1;
    }

    this.setFloor(tiles, x, y);
  }

  private setFloor(tiles: TileType[][], x: number, y: number): void {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      tiles[y][x] = TileTypeEnum.FLOOR;
    }
  }

  getRandomFloorPositionInRoom(
    dungeon: DungeonMap,
    room: Room,
    excludePositions: Position[] = []
  ): Position | null {
    const floorPositions: Position[] = [];

    for (let dy = 0; dy < room.height; dy++) {
      for (let dx = 0; dx < room.width; dx++) {
        const x = room.x + dx;
        const y = room.y + dy;

        if (
          dungeon.tiles[y]?.[x] === TileTypeEnum.FLOOR &&
          !excludePositions.some((p) => p.x === x && p.y === y)
        ) {
          floorPositions.push({ x, y });
        }
      }
    }

    if (floorPositions.length === 0) return null;

    return floorPositions[this.randomInt(0, floorPositions.length - 1)];
  }

  getRandomRoom(rooms: Room[], excludeIndices: number[] = []): Room {
    const availableIndices = rooms
      .map((_, i) => i)
      .filter((i) => !excludeIndices.includes(i));

    const index = availableIndices[this.randomInt(0, availableIndices.length - 1)];
    return rooms[index];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
