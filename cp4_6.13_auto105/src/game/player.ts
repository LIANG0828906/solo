import type { MazeData, Cell } from './maze';
import { animationQueue, easeInOutCubic } from '../renderer/animation';

export interface PlayerState {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  isMoving: boolean;
  steps: number;
}

interface PlayerStateInternal extends PlayerState {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  moveProgress: number;
  moveDuration: number;
}

const MOVE_DURATION = 0.2;

const playerState: PlayerStateInternal = {
  x: 0,
  y: 0,
  gridX: 0,
  gridY: 0,
  isMoving: false,
  steps: 0,
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  moveProgress: 0,
  moveDuration: MOVE_DURATION
};

export function resetPlayer(startX: number, startY: number, cellSize: number): void {
  const pixelX = startX * cellSize + cellSize / 2;
  const pixelY = startY * cellSize + cellSize / 2;

  playerState.x = pixelX;
  playerState.y = pixelY;
  playerState.gridX = startX;
  playerState.gridY = startY;
  playerState.isMoving = false;
  playerState.steps = 0;
  playerState.fromX = pixelX;
  playerState.fromY = pixelY;
  playerState.toX = pixelX;
  playerState.toY = pixelY;
  playerState.moveProgress = 0;
}

export function getPlayerPosition(): PlayerState {
  return {
    x: playerState.x,
    y: playerState.y,
    gridX: playerState.gridX,
    gridY: playerState.gridY,
    isMoving: playerState.isMoving,
    steps: playerState.steps
  };
}

export function movePlayer(
  direction: 'up' | 'down' | 'left' | 'right',
  mazeData: MazeData,
  cellSize: number
): boolean {
  if (playerState.isMoving) return false;

  const currentCell = mazeData[playerState.gridY]?.[playerState.gridX];
  if (!currentCell) return false;

  let newGridX = playerState.gridX;
  let newGridY = playerState.gridY;

  switch (direction) {
    case 'up':
      if (currentCell.walls.top || playerState.gridY <= 0) return false;
      newGridY--;
      break;
    case 'down':
      if (currentCell.walls.bottom || playerState.gridY >= mazeData.length - 1) return false;
      newGridY++;
      break;
    case 'left':
      if (currentCell.walls.left || playerState.gridX <= 0) return false;
      newGridX--;
      break;
    case 'right':
      if (currentCell.walls.right || playerState.gridX >= mazeData[0].length - 1) return false;
      newGridX++;
      break;
  }

  playerState.isMoving = true;
  playerState.steps++;
  playerState.fromX = playerState.x;
  playerState.fromY = playerState.y;
  playerState.toX = newGridX * cellSize + cellSize / 2;
  playerState.toY = newGridY * cellSize + cellSize / 2;
  playerState.moveProgress = 0;

  animationQueue.add({
    duration: MOVE_DURATION * 1000,
    easing: easeInOutCubic,
    onUpdate: (value: number) => {
      playerState.moveProgress = value;
      playerState.x = playerState.fromX + (playerState.toX - playerState.fromX) * value;
      playerState.y = playerState.fromY + (playerState.toY - playerState.fromY) * value;
    },
    onComplete: () => {
      playerState.gridX = newGridX;
      playerState.gridY = newGridY;
      playerState.x = playerState.toX;
      playerState.y = playerState.toY;
      playerState.isMoving = false;
    }
  });

  return true;
}

export function updatePlayerAnimation(dt: number): void {
  // 动画由 animationQueue 驱动，此函数保留供外部调用
}

export function checkCollision(
  px: number,
  py: number,
  mazeData: MazeData,
  cellSize: number
): boolean {
  const gridX = Math.floor(px / cellSize);
  const gridY = Math.floor(py / cellSize);
  const size = mazeData.length;

  if (gridX < 0 || gridX >= size || gridY < 0 || gridY >= size) {
    return true;
  }

  const cell: Cell = mazeData[gridY][gridX];
  const localX = px - gridX * cellSize;
  const localY = py - gridY * cellSize;
  const wallThickness = Math.max(2, cellSize * 0.08);

  if (cell.walls.top && localY < wallThickness) return true;
  if (cell.walls.bottom && localY > cellSize - wallThickness) return true;
  if (cell.walls.left && localX < wallThickness) return true;
  if (cell.walls.right && localX > cellSize - wallThickness) return true;

  return false;
}
