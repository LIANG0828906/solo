import { MapGrid, HexCoord, Unit } from './MapGrid';

export interface PathNode {
  q: number;
  r: number;
  distance: number;
  previous: PathNode | null;
}

export interface RangeResult {
  reachable: Map<string, PathNode>;
  path: HexCoord[] | null;
}

export class PathFinder {
  private grid: MapGrid;

  constructor(grid: MapGrid) {
    this.grid = grid;
  }

  public findPath(start: HexCoord, end: HexCoord, maxSteps: number): HexCoord[] | null {
    if (!this.grid.isInBounds(start.q, start.r) || !this.grid.isInBounds(end.q, end.r)) {
      return null;
    }

    const endCell = this.grid.getCell(end.q, end.r);
    if (!endCell || endCell.type === 'obstacle') {
      return null;
    }

    const visited = new Map<string, PathNode>();
    const queue: PathNode[] = [];
    const startKey = `${start.q},${start.r}`;

    visited.set(startKey, {
      q: start.q,
      r: start.r,
      distance: 0,
      previous: null,
    });
    queue.push(visited.get(startKey)!);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.q === end.q && current.r === end.r) {
        return this.reconstructPath(current);
      }

      if (current.distance >= maxSteps) {
        continue;
      }

      const neighbors = this.grid.getNeighbors(current.q, current.r);
      for (const neighbor of neighbors) {
        const key = `${neighbor.q},${neighbor.r}`;
        if (visited.has(key)) continue;

        const isTarget = neighbor.q === end.q && neighbor.r === end.r;
        const unitAtNeighbor = this.grid.getUnitAt(neighbor.q, neighbor.r);
        
        if (!isTarget && unitAtNeighbor) continue;
        if (!this.grid.isWalkable(neighbor.q, neighbor.r)) continue;

        const node: PathNode = {
          q: neighbor.q,
          r: neighbor.r,
          distance: current.distance + 1,
          previous: current,
        };

        visited.set(key, node);
        queue.push(node);
      }
    }

    return null;
  }

  public getReachableRange(unit: Unit): Map<string, PathNode> {
    const reachable = new Map<string, PathNode>();
    const startKey = `${unit.q},${unit.r}`;

    reachable.set(startKey, {
      q: unit.q,
      r: unit.r,
      distance: 0,
      previous: null,
    });

    const queue: PathNode[] = [reachable.get(startKey)!];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.distance >= unit.moveRange) {
        continue;
      }

      const neighbors = this.grid.getNeighbors(current.q, current.r);
      for (const neighbor of neighbors) {
        const key = `${neighbor.q},${neighbor.r}`;
        if (reachable.has(key)) continue;

        const unitAtNeighbor = this.grid.getUnitAt(neighbor.q, neighbor.r);
        if (unitAtNeighbor) continue;
        if (!this.grid.isWalkable(neighbor.q, neighbor.r)) continue;

        const node: PathNode = {
          q: neighbor.q,
          r: neighbor.r,
          distance: current.distance + 1,
          previous: current,
        };

        reachable.set(key, node);
        queue.push(node);
      }
    }

    return reachable;
  }

  public getAttackRange(unit: Unit): HexCoord[] {
    const attackPositions: HexCoord[] = [];
    
    for (let r = 0; r < this.grid.height; r++) {
      for (let q = 0; q < this.grid.width; q++) {
        const distance = this.grid.getDistance(
          { q: unit.q, r: unit.r },
          { q, r }
        );
        if (distance > 0 && distance <= unit.attackRange) {
          attackPositions.push({ q, r });
        }
      }
    }

    return attackPositions;
  }

  public getEnemiesInRange(unit: Unit, enemyTeam: 'player' | 'enemy'): Unit[] {
    const enemies = this.grid.getUnitsByTeam(enemyTeam);
    return enemies.filter(enemy => {
      const distance = this.grid.getDistance(
        { q: unit.q, r: unit.r },
        { q: enemy.q, r: enemy.r }
      );
      return distance <= unit.attackRange;
    });
  }

  public findClosestEnemy(unit: Unit, enemyTeam: 'player' | 'enemy'): Unit | null {
    const enemies = this.grid.getUnitsByTeam(enemyTeam);
    if (enemies.length === 0) return null;

    let closest: Unit | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      const distance = this.grid.getDistance(
        { q: unit.q, r: unit.r },
        { q: enemy.q, r: enemy.r }
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = enemy;
      }
    }

    return closest;
  }

  private reconstructPath(end: PathNode): HexCoord[] {
    const path: HexCoord[] = [];
    let current: PathNode | null = end;

    while (current !== null) {
      path.unshift({ q: current.q, r: current.r });
      current = current.previous;
    }

    return path;
  }
}
