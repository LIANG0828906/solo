export interface HexCoord {
  col: number;
  row: number;
}

const SQRT3 = Math.sqrt(3);

const EVEN_ROW_NEIGHBORS: [number, number][] = [
  [1, 0], [0, -1], [-1, -1],
  [-1, 0], [-1, 1], [0, 1]
];

const ODD_ROW_NEIGHBORS: [number, number][] = [
  [1, 0], [1, -1], [0, -1],
  [-1, 0], [0, 1], [1, 1]
];

export class HexGrid {
  cols = 8;
  rows = 8;
  hexSize = 36;

  hexToPixel(col: number, row: number): { x: number; y: number } {
    const x = this.hexSize * SQRT3 * (col + 0.5 * (row & 1));
    const y = this.hexSize * 1.5 * row;
    return { x, y };
  }

  pixelToHex(px: number, py: number): HexCoord {
    const row = Math.round(py / (this.hexSize * 1.5));
    const col = Math.round(px / (this.hexSize * SQRT3) - 0.5 * (row & 1));
    return { col, row };
  }

  getHexCorners(cx: number, cy: number): { x: number; y: number }[] {
    const corners: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      corners.push({
        x: cx + this.hexSize * Math.cos(angle),
        y: cy + this.hexSize * Math.sin(angle)
      });
    }
    return corners;
  }

  isValid(coord: HexCoord): boolean {
    return coord.col >= 0 && coord.col < this.cols &&
           coord.row >= 0 && coord.row < this.rows;
  }

  getNeighbors(coord: HexCoord): HexCoord[] {
    const deltas = (coord.row & 1) ? ODD_ROW_NEIGHBORS : EVEN_ROW_NEIGHBORS;
    return deltas
      .map(([dc, dr]) => ({ col: coord.col + dc, row: coord.row + dr }))
      .filter(c => this.isValid(c));
  }

  hexDistance(a: HexCoord, b: HexCoord): number {
    const ac = this.toCube(a);
    const bc = this.toCube(b);
    return Math.max(
      Math.abs(ac.q - bc.q),
      Math.abs(ac.r - bc.r),
      Math.abs(ac.s - bc.s)
    );
  }

  private toCube(h: HexCoord): { q: number; r: number; s: number } {
    const q = h.col - (h.row - (h.row & 1)) / 2;
    const r = h.row;
    return { q, r, s: -q - r };
  }

  getReachableRange(
    start: HexCoord,
    range: number,
    obstacles: HexCoord[]
  ): HexCoord[] {
    const obstacleSet = new Set(obstacles.map(o => `${o.col},${o.row}`));
    const visited = new Map<string, number>();
    const queue: { col: number; row: number; dist: number }[] = [
      { col: start.col, row: start.row, dist: 0 }
    ];
    visited.set(`${start.col},${start.row}`, 0);
    const result: HexCoord[] = [];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.dist > 0) {
        result.push({ col: cur.col, row: cur.row });
      }
      if (cur.dist >= range) continue;
      for (const nb of this.getNeighbors({ col: cur.col, row: cur.row })) {
        const key = `${nb.col},${nb.row}`;
        if (visited.has(key)) continue;
        if (obstacleSet.has(key)) continue;
        visited.set(key, cur.dist + 1);
        queue.push({ col: nb.col, row: nb.row, dist: cur.dist + 1 });
      }
    }

    return result;
  }

  getHexesInCircle(center: HexCoord, radius: number): HexCoord[] {
    const result: HexCoord[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const dist = this.hexDistance(center, { col, row });
        if (dist > 0 && dist <= radius) {
          result.push({ col, row });
        }
      }
    }
    return result;
  }

  getHexesInFan(
    center: HexCoord,
    directionAngle: number,
    spreadAngle: number,
    radius: number
  ): HexCoord[] {
    const centerPx = this.hexToPixel(center.col, center.row);
    const result: HexCoord[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const dist = this.hexDistance(center, { col, row });
        if (dist <= 0 || dist > radius) continue;
        const targetPx = this.hexToPixel(col, row);
        const dx = targetPx.x - centerPx.x;
        const dy = targetPx.y - centerPx.y;
        let angle = Math.atan2(dy, dx);
        let diff = angle - directionAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) <= spreadAngle / 2) {
          result.push({ col, row });
        }
      }
    }
    return result;
  }

  getGridWidth(): number {
    const lastCol = this.cols - 1;
    const lastRow = this.rows - 1;
    const p = this.hexToPixel(lastCol, lastRow);
    return p.x + this.hexSize * SQRT3;
  }

  getGridHeight(): number {
    const lastRow = this.rows - 1;
    const p = this.hexToPixel(0, lastRow);
    return p.y + this.hexSize * 2;
  }
}
