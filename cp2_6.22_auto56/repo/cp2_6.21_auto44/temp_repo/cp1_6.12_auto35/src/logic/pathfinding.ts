import { Position, Cell, TerrainType, Unit } from '../types/game';

const TERRAIN_COSTS: Record<TerrainType, { walkable: boolean; cost: number }> = {
  grass: { walkable: true, cost: 1 },
  mountain: { walkable: true, cost: 2 },
  water: { walkable: false, cost: Infinity },
};

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(pos: Position, mapSize: number): Position[] {
  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];
  const result: Position[] = [];
  for (const dir of dirs) {
    const nx = pos.x + dir.x;
    const ny = pos.y + dir.y;
    if (nx >= 0 && nx < mapSize && ny >= 0 && ny < mapSize) {
      result.push({ x: nx, y: ny });
    }
  }
  return result;
}

function terrainToCell(terrain: TerrainType[][]): Cell[][] {
  return terrain.map((row, y) =>
    row.map((t, x) => ({
      x,
      y,
      terrain: t,
      walkable: TERRAIN_COSTS[t].walkable,
      moveCost: TERRAIN_COSTS[t].cost,
    }))
  );
}

export function findPath(
  start: Position,
  goal: Position,
  terrain: TerrainType[][],
  mapSize: number,
  units: Unit[] = []
): Position[] | null {
  const cells = terrainToCell(terrain);
  const unitPositions = new Set(
    units.filter((u) => u.isAlive).map((u) => `${u.position.x},${u.position.y}`)
  );

  const openSet: Position[] = [start];
  const cameFrom = new Map<string, Position>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const startKey = `${start.x},${start.y}`;
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start, goal));

  while (openSet.length > 0) {
    openSet.sort((a, b) => {
      const fa = fScore.get(`${a.x},${a.y}`) ?? Infinity;
      const fb = fScore.get(`${b.x},${b.y}`) ?? Infinity;
      return fa - fb;
    });

    const current = openSet.shift()!;
    const currentKey = `${current.x},${current.y}`;

    if (current.x === goal.x && current.y === goal.y) {
      const path: Position[] = [current];
      let curr = current;
      while (cameFrom.has(`${curr.x},${curr.y}`)) {
        curr = cameFrom.get(`${curr.x},${curr.y}`)!;
        path.unshift(curr);
      }
      return path;
    }

    const neighbors = getNeighbors(current, mapSize);

    for (const neighbor of neighbors) {
      const cell = cells[neighbor.y][neighbor.x];
      if (!cell.walkable) continue;

      const neighborKey = `${neighbor.x},${neighbor.y}`;
      const isGoal = neighbor.x === goal.x && neighbor.y === goal.y;
      if (!isGoal && unitPositions.has(neighborKey)) continue;

      const tentativeG = (gScore.get(currentKey) ?? Infinity) + cell.moveCost;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic(neighbor, goal));

        if (!openSet.some((p) => p.x === neighbor.x && p.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null;
}

export function getReachableCells(
  start: Position,
  moveRange: number,
  terrain: TerrainType[][],
  mapSize: number,
  units: Unit[] = []
): Position[] {
  const cells = terrainToCell(terrain);
  const unitPositions = new Set(
    units.filter((u) => u.isAlive).map((u) => `${u.position.x},${u.position.y}`)
  );
  unitPositions.delete(`${start.x},${start.y}`);

  const reachable: Position[] = [];
  const visited = new Map<string, number>();
  const queue: { pos: Position; cost: number }[] = [{ pos: start, cost: 0 }];

  visited.set(`${start.x},${start.y}`, 0);

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { pos, cost } = queue.shift()!;

    if (cost > 0) {
      reachable.push(pos);
    }

    const neighbors = getNeighbors(pos, mapSize);

    for (const neighbor of neighbors) {
      const cell = cells[neighbor.y][neighbor.x];
      if (!cell.walkable) continue;

      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (unitPositions.has(neighborKey)) continue;

      const newCost = cost + cell.moveCost;

      if (newCost <= moveRange && newCost < (visited.get(neighborKey) ?? Infinity)) {
        visited.set(neighborKey, newCost);
        queue.push({ pos: neighbor, cost: newCost });
      }
    }
  }

  return reachable;
}

export function getAttackableTargets(
  position: Position,
  attackRange: number,
  units: Unit[],
  targetTeam: string
): Unit[] {
  return units.filter((u) => {
    if (!u.isAlive || u.team !== targetTeam) return false;
    const dist = Math.abs(u.position.x - position.x) + Math.abs(u.position.y - position.y);
    return dist <= attackRange && dist > 0;
  });
}
