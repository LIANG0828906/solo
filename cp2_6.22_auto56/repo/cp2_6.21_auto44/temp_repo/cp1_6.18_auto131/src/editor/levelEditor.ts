import { Baffle, BaffleOrientation, Vector2D, GAME_CONFIG, COLORS } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class LevelEditor {
  private baffles: Baffle[] = [];
  private selectedBaffleId: string | null = null;
  private isDragging: boolean = false;
  private dragOffset: Vector2D = { x: 0, y: 0 };
  private gridSize: number = GAME_CONFIG.GRID_SIZE;
  private maxBaffles: number = GAME_CONFIG.MAX_BAFFLES;

  constructor() {}

  setBaffles(baffles: Baffle[]): void {
    this.baffles = baffles.map(b => ({ ...b }));
  }

  getBaffles(): Baffle[] {
    return this.baffles.map(b => ({ ...b }));
  }

  getSelectedBaffleId(): string | null {
    return this.selectedBaffleId;
  }

  getIsDragging(): boolean {
    return this.isDragging;
  }

  snapToGrid(value: number): number {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  addBaffle(x: number, y: number): Baffle | null {
    if (this.baffles.length >= this.maxBaffles) {
      return null;
    }

    const snappedX = this.snapToGrid(x - GAME_CONFIG.BAFFLE_LENGTH / 2);
    const snappedY = this.snapToGrid(y - GAME_CONFIG.BAFFLE_WIDTH / 2);

    const newBaffle: Baffle = {
      id: uuidv4(),
      x: snappedX,
      y: snappedY,
      length: GAME_CONFIG.BAFFLE_LENGTH,
      width: GAME_CONFIG.BAFFLE_WIDTH,
      orientation: 'horizontal',
      color: COLORS.BAFFLE_HORIZONTAL,
    };

    this.baffles.push(newBaffle);
    this.selectedBaffleId = newBaffle.id;
    return newBaffle;
  }

  deleteBaffle(baffleId: string): boolean {
    const index = this.baffles.findIndex(b => b.id === baffleId);
    if (index !== -1) {
      this.baffles.splice(index, 1);
      if (this.selectedBaffleId === baffleId) {
        this.selectedBaffleId = null;
      }
      return true;
    }
    return false;
  }

  toggleBaffleOrientation(baffleId: string): boolean {
    const baffle = this.baffles.find(b => b.id === baffleId);
    if (baffle) {
      const newOrientation: BaffleOrientation = 
        baffle.orientation === 'horizontal' ? 'vertical' : 'horizontal';
      
      const centerX = baffle.x + (baffle.orientation === 'horizontal' ? baffle.length : baffle.width) / 2;
      const centerY = baffle.y + (baffle.orientation === 'horizontal' ? baffle.width : baffle.length) / 2;

      baffle.orientation = newOrientation;
      
      const newLength = baffle.length;
      baffle.length = baffle.width;
      baffle.width = newLength;

      baffle.x = centerX - baffle.length / 2;
      baffle.y = centerY - baffle.width / 2;

      baffle.color = newOrientation === 'horizontal' 
        ? COLORS.BAFFLE_HORIZONTAL 
        : COLORS.BAFFLE_VERTICAL;

      return true;
    }
    return false;
  }

  getBaffleAt(x: number, y: number): Baffle | null {
    for (let i = this.baffles.length - 1; i >= 0; i--) {
      const baffle = this.baffles[i];
      if (this.isPointInBaffle(x, y, baffle)) {
        return baffle;
      }
    }
    return null;
  }

  private isPointInBaffle(x: number, y: number, baffle: Baffle): boolean {
    const expand = 5;
    if (baffle.orientation === 'horizontal') {
      return x >= baffle.x - expand && 
             x <= baffle.x + baffle.length + expand &&
             y >= baffle.y - expand && 
             y <= baffle.y + baffle.width + expand;
    } else {
      return x >= baffle.x - expand && 
             x <= baffle.x + baffle.width + expand &&
             y >= baffle.y - expand && 
             y <= baffle.y + baffle.length + expand;
    }
  }

  startDrag(x: number, y: number, baffleId: string): boolean {
    const baffle = this.baffles.find(b => b.id === baffleId);
    if (baffle) {
      this.isDragging = true;
      this.selectedBaffleId = baffleId;
      this.dragOffset = {
        x: x - baffle.x,
        y: y - baffle.y,
      };
      return true;
    }
    return false;
  }

  drag(x: number, y: number): void {
    if (this.isDragging && this.selectedBaffleId) {
      const baffle = this.baffles.find(b => b.id === this.selectedBaffleId);
      if (baffle) {
        let newX = x - this.dragOffset.x;
        let newY = y - this.dragOffset.y;

        newX = this.snapToGrid(newX);
        newY = this.snapToGrid(newY);

        baffle.x = Math.max(0, Math.min(GAME_CONFIG.CANVAS_WIDTH - baffle.length, newX));
        baffle.y = Math.max(0, Math.min(GAME_CONFIG.CANVAS_HEIGHT - baffle.width, newY));
      }
    }
  }

  endDrag(): void {
    this.isDragging = false;
  }

  clearSelection(): void {
    this.selectedBaffleId = null;
    this.isDragging = false;
  }

  canAddBaffle(): boolean {
    return this.baffles.length < this.maxBaffles;
  }

  getBaffleCount(): number {
    return this.baffles.length;
  }
}

export const levelEditor = new LevelEditor();
