import { onEvent, emitEvent } from './EventBus';

export interface MazeCell {
  x: number;
  z: number;
  isWall: boolean;
  isEntry: boolean;
  isExit: boolean;
}

export interface MazeData {
  size: number;
  cells: MazeCell[][];
  energyBalls: EnergyBall[];
  interferenceSpawnPoints: { x: number; z: number }[];
  walls: WallSegment[];
}

export interface EnergyBall {
  id: number;
  x: number;
  z: number;
  color: string;
  collected: boolean;
}

export interface WallSegment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

const COLORS = [
  '#FF3366',
  '#00E676',
  '#448AFF',
  '#D500F9',
];

const EXTRA_COLOR = '#FF9100';

export class MazeGenerator {
  private maze: MazeData | null = null;
  private energyBallIdCounter = 0;

  constructor() {
    onEvent('levelStart', this.handleLevelStart.bind(this));
  }

  private handleLevelStart(data: { level: number; mazeSize: number }): void {
    const { level, mazeSize } = data;
    this.generateMaze(mazeSize, level);
  }

  generateMaze(size: number, level: number): MazeData {
    this.energyBallIdCounter = 0;
    
    const grid: boolean[][] = this.generateCellularAutomaton(size, level);
    this.ensurePath(grid, 0, 0, size - 1, size - 1);
    
    grid[0][0] = false;
    grid[size - 1][size - 1] = false;

    const cells: MazeCell[][] = [];
    for (let z = 0; z < size; z++) {
      cells[z] = [];
      for (let x = 0; x < size; x++) {
        cells[z][x] = {
          x,
          z,
          isWall: grid[z][x],
          isEntry: x === 0 && z === 0,
          isExit: x === size - 1 && z === size - 1,
        };
      }
    }

    const walls = this.extractWallSegments(grid, size);

    const energyCount = 8 + (level - 1) * 3;
    const energyColors = this.getColorsForLevel(level);
    const energyBalls = this.placeEnergyBalls(grid, size, energyCount, energyColors);

    const interferenceCount = 5 + (level - 1) * 3;
    const interferenceSpawnPoints = this.getSpawnPoints(grid, size, interferenceCount);

    this.maze = {
      size,
      cells,
      energyBalls,
      interferenceSpawnPoints,
      walls,
    };

    return this.maze;
  }

  private getColorsForLevel(level: number): string[] {
    if (level >= 4) {
      return [...COLORS, EXTRA_COLOR];
    }
    const count = Math.min(level + 2, COLORS.length);
    return COLORS.slice(0, count);
  }

  private generateCellularAutomaton(size: number, level: number): boolean[][] {
    let grid: boolean[][] = [];
    
    const wallProbability = 0.4 + Math.random() * 0.05;
    for (let z = 0; z < size; z++) {
      grid[z] = [];
      for (let x = 0; x < size; x++) {
        if ((x <= 1 && z <= 1) || (x >= size - 2 && z >= size - 2)) {
          grid[z][x] = false;
        } else if (x === 0 || x === size - 1 || z === 0 || z === size - 1) {
          grid[z][x] = Math.random() < 0.7;
        } else {
          grid[z][x] = Math.random() < wallProbability;
        }
      }
    }

    const iterations = 4 + Math.min(level, 3);
    for (let i = 0; i < iterations; i++) {
      grid = this.stepAutomaton(grid, size);
    }

    return grid;
  }

  private stepAutomaton(grid: boolean[][], size: number): boolean[][] {
    const newGrid: boolean[][] = [];
    for (let z = 0; z < size; z++) {
      newGrid[z] = [];
      for (let x = 0; x < size; x++) {
        const wallCount = this.countWallNeighbors(grid, x, z, size);
        if (grid[z][x]) {
          newGrid[z][x] = wallCount >= 4;
        } else {
          newGrid[z][x] = wallCount >= 5;
        }
      }
    }
    return newGrid;
  }

