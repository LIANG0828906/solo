export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  connected: boolean;
}

export interface Corridor {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EnemyData {
  x: number;
  y: number;
  roomGridX: number;
  roomGridY: number;
}

export interface ChestData {
  x: number;
  y: number;
  roomGridX: number;
  roomGridY: number;
}

export interface DungeonData {
  width: number;
  height: number;
  tileSize: number;
  tiles: number[][];
  rooms: Room[];
  corridors: Corridor[];
  enemies: EnemyData[];
  chests: ChestData[];
  exitRoom: { gridX: number; gridY: number; x: number; y: number };
  spawnRoom: { gridX: number; gridY: number; x: number; y: number };
}

export class DungeonGenerator {
  private seed: number;
  private gridRooms: number;
  private tileSize: number = 16;

  constructor(seed: number, gridRooms: number = 8) {
    this.seed = seed;
    this.gridRooms = gridRooms;
  }

  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public generate(): DungeonData {
    const rooms: Room[] = [];
    const gridRoomSize = 8;
    const totalWidth = this.gridRooms * gridRoomSize * this.tileSize;
    const totalHeight = this.gridRooms * gridRoomSize * this.tileSize;

    const grid: (Room | null)[][] = [];
    for (let y = 0; y < this.gridRooms; y++) {
      grid[y] = [];
      for (let x = 0; x < this.gridRooms; x++) {
        grid[y][x] = null;
      }
    }

    const minRooms = 10;
    const maxRooms = Math.min(20, this.gridRooms * this.gridRooms);
    const targetRooms = this.randomInt(minRooms, maxRooms);

    const centerX = Math.floor(this.gridRooms / 2);
    const centerY = Math.floor(this.gridRooms / 2);

    const queue: { gx: number; gy: number }[] = [{ gx: centerX, gy: centerY }];
    const visited = new Set<string>();
    visited.add(`${centerX},${centerY}`);

    while (rooms.length < targetRooms && queue.length > 0) {
      const idx = this.randomInt(0, queue.length - 1);
      const pos = queue.splice(idx, 1)[0];

      const roomWidth = this.randomInt(3, 6);
      const roomHeight = this.randomInt(3, 6);
      const roomOffsetX = this.randomInt(1, gridRoomSize - roomWidth - 1);
      const roomOffsetY = this.randomInt(1, gridRoomSize - roomHeight - 1);

      const room: Room = {
        gridX: pos.gx,
        gridY: pos.gy,
        x: (pos.gx * gridRoomSize + roomOffsetX) * this.tileSize,
        y: (pos.gy * gridRoomSize + roomOffsetY) * this.tileSize,
        width: roomWidth * this.tileSize,
        height: roomHeight * this.tileSize,
        connected: rooms.length === 0
      };

      grid[pos.gy][pos.gx] = room;
      rooms.push(room);

      const neighbors = [
        { gx: pos.gx + 1, gy: pos.gy },
        { gx: pos.gx - 1, gy: pos.gy },
        { gx: pos.gx, gy: pos.gy + 1 },
        { gx: pos.gx, gy: pos.gy - 1 }
      ];

      for (const n of neighbors) {
        if (n.gx >= 0 && n.gx < this.gridRooms && n.gy >= 0 && n.gy < this.gridRooms) {
          const key = `${n.gx},${n.gy}`;
          if (!visited.has(key) && rooms.length < targetRooms) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    const corridors: Corridor[] = [];
    for (const room of rooms) {
      const neighbors: Room[] = [];
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
      ];
      for (const d of dirs) {
        const nx = room.gridX + d.dx;
        const ny = room.gridY + d.dy;
        if (nx >= 0 && nx < this.gridRooms && ny >= 0 && ny < this.gridRooms && grid[ny][nx]) {
          neighbors.push(grid[ny][nx]!);
        }
      }

      const shuffledNeighbors = this.shuffle(neighbors);
      for (const neighbor of shuffledNeighbors) {
        if (!neighbor.connected || this.random() < 0.3) {
          const r1cx = room.x + room.width / 2;
          const r1cy = room.y + room.height / 2;
          const r2cx = neighbor.x + neighbor.width / 2;
          const r2cy = neighbor.y + neighbor.height / 2;

          if (this.random() < 0.5) {
            corridors.push({ x1: r1cx, y1: r1cy, x2: r2cx, y2: r1cy });
            corridors.push({ x1: r2cx, y1: r1cy, x2: r2cx, y2: r2cy });
          } else {
            corridors.push({ x1: r1cx, y1: r1cy, x2: r1cx, y2: r2cy });
            corridors.push({ x1: r1cx, y1: r2cy, x2: r2cx, y2: r2cy });
          }

          room.connected = true;
          neighbor.connected = true;
        }
      }
    }

    const cols = Math.floor(totalWidth / this.tileSize);
    const rows = Math.floor(totalHeight / this.tileSize);
    const tiles: number[][] = [];
    for (let y = 0; y < rows; y++) {
      tiles[y] = [];
      for (let x = 0; x < cols; x++) {
        tiles[y][x] = this.randomInt(0, 3);
      }
    }

    for (const room of rooms) {
      const startX = Math.floor(room.x / this.tileSize);
      const startY = Math.floor(room.y / this.tileSize);
      const endX = startX + Math.floor(room.width / this.tileSize);
      const endY = startY + Math.floor(room.height / this.tileSize);
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (y >= 0 && y < rows && x >= 0 && x < cols) {
            tiles[y][x] = this.randomInt(4, 7);
          }
        }
      }
    }

    for (const corridor of corridors) {
      const x1 = Math.floor(Math.min(corridor.x1, corridor.x2) / this.tileSize);
      const x2 = Math.floor(Math.max(corridor.x1, corridor.x2) / this.tileSize);
      const y1 = Math.floor(Math.min(corridor.y1, corridor.y2) / this.tileSize);
      const y2 = Math.floor(Math.max(corridor.y1, corridor.y2) / this.tileSize);

      for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
          if (y >= 0 && y < rows && x >= 0 && x < cols) {
            tiles[y][x] = this.randomInt(4, 7);
          }
        }
      }
    }

