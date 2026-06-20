import { Point, HexCoord } from './PathManager';

export interface HexCell {
  q: number;
  r: number;
  isPath: boolean;
  occupied: boolean;
  position: Point;
}

export class GridSystem {
  private readonly cols: number;
  private readonly rows: number;
  private readonly hexSize: number;
  private readonly offsetX: number;
  private readonly offsetY: number;
  private readonly hexWidth: number;
  private readonly hexHeight: number;

  public readonly hexes: Map<string, HexCell> = new Map();
  public readonly pathHexes: Set<string> = new Set();
  public readonly occupiedHexes: Set<string> = new Set();

  constructor(cols: number = 20, rows: number = 15, hexSize: number = 24) {
    this.cols = cols;
    this.rows = rows;
    this.hexSize = hexSize;
    this.offsetX = hexSize * 1.2;
    this.offsetY = hexSize * 1.2;
    this.hexWidth = hexSize * 1.5;
    this.hexHeight = hexSize * Math.sqrt(3);

    this.initHexes();
  }

  private initHexes(): void {
    for (let q = 0; q < this.cols; q++) {
      for (let r = 0; r < this.rows; r++) {
        const hex: HexCoord = { q, r };
        const key = this.getHexKey(hex);
        const position = this.hexToPixel(hex);
        const isPath = this.pathHexes.has(key);
        const occupied = this.occupiedHexes.has(key);

        this.hexes.set(key, {
          q,
          r,
          isPath,
          occupied,
          position,
        });
      }
    }
  }

  private initPath(pathPoints: HexCoord[]): void {
    this.pathHexes.clear();
    for (const hex of pathPoints) {
      const key = this.getHexKey(hex);
      this.pathHexes.add(key);
      const cell = this.hexes.get(key);
      if (cell) {
        cell.isPath = true;
      }
    }
  }

  public getHexKey(hex: HexCoord): string {
    return `${hex.q},${hex.r}`;
  }

  public hexToPixel(hex: HexCoord): Point {
    const x = this.offsetX + hex.q * this.hexWidth;
    const y = this.offsetY + hex.r * this.hexHeight + (hex.q % 2 === 1 ? this.hexHeight / 2 : 0);
    return { x, y };
  }

  public pixelToHex(point: Point): HexCoord {
    const adjustedX = point.x - this.offsetX;
    const adjustedY = point.y - this.offsetY;

    const q = adjustedX / this.hexWidth;
    const r = (adjustedY - (Math.floor(q) % 2 === 1 ? this.hexHeight / 2 : 0)) / this.hexHeight;

    const qFloor = Math.floor(q);
    const rFloor = Math.floor(r);
    const qFrac = q - qFloor;
    const rFrac = r - rFloor;

    let qBest = qFloor;
    let rBest = rFloor;
    let minDist = Infinity;

    for (let dq = 0; dq <= 1; dq++) {
      for (let dr = 0; dr <= 1; dr++) {
        const candidateQ = qFloor + dq;
        const candidateR = rFloor + dr;
        const candidatePixel = this.hexToPixel({ q: candidateQ, r: candidateR });
        const dist = Math.hypot(point.x - candidatePixel.x, point.y - candidatePixel.y);
        if (dist < minDist) {
          minDist = dist;
          qBest = candidateQ;
          rBest = candidateR;
        }
      }
    }

    return { q: qBest, r: rBest };
  }

  public isPathHex(hex: HexCoord): boolean {
    return this.pathHexes.has(this.getHexKey(hex));
  }

  public isOccupied(hex: HexCoord): boolean {
    return this.occupiedHexes.has(this.getHexKey(hex));
  }

  public setOccupied(hex: HexCoord, occupied: boolean): void {
    const key = this.getHexKey(hex);
    const cell = this.hexes.get(key);
    if (!cell) return;

    if (occupied) {
      this.occupiedHexes.add(key);
    } else {
      this.occupiedHexes.delete(key);
    }
    cell.occupied = occupied;
  }

  public canPlaceTower(hex: HexCoord): boolean {
    return this.isValidHex(hex) && !this.isPathHex(hex) && !this.isOccupied(hex);
  }

  public isValidHex(hex: HexCoord): boolean {
    return hex.q >= 0 && hex.q < this.cols && hex.r >= 0 && hex.r < this.rows;
  }

  public getHexAt(hex: HexCoord): HexCell | undefined {
    return this.hexes.get(this.getHexKey(hex));
  }

  public getHexColor(hex: HexCoord): string {
    return (hex.q + hex.r) % 2 === 0 ? '#90EE90' : '#228B22';
  }
}
