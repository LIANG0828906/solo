export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  connections: Set<string>;
}

export interface Corridor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChestData {
  x: number;
  y: number;
  weaponType: WeaponType;
  opened: boolean;
}

export interface EnemySpawn {
  x: number;
  y: number;
  patrolPoints: { x: number; y: number }[];
}

export type WeaponType = 'sword' | 'bow' | 'staff' | 'shield';

export interface MazeData {
  width: number;
  height: number;
  rooms: Room[];
  corridors: Corridor[];
  playerSpawn: { x: number; y: number };
  exitPos: { x: number; y: number };
  chests: ChestData[];
  enemySpawns: EnemySpawn[];
  walls: { x: number; y: number; w: number; h: number }[];
}

const GRID_SIZE = 8;
const ROOM_SIZE = 50;
const CORRIDOR_WIDTH = 30;
const TOTAL_CELL = ROOM_SIZE + CORRIDOR_WIDTH;

export class MazeGenerator {
  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  public generate(): MazeData {
    const rooms: Room[] = [];
    const corridors: Corridor[] = [];
    const roomGrid: (Room | null)[][] = [];

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      roomGrid[gy] = [];
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        roomGrid[gy][gx] = null;
      }
    }

    const cellsToSplit: { x: number; y: number; w: number; h: number }[] = [
      { x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE }
    ];
    const finalCells: { x: number; y: number; w: number; h: number }[] = [];

    while (cellsToSplit.length > 0) {
      const cell = cellsToSplit.pop()!;
      const canSplitH = cell.w >= 2;
      const canSplitV = cell.h >= 2;

      if (!canSplitH && !canSplitV) {
        finalCells.push(cell);
        continue;
      }

      if (canSplitH && canSplitV) {
        if (Math.random() < 0.5) {
          const splitX = cell.x + this.rand(1, cell.w - 1);
          cellsToSplit.push({ x: cell.x, y: cell.y, w: splitX - cell.x, h: cell.h });
          cellsToSplit.push({ x: splitX, y: cell.y, w: cell.w - (splitX - cell.x), h: cell.h });
        } else {
          const splitY = cell.y + this.rand(1, cell.h - 1);
          cellsToSplit.push({ x: cell.x, y: cell.y, w: cell.w, h: splitY - cell.y });
          cellsToSplit.push({ x: cell.x, y: splitY, w: cell.w, h: cell.h - (splitY - cell.y) });
        }
      } else if (canSplitH) {
        const splitX = cell.x + this.rand(1, cell.w - 1);
        cellsToSplit.push({ x: cell.x, y: cell.y, w: splitX - cell.x, h: cell.h });
        cellsToSplit.push({ x: splitX, y: cell.y, w: cell.w - (splitX - cell.x), h: cell.h });
      } else {
        const splitY = cell.y + this.rand(1, cell.h - 1);
        cellsToSplit.push({ x: cell.x, y: cell.y, w: cell.w, h: splitY - cell.y });
        cellsToSplit.push({ x: cell.x, y: splitY, w: cell.w, h: cell.h - (splitY - cell.y) });
      }
    }

    for (const cell of finalCells) {
      const gx = cell.x + Math.floor(cell.w / 2);
      const gy = cell.y + Math.floor(cell.h / 2);
      if (roomGrid[gy] && roomGrid[gy][gx] === null) {
        const px = gx * TOTAL_CELL + CORRIDOR_WIDTH / 2;
        const py = gy * TOTAL_CELL + CORRIDOR_WIDTH / 2;
        const room: Room = {
          x: px,
          y: py,
          width: ROOM_SIZE,
          height: ROOM_SIZE,
          gridX: gx,
          gridY: gy,
          connections: new Set()
        };
        rooms.push(room);
        roomGrid[gy][gx] = room;
      }
    }

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        if (roomGrid[gy][gx] === null) {
          let nearest = this.findNearestRoom(roomGrid, gx, gy);
          if (nearest) {
            const px = gx * TOTAL_CELL + CORRIDOR_WIDTH / 2;
            const py = gy * TOTAL_CELL + CORRIDOR_WIDTH / 2;
            const room: Room = {
              x: px, y: py,
              width: ROOM_SIZE, height: ROOM_SIZE,
              gridX: gx, gridY: gy,
              connections: new Set()
            };
            rooms.push(room);
            roomGrid[gy][gx] = room;
          }
        }
      }
    }

    const adjacency: [string, string][] = [];
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        if (gx < GRID_SIZE - 1) {
          adjacency.push([`${gx},${gy}`, `${gx + 1},${gy}`]);
        }
        if (gy < GRID_SIZE - 1) {
          adjacency.push([`${gx},${gy}`, `${gx},${gy + 1}`]);
        }
      }
    }

    const shuffledAdj = this.shuffle(adjacency);
    const parent = new Map<string, string>();
    const find = (k: string): string => {
      if (!parent.has(k)) parent.set(k, k);
      let p = parent.get(k)!;
      while (p !== parent.get(p)) {
        parent.set(p, parent.get(parent.get(p)!)!);
        p = parent.get(p)!;
      }
      return p;
    };
    const union = (a: string, b: string) => {
      parent.set(find(a), find(b));
    };

    const connectedEdges = new Set<string>();
    for (const [a, b] of shuffledAdj) {
      const [ax, ay] = a.split(',').map(Number);
      const [bx, by] = b.split(',').map(Number);
      if (!roomGrid[ay][ax] || !roomGrid[by][bx]) continue;
      if (find(a) !== find(b)) {
        union(a, b);
        connectedEdges.add(`${a}|${b}`);
        connectedEdges.add(`${b}|${a}`);
        roomGrid[ay][ax]!.connections.add(b);
        roomGrid[by][bx]!.connections.add(a);
        this.createCorridor(roomGrid[ay][ax]!, roomGrid[by][bx]!, corridors);
      }
    }

    for (const [a, b] of shuffledAdj) {
      if (Math.random() < 0.3 && !connectedEdges.has(`${a}|${b}`)) {
        const [ax, ay] = a.split(',').map(Number);
        const [bx, by] = b.split(',').map(Number);
        if (!roomGrid[ay][ax] || !roomGrid[by][bx]) continue;
        connectedEdges.add(`${a}|${b}`);
        connectedEdges.add(`${b}|${a}`);
        roomGrid[ay][ax]!.connections.add(b);
        roomGrid[by][bx]!.connections.add(a);
        this.createCorridor(roomGrid[ay][ax]!, roomGrid[by][bx]!, corridors);
      }
    }

    const mazeWidth = GRID_SIZE * TOTAL_CELL + CORRIDOR_WIDTH / 2;
    const mazeHeight = GRID_SIZE * TOTAL_CELL + CORRIDOR_WIDTH / 2;

    const startRoom = roomGrid[0][0]!;
    const playerSpawn = {
      x: startRoom.x + ROOM_SIZE / 2,
      y: startRoom.y + ROOM_SIZE / 2
    };

    const endRoom = roomGrid[GRID_SIZE - 1][GRID_SIZE - 1]!;
    const exitPos = {
      x: endRoom.x + ROOM_SIZE / 2,
      y: endRoom.y + ROOM_SIZE / 2
    };

    const chests: ChestData[] = [];
    const weaponTypes: WeaponType[] = ['sword', 'bow', 'staff', 'shield'];
    const weaponCounts = new Map<WeaponType, number>();
    weaponTypes.forEach(w => weaponCounts.set(w, 0));
    const chestCount = this.rand(15, 20);
    const shuffledRooms = this.shuffle(rooms.filter(r => r !== startRoom && r !== endRoom));
    let placed = 0;
    for (let i = 0; i < shuffledRooms.length && placed < chestCount; i++) {
      const room = shuffledRooms[i];
      let wt: WeaponType;
      do {
        wt = weaponTypes[this.rand(0, 3)];
      } while (weaponCounts.get(wt)! >= 5 && weaponCounts.get(weaponTypes[0])! < 5);
      if (weaponCounts.get(wt)! < 5) {
        weaponCounts.set(wt, weaponCounts.get(wt)! + 1);
      } else {
        wt = weaponTypes.find(t => weaponCounts.get(t)! < 5) || wt;
        weaponCounts.set(wt, weaponCounts.get(wt)! + 1);
      }
      chests.push({
        x: room.x + this.rand(5, ROOM_SIZE - 25),
        y: room.y + this.rand(5, ROOM_SIZE - 25),
        weaponType: wt,
        opened: false
      });
      placed++;
    }

    const enemySpawns: EnemySpawn[] = [];
    const enemyCount = this.rand(6, 8);
    const enemyRooms = this.shuffle(shuffledRooms).slice(0, enemyCount);
    for (const room of enemyRooms) {
      const points = this.generatePatrolPoints(room);
      enemySpawns.push({
        x: points[0].x,
        y: points[0].y,
        patrolPoints: points
      });
    }

    const walls = this.generateWalls(rooms, corridors, mazeWidth, mazeHeight);

    return {
      width: mazeWidth,
      height: mazeHeight,
      rooms,
      corridors,
      playerSpawn,
      exitPos,
      chests,
      enemySpawns,
      walls
    };
  }

  private findNearestRoom(grid: (Room | null)[][], gx: number, gy: number): Room | null {
    for (let d = 1; d < GRID_SIZE; d++) {
      for (let dy = -d; dy <= d; dy++) {
        for (let dx = -d; dx <= d; dx++) {
          const nx = gx + dx, ny = gy + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[ny][nx]) {
            return grid[ny][nx];
          }
        }
      }
    }
    return null;
  }

  private createCorridor(a: Room, b: Room, corridors: Corridor[]): void {
    const ax = a.x + a.width / 2;
    const ay = a.y + a.height / 2;
    const bx = b.x + b.width / 2;
    const by = b.y + b.height / 2;

    if (Math.abs(ax - bx) > Math.abs(ay - by)) {
      const x1 = Math.min(ax, bx);
      const x2 = Math.max(ax, bx);
      corridors.push({
        x: x1,
        y: ay - CORRIDOR_WIDTH / 2,
        width: x2 - x1,
        height: CORRIDOR_WIDTH
      });
    } else {
      const y1 = Math.min(ay, by);
      const y2 = Math.max(ay, by);
      corridors.push({
        x: ax - CORRIDOR_WIDTH / 2,
        y: y1,
        width: CORRIDOR_WIDTH,
        height: y2 - y1
      });
    }
  }

  private generatePatrolPoints(room: Room): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const count = this.rand(2, 4);
    for (let i = 0; i < count; i++) {
      points.push({
        x: room.x + this.rand(5, ROOM_SIZE - 25),
        y: room.y + this.rand(5, ROOM_SIZE - 25)
      });
    }
    return points;
  }

  private generateWalls(rooms: Room[], corridors: Corridor[], mw: number, mh: number): { x: number; y: number; w: number; h: number }[] {
    const walls: { x: number; y: number; w: number; h: number }[] = [];
    const cell = 5;
    const walkable = new Set<string>();

    for (const r of rooms) {
      for (let y = Math.floor(r.y / cell); y < Math.ceil((r.y + r.height) / cell); y++) {
        for (let x = Math.floor(r.x / cell); x < Math.ceil((r.x + r.width) / cell); x++) {
          walkable.add(`${x},${y}`);
        }
      }
    }
    for (const c of corridors) {
      for (let y = Math.floor(c.y / cell); y < Math.ceil((c.y + c.height) / cell); y++) {
        for (let x = Math.floor(c.x / cell); x < Math.ceil((c.x + c.width) / cell); x++) {
          walkable.add(`${x},${y}`);
        }
      }
    }

    const maxX = Math.ceil(mw / cell) + 1;
    const maxY = Math.ceil(mh / cell) + 1;
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < maxX; x++) {
        if (!walkable.has(`${x},${y}`)) {
          const neighbours = [
            walkable.has(`${x - 1},${y}`), walkable.has(`${x + 1},${y}`),
            walkable.has(`${x},${y - 1}`), walkable.has(`${x},${y + 1}`)
          ];
          if (neighbours.some(n => n)) {
            walls.push({ x: x * cell, y: y * cell, w: cell, h: cell });
          }
        }
      }
    }

    return walls;
  }
}
