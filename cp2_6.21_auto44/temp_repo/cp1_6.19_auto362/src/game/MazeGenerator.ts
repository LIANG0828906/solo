type SeededRandom = () => number;

function createSeededRandom(seed: number): SeededRandom {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MAZE_SIZE = 15;
const WALL = 1;
const PATH = 0;

export function generateMaze(seed: number): number[][] {
  const rand = createSeededRandom(seed);
  const grid: number[][] = Array.from({ length: MAZE_SIZE }, () =>
    Array(MAZE_SIZE).fill(WALL)
  );

  const visited: boolean[][] = Array.from({ length: MAZE_SIZE }, () =>
    Array(MAZE_SIZE).fill(false)
  );

  const directions = [
    { dx: 0, dy: -2 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
    { dx: 2, dy: 0 },
  ];

  function carve(cx: number, cy: number) {
    visited[cy][cx] = true;
    grid[cy][cx] = PATH;

    const dirs = [...directions];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const { dx, dy } of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (
        nx >= 0 &&
        nx < MAZE_SIZE &&
        ny >= 0 &&
        ny < MAZE_SIZE &&
        !visited[ny][nx]
      ) {
        grid[cy + dy / 2][cx + dx / 2] = PATH;
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);

  grid[0][0] = PATH;
  grid[MAZE_SIZE - 1][MAZE_SIZE - 1] = PATH;

  return grid;
}

export function getRandomPathCells(
  grid: number[][],
  seed: number,
  count: number
): { x: number; y: number }[] {
  const rand = createSeededRandom(seed + 9999);
  const pathCells: { x: number; y: number }[] = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] === PATH) {
        pathCells.push({ x, y });
      }
    }
  }

  const result: { x: number; y: number }[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (result.length < count && attempts < 1000) {
    const idx = Math.floor(rand() * pathCells.length);
    const cell = pathCells[idx];
    const key = `${cell.x},${cell.y}`;
    const isStart = cell.x === 0 && cell.y === 0;
    const isEnd =
      cell.x === grid[0].length - 1 && cell.y === grid.length - 1;
    if (!used.has(key) && !isStart && !isEnd) {
      used.add(key);
      result.push(cell);
    }
    attempts++;
  }

  return result;
}

export { MAZE_SIZE, WALL, PATH };
