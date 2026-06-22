import type { Position, Monster } from "@/types/game";
import { MAZE_SIZE, PATH } from "./MazeGenerator";

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

export function bfsPath(
  grid: number[][],
  start: Position,
  end: Position
): Position[] {
  if (start.x === end.x && start.y === end.y) return [];

  const visited = new Set<string>();
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [] }];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    for (const { dx, dy } of DIRECTIONS) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      const key = `${nx},${ny}`;

      if (
        nx >= 0 &&
        nx < MAZE_SIZE &&
        ny >= 0 &&
        ny < MAZE_SIZE &&
        grid[ny][nx] === PATH &&
        !visited.has(key)
      ) {
        const newPath = [...path, { x: nx, y: ny }];
        if (nx === end.x && ny === end.y) {
          return newPath;
        }
        visited.add(key);
        queue.push({ pos: { x: nx, y: ny }, path: newPath });
      }
    }
  }

  return [];
}

export function canMove(grid: number[][], pos: Position): boolean {
  return (
    pos.x >= 0 &&
    pos.x < MAZE_SIZE &&
    pos.y >= 0 &&
    pos.y < MAZE_SIZE &&
    grid[pos.y][pos.x] === PATH
  );
}

export function movePlayer(
  grid: number[][],
  current: Position,
  dx: number,
  dy: number
): Position {
  const next = { x: current.x + dx, y: current.y + dy };
  if (canMove(grid, next)) return next;
  return current;
}

export function updateMonsterAI(
  monster: Monster,
  playerPos: Position,
  grid: number[][]
): Monster {
  if (!monster.alive) return monster;

  const dist = Math.abs(monster.position.x - playerPos.x) + Math.abs(monster.position.y - playerPos.y);

  if (dist <= 2) {
    const dx = playerPos.x - monster.position.x;
    const dy = playerPos.y - monster.position.y;

    let nextPos: Position = monster.position;

    if (Math.abs(dx) >= Math.abs(dy)) {
      const step = dx > 0 ? 1 : -1;
      const candidate = { x: monster.position.x + step, y: monster.position.y };
      if (canMove(grid, candidate)) {
        nextPos = candidate;
      } else if (dy !== 0) {
        const yStep = dy > 0 ? 1 : -1;
        const yCandidate = { x: monster.position.x, y: monster.position.y + yStep };
        if (canMove(grid, yCandidate)) {
          nextPos = yCandidate;
        }
      }
    } else {
      const step = dy > 0 ? 1 : -1;
      const candidate = { x: monster.position.x, y: monster.position.y + step };
      if (canMove(grid, candidate)) {
        nextPos = candidate;
      } else if (dx !== 0) {
        const xStep = dx > 0 ? 1 : -1;
        const xCandidate = { x: monster.position.x + xStep, y: monster.position.y };
        if (canMove(grid, xCandidate)) {
          nextPos = xCandidate;
        }
      }
    }

    return {
      ...monster,
      position: nextPos,
      mode: "chase",
    };
  }

  if (monster.mode === "chase") {
    return { ...monster, mode: "patrol" };
  }

  const target = monster.patrolPoints[monster.currentPatrolIndex];
  if (!target) return monster;

  if (monster.position.x === target.x && monster.position.y === target.y) {
    return {
      ...monster,
      currentPatrolIndex: (monster.currentPatrolIndex + 1) % monster.patrolPoints.length,
    };
  }

  const path = bfsPath(grid, monster.position, target);
  if (path.length > 0) {
    return {
      ...monster,
      position: path[0],
    };
  }

  return monster;
}

export function checkBattle(playerPos: Position, monsters: Monster[]): string | null {
  for (const m of monsters) {
    if (m.alive && m.position.x === playerPos.x && m.position.y === playerPos.y) {
      return m.id;
    }
  }
  return null;
}

export function checkWin(playerPos: Position): boolean {
  return playerPos.x === MAZE_SIZE - 1 && playerPos.y === MAZE_SIZE - 1;
}
