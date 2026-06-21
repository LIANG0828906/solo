import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TileType,
  KeyColor,
  Position,
  Room,
  ChestData,
  Doorway
} from './types';

export class GameMap {
  private tiles: TileType[][];
  private rooms: Room[] = [];
  private chests: ChestData[] = [];
  private doorways: Doorway[] = [];
  private revealedTiles: boolean[][];
  private revealWave: number = 0;
  private maxRevealWave: number = 0;
  private revealStartTime: number = 0;
  private playerSpawn: Position = { x: 1, y: 1 };
  private exitPos: Position = { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 };

  constructor() {
    this.tiles = this.createEmptyMap();
    this.revealedTiles = this.createRevealedMap();
    this.generate();
  }

  private createEmptyMap(): TileType[][] {
    const map: TileType[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = TileType.WALL;
      }
    }
    return map;
  }

  private createRevealedMap(): boolean[][] {
    const map: boolean[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x] = false;
      }
    }
    return map;
  }

  generate(): void {
    this.tiles = this.createEmptyMap();
    this.revealedTiles = this.createRevealedMap();
    this.rooms = [];
    this.chests = [];
    this.doorways = [];

    this.generateRooms();
    this.connectRooms();
    this.placeEntities();
    this.calculateRevealWaves();
    this.revealStartTime = performance.now();
  }

  private generateRooms(): void {
    const roomCount = 4;
    let attempts = 0;
    const maxAttempts = 100;

    while (this.rooms.length < roomCount && attempts < maxAttempts) {
      const room: Room = {
        x: Math.floor(Math.random() * (MAP_WIDTH - 6)) + 1,
        y: Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 1,
        width: Math.floor(Math.random() * 3) + 3,
        height: Math.floor(Math.random() * 3) + 3,
        connected: false
      };

      if (this.isRoomValid(room)) {
        this.rooms.push(room);
        this.carveRoom(room);
      }
      attempts++;
    }

    if (this.rooms.length > 0) {
      this.rooms[0].connected = true;
    }
  }

  private isRoomValid(room: Room): boolean {
    if (room.x + room.width >= MAP_WIDTH - 1 || room.y + room.height >= MAP_HEIGHT - 1) {
      return false;
    }

    for (const existing of this.rooms) {
      if (this.roomsOverlap(room, existing)) {
        return false;
      }
    }
    return true;
  }

  private roomsOverlap(a: Room, b: Room): boolean {
    return !(a.x + a.width + 1 < b.x || b.x + b.width + 1 < a.x ||
             a.y + a.height + 1 < b.y || b.y + b.height + 1 < a.y);
  }

  private carveRoom(room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        this.tiles[y][x] = TileType.FLOOR;
      }
    }
  }

  private connectRooms(): void {
    let connectedCount = 1;

    while (connectedCount < this.rooms.length) {
      let bestDist = Infinity;
      let bestRoomA: Room | null = null;
      let bestRoomB: Room | null = null;

      for (const roomA of this.rooms) {
        if (!roomA.connected) continue;
        for (const roomB of this.rooms) {
          if (roomB.connected) continue;
          const dist = this.getRoomDistance(roomA, roomB);
          if (dist < bestDist) {
            bestDist = dist;
            bestRoomA = roomA;
            bestRoomB = roomB;
          }
        }
      }

      if (bestRoomA && bestRoomB) {
        this.createCorridor(bestRoomA, bestRoomB);
        bestRoomB.connected = true;
        connectedCount++;
      } else {
        break;
      }
    }
  }

  private getRoomDistance(a: Room, b: Room): number {
    const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    return Math.abs(centerA.x - centerB.x) + Math.abs(centerA.y - centerB.y);
  }

  private createCorridor(a: Room, b: Room): void {
    const centerA = {
      x: Math.floor(a.x + a.width / 2),
      y: Math.floor(a.y + a.height / 2)
    };
    const centerB = {
      x: Math.floor(b.x + b.width / 2),
      y: Math.floor(b.y + b.height / 2)
    };

    const startX = Math.min(centerA.x, centerB.x);
    const endX = Math.max(centerA.x, centerB.x);
    for (let x = startX; x <= endX; x++) {
      this.tiles[centerA.y][x] = TileType.FLOOR;
    }

    const startY = Math.min(centerA.y, centerB.y);
    const endY = Math.max(centerA.y, centerB.y);
    for (let y = startY; y <= endY; y++) {
      this.tiles[y][centerB.x] = TileType.FLOOR;
    }

    this.doorways.push({ x: centerA.x, y: centerA.y, pulsePhase: Math.random() * Math.PI * 2 });
    this.doorways.push({ x: centerB.x, y: centerB.y, pulsePhase: Math.random() * Math.PI * 2 });
  }

  private placeEntities(): void {
    if (this.rooms.length === 0) return;

    const spawnRoom = this.rooms[0];
    this.playerSpawn = {
      x: Math.floor(spawnRoom.x + spawnRoom.width / 2),
      y: Math.floor(spawnRoom.y + spawnRoom.height / 2)
    };
    this.tiles[this.playerSpawn.y][this.playerSpawn.x] = TileType.SPAWN;

    const exitRoom = this.rooms[this.rooms.length - 1];
    this.exitPos = {
      x: Math.floor(exitRoom.x + exitRoom.width / 2),
      y: Math.floor(exitRoom.y + exitRoom.height / 2)
    };
    this.tiles[this.exitPos.y][this.exitPos.x] = TileType.EXIT;

    const keyColors = [KeyColor.RED, KeyColor.BLUE, KeyColor.GOLD];
    const keyTiles = [TileType.KEY_RED, TileType.KEY_BLUE, TileType.KEY_GOLD];
    const usedPositions = new Set<string>();
    usedPositions.add(`${this.playerSpawn.x},${this.playerSpawn.y}`);
    usedPositions.add(`${this.exitPos.x},${this.exitPos.y}`);

    for (let i = 0; i < 3; i++) {
      const room = this.rooms[Math.min(i + 1, this.rooms.length - 1)];
      const pos = this.getRandomFloorInRoom(room, usedPositions);
      if (pos) {
        this.tiles[pos.y][pos.x] = keyTiles[i];
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }

    for (let i = 0; i < 3; i++) {
      const room = this.rooms[Math.min(i + 1, this.rooms.length - 1)];
      const pos = this.getRandomFloorInRoom(room, usedPositions);
      if (pos) {
        this.chests.push({
          x: pos.x,
          y: pos.y,
          keyRequired: keyColors[i],
          opened: false,
          opening: false,
          openProgress: 0
        });
        this.tiles[pos.y][pos.x] = TileType.CHEST;
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }
  }

  private getRandomFloorInRoom(room: Room, used: Set<string>): Position | null {
    const floors: Position[] = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (this.tiles[y][x] === TileType.FLOOR && !used.has(`${x},${y}`)) {
          floors.push({ x, y });
        }
      }
    }
    if (floors.length === 0) return null;
    return floors[Math.floor(Math.random() * floors.length)];
  }

  private calculateRevealWaves(): void {
    const centerX = Math.floor(MAP_WIDTH / 2);
    const centerY = Math.floor(MAP_HEIGHT / 2);
    let maxDist = 0;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
        if (dist > maxDist) maxDist = dist;
      }
    }
    this.maxRevealWave = maxDist;
  }

  update(currentTime: number): void {
    const elapsed = (currentTime - this.revealStartTime) / 80;
    this.revealWave = Math.min(elapsed, this.maxRevealWave);

    const centerX = Math.floor(MAP_WIDTH / 2);
    const centerY = Math.floor(MAP_HEIGHT / 2);

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
        if (dist <= this.revealWave) {
          this.revealedTiles[y][x] = true;
        }
      }
    }

    for (const doorway of this.doorways) {
      doorway.pulsePhase += 0.08;
    }

    for (const chest of this.chests) {
      if (chest.opening) {
        chest.openProgress = Math.min(chest.openProgress + 0.08, 1);
        if (chest.openProgress >= 1) {
          chest.opening = false;
          chest.opened = true;
        }
      }
    }
  }

  getTileAt(x: number, y: number): TileType {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return TileType.WALL;
    }
    return this.tiles[y][x];
  }

  setTileAt(x: number, y: number, tile: TileType): void {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
      this.tiles[y][x] = tile;
    }
  }

  isRevealed(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    return this.revealedTiles[y][x];
  }

  getPlayerSpawn(): Position {
    return { ...this.playerSpawn };
  }

  getExitPos(): Position {
    return { ...this.exitPos };
  }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  getChests(): ChestData[] {
    return this.chests;
  }

  getDoorways(): Doorway[] {
    return this.doorways;
  }

  getMonsterSpawnPoints(): Position[] {
    const points: Position[] = [];
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      points.push({
        x: Math.floor(room.x + room.width / 2),
        y: Math.floor(room.y + room.height / 2)
      });
    }
    return points;
  }

  isInSameRoom(pos1: Position, pos2: Position): boolean {
    for (const room of this.rooms) {
      const inRoom1 = pos1.x >= room.x && pos1.x < room.x + room.width &&
                      pos1.y >= room.y && pos1.y < room.y + room.height;
      const inRoom2 = pos2.x >= room.x && pos2.x < room.x + room.width &&
                      pos2.y >= room.y && pos2.y < room.y + room.height;
      if (inRoom1 && inRoom2) return true;
    }
    return false;
  }

  getRevealProgress(): number {
    return this.revealWave / this.maxRevealWave;
  }

  isFullyRevealed(): boolean {
    return this.revealWave >= this.maxRevealWave;
  }

  openChest(chest: ChestData): void {
    if (!chest.opened && !chest.opening) {
      chest.opening = true;
      chest.openProgress = 0;
    }
  }
}
