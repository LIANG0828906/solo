import type { HexCoord } from '../types';

const HEX_SIZE = 30;
const GRID_WIDTH = 11;
const GRID_HEIGHT = 9;

export class GridEngine {
  private hexSize: number;
  private width: number;
  private height: number;

  constructor(hexSize = HEX_SIZE, width = GRID_WIDTH, height = GRID_HEIGHT) {
    this.hexSize = hexSize;
    this.width = width;
    this.height = height;
  }

  getHexSize(): number {
    return this.hexSize;
  }

  getGridWidth(): number {
    return this.width;
  }

  getGridHeight(): number {
    return this.height;
  }

  hexToPixel(coord: HexCoord): { x: number; y: number } {
    const x = this.hexSize * (3 / 2 * coord.q);
    const y = this.hexSize * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
    return { x, y };
  }

  pixelToHex(x: number, y: number): HexCoord {
    const q = (2 / 3 * x) / this.hexSize;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / this.hexSize;
    return this.roundHex({ q, r });
  }

  private roundHex(coord: HexCoord): HexCoord {
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

  hexDistance(a: HexCoord, b: HexCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }

  getNeighbors(coord: HexCoord): HexCoord[] {
    const directions = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];
    return directions
      .map(d => ({ q: coord.q + d.q, r: coord.r + d.r }))
      .filter(c => this.isValidCoord(c));
  }

  isValidCoord(coord: HexCoord): boolean {
    if (coord.q < 0 || coord.q >= this.width) return false;
    if (coord.r < 0 || coord.r >= this.height) return false;
    return true;
  }

  hexKey(coord: HexCoord): string {
    return `${coord.q},${coord.r}`;
  }

  parseHexKey(key: string): HexCoord {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
  }

  getAllCoords(): HexCoord[] {
    const coords: HexCoord[] = [];
    for (let r = 0; r < this.height; r++) {
      for (let q = 0; q < this.width; q++) {
        coords.push({ q, r });
      }
    }
    return coords;
  }

  getHexCornerPoints(centerX: number, centerY: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const x = centerX + this.hexSize * Math.cos(angle);
      const y = centerY + this.hexSize * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  findPath(
    start: HexCoord,
    goal: HexCoord,
    blockedCoords: Set<string>,
    maxSteps: number
  ): HexCoord[] | null {
    if (this.hexKey(start) === this.hexKey(goal)) {
      return [];
    }

    const startKey = this.hexKey(start);
    const goalKey = this.hexKey(goal);

    const openSet: { coord: HexCoord; f: number; g: number }[] = [];
    const cameFrom: Map<string, HexCoord> = new Map();
    const gScore: Map<string, number> = new Map();
    const closedSet: Set<string> = new Set();

    gScore.set(startKey, 0);
    openSet.push({ coord: start, f: this.hexDistance(start, goal), g: 0 });

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = this.hexKey(current.coord);

      if (currentKey === goalKey) {
        const path: HexCoord[] = [];
        let c: HexCoord | undefined = current.coord;
        while (c && this.hexKey(c) !== startKey) {
          path.unshift(c);
          c = cameFrom.get(this.hexKey(c));
        }
        if (path.length <= maxSteps) {
          return path;
        }
        return null;
      }

      closedSet.add(currentKey);

      const neighbors = this.getNeighbors(current.coord);
      for (const neighbor of neighbors) {
        const neighborKey = this.hexKey(neighbor);
        if (closedSet.has(neighborKey)) continue;
        if (neighborKey !== goalKey && blockedCoords.has(neighborKey)) continue;
        if (neighborKey === goalKey && blockedCoords.has(neighborKey)) continue;

        const tentativeG = current.g + 1;
        if (tentativeG > maxSteps) continue;

        if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, current.coord);
          gScore.set(neighborKey, tentativeG);
          const f = tentativeG + this.hexDistance(neighbor, goal);
          const existingIdx = openSet.findIndex(n => this.hexKey(n.coord) === neighborKey);
          if (existingIdx >= 0) {
            openSet[existingIdx] = { coord: neighbor, f, g: tentativeG };
          } else {
            openSet.push({ coord: neighbor, f, g: tentativeG });
          }
        }
      }
    }

    return null;
  }

  getReachableCells(
    start: HexCoord,
    moveRange: number,
    blockedCoords: Set<string>
  ): HexCoord[] {
    const reachable: HexCoord[] = [];
    const startKey = this.hexKey(start);

    if (moveRange <= 0) return reachable;

    const visited: Map<string, number> = new Map();
    const queue: { coord: HexCoord; distance: number }[] = [{ coord: start, distance: 0 }];
    visited.set(startKey, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.distance >= moveRange) continue;

      const neighbors = this.getNeighbors(current.coord);
      for (const neighbor of neighbors) {
        const neighborKey = this.hexKey(neighbor);
        if (visited.has(neighborKey)) continue;
        if (blockedCoords.has(neighborKey)) continue;

        const newDistance = current.distance + 1;
        visited.set(neighborKey, newDistance);
        reachable.push(neighbor);
        queue.push({ coord: neighbor, distance: newDistance });
      }
    }

    return reachable;
  }

  getAttackRange(center: HexCoord, range: number): HexCoord[] {
    const cells: HexCoord[] = [];
    for (let dq = -range; dq <= range; dq++) {
      for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
        if (dq === 0 && dr === 0) continue;
        const coord = { q: center.q + dq, r: center.r + dr };
        if (this.isValidCoord(coord)) {
          cells.push(coord);
        }
      }
    }
    return cells;
  }

  getConeAttackRange(origin: HexCoord, direction: number, range: number): HexCoord[] {
    const cells: HexCoord[] = [];
    const directions = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];

    const forward = directions[((direction % 6) + 6) % 6];
    const leftIdx = (((direction - 1) % 6) + 6) % 6;
    const rightIdx = (((direction + 1) % 6) + 6) % 6;
    const leftDir = directions[leftIdx];
    const rightDir = directions[rightIdx];

    for (let step = 1; step <= range; step++) {
      const front = { q: origin.q + forward.q * step, r: origin.r + forward.r * step };
      if (this.isValidCoord(front)) cells.push(front);

      for (let side = 1; side < step; side++) {
        const fwd = step - side;
        const lCell = {
          q: origin.q + forward.q * fwd + leftDir.q * side,
          r: origin.r + forward.r * fwd + leftDir.r * side,
        };
        const rCell = {
          q: origin.q + forward.q * fwd + rightDir.q * side,
          r: origin.r + forward.r * fwd + rightDir.r * side,
        };
        if (this.isValidCoord(lCell)) cells.push(lCell);
        if (this.isValidCoord(rCell)) cells.push(rCell);
      }
    }

    return cells;
  }
}
