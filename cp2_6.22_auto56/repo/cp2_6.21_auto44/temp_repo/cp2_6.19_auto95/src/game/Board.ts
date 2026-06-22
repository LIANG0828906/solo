export type TerrainType = 'normal' | 'startRed' | 'startBlue';
export type EventType = 'trap' | 'boost' | 'heal' | null;

export interface Cell {
  x: number;
  y: number;
  terrain: TerrainType;
  eventType: EventType;
  eventActive: boolean;
}

export class Board {
  public readonly size = 8;
  public cells: Cell[][] = [];

  constructor() {
    this.generateBoard();
  }

  private generateBoard(): void {
    this.cells = [];
    for (let y = 0; y < this.size; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.size; x++) {
        let terrain: TerrainType = 'normal';
        if (x === 0 && y === 0) terrain = 'startRed';
        if (x === this.size - 1 && y === this.size - 1) terrain = 'startBlue';

        row.push({
          x,
          y,
          terrain,
          eventType: null,
          eventActive: false,
        });
      }
      this.cells.push(row);
    }
  }

  public getCell(x: number, y: number): Cell | null {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null;
    return this.cells[y][x];
  }

  public isInside(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  public clearAllEvents(): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.cells[y][x].eventActive = false;
        this.cells[y][x].eventType = null;
      }
    }
  }

  public setCellEvent(x: number, y: number, eventType: EventType): void {
    const cell = this.getCell(x, y);
    if (cell) {
      cell.eventType = eventType;
      cell.eventActive = eventType !== null;
    }
  }
}
