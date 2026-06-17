import { LevelData, isWalkable, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE } from './levelGenerator';
import { PlayerState } from './player';

export type GuardState = 'patrol' | 'chase' | 'stunned';

export interface Guard {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  moveProgress: number;
  moveInterval: number;
  state: GuardState;
  facing: number;
  patrolPath: { x: number; y: number }[];
  patrolIndex: number;
  visionTimer: number;
  stunTimer: number;
  chaseTargetX: number;
  chaseTargetY: number;
}

export function createGuards(level: LevelData): Guard[] {
  const guards: Guard[] = [];
  const numGuards = Math.max(1, Math.min(3, Math.floor(level.rooms.length / 2) + 1));

  const candidatePositions: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (level.grid[y][x] === 'corridor' || level.grid[y][x] === 'door') {
        let neighborCorridors = 0;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of dirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            if (level.grid[ny][nx] === 'corridor') neighborCorridors++;
          }
        }
        if (neighborCorridors >= 2) {
          candidatePositions.push({ x, y });
        }
      }
    }
  }

  for (let i = 0; i < numGuards && candidatePositions.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidatePositions.length);
    const pos = candidatePositions.splice(idx, 1)[0];
    const patrolPath = generatePatrolPath(pos.x, pos.y, level);
    guards.push({
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      isMoving: false,
      moveProgress: 0,
      moveInterval: 3.0,
      state: 'patrol',
      facing: Math.floor(Math.random() * 4),
      patrolPath,
      patrolIndex: 0,
      visionTimer: 0,
      stunTimer: 0,
      chaseTargetX: pos.x,
      chaseTargetY: pos.y,
    });
  }

  return guards;
}

function generatePatrolPath(
  startX: number,
  startY: number,
  level: LevelData
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let cx = startX;
  let cy = startY;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const pathLength = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < pathLength; i++) {
    const candidates: { x: number; y: number }[] = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (isWalkable(level.grid, nx, ny)) {
        let alreadyInPath = false;
        for (const p of path) {
          if (p.x === nx && p.y === ny) {
            alreadyInPath = true;
            break;
          }
        }
        if (!alreadyInPath) {
          candidates.push({ x: nx, y: ny });
        }
      }
    }
    if (candidates.length === 0) break;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    path.push(next);
    cx = next.x;
    cy = next.y;
  }

  return path;
}

export function isInVisionCone(
  guard: Guard,
  playerX: number,
  playerY: number,
  level: LevelData,
  playerSneaking: boolean
): boolean {
  if (guard.state === 'stunned') return false;

  const dx = playerX - guard.x;
  const dy = playerY - guard.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const visionRadius = playerSneaking ? 2 : 4;

  if (dist > visionRadius) return false;
  if (dist < 0.01) return true;

  let angleToPlayer = Math.atan2(dy, dx);
  let guardAngle = 0;
  switch (guard.facing) {
    case 0: guardAngle = -Math.PI / 2; break;
    case 1: guardAngle = 0; break;
    case 2: guardAngle = Math.PI / 2; break;
    case 3: guardAngle = Math.PI; break;
  }

  let diff = angleToPlayer - guardAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  const halfCone = Math.PI / 4;
  if (Math.abs(diff) > halfCone) return false;

  return hasLineOfSight(guard.x, guard.y, playerX, playerY, level);
}

function hasLineOfSight(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  level: LevelData
): boolean {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  if (steps === 0) return true;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = Math.floor(x0 + (x1 - x0) * t);
    const py = Math.floor(y0 + (y1 - y0) * t);
    if (px < 0 || px >= GRID_SIZE || py < 0 || py >= GRID_SIZE) return false;
    if (level.grid[py][px] === 'wall') return false;
  }
  return true;
}

export function updateGuard(
  guard: Guard,
  dt: number,
  player: PlayerState,
  level: LevelData,
  alertLevel: { value: number }
): void {
  guard.visionTimer -= dt;
  if (guard.state === 'stunned') {
    guard.stunTimer -= dt;
    if (guard.stunTimer <= 0) {
      guard.state = 'patrol';
    }
    return;
  }

  if (guard.visionTimer <= 0) {
    guard.visionTimer = 0.1;
    const playerSeen = isInVisionCone(guard, player.x, player.y, level, player.isSneaking);
    if (playerSeen && !player.isSneaking) {
      guard.state = 'chase';
      guard.chaseTargetX = player.x;
      guard.chaseTargetY = player.y;
      alertLevel.value = Math.min(5, alertLevel.value + dt * 3);
    } else if (guard.state === 'chase') {
      alertLevel.value = Math.max(0, alertLevel.value - dt * 0.5);
      if (alertLevel.value <= 0) {
        guard.state = 'patrol';
      }
    }
  }

  if (guard.isMoving) {
    guard.moveProgress += dt / guard.moveInterval;
    if (guard.moveProgress >= 1) {
      guard.x = guard.targetX;
      guard.y = guard.targetY;
      guard.isMoving = false;
      guard.moveProgress = 1;
    }
  } else {
    if (guard.state === 'patrol') {
      guard.moveInterval = 3.0;
      const next = guard.patrolPath[guard.patrolIndex];
      if (next.x !== guard.x || next.y !== guard.y) {
        const dx = Math.sign(next.x - guard.x);
        const dy = Math.sign(next.y - guard.y);
        moveGuard(guard, dx, dy, level);
      } else {
        guard.patrolIndex = (guard.patrolIndex + 1) % guard.patrolPath.length;
      }
    } else if (guard.state === 'chase') {
      guard.moveInterval = 0.2;
      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      let mx = 0;
      let my = 0;
      if (Math.abs(dx) >= Math.abs(dy)) {
        mx = Math.sign(dx);
      }
      if (mx === 0 || Math.abs(dy) > Math.abs(dx)) {
        my = Math.sign(dy);
      }
      if (!moveGuard(guard, mx, my, level)) {
        if (mx !== 0) moveGuard(guard, 0, my, level);
        else if (my !== 0) moveGuard(guard, mx, 0, level);
      }
    }
  }
}

function moveGuard(guard: Guard, dx: number, dy: number, level: LevelData): boolean {
  const nx = guard.x + dx;
  const ny = guard.y + dy;
  if (isWalkable(level.grid, nx, ny)) {
    guard.targetX = nx;
    guard.targetY = ny;
    guard.isMoving = true;
    guard.moveProgress = 0;
    if (dx > 0) guard.facing = 1;
    else if (dx < 0) guard.facing = 3;
    else if (dy > 0) guard.facing = 2;
    else if (dy < 0) guard.facing = 0;
    return true;
  }
  return false;
}

export function getGuardRenderPos(guard: Guard): { px: number; py: number } {
  const t = guard.isMoving ? guard.moveProgress : 1;
  const rx = guard.x + (guard.targetX - guard.x) * (guard.isMoving ? t : 0);
  const ry = guard.y + (guard.targetY - guard.y) * (guard.isMoving ? t : 0);
  return {
    px: GRID_OFFSET_X + rx * TILE_SIZE + TILE_SIZE / 2,
    py: GRID_OFFSET_Y + ry * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function areAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1;
}

export function stunGuard(guard: Guard): void {
  guard.state = 'stunned';
  guard.stunTimer = 3.0;
  guard.isMoving = false;
}
