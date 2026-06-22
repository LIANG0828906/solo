import { LevelData, isWalkable, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './levelGenerator';

export interface PlayerState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  moveProgress: number;
  moveInterval: number;
  moveTimer: number;
  isSneaking: boolean;
  score: number;
}

export function createPlayer(level: LevelData): PlayerState {
  let startX = 0;
  let startY = 0;
  outer: for (let y = 0; y < level.grid.length; y++) {
    for (let x = 0; x < level.grid[y].length; x++) {
      if (level.grid[y][x] === 'room') {
        let isTreasureRoom = x === level.treasure.x && y === level.treasure.y;
        let isExitRoom = x === level.exit.x && y === level.exit.y;
        if (!isTreasureRoom && !isExitRoom) {
          startX = x;
          startY = y;
          break outer;
        }
      }
    }
  }

  return {
    x: startX,
    y: startY,
    targetX: startX,
    targetY: startY,
    isMoving: false,
    moveProgress: 0,
    moveInterval: 0.15,
    moveTimer: 0,
    isSneaking: false,
    score: 0,
  };
}

export function tryMovePlayer(
  player: PlayerState,
  dx: number,
  dy: number,
  level: LevelData
): void {
  if (player.isMoving) return;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (isWalkable(level.grid, nx, ny)) {
    player.targetX = nx;
    player.targetY = ny;
    player.isMoving = true;
    player.moveProgress = 0;
    player.moveInterval = player.isSneaking ? 0.3 : 0.15;
  }
}

export function updatePlayer(player: PlayerState, dt: number, keys: Set<string>): void {
  player.isSneaking = keys.has(' ');

  if (player.isMoving) {
    player.moveProgress += dt / player.moveInterval;
    if (player.moveProgress >= 1) {
      player.x = player.targetX;
      player.y = player.targetY;
      player.isMoving = false;
      player.moveProgress = 1;
    }
  }
}

export function getPlayerRenderPos(player: PlayerState): { px: number; py: number } {
  const t = player.isMoving ? player.moveProgress : 1;
  const rx = player.x + (player.targetX - player.x) * (player.isMoving ? t : 0);
  const ry = player.y + (player.targetY - player.y) * (player.isMoving ? t : 0);
  return {
    px: GRID_OFFSET_X + rx * TILE_SIZE + TILE_SIZE / 2,
    py: GRID_OFFSET_Y + ry * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function handleMovementInput(
  player: PlayerState,
  keys: Set<string>,
  level: LevelData,
  dt: number
): void {
  player.moveTimer -= dt;
  if (player.moveTimer > 0) return;

  let dx = 0;
  let dy = 0;

  if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy = -1;
  else if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy = 1;
  else if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx = -1;
  else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx = 1;

  if (dx !== 0 || dy !== 0) {
    tryMovePlayer(player, dx, dy, level);
    player.moveTimer = 0.02;
  }
}
