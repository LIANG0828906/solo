import { Position } from '../map/types';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Player {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  roomX: number;
  roomY: number;
  hp: number;
  maxHp: number;
  gold: number;
  attack: number;
  direction: Direction;
  isMoving: boolean;
  moveProgress: number;
  moveFromX: number;
  moveFromY: number;
  moveToX: number;
  moveToY: number;
  moveToGridX: number;
  moveToGridY: number;
  animFrame: 0 | 1;
  animTimer: number;
  isAttacking: boolean;
  attackTimer: number;
  damageText: number;
  damageTextTimer: number;
  hurtTimer: number;
  moveCooldown: number;
}

const MOVE_DURATION = 0.3;
const ANIM_FRAME_DURATION = 0.15;

export function createPlayer(
  gridX: number,
  gridY: number,
  roomX: number,
  roomY: number,
  tileSize: number
): Player {
  const x = gridX * tileSize;
  const y = gridY * tileSize;
  return {
    x,
    y,
    gridX,
    gridY,
    roomX,
    roomY,
    hp: 10,
    maxHp: 10,
    gold: 0,
    attack: 1,
    direction: 'down',
    isMoving: false,
    moveProgress: 0,
    moveFromX: x,
    moveFromY: y,
    moveToX: x,
    moveToY: y,
    moveToGridX: gridX,
    moveToGridY: gridY,
    animFrame: 0,
    animTimer: 0,
    isAttacking: false,
    attackTimer: 0,
    damageText: 0,
    damageTextTimer: 0,
    hurtTimer: 0,
    moveCooldown: 0,
  };
}

export function startMove(
  player: Player,
  direction: Direction,
  tileSize: number
): boolean {
  if (player.isMoving || player.moveCooldown > 0) return false;

  player.direction = direction;
  player.isMoving = true;
  player.moveProgress = 0;
  player.moveFromX = player.x;
  player.moveFromY = player.y;
  player.moveToGridX = player.gridX;
  player.moveToGridY = player.gridY;

  switch (direction) {
    case 'up':
      player.moveToY = player.y - tileSize;
      player.moveToX = player.x;
      player.moveToGridY = player.gridY - 1;
      break;
    case 'down':
      player.moveToY = player.y + tileSize;
      player.moveToX = player.x;
      player.moveToGridY = player.gridY + 1;
      break;
    case 'left':
      player.moveToX = player.x - tileSize;
      player.moveToY = player.y;
      player.moveToGridX = player.gridX - 1;
      break;
    case 'right':
      player.moveToX = player.x + tileSize;
      player.moveToY = player.y;
      player.moveToGridX = player.gridX + 1;
      break;
  }

  return true;
}

export function updatePlayer(player: Player, deltaTime: number): void {
  if (player.moveCooldown > 0) {
    player.moveCooldown = Math.max(0, player.moveCooldown - deltaTime);
  }

  if (player.isMoving) {
    player.moveProgress += deltaTime / MOVE_DURATION;

    if (player.moveProgress >= 1) {
      player.moveProgress = 1;
      player.x = player.moveToX;
      player.y = player.moveToY;
      player.gridX = player.moveToGridX;
      player.gridY = player.moveToGridY;
      player.isMoving = false;
      player.moveCooldown = MOVE_DURATION;
    } else {
      player.x = player.moveFromX + (player.moveToX - player.moveFromX) * player.moveProgress;
      player.y = player.moveFromY + (player.moveToY - player.moveFromY) * player.moveProgress;
    }
  }

  player.animTimer += deltaTime;
  if (player.animTimer >= ANIM_FRAME_DURATION) {
    player.animTimer = 0;
    player.animFrame = player.animFrame === 0 ? 1 : 0;
  }

  if (player.attackTimer > 0) {
    player.attackTimer -= deltaTime;
    if (player.attackTimer <= 0) {
      player.isAttacking = false;
    }
  }

  if (player.hurtTimer > 0) {
    player.hurtTimer -= deltaTime;
  }

  if (player.damageTextTimer > 0) {
    player.damageTextTimer -= deltaTime;
  }
}

export function attackMonster(player: Player): number {
  player.isAttacking = true;
  player.attackTimer = 0.3;
  return Math.floor(Math.random() * 3) + 1;
}

export function takeDamage(player: Player, damage: number): void {
  player.hp = Math.max(0, player.hp - damage);
  player.hurtTimer = 0.5;
  player.damageText = damage;
  player.damageTextTimer = 0.8;
}

export function heal(player: Player, amount: number): void {
  player.hp = Math.min(player.maxHp, player.hp + amount);
}

export function addGold(player: Player, amount: number): void {
  player.gold += amount;
}
