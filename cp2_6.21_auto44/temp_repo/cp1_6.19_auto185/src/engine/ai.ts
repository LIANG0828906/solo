import type { Cell, Position, AIState, AIAction, Direction, Character } from '@/types/game';
import { isWalkable, manhattanDistance, areAdjacent } from './labyrinth';

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function aStar(grid: Cell[][], start: Position, end: Position): Position[] {
  const width = grid[0].length;
  const height = grid.length;

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: manhattanDistance(start, end),
    f: manhattanDistance(start, end),
    parent: null,
  };

  openSet.push(startNode);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.x === end.x && current.y === end.y) {
      const path: Position[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (!isWalkable(grid, nx, ny)) continue;
      if (closedSet.has(`${nx},${ny}`)) continue;

      const g = current.g + 1;
      const h = manhattanDistance({ x: nx, y: ny }, end);
      const f = g + h;

      const existingNode = openSet.find((n) => n.x === nx && n.y === ny);

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          x: nx,
          y: ny,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  return [];
}

function getRandomDirection(grid: Cell[][], pos: Position): Direction | null {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  const deltas: Record<Direction, { dx: number; dy: number }> = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  const valid: Direction[] = [];

  for (const dir of directions) {
    const { dx, dy } = deltas[dir];
    if (isWalkable(grid, pos.x + dx, pos.y + dy)) {
      valid.push(dir);
    }
  }

  if (valid.length === 0) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

function getFleeDirection(grid: Cell[][], aiPos: Position, playerPos: Position): Direction | null {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  const deltas: Record<Direction, { dx: number; dy: number }> = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  let bestDir: Direction | null = null;
  let maxDist = -1;

  for (const dir of directions) {
    const { dx, dy } = deltas[dir];
    const nx = aiPos.x + dx;
    const ny = aiPos.y + dy;

    if (!isWalkable(grid, nx, ny)) continue;

    const dist = manhattanDistance({ x: nx, y: ny }, playerPos);
    if (dist > maxDist) {
      maxDist = dist;
      bestDir = dir;
    }
  }

  return bestDir;
}

export function determineAIState(
  aiCharacter: Character,
  playerPos: Position,
): AIState {
  const distance = manhattanDistance(aiCharacter.position, playerPos);
  const hpPercent = aiCharacter.hp / aiCharacter.maxHp;

  if (hpPercent < 0.3 && distance < 8) {
    return 'flee';
  }

  if (distance < 5) {
    return 'chase';
  }

  return 'patrol';
}

export function getAIAction(
  grid: Cell[][],
  aiCharacter: Character,
  playerPos: Position,
  aiState: AIState,
): AIAction {
  const aiPos = aiCharacter.position;

  if (areAdjacent(aiPos, playerPos)) {
    return { type: 'attack' };
  }

  const deltas: Record<Direction, { dx: number; dy: number }> = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  switch (aiState) {
    case 'chase': {
      const path = aStar(grid, aiPos, playerPos);
      if (path.length > 1) {
        const nextPos = path[1];
        const dx = nextPos.x - aiPos.x;
        const dy = nextPos.y - aiPos.y;

        let direction: Direction | null = null;
        if (dx === 1) direction = 'right';
        else if (dx === -1) direction = 'left';
        else if (dy === 1) direction = 'down';
        else if (dy === -1) direction = 'up';

        if (direction) {
          const steps = Math.min(2, aiCharacter.moveRange);
          return { type: 'move', direction, steps };
        }
      }

      const randomDir = getRandomDirection(grid, aiPos);
      if (randomDir) {
        return { type: 'move', direction: randomDir, steps: 1 };
      }
      return { type: 'wait' };
    }

    case 'flee': {
      const fleeDir = getFleeDirection(grid, aiPos, playerPos);
      if (fleeDir) {
        return { type: 'move', direction: fleeDir, steps: 1 };
      }
      return { type: 'wait' };
    }

    case 'patrol':
    default: {
      const randomDir = getRandomDirection(grid, aiPos);
      if (randomDir) {
        return { type: 'move', direction: randomDir, steps: 1 };
      }
      return { type: 'wait' };
    }
  }
}

export { aStar };
