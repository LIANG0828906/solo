import type { HexCoord, HexCell, GridConfig } from '../types';

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cols: 8,
  rows: 6,
  hexSize: 40,
};

const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function generateGrid(config: GridConfig = DEFAULT_GRID_CONFIG): HexCell[] {
  const cells: HexCell[] = [];
  for (let r = 0; r < config.rows; r++) {
    for (let q = 0; q < config.cols; q++) {
      cells.push({
        coord: { q, r },
        terrain: 'plain',
        passable: true,
      });
    }
  }
  return cells;
}

export function hexToPixel(coord: HexCoord, hexSize: number = DEFAULT_GRID_CONFIG.hexSize): { x: number; y: number } {
  const x = hexSize * (3 / 2) * coord.q;
  const y = hexSize * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

export function pixelToHex(x: number, y: number, hexSize: number = DEFAULT_GRID_CONFIG.hexSize): HexCoord {
  const q = (2 / 3 * x) / hexSize;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / hexSize;
  return hexRound({ q, r });
}

export function hexRound(coord: { q: number; r: number }): HexCoord {
  const s = -coord.q - coord.r;
  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function getHexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

export function isInBounds(coord: HexCoord, config: GridConfig = DEFAULT_GRID_CONFIG): boolean {
  return coord.q >= 0 && coord.q < config.cols && coord.r >= 0 && coord.r < config.rows;
}

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function getHexCorners(hexSize: number = DEFAULT_GRID_CONFIG.hexSize): string {
  const corners: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = hexSize * Math.cos(angle);
    const y = hexSize * Math.sin(angle);
    corners.push(`${x},${y}`);
  }
  return corners.join(' ');
}

export function getGridPixelSize(config: GridConfig = DEFAULT_GRID_CONFIG): { width: number; height: number } {
  const width = config.hexSize * 3 / 2 * (config.cols - 1) + config.hexSize * 2;
  const height = config.hexSize * Math.sqrt(3) * (config.rows - 1) + config.hexSize * Math.sqrt(3);
  return { width, height };
}

export function getCellsInRange(center: HexCoord, range: number, config: GridConfig = DEFAULT_GRID_CONFIG): HexCoord[] {
  const results: HexCoord[] = [];
  for (let dq = -range; dq <= range; dq++) {
    for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
      const coord = { q: center.q + dq, r: center.r + dr };
      if (isInBounds(coord, config) && (dq !== 0 || dr !== 0)) {
        results.push(coord);
      }
    }
  }
  return results;
}
