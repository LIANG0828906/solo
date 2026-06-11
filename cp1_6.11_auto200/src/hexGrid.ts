export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

export interface HexCoord {
  col: number;
  row: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export interface HexCell {
  col: number;
  row: number;
  q: number;
  r: number;
  s: number;
}

const SQRT3 = Math.sqrt(3);

export class HexGrid {
  private hexSize: number;
  private cols: number;
  private rows: number;
  private offsetX: number;
  private offsetY: number;
  private cells: HexCell[] = [];

  constructor(hexSize: number, cols: number, rows: number, offsetX: number = 0, offsetY: number = 0) {
    this.hexSize = hexSize;
    this.cols = cols;
    this.rows = rows;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.generateGrid();
  }

  private generateGrid(): void {
    this.cells = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cube = this.offsetToCube(col, row);
        this.cells.push({
          col,
          row,
          q: cube.q,
          r: cube.r,
          s: cube.s
        });
      }
    }
  }

  public offsetToCube(col: number, row: number): CubeCoord {
    const q = col - (row - (row & 1)) / 2;
    const r = row;
    const s = -q - r;
    return { q, r, s };
  }

  public cubeToOffset(q: number, r: number): HexCoord {
    const col = q + (r - (r & 1)) / 2;
    const row = r;
    return { col, row };
  }

  public cubeToPixel(q: number, r: number): PixelCoord {
    const x = this.hexSize * (SQRT3 * q + SQRT3 / 2 * r) + this.offsetX;
    const y = this.hexSize * (3 / 2 * r) + this.offsetY;
    return { x, y };
  }

  public pixelToCube(x: number, y: number): CubeCoord {
    const px = x - this.offsetX;
    const py = y - this.offsetY;
    const q = (SQRT3 / 3 * px - 1 / 3 * py) / this.hexSize;
    const r = (2 / 3 * py) / this.hexSize;
    return this.cubeRound(q, r);
  }

  private cubeRound(q: number, r: number): CubeCoord {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    } else {
      rs = -rq - rr;
    }

    return { q: rq, r: rr, s: rs };
  }

  public getHexAtPoint(x: number, y: number): HexCell | null {
    const cube = this.pixelToCube(x, y);
    const offset = this.cubeToOffset(cube.q, cube.r);
    
    if (offset.col < 0 || offset.col >= this.cols || offset.row < 0 || offset.row >= this.rows) {
      return null;
    }

    return this.cells.find(c => c.col === offset.col && c.row === offset.row) || null;
  }

  public getNeighbors(col: number, row: number): HexCell[] {
    const cube = this.offsetToCube(col, row);
    const directions = [
      { q: 1, r: -1, s: 0 },
      { q: 1, r: 0, s: -1 },
      { q: 0, r: 1, s: -1 },
      { q: -1, r: 1, s: 0 },
      { q: -1, r: 0, s: 1 },
      { q: 0, r: -1, s: 1 }
    ];

    const neighbors: HexCell[] = [];
    for (const dir of directions) {
      const offset = this.cubeToOffset(cube.q + dir.q, cube.r + dir.r);
      if (offset.col >= 0 && offset.col < this.cols && offset.row >= 0 && offset.row < this.rows) {
        const cell = this.cells.find(c => c.col === offset.col && c.row === offset.row);
        if (cell) {
          neighbors.push(cell);
        }
      }
    }
    return neighbors;
  }

  public getHexCenter(col: number, row: number): PixelCoord {
    const cube = this.offsetToCube(col, row);
    return this.cubeToPixel(cube.q, cube.r);
  }

  public cubeDistance(a: CubeCoord, b: CubeCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }

  public hexDistance(a: HexCoord, b: HexCoord): number {
    const cubeA = this.offsetToCube(a.col, a.row);
    const cubeB = this.offsetToCube(b.col, b.row);
    return this.cubeDistance(cubeA, cubeB);
  }

  public findPath(start: HexCoord, end: HexCoord, occupied: Set<string> = new Set()): HexCoord[] {
    const startKey = `${start.col},${start.row}`;
    const endKey = `${end.col},${end.row}`;

    if (startKey === endKey) return [start];

    const openSet: { coord: HexCoord; g: number; f: number }[] = [];
    const cameFrom: Map<string, HexCoord> = new Map();
    const gScore: Map<string, number> = new Map();

    const startH = this.hexDistance(start, end);
    openSet.push({ coord: start, g: 0, f: startH });
    gScore.set(startKey, 0);

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.coord.col},${current.coord.row}`;

      if (currentKey === endKey) {
        const path: HexCoord[] = [current.coord];
        let c = currentKey;
        while (cameFrom.has(c)) {
          const prev = cameFrom.get(c)!;
          path.unshift(prev);
          c = `${prev.col},${prev.row}`;
        }
        return path;
      }

      const neighbors = this.getNeighbors(current.coord.col, current.coord.row);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.col},${neighbor.row}`;
        
        if (neighborKey !== endKey && occupied.has(neighborKey)) {
          continue;
        }

        const tentativeG = current.g + 1;
        const prevG = gScore.get(neighborKey);

        if (prevG === undefined || tentativeG < prevG) {
          cameFrom.set(neighborKey, current.coord);
          gScore.set(neighborKey, tentativeG);
          const h = this.hexDistance(neighbor, end);
          const f = tentativeG + h;

          const existing = openSet.find(o => o.coord.col === neighbor.col && o.coord.row === neighbor.row);
          if (existing) {
            existing.g = tentativeG;
            existing.f = f;
          } else {
            openSet.push({ coord: { col: neighbor.col, row: neighbor.row }, g: tentativeG, f });
          }
        }
      }
    }

    return [];
  }

  public getCells(): HexCell[] {
    return this.cells;
  }

  public getHexSize(): number {
    return this.hexSize;
  }

  public getCols(): number {
    return this.cols;
  }

  public getRows(): number {
    return this.rows;
  }

  public setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  public getHexCorners(col: number, row: number): PixelCoord[] {
    const center = this.getHexCenter(col, row);
    const corners: PixelCoord[] = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      corners.push({
        x: center.x + this.hexSize * Math.cos(angleRad),
        y: center.y + this.hexSize * Math.sin(angleRad)
      });
    }
    return corners;
  }
}
