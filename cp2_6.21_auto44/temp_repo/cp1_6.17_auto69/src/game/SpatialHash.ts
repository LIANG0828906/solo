export interface SpatialObject {
  id: string;
  position: { x: number; y: number };
  radius: number;
}

export class SpatialHashGrid<T extends SpatialObject> {
  private cellSize: number;
  private grid: Map<string, T[]>;
  private width: number;
  private height: number;

  constructor(cellSize: number, width: number, height: number) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.grid = new Map();
  }

  private getKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private getCell(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: Math.floor(x / this.cellSize),
      cy: Math.floor(y / this.cellSize),
    };
  }

  clear(): void {
    this.grid.clear();
  }

  insert(obj: T): void {
    const minX = obj.position.x - obj.radius;
    const maxX = obj.position.x + obj.radius;
    const minY = obj.position.y - obj.radius;
    const maxY = obj.position.y + obj.radius;

    const { cx: cx1, cy: cy1 } = this.getCell(minX, minY);
    const { cx: cx2, cy: cy2 } = this.getCell(maxX, maxY);

    for (let cy = cy1; cy <= cy2; cy++) {
      for (let cx = cx1; cx <= cx2; cx++) {
        const key = this.getKey(cx, cy);
        let bucket = this.grid.get(key);
        if (!bucket) {
          bucket = [];
          this.grid.set(key, bucket);
        }
        bucket.push(obj);
      }
    }
  }

  query(x: number, y: number, radius: number): T[] {
    const results: Set<T> = new Set();
    const minX = x - radius;
    const maxX = x + radius;
    const minY = y - radius;
    const maxY = y + radius;

    const { cx: cx1, cy: cy1 } = this.getCell(minX, minY);
    const { cx: cx2, cy: cy2 } = this.getCell(maxX, maxY);

    for (let cy = cy1; cy <= cy2; cy++) {
      for (let cx = cx1; cx <= cx2; cx++) {
        const key = this.getKey(cx, cy);
        const bucket = this.grid.get(key);
        if (bucket) {
          for (const obj of bucket) {
            results.add(obj);
          }
        }
      }
    }

    return Array.from(results);
  }

  findNearby(obj: T, radius: number): T[] {
    const candidates = this.query(obj.position.x, obj.position.y, radius);
    const result: T[] = [];
    const r = obj.radius + radius;
    const r2 = r * r;

    for (const candidate of candidates) {
      if (candidate.id === obj.id) continue;
      const dx = candidate.position.x - obj.position.x;
      const dy = candidate.position.y - obj.position.y;
      if (dx * dx + dy * dy <= r2) {
        result.push(candidate);
      }
    }

    return result;
  }
}
