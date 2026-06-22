import { Tile, TileType, Room, GameMap, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../../types/gameTypes';
import { v4 as uuidv4 } from 'uuid';

export class MapGenerator {
  private tiles: Tile[][] = [];
  private rooms: Room[] = [];
  private portal: { x: number; y: number } = { x: 0, y: 0 };

  public generate(floor: number): GameMap {
    this.tiles = [];
    this.rooms = [];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        this.tiles[y][x] = {
          type: 'WALL',
          x,
          y,
          glowPhase: Math.random() * Math.PI * 2
        };
      }
    }

    this.generateRooms(floor);
    this.connectRooms();
    this.placeDoors();
    this.placePortal();

    return {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tileSize: TILE_SIZE,
      tiles: this.tiles,
      rooms: this.rooms,
      portal: this.portal
    };
  }

  private generateRooms(floor: number): void {
    const roomCount = 6 + Math.floor(Math.random() * 4) + Math.floor(floor / 2);
    const maxAttempts = 100;
    const minRoomSize = 5;
    const maxRoomSize = 10;

    for (let i = 0; i < maxAttempts && this.rooms.length < roomCount; i++) {
      const width = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
      const height = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
      const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - width - 4));
      const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - height - 4));

      const newRoom: Room = { id: uuidv4(), x, y, width, height, connected: false };

      if (!this.rooms.some(room => this.roomsOverlap(room, newRoom))) {
        this.rooms.push(newRoom);
        this.carveRoom(newRoom);
      }
    }
  }

  private roomsOverlap(a: Room, b: Room): boolean {
    const padding = 2;
    return (
      a.x - padding < b.x + b.width &&
      a.x + a.width + padding > b.x &&
      a.y - padding < b.y + b.height &&
      a.y + a.height + padding > b.y
    );
  }

  private carveRoom(room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (this.tiles[y] && this.tiles[y][x]) {
          this.tiles[y][x].type = 'FLOOR';
          this.tiles[y][x].roomId = room.id;
        }
      }
    }
  }

  private connectRooms(): void {
    if (this.rooms.length < 2) return;

    this.rooms[0].connected = true;

    while (this.rooms.some(r => !r.connected)) {
      const connected = this.rooms.filter(r => r.connected);
      const disconnected = this.rooms.filter(r => !r.connected);

      let best: { from: Room; to: Room; dist: number } | null = null;

      for (const from of connected) {
        for (const to of disconnected) {
          const dist = this.roomDistance(from, to);
          if (!best || dist < best.dist) {
            best = { from, to, dist };
          }
        }
      }

      if (best) {
        this.createCorridor(best.from, best.to);
        best.to.connected = true;
      }
    }

    for (let i = 0; i < Math.floor(this.rooms.length / 3); i++) {
      const r1 = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      const r2 = this.rooms[Math.floor(Math.random() * this.rooms.length)];
      if (r1.id !== r2.id) {
        this.createCorridor(r1, r2);
      }
    }
  }

  private roomDistance(a: Room, b: Room): number {
    const ax = a.x + a.width / 2;
    const ay = a.y + a.height / 2;
    const bx = b.x + b.width / 2;
    const by = b.y + b.height / 2;
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  private createCorridor(from: Room, to: Room): void {
    let x = Math.floor(from.x + from.width / 2);
    let y = Math.floor(from.y + from.height / 2);
    const targetX = Math.floor(to.x + to.width / 2);
    const targetY = Math.floor(to.y + to.height / 2);

    while (x !== targetX) {
      if (this.tiles[y] && this.tiles[y][x]) {
        this.tiles[y][x].type = 'FLOOR';
      }
      x += x < targetX ? 1 : -1;
    }

    while (y !== targetY) {
      if (this.tiles[y] && this.tiles[y][x]) {
        this.tiles[y][x].type = 'FLOOR';
      }
      y += y < targetY ? 1 : -1;
    }
  }

  private placeDoors(): void {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (this.tiles[y][x].type === 'FLOOR') {
          if (this.isDoorway(x, y)) {
            this.tiles[y][x].type = 'DOOR';
          }
        }
      }
    }
  }

  private isDoorway(x: number, y: number): boolean {
    const horizontal = 
      this.tiles[y][x - 1].type === 'WALL' &&
      this.tiles[y][x + 1].type === 'WALL' &&
      this.tiles[y - 1][x].type === 'FLOOR' &&
      this.tiles[y + 1][x].type === 'FLOOR';

    const vertical =
      this.tiles[y - 1][x].type === 'WALL' &&
      this.tiles[y + 1][x].type === 'WALL' &&
      this.tiles[y][x - 1].type === 'FLOOR' &&
      this.tiles[y][x + 1].type === 'FLOOR';

    return horizontal || vertical;
  }

  private placePortal(): void {
    const lastRoom = this.rooms[this.rooms.length - 1];
    const px = lastRoom.x + Math.floor(lastRoom.width / 2);
    const py = lastRoom.y + Math.floor(lastRoom.height / 2);
    this.portal = { x: px, y: py };
    if (this.tiles[py] && this.tiles[py][px]) {
      this.tiles[py][px].type = 'PORTAL';
    }
  }

  public getSpawnPosition(): { x: number; y: number } {
    const firstRoom = this.rooms[0];
    return {
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2)
    };
  }

  public isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = this.tiles[y]?.[x];
    return tile ? tile.type !== 'WALL' : false;
  }

  public getTileAt(x: number, y: number): Tile | null {
    return this.tiles[y]?.[x] || null;
  }

  public updateTileAnimation(time: number): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.tiles[y][x].type === 'DOOR') {
          this.tiles[y][x].glowPhase = (time / 500 + x * 0.5 + y * 0.5) % (Math.PI * 2);
        }
      }
    }
  }
}
