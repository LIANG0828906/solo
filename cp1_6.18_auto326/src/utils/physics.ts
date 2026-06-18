import type { Position, Block } from '../types/game';

export const GRID_SIZE: number = 64;
export const MAGNETIC_RANGE: number = 1.5;
export const MAGNETIC_ACCELERATION: number = 0.3;
export const MAX_SPEED: number = 3;
export const BOUNCE_FACTOR: number = 0.6;
export const BALL_RADIUS: number = 12;

export const GAME_OFFSET_X: number = 48;
export const GAME_OFFSET_Y: number = 80;

export function gridToWorld(gridX: number, gridY: number): Position {
  return {
    x: GAME_OFFSET_X + gridX * GRID_SIZE + GRID_SIZE / 2,
    y: GAME_OFFSET_Y + gridY * GRID_SIZE + GRID_SIZE / 2,
  };
}

export function worldToGrid(worldX: number, worldY: number): Position {
  return {
    x: Math.floor((worldX - GAME_OFFSET_X) / GRID_SIZE),
    y: Math.floor((worldY - GAME_OFFSET_Y) / GRID_SIZE),
  };
}

export function calculateMagneticForce(
  ballPos: Position,
  blocks: Block[]
): { fx: number; fy: number } {
  let fx: number = 0;
  let fy: number = 0;

  for (const block of blocks) {
    if (block.type === 'neutral') continue;

    const blockWorldPos: Position = gridToWorld(block.gridX, block.gridY);
    const dx: number = ballPos.x - blockWorldPos.x;
    const dy: number = ballPos.y - blockWorldPos.y;
    const distance: number = Math.sqrt(dx * dx + dy * dy);
    const distanceGrid: number = distance / GRID_SIZE;

    if (distanceGrid > MAGNETIC_RANGE || distance === 0) continue;

    const forceMagnitude: number = MAGNETIC_ACCELERATION / (distanceGrid * distanceGrid);
    const nx: number = dx / distance;
    const ny: number = dy / distance;

    let direction: number = 1;
    if (block.type === 's') {
      direction = -1;
    }

    fx += direction * forceMagnitude * nx;
    fy += direction * forceMagnitude * ny;
  }

  return { fx, fy };
}

export function clampSpeed(
  vx: number,
  vy: number,
  maxSpeed: number
): { vx: number; vy: number } {
  const speed: number = Math.sqrt(vx * vx + vy * vy);
  if (speed <= maxSpeed) {
    return { vx, vy };
  }
  const scale: number = maxSpeed / speed;
  return {
    vx: vx * scale,
    vy: vy * scale,
  };
}

export function checkHoleCollision(
  ballPos: Position,
  holePos: Position,
  threshold: number = 16
): boolean {
  const dx: number = ballPos.x - holePos.x;
  const dy: number = ballPos.y - holePos.y;
  const distance: number = Math.sqrt(dx * dx + dy * dy);
  return distance <= threshold;
}

export function checkWallCollision(
  ballX: number,
  ballY: number,
  ballRadius: number,
  worldWidth: number,
  worldHeight: number
): {
  hit: boolean;
  newVx: number;
  newVy: number;
  newX: number;
  newY: number;
} {
  let hit: boolean = false;
  let newVx: number = 0;
  let newVy: number = 0;
  let newX: number = ballX;
  let newY: number = ballY;

  const minX: number = GAME_OFFSET_X + ballRadius;
  const maxX: number = GAME_OFFSET_X + worldWidth - ballRadius;
  const minY: number = GAME_OFFSET_Y + ballRadius;
  const maxY: number = GAME_OFFSET_Y + worldHeight - ballRadius;

  if (ballX <= minX) {
    newX = minX;
    newVx = BOUNCE_FACTOR;
    hit = true;
  } else if (ballX >= maxX) {
    newX = maxX;
    newVx = -BOUNCE_FACTOR;
    hit = true;
  }

  if (ballY <= minY) {
    newY = minY;
    newVy = BOUNCE_FACTOR;
    hit = true;
  } else if (ballY >= maxY) {
    newY = maxY;
    newVy = -BOUNCE_FACTOR;
    hit = true;
  }

  return { hit, newVx, newVy, newX, newY };
}
