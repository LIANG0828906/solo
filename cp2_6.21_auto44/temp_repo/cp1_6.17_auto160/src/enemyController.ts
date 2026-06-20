import { eventBus } from './eventBus';
import { levelData, CELL_SIZE, isWallPixel } from './levelData';

export interface EnemyState {
  id: number;
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
  patrolPath: { gridX: number; gridY: number }[];
  patrolIndex: number;
  alive: boolean;
  dying: boolean;
  dyingStartTime: number;
  alerted: boolean;
  alertTargetX: number;
  alertTargetY: number;
  speed: number;
  detectionRadius: number;
  detectionAngle: number;
}

const ENEMY_SPEED = 1;
const DETECTION_RADIUS = 150;
const DETECTION_ANGLE = Math.PI / 4;
const ENEMY_SIZE = 20;
const DYING_DURATION = 500;
const HIT_RADIUS = 14;

let enemies: EnemyState[] = [];

function getFacingAngle(facing: string): number {
  switch (facing) {
    case 'up': return -Math.PI / 2;
    case 'down': return Math.PI / 2;
    case 'left': return Math.PI;
    case 'right': return 0;
    default: return 0;
  }
}

function getFacingFromAngle(angle: number): 'up' | 'down' | 'left' | 'right' {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (normalized < Math.PI / 4 || normalized >= 7 * Math.PI / 4) return 'right';
  if (normalized >= Math.PI / 4 && normalized < 3 * Math.PI / 4) return 'down';
  if (normalized >= 3 * Math.PI / 4 && normalized < 5 * Math.PI / 4) return 'left';
  return 'up';
}

function isPointInDetectionCone(px: number, py: number, enemy: EnemyState): boolean {
  const dx = px - enemy.x;
  const dy = py - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > DETECTION_RADIUS) return false;

  const angleToPoint = Math.atan2(dy, dx);
  const facingAngle = getFacingAngle(enemy.facing);
  let angleDiff = angleToPoint - facingAngle;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  return Math.abs(angleDiff) <= DETECTION_ANGLE;
}

function isHitFromBehind(hitDx: number, hitDy: number, facing: string): boolean {
  const facingAngle = getFacingAngle(facing);
  const hitAngle = Math.atan2(hitDy, hitDx);
  let angleDiff = hitAngle - facingAngle;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  return Math.abs(angleDiff) > Math.PI / 2;
}

function moveToward(enemy: EnemyState, tx: number, ty: number): void {
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return;

  const nx = enemy.x + (dx / dist) * enemy.speed;
  const ny = enemy.y + (dy / dist) * enemy.speed;

  if (!isWallPixel(nx, enemy.y)) {
    enemy.x = nx;
  }
  if (!isWallPixel(enemy.x, ny)) {
    enemy.y = ny;
  }

  enemy.facing = getFacingFromAngle(Math.atan2(dy, dx));
}

function patrolTick(enemy: EnemyState): void {
  const target = enemy.patrolPath[enemy.patrolIndex];
  const tx = (target.gridX + 0.5) * CELL_SIZE;
  const ty = (target.gridY + 0.5) * CELL_SIZE;
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 3) {
    enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPath.length;
  } else {
    moveToward(enemy, tx, ty);
  }
}

export function initEnemies(): void {
  enemies = levelData.enemies.map((spawn, i) => ({
    id: i,
    x: (spawn.gridX + 0.5) * CELL_SIZE,
    y: (spawn.gridY + 0.5) * CELL_SIZE,
    facing: spawn.facing,
    patrolPath: spawn.patrolPath,
    patrolIndex: 0,
    alive: true,
    dying: false,
    dyingStartTime: 0,
    alerted: false,
    alertTargetX: 0,
    alertTargetY: 0,
    speed: ENEMY_SPEED,
    detectionRadius: DETECTION_RADIUS,
    detectionAngle: DETECTION_ANGLE,
  }));
}

export function tick(now: number): void {
  enemies.forEach(enemy => {
    if (!enemy.alive) return;

    if (enemy.dying) {
      if (now - enemy.dyingStartTime >= DYING_DURATION) {
        enemy.alive = false;
        eventBus.emit('enemy:destroyed', { enemyId: enemy.id });
      }
      return;
    }

    if (enemy.alerted) {
      moveToward(enemy, enemy.alertTargetX, enemy.alertTargetY);
    } else {
      patrolTick(enemy);
    }
  });

  const allDead = enemies.every(e => !e.alive);
  if (allDead && enemies.length > 0) {
    eventBus.emit('level:complete', {});
    enemies = [];
  }
}

export function handleWaveHit(x: number, y: number, dx: number, dy: number): void {
  enemies.forEach(enemy => {
    if (!enemy.alive || enemy.dying) return;

    const edx = x - enemy.x;
    const edy = y - enemy.y;
    const dist = Math.sqrt(edx * edx + edy * edy);

    if (dist <= HIT_RADIUS) {
      if (isHitFromBehind(dx, dy, enemy.facing)) {
        enemy.dying = true;
        enemy.dyingStartTime = performance.now();
      } else if (isPointInDetectionCone(x, y, enemy)) {
        enemy.alerted = true;
        enemy.alertTargetX = x;
        enemy.alertTargetY = y;
        eventBus.emit('enemy:alerted', { enemyId: enemy.id, targetX: x, targetY: y });
      }
    } else if (isPointInDetectionCone(x, y, enemy)) {
      enemy.alerted = true;
      enemy.alertTargetX = x;
      enemy.alertTargetY = y;
      eventBus.emit('enemy:alerted', { enemyId: enemy.id, targetX: x, targetY: y });
    }
  });
}

export function getEnemies(): EnemyState[] {
  return enemies;
}

export function getAliveEnemyCount(): number {
  return enemies.filter(e => e.alive).length;
}

export function isPointInEnemyCone(px: number, py: number, enemyId: number): boolean {
  const enemy = enemies.find(e => e.id === enemyId);
  if (!enemy || !enemy.alive || enemy.dying) return false;
  return isPointInDetectionCone(px, py, enemy);
}

export function getEnemyConeData(enemyId: number): { x: number; y: number; facing: string; radius: number; angle: number } | null {
  const enemy = enemies.find(e => e.id === enemyId);
  if (!enemy || !enemy.alive) return null;
  return {
    x: enemy.x,
    y: enemy.y,
    facing: enemy.facing,
    radius: enemy.detectionRadius,
    angle: enemy.detectionAngle,
  };
}
