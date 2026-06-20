export const GRID_SIZE = 30;
export const CELL_PX = 40;
export const CANVAS_PX = GRID_SIZE * CELL_PX;

type CellType = 'grass' | 'wall' | 'chest';

interface Cell {
  type: CellType;
  x: number;
  y: number;
  opened?: boolean;
}

export class GameMap {
  private cells: Cell[][];

  constructor() {
    this.cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.cells[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.cells[y][x] = { type: 'grass', x, y };
      }
    }
  }

  private worldToGrid(wx: number, wy: number): { gx: number; gy: number } {
    return {
      gx: Math.floor(wx / CELL_PX),
      gy: Math.floor(wy / CELL_PX),
    };
  }

  isWalkableWorld(wx: number, wy: number): boolean {
    const { gx, gy } = this.worldToGrid(wx, wy);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return false;
    return this.cells[gy][gx].type !== 'wall';
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = this.cells[y][x];
        const px = x * CELL_PX;
        const py = y * CELL_PX;
        if (cell.type === 'wall') {
          ctx.fillStyle = '#3A3A4A';
          ctx.fillRect(px, py, CELL_PX, CELL_PX);
          ctx.strokeStyle = '#2A2A3A';
          ctx.strokeRect(px, py, CELL_PX, CELL_PX);
        } else {
          ctx.fillStyle = '#1E2A1E';
          ctx.fillRect(px, py, CELL_PX, CELL_PX);
          ctx.strokeStyle = '#2A3A2A';
          ctx.strokeRect(px, py, CELL_PX, CELL_PX);
        }
      }
    }
  }
}
