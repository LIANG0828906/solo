import { CellType, PowerUpEffectType, PowerUpEffectsMap } from '../types';

export class MazeGenerator {
  private size: number;
  private grid: CellType[][];
  private powerUpEffects: PowerUpEffectsMap;
  private effectTypes: PowerUpEffectType[] = [
    PowerUpEffectType.SPEED_BOOST,
    PowerUpEffectType.GHOST_FREEZE,
    PowerUpEffectType.SCORE_MULTIPLIER,
  ];

  constructor(size: number = 15) {
    this.size = size % 2 === 0 ? size + 1 : size;
    this.grid = [];
    this.powerUpEffects = {};
  }

  public generate(): { maze: CellType[][]; effects: PowerUpEffectsMap } {
    this.initializeGrid();
    this.carvePassages(1, 1);
    this.placeDots();
    this.placePowerUps();
    return { maze: this.grid, effects: { ...this.powerUpEffects } };
  }

  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.size; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < this.size; x++) {
        row.push(CellType.WALL);
      }
      this.grid.push(row);
    }
  }

  private carvePassages(x: number, y: number): void {
    this.grid[y][x] = CellType.PATH;

    const directions = this.shuffle([
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 },
    ]);

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (this.isValid(nx, ny) && this.grid[ny][nx] === CellType.WALL) {
        this.grid[y + dir.dy / 2][x + dir.dx / 2] = CellType.PATH;
        this.carvePassages(nx, ny);
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private isValid(x: number, y: number): boolean {
    return x > 0 && x < this.size - 1 && y > 0 && y < this.size - 1;
  }

  private placeDots(): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] === CellType.PATH) {
          this.grid[y][x] = CellType.PATH;
        }
      }
    }
  }

  private placePowerUps(): void {
    this.powerUpEffects = {};
    const pathCells: { x: number; y: number }[] = [];

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] === CellType.PATH) {
          const isNearStart = x <= 2 && y <= 2;
          const isNearEnd = x >= this.size - 3 && y >= this.size - 3;
          if (!isNearStart && !isNearEnd) {
            pathCells.push({ x, y });
          }
        }
      }
    }

    const shuffled = this.shuffle(pathCells);
    const powerUpCount = Math.min(4, shuffled.length);

    for (let i = 0; i < powerUpCount; i++) {
      const cell = shuffled[i];
      this.grid[cell.y][cell.x] = CellType.POWER_UP;
      const effectType = this.effectTypes[Math.floor(Math.random() * this.effectTypes.length)];
      this.powerUpEffects[`${cell.x},${cell.y}`] = effectType;
    }
  }

  public countDots(maze: CellType[][]): number {
    let count = 0;
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === CellType.PATH) {
          count++;
        }
      }
    }
    return count;
  }

  public respawnPowerUps(maze: CellType[][]): { maze: CellType[][]; effects: PowerUpEffectsMap } {
    const newMaze = maze.map(row => [...row]);
    const newEffects: PowerUpEffectsMap = {};
    const pathCells: { x: number; y: number }[] = [];

    for (let y = 0; y < newMaze.length; y++) {
      for (let x = 0; x < newMaze[y].length; x++) {
        if (newMaze[y][x] === CellType.PATH) {
          const isCorner = (x <= 2 && y <= 2) || 
                          (x >= newMaze[y].length - 3 && y >= newMaze.length - 3) ||
                          (x <= 2 && y >= newMaze.length - 3) ||
                          (x >= newMaze[y].length - 3 && y <= 2);
          if (!isCorner) {
            pathCells.push({ x, y });
          }
        }
      }
    }

    for (let y = 0; y < newMaze.length; y++) {
      for (let x = 0; x < newMaze[y].length; x++) {
        if (newMaze[y][x] === CellType.POWER_UP) {
          newMaze[y][x] = CellType.PATH;
          pathCells.push({ x, y });
        }
      }
    }

    const shuffled = this.shuffle(pathCells);
    const powerUpCount = Math.min(4, shuffled.length);

    for (let i = 0; i < powerUpCount; i++) {
      const cell = shuffled[i];
      newMaze[cell.y][cell.x] = CellType.POWER_UP;
      const effectType = this.effectTypes[Math.floor(Math.random() * this.effectTypes.length)];
      newEffects[`${cell.x},${cell.y}`] = effectType;
    }

    return { maze: newMaze, effects: newEffects };
  }

  public getStartPosition(): { x: number; y: number } {
    return { x: 1, y: 1 };
  }

  public getGhostStartPositions(count: number): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const centerX = Math.floor(this.size / 2);
    const centerY = Math.floor(this.size / 2);

    const candidates = [
      { x: centerX, y: centerY },
      { x: centerX - 2, y: centerY },
      { x: centerX + 2, y: centerY },
      { x: centerX, y: centerY - 2 },
    ];

    for (const pos of candidates) {
      if (
        pos.x > 0 && pos.x < this.size - 1 &&
        pos.y > 0 && pos.y < this.size - 1 &&
        this.grid[pos.y][pos.x] !== CellType.WALL
      ) {
        positions.push(pos);
      }
    }

    while (positions.length < count) {
      const x = Math.floor(Math.random() * (this.size - 2)) + 1;
      const y = Math.floor(Math.random() * (this.size - 2)) + 1;
      if (this.grid[y][x] !== CellType.WALL) {
        positions.push({ x, y });
      }
    }

    return positions.slice(0, count);
  }

  public getPlayer2StartPosition(): { x: number; y: number } {
    return { x: this.size - 2, y: this.size - 2 };
  }
}
