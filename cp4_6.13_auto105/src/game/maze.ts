export interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
  generated: boolean;
}

export type MazeData = Cell[][];

export interface GenerationState {
  isGenerating: boolean;
  isPaused: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
}

let currentMaze: MazeData | null = null;

let generationState: GenerationState = {
  isGenerating: false,
  isPaused: false,
  progress: 0,
  currentStep: 0,
  totalSteps: 0
};

let generationTimerId: number | null = null;
let generationSteps: Array<{ maze: MazeData }> = [];
let currentStepIndex = 0;
let currentOnStep: ((maze: MazeData, state: GenerationState) => void) | null = null;
let currentStepInterval = 50;

export function generateMaze(size: number): MazeData {
  const maze: MazeData = [];

  for (let y = 0; y < size; y++) {
    maze[y] = [];
    for (let x = 0; x < size; x++) {
      maze[y][x] = {
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        generated: false
      };
    }
  }

  const stack: Cell[] = [];
  const startCell = maze[0][0];
  startCell.visited = true;
  startCell.generated = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(maze, current, size);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      next.generated = true;
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  currentMaze = maze;
  return maze;
}

function getUnvisitedNeighbors(maze: MazeData, cell: Cell, size: number): Cell[] {
  const neighbors: Cell[] = [];
  const { x, y } = cell;

  if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x]);
  if (x < size - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1]);
  if (y < size - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x]);
  if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1]);

  return neighbors;
}

function removeWall(current: Cell, next: Cell): void {
  const dx = next.x - current.x;
  const dy = next.y - current.y;

  if (dx === 1) {
    current.walls.right = false;
    next.walls.left = false;
  } else if (dx === -1) {
    current.walls.left = false;
    next.walls.right = false;
  } else if (dy === 1) {
    current.walls.bottom = false;
    next.walls.top = false;
  } else if (dy === -1) {
    current.walls.top = false;
    next.walls.bottom = false;
  }
}

export function getMazeData(): MazeData | null {
  return currentMaze;
}

export function setMazeData(maze: MazeData): void {
  currentMaze = maze;
}

function generateAnimationSteps(size: number): Array<{ maze: MazeData }> {
  const steps: Array<{ maze: MazeData }> = [];
  const maze: MazeData = [];

  for (let y = 0; y < size; y++) {
    maze[y] = [];
    for (let x = 0; x < size; x++) {
      maze[y][x] = {
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        generated: false
      };
    }
  }

  steps.push({ maze: cloneMaze(maze) });

  const stack: Cell[] = [];
  const startCell = maze[0][0];
  startCell.visited = true;
  startCell.generated = true;
  stack.push(startCell);
  steps.push({ maze: cloneMaze(maze) });

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(maze, current, size);

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      next.generated = true;
      stack.push(next);
      steps.push({ maze: cloneMaze(maze) });
    } else {
      stack.pop();
    }
  }

  return steps;
}

function cloneMaze(maze: MazeData): MazeData {
  return maze.map(row =>
    row.map(cell => ({
      ...cell,
      walls: { ...cell.walls }
    }))
  );
}

export function startGenerationAnimation(
  size: number,
  onStep: (maze: MazeData, state: GenerationState) => void,
  stepInterval: number = 50
): () => void {
  stopGenerationAnimation();

  generationSteps = generateAnimationSteps(size);
  currentStepIndex = 0;
  currentOnStep = onStep;
  currentStepInterval = stepInterval;

  generationState = {
    isGenerating: true,
    isPaused: false,
    progress: 0,
    currentStep: 0,
    totalSteps: generationSteps.length
  };

  runNextStep();

  return stopGenerationAnimation;
}

function runNextStep(): void {
  if (generationState.isPaused) return;
  if (currentStepIndex >= generationSteps.length) {
    generationState.isGenerating = false;
    if (currentOnStep && generationSteps.length > 0) {
      currentMaze = generationSteps[generationSteps.length - 1].maze;
      currentOnStep(currentMaze, generationState);
    }
    return;
  }

  const step = generationSteps[currentStepIndex];
  currentMaze = step.maze;
  generationState.currentStep = currentStepIndex;
  generationState.progress = generationSteps.length > 0
    ? (currentStepIndex + 1) / generationSteps.length
    : 1;

  if (currentOnStep) {
    currentOnStep(step.maze, { ...generationState });
  }

  currentStepIndex++;

  generationTimerId = window.setTimeout(runNextStep, currentStepInterval);
}

export function pauseGeneration(): void {
  generationState.isPaused = true;
  if (generationTimerId !== null) {
    clearTimeout(generationTimerId);
    generationTimerId = null;
  }
}

export function resumeGeneration(): void {
  if (!generationState.isGenerating) return;
  generationState.isPaused = false;
  runNextStep();
}

export function stopGenerationAnimation(): void {
  if (generationTimerId !== null) {
    clearTimeout(generationTimerId);
    generationTimerId = null;
  }
  generationState.isGenerating = false;
  generationState.isPaused = false;
  generationSteps = [];
  currentStepIndex = 0;
}

export function getGenerationState(): GenerationState {
  return { ...generationState };
}

export function findPath(maze: MazeData, start: { x: number; y: number }, end: { x: number; y: number }): Array<{ x: number; y: number }> {
  const size = maze.length;
  const visited: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  const parent: Array<Array<{ x: number; y: number } | null>> = Array(size).fill(null).map(() => Array(size).fill(null));
  const queue: Array<{ x: number; y: number }> = [];

  queue.push(start);
  visited[start.y][start.x] = true;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x === end.x && current.y === end.y) {
      const path: Array<{ x: number; y: number }> = [];
      let node: { x: number; y: number } | null = end;
      while (node) {
        path.unshift(node);
        node = parent[node.y][node.x];
      }
      return path;
    }

    const cell = maze[current.y][current.x];
    const neighbors: Array<{ x: number; y: number }> = [];

    if (!cell.walls.top && current.y > 0) neighbors.push({ x: current.x, y: current.y - 1 });
    if (!cell.walls.right && current.x < size - 1) neighbors.push({ x: current.x + 1, y: current.y });
    if (!cell.walls.bottom && current.y < size - 1) neighbors.push({ x: current.x, y: current.y + 1 });
    if (!cell.walls.left && current.x > 0) neighbors.push({ x: current.x - 1, y: current.y });

    for (const neighbor of neighbors) {
      if (!visited[neighbor.y][neighbor.x]) {
        visited[neighbor.y][neighbor.x] = true;
        parent[neighbor.y][neighbor.x] = current;
        queue.push(neighbor);
      }
    }
  }

  return [];
}
