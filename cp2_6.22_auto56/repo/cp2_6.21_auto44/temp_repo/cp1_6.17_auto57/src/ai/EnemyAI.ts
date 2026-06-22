import { v4 as uuidv4 } from 'uuid';
import { AI, COLORS } from '../utils/constants';
import type { Enemy, Projectile } from '../types';

export interface AIUpdateResult {
  vx: number;
  vy: number;
  shouldShoot: boolean;
}

export class SlimeAI {
  update(
    enemy: Enemy,
    playerX: number,
    playerY: number,
    deltaTime: number,
    _spawnProjectile?: (projectile: Projectile) => void
  ): AIUpdateResult {
    const now = Date.now();
    let { lastJumpTime, jumpDuration, isJumping, targetX, targetY } = enemy.aiState;

    if (!isJumping && now - lastJumpTime >= AI.SLIME_JUMP_INTERVAL) {
      isJumping = 1;
      targetX = playerX;
      targetY = playerY;
      jumpDuration = 500;
      lastJumpTime = now;
    }

    let vx = 0;
    let vy = 0;

    if (isJumping) {
      jumpDuration -= deltaTime;
      if (jumpDuration <= 0) {
        isJumping = 0;
        jumpDuration = 0;
      } else {
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const speed = enemy.speed * 2;
          vx = (dx / dist) * speed;
          vy = (dy / dist) * speed * 0.5 - 2;
        }
      }
    }

    enemy.aiState = { lastJumpTime, jumpDuration, isJumping, targetX, targetY };

    return { vx, vy, shouldShoot: false };
  }
}

export class SkeletonAI {
  update(
    enemy: Enemy,
    playerX: number,
    playerY: number,
    deltaTime: number,
    spawnProjectile?: (projectile: Projectile) => void
  ): AIUpdateResult {
    const now = Date.now();
    let { lastShootTime, patrolDir, patrolTimer } = enemy.aiState;

    if (patrolTimer === undefined) patrolTimer = 0;
    if (patrolDir === undefined) patrolDir = 1;

    patrolTimer -= deltaTime;
    if (patrolTimer <= 0) {
      patrolDir *= -1;
      patrolTimer = 2000;
    }

    const vx = patrolDir * enemy.speed * 0.5;
    const vy = 0;

    enemy.direction = vx < 0 ? 'left' : 'right';

    let shouldShoot = false;
    if (now - lastShootTime >= AI.SKELETON_SHOOT_INTERVAL) {
      lastShootTime = now;
      shouldShoot = true;

      if (spawnProjectile) {
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const projectileVx = dist > 0 ? (dx / dist) * AI.SKELETON_PROJECTILE_SPEED : AI.SKELETON_PROJECTILE_SPEED;
        const projectileVy = dist > 0 ? (dy / dist) * AI.SKELETON_PROJECTILE_SPEED : 0;

        const projectile: Projectile = {
          id: uuidv4(),
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: projectileVx,
          vy: projectileVy,
          damage: enemy.attack,
          owner: 'enemy',
          color: COLORS.BONE,
          size: 6,
          active: true,
        };
        spawnProjectile(projectile);
      }
    }

    enemy.aiState = { lastShootTime, patrolDir, patrolTimer };

    return { vx, vy, shouldShoot };
  }
}

export class BatAI {
  update(
    enemy: Enemy,
    playerX: number,
    playerY: number,
    deltaTime: number,
    _spawnProjectile?: (projectile: Projectile) => void
  ): AIUpdateResult {
    const now = Date.now();
    let { startTime, baseY, zPhase, zDirection } = enemy.aiState;

    if (startTime === undefined) startTime = now;
    if (baseY === undefined) baseY = enemy.y;
    if (zPhase === undefined) zPhase = 0;
    if (zDirection === undefined) zDirection = playerX > enemy.x ? 1 : -1;

    const elapsed = now - startTime;
    const sineOffset = Math.sin((elapsed / AI.BAT_PERIOD) * Math.PI * 2) * AI.BAT_AMPLITUDE;

    zPhase += deltaTime;
    if (zPhase > 1500) {
      zPhase = 0;
      zDirection *= -1;
    }

    const dx = playerX - enemy.x;
    const targetVx = dx > 0 ? enemy.speed : -enemy.speed;
    const vx = targetVx * 0.6 + zDirection * enemy.speed * 0.4;

    const targetY = baseY + sineOffset;
    const vy = (targetY - enemy.y) * 0.1;

    if (Math.abs(dx) < 200) {
      baseY = playerY;
    }

    enemy.direction = vx < 0 ? 'left' : 'right';

    enemy.aiState = { startTime, baseY, zPhase, zDirection };

    return { vx, vy, shouldShoot: false };
  }
}
