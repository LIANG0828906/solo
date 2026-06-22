import { Vec2 } from '../types';

export class SpatialHash<T> {
  private cells: Map<string, Set<T>> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 80) {
    this.cellSize = cellSize;
  }

  private key(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(obj: T, pos: Vec2): void {
    const k = this.key(pos.x, pos.y);
    if (!this.cells.has(k)) {
      this.cells.set(k, new Set());
    }
    this.cells.get(k)!.add(obj);
  }

  remove(obj: T, pos: Vec2): void {
    const k = this.key(pos.x, pos.y);
    this.cells.get(k)?.delete(obj);
  }

  query(pos: Vec2, radius: number): Set<T> {
    const results = new Set<T>();
    const minCx = Math.floor((pos.x - radius) / this.cellSize);
    const maxCx = Math.floor((pos.x + radius) / this.cellSize);
    const minCy = Math.floor((pos.y - radius) / this.cellSize);
    const maxCy = Math.floor((pos.y + radius) / this.cellSize);
    const r2 = radius * radius;
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          cell.forEach((obj) => results.add(obj));
        }
      }
    }
    return results;
  }

  queryRect(x: number, y: number, w: number, h: number): Set<T> {
    const results = new Set<T>();
    const minCx = Math.floor(x / this.cellSize);
    const maxCx = Math.floor((x + w) / this.cellSize);
    const minCy = Math.floor(y / this.cellSize);
    const maxCy = Math.floor((y + h) / this.cellSize);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(`${cx},${cy}`);
        if (cell) {
          cell.forEach((obj) => results.add(obj));
        }
      }
    }
    return results;
  }
}
