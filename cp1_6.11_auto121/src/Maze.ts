export const TILE_SIZE = 40;
export const MAZE_WIDTH = 20;
export const MAZE_HEIGHT = 20;

export type CellType = 0 | 1;

export class Maze {
  public grid: CellType[][];
  public width: number;
  public height: number;

  constructor(width: number = MAZE_WIDTH, height: number = MAZE_HEIGHT) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.generate();
  }

  private generate(): void {
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = 1;
      }
    }

    const stack: { x: number; y: number }[] = [];
    const startX = 1;
    const startY = 1;
    this.grid[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    const directions = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 }
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors: { x: number; y: number; dir: { dx: number; dy: number } }[] = [];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        if (
          nx > 0 && nx < this.width - 1 &&
          ny > 0 && ny < this.height - 1 &&
          this.grid[ny][nx] === 1
        ) {
          neighbors.push({ x: nx, y: ny, dir });
        }
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.grid[current.y + next.dir.dy / 2][current.x + next.dir.dx / 2] = 0;
        this.grid[next.y][next.x] = 0;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x] === 1 && Math.random() < 0.08) {
          const openCount = [
            this.grid[y - 1][x] === 0 ? 1 : 0,
            this.grid[y + 1][x] === 0 ? 1 : 0,
            this.grid[y][x - 1] === 0 ? 1 : 0,
            this.grid[y][x + 1] === 0 ? 1 : 0
          ].reduce((a, b) => a + b, 0);
          if (openCount >= 2) {
            this.grid[y][x] = 0;
          }
        }
      }
    }
  }

  public isWall(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return true;
    }
    return this.grid[gridY][gridX] === 1;
  }

  public isWalkable(gridX: number, gridY: number): boolean {
    return !this.isWall(gridX, gridY);
  }

  public getEmptyCells(): { x: number; y: number }[] {
    const cells: { x: number; y: number }[] = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x] === 0) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        if (this.grid[y][x] === 1) {
          ctx.fillStyle = '#2C2F33';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = '#383C42';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }
}
