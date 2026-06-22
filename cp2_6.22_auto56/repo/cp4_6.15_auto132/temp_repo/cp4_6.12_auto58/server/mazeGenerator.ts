export interface Position {
  x: number;
  y: number;
}

export interface MazeData {
  walls: Position[];
  treasures: Position[];
  monsters: Position[];
  start: Position;
  end: Position;
  size: number;
}

const MAZE_SIZE = 25;

export function generateMaze(seed?: number): MazeData {
  const random = seed ? seededRandom(seed) : Math.random;

  const grid: boolean[][] = [];
  for (let y = 0; y < MAZE_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < MAZE_SIZE; x++) {
      grid[y][x] = true;
    }
  }

  const start: Position = { x: 1, y: 1 };
  const end: Position = { x: MAZE_SIZE - 2, y: MAZE_SIZE - 2 };

  const stack: Position[] = [];
  grid[start.y][start.x] = false;
  stack.push(start);

  const directions = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { pos: Position; wall: Position }[] = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (nx > 0 && nx < MAZE_SIZE - 1 && ny > 0 && ny < MAZE_SIZE - 1 && grid[ny][nx]) {
        neighbors.push({
          pos: { x: nx, y: ny },
          wall: { x: current.x + dir.dx / 2, y: current.y + dir.dy / 2 },
        });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(random() * neighbors.length)];
      grid[next.wall.y][next.wall.x] = false;
      grid[next.pos.y][next.pos.x] = false;
      stack.push(next.pos);
    } else {
      stack.pop();
    }
  }

  const pathCells: Position[] = [];
  const walls: Position[] = [];

  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      if (grid[y][x]) {
        walls.push({ x, y });
      } else {
        if (!(x === start.x && y === start.y) && !(x === end.x && y === end.y)) {
          pathCells.push({ x, y });
        }
      }
    }
  }

  shuffleArray(pathCells, random);

  const treasureCount = 5 + Math.floor(random() * 4);
  const treasures: Position[] = [];
  for (let i = 0; i < treasureCount && i < pathCells.length; i++) {
    treasures.push(pathCells[i]);
  }

  const monsterCount = 3 + Math.floor(random() * 3);
  const monsters: Position[] = [];
  for (let i = treasureCount; i < treasureCount + monsterCount && i < pathCells.length; i++) {
    monsters.push(pathCells[i]);
  }

  return {
    walls,
    treasures,
    monsters,
    start,
    end,
    size: MAZE_SIZE,
  };
}

export function validateMove(
  maze: MazeData,
  playerPos: Position,
  direction: 'up' | 'down' | 'left' | 'right'
): {
  valid: boolean;
  newPosition: Position;
  type: 'empty' | 'wall' | 'treasure' | 'monster';
  monsterIndex?: number;
  treasureIndex?: number;
} {
  const dirMap = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  const dir = dirMap[direction];
  const newPos = {
    x: playerPos.x + dir.dx,
    y: playerPos.y + dir.dy,
  };

  if (newPos.x < 0 || newPos.x >= maze.size || newPos.y < 0 || newPos.y >= maze.size) {
    return { valid: false, newPosition: playerPos, type: 'wall' };
  }

  const isWall = maze.walls.some((w) => w.x === newPos.x && w.y === newPos.y);
  if (isWall) {
    return { valid: false, newPosition: playerPos, type: 'wall' };
  }

  const treasureIndex = maze.treasures.findIndex((t) => t.x === newPos.x && t.y === newPos.y);
  if (treasureIndex !== -1) {
    return { valid: true, newPosition: newPos, type: 'treasure', treasureIndex };
  }

  const monsterIndex = maze.monsters.findIndex((m) => m.x === newPos.x && m.y === newPos.y);
  if (monsterIndex !== -1) {
    return { valid: true, newPosition: newPos, type: 'monster', monsterIndex };
  }

  return { valid: true, newPosition: newPos, type: 'empty' };
}

export function rollDice(): { playerRoll: number; monsterRoll: number; playerWins: boolean; damage: number } {
  const playerRoll = Math.floor(Math.random() * 6) + 1;
  const monsterRoll = Math.floor(Math.random() * 6) + 1;
  const playerWins = playerRoll >= monsterRoll;
  return { playerRoll, monsterRoll, playerWins, damage: playerWins ? 0 : 10 };
}

function seededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function shuffleArray<T>(array: T[], random: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
