import { BrickData } from '../game/engine';
import { GameRenderer } from '../game/renderer';

const COLOR_HP: Record<string, number> = {
  red: 3,
  blue: 2,
  green: 1
};

export class SceneManager {
  private renderer: GameRenderer;
  private grid: (BrickData | null)[][] = [];
  private selectedBrick: { x: number; y: number } | null = null;
  private currentColor: 'red' | 'blue' | 'green' = 'red';
  private fieldWidth = 30;
  private fieldHeight = 20;

  onSelectionChange: ((info: { x: number; y: number; color: string; hp: number } | null) => void) | null = null;

  constructor(renderer: GameRenderer) {
    this.renderer = renderer;
    this.grid = [];
    for (let y = 0; y < this.fieldHeight; y++) {
      const row: (BrickData | null)[] = [];
      for (let x = 0; x < this.fieldWidth; x++) {
        row.push(null);
      }
      this.grid.push(row);
    }
  }

  init(): void {
    this.renderer.showGrid();
  }

  destroy(): void {
    this.renderer.hideGrid();
    this.renderer.clearBrickMeshes();
  }

  setCurrentColor(color: 'red' | 'blue' | 'green'): void {
    this.currentColor = color;
  }

  handleClick(clientX: number, clientY: number): void {
    const { gx, gy } = this.renderer.screenToGame(clientX, clientY);
    const gridX = Math.floor(gx);
    const gridY = Math.floor(gy);

    if (gridX < 0 || gridX >= this.fieldWidth || gridY < 0 || gridY >= this.fieldHeight) return;

    const existing = this.grid[gridY][gridX];
    if (existing) {
      this.selectBrick(gridX, gridY);
    } else {
      this.placeBrick(gridX, gridY);
    }
  }

  handleRightClick(clientX: number, clientY: number): void {
    const { gx, gy } = this.renderer.screenToGame(clientX, clientY);
    const gridX = Math.floor(gx);
    const gridY = Math.floor(gy);

    if (gridX < 0 || gridX >= this.fieldWidth || gridY < 0 || gridY >= this.fieldHeight) return;

    if (this.grid[gridY][gridX]) {
      this.deleteBrick(gridX, gridY);
    }
  }

  private placeBrick(x: number, y: number): void {
    if (this.grid[y][x]) return;

    const brick: BrickData = {
      x, y,
      color: this.currentColor,
      hp: COLOR_HP[this.currentColor]
    };

    this.grid[y][x] = brick;
    this.renderer.createBrickMesh(brick, true);
    this.selectBrick(x, y);
  }

  private deleteBrick(x: number, y: number): void {
    if (!this.grid[y][x]) return;

    this.grid[y][x] = null;
    this.renderer.removeBrickMesh(x, y);

    if (this.selectedBrick && this.selectedBrick.x === x && this.selectedBrick.y === y) {
      this.selectedBrick = null;
      this.notifySelection(null);
    }
  }

  private selectBrick(x: number, y: number): void {
    this.selectedBrick = { x, y };
    const brick = this.grid[y][x];
    this.renderer.highlightBrick(x, y);

    if (brick) {
      this.notifySelection({ x, y, color: brick.color, hp: brick.hp });
    }
  }

  private notifySelection(info: { x: number; y: number; color: string; hp: number } | null): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(info);
    }
  }

  clearGrid(): void {
    for (let y = 0; y < this.fieldHeight; y++) {
      for (let x = 0; x < this.fieldWidth; x++) {
        this.grid[y][x] = null;
      }
    }
    this.renderer.clearBrickMeshes();
    this.selectedBrick = null;
    this.notifySelection(null);
  }

  exportLevel(): BrickData[] {
    const bricks: BrickData[] = [];
    for (let y = 0; y < this.fieldHeight; y++) {
      for (let x = 0; x < this.fieldWidth; x++) {
        const brick = this.grid[y][x];
        if (brick) {
          bricks.push({ ...brick });
        }
      }
    }
    return bricks;
  }

  importLevel(bricks: BrickData[]): void {
    this.clearGrid();
    for (const brick of bricks) {
      if (brick.x >= 0 && brick.x < this.fieldWidth && brick.y >= 0 && brick.y < this.fieldHeight) {
        const b: BrickData = {
          x: brick.x,
          y: brick.y,
          color: brick.color,
          hp: brick.hp > 0 ? brick.hp : COLOR_HP[brick.color] ?? 1
        };
        this.grid[brick.y][brick.x] = b;
        this.renderer.createBrickMesh(b, true);
      }
    }
  }

  loadBricksForGame(bricks: BrickData[]): BrickData[] {
    return bricks.map(b => ({
      ...b,
      hp: b.hp > 0 ? b.hp : COLOR_HP[b.color] ?? 1
    }));
  }
}
