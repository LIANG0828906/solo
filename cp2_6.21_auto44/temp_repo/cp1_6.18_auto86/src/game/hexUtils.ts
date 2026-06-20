import type { HexCoord, HexCell } from './types';

export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function getNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((d) => ({
    q: coord.q + d.q,
    r: coord.r + d.r,
  }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

export function isAdjacent(a: HexCoord, b: HexCoord): boolean {
  return hexDistance(a, b) === 1;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export function hexToPixel(coord: HexCoord, size: number): PixelCoord {
  const x = size * (3 / 2) * coord.q;
  const y = size * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

export function pixelToHex(
  x: number,
  y: number,
  size: number,
): HexCoord {
  const q = ((2 / 3) * x) / size;
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
  return hexRound({ q, r });
}

export function hexRound(coord: HexCoord): HexCoord {
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

export function getHexCorners(center: PixelCoord, size: number): PixelCoord[] {
  const corners: PixelCoord[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }
  return corners;
}

export function getHexPolygonPoints(
  center: PixelCoord,
  size: number,
): string {
  return getHexCorners(center, size)
    .map((c) => `${c.x},${c.y}`)
    .join(' ');
}

export interface BFSResult {
  path: HexCoord[];
  visited: Set<string>;
}

export function findPathBFS(
  start: HexCoord,
  end: HexCoord,
  isPassable: (coord: HexCoord) => boolean,
  gridWidth: number,
  gridHeight: number,
): HexCoord[] | null {
  if (hexEquals(start, end)) return [start];

  const visited = new Set<string>();
  const queue: { coord: HexCoord; path: HexCoord[] }[] = [
    { coord: start, path: [start] },
  ];
  visited.add(hexKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor of getNeighbors(current.coord)) {
      const key = hexKey(neighbor);
      if (visited.has(key)) continue;
      if (
        neighbor.q < 0 ||
        neighbor.q >= gridWidth ||
        neighbor.r < 0 ||
        neighbor.r >= gridHeight
      )
        continue;
      if (!isPassable(neighbor) && !hexEquals(neighbor, end)) continue;

      const newPath = [...current.path, neighbor];
      if (hexEquals(neighbor, end)) {
        return newPath;
      }

      visited.add(key);
      queue.push({ coord: neighbor, path: newPath });
    }
  }

  return null;
}

export function getCell(
  grid: HexCell[][],
  coord: HexCoord,
): HexCell | null {
  if (
    coord.r >= 0 &&
    coord.r < grid.length &&
    coord.q >= 0 &&
    coord.q < grid[coord.r].length
  ) {
    return grid[coord.r][coord.q];
  }
  return null;
}
