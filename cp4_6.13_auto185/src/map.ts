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

export const GRID_COLS = 15;
export const GRID_ROWS = 15;
export const CELL_SIZE = 30;
export const ROOM_GRID_SIZE = 6;
export const START_ROOM_X = 3;
export const START_ROOM_Y = 3;

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
      room.keyPosition = {
        x: this.rand(3, GRID_COLS - 4),
        y: this.rand(3, GRID_ROWS - 4)
      };
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

    for (let rx = 0; rx < GRID_COLS; rx++) {
      walls[0][rx] = true;
      walls[GRID_ROWS - 1][rx] = true;
    }
    for (let ry = 0; ry < GRID_ROWS; ry++) {
      walls[ry][0] = true;
      walls[ry][GRID_COLS - 1] = true;
    }

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

    const spawnCount = this.rand(2, 4);
    const spawnPoints: Point[] = [];
    const corners = [
      { x: 2, y: 2 },
      { x: GRID_COLS - 3, y: 2 },
      { x: 2, y: GRID_ROWS - 3 },
      { x: GRID_COLS - 3, y: GRID_ROWS - 3 }
    ];
    for (let i = 0; i < spawnCount && i < corners.length; i++) {
      const idx = this.rand(0, corners.length - 1);
      spawnPoints.push(corners.splice(idx, 1)[0]);
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
