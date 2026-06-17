import type { HexCoord, Unit } from '../types';

export const GRID_COLS = 8;
export const GRID_ROWS = 6;
export const HEX_RADIUS = 40;

export const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
export const HEX_HEIGHT = 2 * HEX_RADIUS;
export const HEX_VERTICAL_SPACING = HEX_HEIGHT * 0.75;

export function hexToPixel(col: number, row: number): { x: number; y: number } {
  const x = HEX_WIDTH * (col + 0.5 * (row & 1));
  const y = HEX_VERTICAL_SPACING * row;
  return { x, y };
}

export function offsetToAxial(col: number, row: number): { q: number; r: number } {
  const q = col - (row - (row & 1)) / 2;
  const r = row;
  return { q, r };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const aq = a.col - (a.row - (a.row & 1)) / 2;
  const ar = a.row;
  const bq = b.col - (b.row - (b.row & 1)) / 2;
  const br = b.row;

  const as = -aq - ar;
  const bs = -bq - br;

  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}

export function getNeighbors(col: number, row: number): HexCoord[] {
  const neighbors: HexCoord[] = [];
  const evenRowOffsets = [
    { dc: -1, dr: 0 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
    { dc: 1, dr: 0 }, { dc: 1, dr: 1 }, { dc: 0, dr: 1 },
  ];
  const oddRowOffsets = [
    { dc: -1, dr: 0 }, { dc: -1, dr: -1 }, { dc: 0, dr: -1 },
    { dc: 1, dr: 0 }, { dc: 0, dr: 1 }, { dc: -1, dr: 1 },
  ];
  const offsets = row % 2 === 0 ? evenRowOffsets : oddRowOffsets;

  for (const offset of offsets) {
    const nc = col + offset.dc;
    const nr = row + offset.dr;
    if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
      neighbors.push({ col: nc, row: nr });
    }
  }
  return neighbors;
}

export function isInBounds(col: number, row: number): boolean {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

export function getMoveRange(unit: Unit, units: Unit[]): HexCoord[] {
  const result: HexCoord[] = [];
  const visited = new Set<string>();
  const startKey = `${unit.col},${unit.row}`;
  visited.add(startKey);

  const queue: { col: number; row: number; distance: number }[] = [
    { col: unit.col, row: unit.row, distance: 0 },
  ];

  const occupiedPositions = new Set(
    units.filter(u => u.id !== unit.id && u.hp > 0).map(u => `${u.col},${u.row}`)
  );

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.distance > 0) {
      const key = `${current.col},${current.row}`;
      if (!occupiedPositions.has(key)) {
        result.push({ col: current.col, row: current.row });
      }
    }

    if (current.distance < unit.move) {
      const neighbors = getNeighbors(current.col, current.row);
      for (const neighbor of neighbors) {
        const key = `${neighbor.col},${neighbor.row}`;
        if (!visited.has(key) && !occupiedPositions.has(key)) {
          visited.add(key);
          queue.push({ col: neighbor.col, row: neighbor.row, distance: current.distance + 1 });
        }
      }
    }
  }

  return result;
}

export function getAttackRange(unit: Unit, units: Unit[]): Unit[] {
  return units.filter(u => {
    if (u.team === unit.team || u.hp <= 0) return false;
    const distance = hexDistance(
      { col: unit.col, row: unit.row },
      { col: u.col, row: u.row }
    );
    return distance <= unit.range && distance > 0;
  });
}

export function isPlayerDeployZone(col: number, row: number): boolean {
  return col <= 1;
}

export function isAIDeployZone(col: number, row: number): boolean {
  return col >= GRID_COLS - 2;
}

export function getHexCorners(centerX: number, centerY: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    const px = centerX + HEX_RADIUS * Math.cos(angleRad);
    const py = centerY + HEX_RADIUS * Math.sin(angleRad);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}
