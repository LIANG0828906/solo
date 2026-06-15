export interface Point {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  doors: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  spawnPoints: Point[];
  isLocked: boolean;
  hasKeyFragment: boolean;
  keyPosition: Point;
  fragmentCollected: boolean;
  walls: boolean[][];
}

// 网格配置常量
export const CELL_SIZE = 30;       // 每格像素大小
export const GRID_COLS = 15;       // 房间横向格子数
export const GRID_ROWS = 15;       // 房间纵向格子数
// 房间总像素尺寸: 15 * 30 = 450 x 450 像素

export const ROOM_GRID_SIZE = 6;
export const START_ROOM_X = 3;
export const START_ROOM_Y = 3;

export function getRoomPixelSize(): { width: number; height: number } {
  return {
    width: GRID_COLS * CELL_SIZE,
    height: GRID_ROWS * CELL_SIZE
  };
}

export class GameMap {
  rooms: Room[][] = [];
  currentRoomX: number = START_ROOM_X;
  currentRoomY: number = START_ROOM_Y;

  constructor() {
    this.generateRooms();
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomWalkablePosition(
    walls: boolean[][],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    maxAttempts: number = 100
  ): Point | null {
    for (let i = 0; i < maxAttempts; i++) {
      const x = this.rand(minX, maxX);
      const y = this.rand(minY, maxY);
      if (!walls[y][x]) {
        return { x, y };
      }
    }
    return null;
  }

  private generateRooms(): void {
    for (let y = 0; y < ROOM_GRID_SIZE; y++) {
      this.rooms[y] = [];
      for (let x = 0; x < ROOM_GRID_SIZE; x++) {
        this.rooms[y][x] = this.createRoom(x, y);
      }
    }

    for (let y = 0; y < ROOM_GRID_SIZE; y++) {
      for (let x = 0; x < ROOM_GRID_SIZE; x++) {
        const room = this.rooms[y][x];
        room.doors.top = y > 0;
        room.doors.bottom = y < ROOM_GRID_SIZE - 1;
        room.doors.left = x > 0;
        room.doors.right = x < ROOM_GRID_SIZE - 1;
      }
    }

    const fragmentRooms = this.selectFragmentRooms();
    fragmentRooms.forEach(pos => {
      const room = this.rooms[pos.y][pos.x];
      room.hasKeyFragment = true;
      const keyPos = this.getRandomWalkablePosition(room.walls, 3, GRID_COLS - 4, 3, GRID_ROWS - 4);
      if (keyPos) {
        room.keyPosition = keyPos;
      }
    });
  }

  private selectFragmentRooms(): Point[] {
    const positions: Point[] = [];
    for (let y = 0; y < ROOM_GRID_SIZE; y++) {
      for (let x = 0; x < ROOM_GRID_SIZE; x++) {
        if (!(x === START_ROOM_X && y === START_ROOM_Y)) {
          positions.push({ x, y });
        }
      }
    }
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions.slice(0, 6);
  }

  private createRoom(x: number, y: number): Room {
    const walls: boolean[][] = [];
    for (let ry = 0; ry < GRID_ROWS; ry++) {
      walls[ry] = [];
      for (let rx = 0; rx < GRID_COLS; rx++) {
        walls[ry][rx] = false;
      }
    }

    // 生成四周墙壁
    for (let rx = 0; rx < GRID_COLS; rx++) {
      walls[0][rx] = true;
      walls[GRID_ROWS - 1][rx] = true;
    }
    for (let ry = 0; ry < GRID_ROWS; ry++) {
      walls[ry][0] = true;
      walls[ry][GRID_COLS - 1] = true;
    }

    // 留出门口位置（四个方向中间）
    const midX = Math.floor(GRID_COLS / 2);
    const midY = Math.floor(GRID_ROWS / 2);
    walls[0][midX] = false;
    walls[GRID_ROWS - 1][midX] = false;
    walls[midY][0] = false;
    walls[midY][GRID_COLS - 1] = false;

    // 生成内部随机墙壁
    const wallCount = this.rand(3, 8);
    for (let i = 0; i < wallCount; i++) {
      const wx = this.rand(2, GRID_COLS - 3);
      const wy = this.rand(2, GRID_ROWS - 3);
      const horizontal = Math.random() > 0.5;
      const length = this.rand(2, 4);
      for (let j = 0; j < length; j++) {
        if (horizontal) {
          if (wx + j < GRID_COLS - 2) walls[wy][wx + j] = true;
        } else {
          if (wy + j < GRID_ROWS - 2) walls[wy + j][wx] = true;
        }
      }
    }

    // 生成怪物生成点（确保不在墙上）
    const spawnCount = this.rand(2, 4);
    const spawnPoints: Point[] = [];
    const corners = [
      { x: 2, y: 2 },
      { x: GRID_COLS - 3, y: 2 },
      { x: 2, y: GRID_ROWS - 3 },
      { x: GRID_COLS - 3, y: GRID_ROWS - 3 }
    ];

    const shuffledCorners = [...corners].sort(() => Math.random() - 0.5);
    for (const corner of shuffledCorners) {
      if (spawnPoints.length >= spawnCount) break;
      if (!walls[corner.y][corner.x]) {
        spawnPoints.push(corner);
      }
    }

    while (spawnPoints.length < spawnCount) {
      const pos = this.getRandomWalkablePosition(walls, 2, GRID_COLS - 3, 2, GRID_ROWS - 3);
      if (pos && !spawnPoints.some(p => p.x === pos.x && p.y === pos.y)) {
        spawnPoints.push(pos);
      } else {
        break;
      }
    }

    // 确保玩家出生点（中心位置）不在墙上
    const playerSpawnX = Math.floor(GRID_COLS / 2);
    const playerSpawnY = Math.floor(GRID_ROWS / 2);
    if (walls[playerSpawnY][playerSpawnX]) {
      walls[playerSpawnY][playerSpawnX] = false;
    }

    return {
      x,
      y,
      doors: { top: false, right: false, bottom: false, left: false },
      spawnPoints,
      isLocked: false,
      hasKeyFragment: false,
      keyPosition: { x: 0, y: 0 },
      fragmentCollected: false,
      walls
    };
  }

  getCurrentRoom(): Room {
    return this.rooms[this.currentRoomY][this.currentRoomX];
  }

  canMove(direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    const room = this.getCurrentRoom();
    return room.doors[direction];
  }

  moveToRoom(direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    if (!this.canMove(direction)) return false;
    switch (direction) {
      case 'top': this.currentRoomY--; break;
      case 'bottom': this.currentRoomY++; break;
      case 'left': this.currentRoomX--; break;
      case 'right': this.currentRoomX++; break;
    }
    this.getCurrentRoom().isLocked = true;
    return true;
  }

  isWalkable(gridX: number, gridY: number, room: Room): boolean {
    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return false;
    return !room.walls[gridY][gridX];
  }

  findPath(start: Point, end: Point, room: Room): Point[] {
    if (start.x === end.x && start.y === end.y) return [start];

    const visited = new Set<string>();
    const queue: { point: Point; path: Point[] }[] = [];
    queue.push({ point: start, path: [start] });
    visited.add(`${start.x},${start.y}`);

    const dirs = [
      { x: 0, y: -1 }, { x: 1, y: 0 },
      { x: 0, y: 1 }, { x: -1, y: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dir of dirs) {
        const nx = current.point.x + dir.x;
        const ny = current.point.y + dir.y;
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        if (!this.isWalkable(nx, ny, room) && !(nx === end.x && ny === end.y)) continue;
        visited.add(key);
        const newPath = [...current.path, { x: nx, y: ny }];
        if (nx === end.x && ny === end.y) return newPath;
        queue.push({ point: { x: nx, y: ny }, path: newPath });
      }
    }
    return [];
  }

  getPlayerSpawnPosition(): Point {
    return { x: Math.floor(GRID_COLS / 2), y: Math.floor(GRID_ROWS / 2) };
  }

  getDoorPosition(direction: 'top' | 'right' | 'bottom' | 'left'): Point {
    switch (direction) {
      case 'top': return { x: Math.floor(GRID_COLS / 2), y: 0 };
      case 'bottom': return { x: Math.floor(GRID_COLS / 2), y: GRID_ROWS - 1 };
      case 'left': return { x: 0, y: Math.floor(GRID_ROWS / 2) };
      case 'right': return { x: GRID_COLS - 1, y: Math.floor(GRID_ROWS / 2) };
    }
  }
}
