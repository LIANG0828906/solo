import type { GridPosition, TerrainType, MoveResult } from '../battle/types';
import { TERRAIN_INFO } from '../battle/types';

const HEX_DIRECTIONS: GridPosition[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export class GridSystem {
  private size: number;
  private terrainMap: Map<string, TerrainType>;

  constructor(size: number = 8) {
    this.size = size;
    this.terrainMap = new Map();
    this.initializeTerrain();
  }

  private initializeTerrain(): void {
    for (let q = 0; q < this.size; q++) {
      for (let r = 0; r < this.size; r++) {
        const key = this.posKey({ q, r });
        this.terrainMap.set(key, 'grass');
      }
    }
  }

  private posKey(pos: GridPosition): string {
    return `${pos.q},${pos.r}`;
  }

  getSize(): number {
    return this.size;
  }

  isValidPosition(pos: GridPosition): boolean {
    return pos.q >= 0 && pos.q < this.size && pos.r >= 0 && pos.r < this.size;
  }

  getTerrain(pos: GridPosition): TerrainType {
    if (!this.isValidPosition(pos)) return 'grass';
    return this.terrainMap.get(this.posKey(pos)) || 'grass';
  }

  setTerrain(pos: GridPosition, terrain: TerrainType): void {
    if (!this.isValidPosition(pos)) return;
    this.terrainMap.set(this.posKey(pos), terrain);
  }

  getTerrainDefenseBonus(pos: GridPosition): number {
    const terrain = this.getTerrain(pos);
    return TERRAIN_INFO[terrain].defenseBonus;
  }

  getMoveCost(pos: GridPosition): number {
    const terrain = this.getTerrain(pos);
    return TERRAIN_INFO[terrain].moveCostMultiplier;
  }

  getNeighbors(pos: GridPosition): GridPosition[] {
    return HEX_DIRECTIONS
      .map((dir) => ({ q: pos.q + dir.q, r: pos.r + dir.r }))
      .filter((p) => this.isValidPosition(p));
  }

  getDistance(a: GridPosition, b: GridPosition): number {
    return (
      (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2
    );
  }

  getCellsInRange(center: GridPosition, range: number): GridPosition[] {
    const results: GridPosition[] = [];
    for (let dq = -range; dq <= range; dq++) {
      for (
        let dr = Math.max(-range, -dq - range);
        dr <= Math.min(range, -dq + range);
        dr++
      ) {
        const pos = { q: center.q + dq, r: center.r + dr };
        if (this.isValidPosition(pos)) {
          results.push(pos);
        }
      }
    }
    return results;
  }

  getReachableCells(
    start: GridPosition,
    movePoints: number,
    occupiedPositions: Set<string> = new Set()
  ): GridPosition[] {
    const reachable = new Set<string>();
    const visited = new Map<string, number>();
    const queue: { pos: GridPosition; cost: number }[] = [{ pos: start, cost: 0 }];

    visited.set(this.posKey(start), 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.getNeighbors(current.pos);

      for (const neighbor of neighbors) {
        const key = this.posKey(neighbor);
        if (occupiedPositions.has(key)) continue;

        const moveCost = this.getMoveCost(neighbor);
        const totalCost = current.cost + moveCost;

        if (totalCost <= movePoints) {
          if (!visited.has(key) || visited.get(key)! > totalCost) {
            visited.set(key, totalCost);
            reachable.add(key);
            queue.push({ pos: neighbor, cost: totalCost });
          }
        }
      }
    }

    const result: GridPosition[] = [];
    reachable.forEach((key) => {
      const [q, r] = key.split(',').map(Number);
      result.push({ q, r });
    });

    return result;
  }

  findPath(
    start: GridPosition,
    end: GridPosition,
    occupiedPositions: Set<string> = new Set()
  ): MoveResult | null {
    if (!this.isValidPosition(start) || !this.isValidPosition(end)) {
      return null;
    }

    const startKey = this.posKey(start);
    const endKey = this.posKey(end);

    if (startKey === endKey) {
      return { path: [start], cost: 0 };
    }

    const cameFrom = new Map<string, string>();
    const costSoFar = new Map<string, number>();
    const frontier: { pos: GridPosition; priority: number }[] = [];

    costSoFar.set(startKey, 0);
    frontier.push({ pos: start, priority: 0 });

    while (frontier.length > 0) {
      frontier.sort((a, b) => a.priority - b.priority);
      const current = frontier.shift()!;
      const currentKey = this.posKey(current.pos);

      if (currentKey === endKey) break;

      const neighbors = this.getNeighbors(current.pos);
      for (const next of neighbors) {
        const nextKey = this.posKey(next);
        if (occupiedPositions.has(nextKey) && nextKey !== endKey) continue;

        const newCost = costSoFar.get(currentKey)! + this.getMoveCost(next);

        if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)!) {
          costSoFar.set(nextKey, newCost);
          const priority = newCost + this.getDistance(next, end);
          frontier.push({ pos: next, priority });
          cameFrom.set(nextKey, currentKey);
        }
      }
    }

    if (!cameFrom.has(endKey)) {
      return null;
    }

    const path: GridPosition[] = [];
    let currentKey = endKey;
    while (currentKey !== startKey) {
      const [q, r] = currentKey.split(',').map(Number);
      path.unshift({ q, r });
      currentKey = cameFrom.get(currentKey)!;
    }
    path.unshift(start);

    return {
      path,
      cost: costSoFar.get(endKey) || 0,
    };
  }

  getAllCells(): GridPosition[] {
    const cells: GridPosition[] = [];
    for (let q = 0; q < this.size; q++) {
      for (let r = 0; r < this.size; r++) {
        cells.push({ q, r });
      }
    }
    return cells;
  }

  axialToPixel(pos: GridPosition, hexSize: number): { x: number; y: number } {
    const x = hexSize * (3 / 2) * pos.q;
    const y = hexSize * (Math.sqrt(3) / 2 * pos.q + Math.sqrt(3) * pos.r);
    return { x, y };
  }

  pixelToAxial(x: number, y: number, hexSize: number): GridPosition {
    const q = ((2 / 3) * x) / hexSize;
    const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / hexSize;
    return this.roundAxial({ q, r });
  }

  private roundAxial(pos: { q: number; r: number }): GridPosition {
    const s = -pos.q - pos.r;
    let rq = Math.round(pos.q);
    let rr = Math.round(pos.r);
    const rs = Math.round(s);

    const qDiff = Math.abs(rq - pos.q);
    const rDiff = Math.abs(rr - pos.r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }
}
