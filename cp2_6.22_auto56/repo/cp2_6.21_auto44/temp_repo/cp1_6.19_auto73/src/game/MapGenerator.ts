import { Position, CellType, GRID_SIZE } from './types';

export function generateMap(): CellType[][] {
  const map: CellType[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      map[y][x] = 'wall';
    }
  }

  const path: Position[] = generatePath();

  path.forEach((pos, index) => {
    if (index === 0) {
      map[pos.y][pos.x] = 'entrance';
    } else if (index === path.length - 1) {
      map[pos.y][pos.x] = 'exit';
    } else {
      map[pos.y][pos.x] = 'path';
    }
  });

  const pathSet = new Set(path.map((p) => `${p.x},${p.y}`));

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (map[y][x] === 'wall') {
        const neighbors = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
        ];
        let adjacentToPath = false;
        for (const n of neighbors) {
          const nx = x + n.dx;
          const ny = y + n.dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            if (pathSet.has(`${nx},${ny}`)) {
              adjacentToPath = true;
              break;
            }
          }
        }
        if (adjacentToPath && Math.random() > 0.3) {
          map[y][x] = 'trap_area';
        }
      }
    }
  }

  return map;
}

export function generatePath(): Position[] {
  const path: Position[] = [];
  let current: Position = { x: 0, y: 0 };
  path.push(current);

  const target: Position = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };

  while (current.x !== target.x || current.y !== target.y) {
    const choices: Position[] = [];

    if (current.x < target.x) {
      choices.push({ x: current.x + 1, y: current.y });
    }
    if (current.y < target.y) {
      choices.push({ x: current.x, y: current.y + 1 });
    }
    if (current.x > 0 && Math.random() < 0.15) {
      choices.push({ x: current.x - 1, y: current.y });
    }
    if (current.y > 0 && Math.random() < 0.15) {
      choices.push({ x: current.x, y: current.y - 1 });
    }

    const existing = new Set(path.map((p) => `${p.x},${p.y}`));
    const validChoices = choices.filter((c) => !existing.has(`${c.x},${c.y}`));

    if (validChoices.length === 0) {
      break;
    }

    current = validChoices[Math.floor(Math.random() * validChoices.length)];
    path.push(current);
  }

  return path;
}

interface AStarNode {
  position: Position;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(
  map: CellType[][],
  start: Position,
  end: Position
): Position[] {
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    position: start,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };

  openSet.push(startNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.position.x === end.x && current.position.y === end.y) {
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node.position);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.position.x},${current.position.y}`);

    const neighbors = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (const n of neighbors) {
      const nx = current.position.x + n.dx;
      const ny = current.position.y + n.dy;

      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;

      const cellType = map[ny][nx];
      if (cellType === 'wall' || cellType === 'trap_area') continue;

      const key = `${nx},${ny}`;
      if (closedSet.has(key)) continue;

      const tentativeG = current.g + 1;
      const neighborPos: Position = { x: nx, y: ny };

      const existing = openSet.find(
        (node) => node.position.x === nx && node.position.y === ny
      );

      if (!existing) {
        openSet.push({
          position: neighborPos,
          g: tentativeG,
          h: heuristic(neighborPos, end),
          f: tentativeG + heuristic(neighborPos, end),
          parent: current,
        });
      } else if (tentativeG < existing.g) {
        existing.g = tentativeG;
        existing.f = tentativeG + existing.h;
        existing.parent = current;
      }
    }
  }

  return [];
}