    const spawnRoom = rooms[0];
    const sortedRooms = [...rooms].sort((a, b) => {
      const da = Math.abs(a.gridX - spawnRoom.gridX) + Math.abs(a.gridY - spawnRoom.gridY);
      const db = Math.abs(b.gridX - spawnRoom.gridX) + Math.abs(b.gridY - spawnRoom.gridY);
      return db - da;
    });
    const exitRoom = sortedRooms[0];

    const enemies: EnemyData[] = [];
    let totalEnemies = 0;
    for (let i = 1; i < rooms.length && totalEnemies < 20; i++) {
      const room = rooms[i];
      const enemyCount = this.randomInt(1, 3);
      for (let j = 0; j < enemyCount && totalEnemies < 20; j++) {
        const ex = room.x + this.randomInt(this.tileSize, room.width - this.tileSize * 2);
        const ey = room.y + this.randomInt(this.tileSize, room.height - this.tileSize * 2);
        enemies.push({
          x: ex,
          y: ey,
          roomGridX: room.gridX,
          roomGridY: room.gridY
        });
        totalEnemies++;
      }
    }

    const chests: ChestData[] = [];
    const nonSpawnExitRooms = rooms.filter(r => r !== spawnRoom && r !== exitRoom);
    const shuffledChestRooms = this.shuffle(nonSpawnExitRooms.length >= 3 ? nonSpawnExitRooms : rooms.filter(r => r !== spawnRoom));
    for (let i = 0; i < 3 && i < shuffledChestRooms.length; i++) {
      const room = shuffledChestRooms[i];
      const cx = room.x + Math.floor(room.width / 2) - this.tileSize / 2;
      const cy = room.y + Math.floor(room.height / 2) - this.tileSize / 2;
      chests.push({
        x: cx,
        y: cy,
        roomGridX: room.gridX,
        roomGridY: room.gridY
      });
      const tx = Math.floor(cx / this.tileSize);
      const ty = Math.floor(cy / this.tileSize);
      if (ty >= 0 && ty < rows && tx >= 0 && tx < cols) {
        tiles[ty][tx] = 8;
      }
    }

    return {
      width: totalWidth,
      height: totalHeight,
      tileSize: this.tileSize,
      tiles,
      rooms,
      corridors,
      enemies,
      chests,
      exitRoom: {
        gridX: exitRoom.gridX,
        gridY: exitRoom.gridY,
        x: exitRoom.x + exitRoom.width / 2 - this.tileSize / 2,
        y: exitRoom.y + exitRoom.height / 2 - this.tileSize / 2
      },
      spawnRoom: {
        gridX: spawnRoom.gridX,
        gridY: spawnRoom.gridY,
        x: spawnRoom.x + spawnRoom.width / 2 - this.tileSize / 2,
        y: spawnRoom.y + spawnRoom.height / 2 - this.tileSize / 2
      }
    };
  }
}