  private countWallNeighbors(grid: boolean[][], x: number, z: number, size: number): number {
    let count = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dz === 0) continue;
        const nx = x + dx;
        const nz = z + dz;
        if (nx < 0 || nx >= size || nz < 0 || nz >= size) {
          count++;
        } else if (grid[nz][nx]) {
          count++;
        }
      }
    }
    return count;
  }

  private ensurePath(grid: boolean[][], sx: number, sz: number, ex: number, ez: number): void {
    const size = grid.length;
    const visited = new Set<string>();
    const queue: [{ x: number; z: number; path: { x: number; z: number }[] }] = [
      { x: sx, z: sz, path: [{ x: sx, z: sz }] },
    ];
    visited.add(`${sx},${sz}`);

    let found: { x: number; z: number }[] | null = null;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];

    while (queue.length > 0) {
      const { x, z, path } = queue.shift()!;
      if (x === ex && z === ez) {
        found = path;
        break;
      }
      for (const [dx, dz] of dirs) {
        const nx = x + dx;
        const nz = z + dz;
        const key = `${nx},${nz}`;
        if (
          nx >= 0 &&
          nx < size &&
          nz >= 0 &&
          nz < size &&
          !visited.has(key) &&
          !grid[nz][nx]
        ) {
          visited.add(key);
          queue.push({ x: nx, z: nz, path: [...path, { x: nx, z: nz }] });
        }
      }
    }

    if (!found) {
      let cx = sx;
      let cz = sz;
      while (cx !== ex || cz !== ez) {
        grid[cz][cx] = false;
        if (cx < ex) cx++;
        else if (cx > ex) cx--;
        if (cz < ez) cz++;
        else if (cz > ez) cz--;
      }
      grid[ez][ex] = false;
    } else {
      for (const cell of found) {
        grid[cell.z][cell.x] = false;
      }
    }
  }

  private extractWallSegments(grid: boolean[][], size: number): WallSegment[] {
    const segments: WallSegment[] = [];
    const offset = -(size - 1) / 2;

    for (let z = 0; z < size; z++) {
      let startX = -1;
      let runLength = 0;
      for (let x = 0; x <= size; x++) {
        const isWall = x < size && grid[z][x];
        const isValidRun = runLength >= 1 && runLength <= 2;
        
        if (isWall && startX === -1) {
          startX = x;
          runLength = 1;
        } else if (isWall) {
          runLength++;
        } else if (startX !== -1) {
          if (isValidRun) {
            segments.push({
              x1: offset + startX - 0.5,
              z1: offset + z,
              x2: offset + startX + runLength - 0.5,
              z2: offset + z,
            });
          }
          startX = -1;
          runLength = 0;
        }
      }
    }

    for (let x = 0; x < size; x++) {
      let startZ = -1;
      let runLength = 0;
      for (let z = 0; z <= size; z++) {
        const isWall = z < size && grid[z][x];
        const isValidRun = runLength >= 1 && runLength <= 2;

        if (isWall && startZ === -1) {
          startZ = z;
          runLength = 1;
        } else if (isWall) {
          runLength++;
        } else if (startZ !== -1) {
          if (isValidRun) {
            segments.push({
              x1: offset + x,
              z1: offset + startZ - 0.5,
              x2: offset + x,
              z2: offset + startZ + runLength - 0.5,
            });
          }
          startZ = -1;
          runLength = 0;
        }
      }
    }

    return segments;
  }

  private placeEnergyBalls(
    grid: boolean[][],
    size: number,
    count: number,
    colors: string[]
  ): EnergyBall[] {
    const offset = -(size - 1) / 2;
    const balls: EnergyBall[] = [];
    const occupied = new Set<string>();
    occupied.add(`0,0`);
    occupied.add(`${size - 1},${size - 1}`);

    let attempts = 0;
    while (balls.length < count && attempts < count * 100) {
      attempts++;
      const x = Math.floor(Math.random() * size);
      const z = Math.floor(Math.random() * size);
      const key = `${x},${z}`;
      if (!grid[z][x] && !occupied.has(key)) {
        occupied.add(key);
        balls.push({
          id: this.energyBallIdCounter++,
          x: offset + x + (Math.random() - 0.5) * 0.3,
          z: offset + z + (Math.random() - 0.5) * 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
          collected: false,
        });
      }
    }

    return balls;
  }

  private getSpawnPoints(
    grid: boolean[][],
    size: number,
    count: number
  ): { x: number; z: number }[] {
    const offset = -(size - 1) / 2;
    const points: { x: number; z: number }[] = [];
    const occupied = new Set<string>();

    let attempts = 0;
    while (points.length < count && attempts < count * 100) {
      attempts++;
      const x = Math.floor(Math.random() * size);
      const z = Math.floor(Math.random() * size);
      const key = `${x},${z}`;
      if (!grid[z][x] && !occupied.has(key)) {
        occupied.add(key);
        points.push({
          x: offset + x,
          z: offset + z,
        });
      }
    }

    return points;
  }

  getMaze(): MazeData | null {
    return this.maze;
  }

  isWallAt(mazeX: number, mazeZ: number, size: number): boolean {
    if (!this.maze) return true;
    const offset = (size - 1) / 2;
    const gx = Math.round(mazeX + offset);
    const gz = Math.round(mazeZ + offset);
    if (gx < 0 || gx >= size || gz < 0 || gz >= size) return true;
    return this.maze.cells[gz][gx].isWall;
  }

  checkWallCollision(x: number, z: number, radius: number, size: number): boolean {
    const samplePoints = [
      [x + radius, z],
      [x - radius, z],
      [x, z + radius],
      [x, z - radius],
      [x + radius * 0.7, z + radius * 0.7],
      [x - radius * 0.7, z + radius * 0.7],
      [x + radius * 0.7, z - radius * 0.7],
      [x - radius * 0.7, z - radius * 0.7],
    ];
    for (const [sx, sz] of samplePoints) {
      if (this.isWallAt(sx, sz, size)) {
        return true;
      }
    }
    return false;
  }
}

export const mazeGenerator = new MazeGenerator();
