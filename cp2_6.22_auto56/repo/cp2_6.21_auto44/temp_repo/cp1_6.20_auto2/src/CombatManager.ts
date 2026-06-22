import { CONFIG, COLORS } from './types';
import type {
  Enemy,
  Position,
  PlayerState,
  CombatResult,
  Particle,
  DamageNumber,
  DungeonMap,
  Direction,
} from './types';
import { TileType } from './types';

export class CombatManager {
  private nextEnemyId = 0;

  createEnemy(position: Position): Enemy {
    return {
      id: this.nextEnemyId++,
      position: { ...position },
      targetPosition: { ...position },
      health: CONFIG.ENEMY_HEALTH,
      maxHealth: CONFIG.ENEMY_HEALTH,
      attack: CONFIG.ENEMY_ATTACK,
      isAlive: true,
      isMoving: false,
      moveStartTime: 0,
      flashStartTime: 0,
    };
  }

  isAdjacent(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  findAdjacentEnemy(playerPos: Position, enemies: Enemy[]): Enemy | null {
    for (const enemy of enemies) {
      if (enemy.isAlive && this.isAdjacent(playerPos, enemy.position)) {
        return enemy;
      }
    }
    return null;
  }

  executeCombat(
    player: PlayerState,
    enemy: Enemy,
    currentTime: number
  ): {
    result: CombatResult;
    particles: Particle[];
    damageNumbers: DamageNumber[];
  } {
    const particles: Particle[] = [];
    const damageNumbers: DamageNumber[] = [];

    enemy.health -= player.attack;
    enemy.flashStartTime = currentTime;

    damageNumbers.push({
      x: enemy.position.x,
      y: enemy.position.y,
      value: player.attack,
      color: COLORS.TEXT,
      life: CONFIG.DAMAGE_NUMBER_DURATION,
      maxLife: CONFIG.DAMAGE_NUMBER_DURATION,
    });

    const result: CombatResult = {
      enemyDefeated: false,
      playerDied: false,
      experienceGained: 0,
      healthPotionDropped: false,
    };

    if (enemy.health <= 0) {
      enemy.isAlive = false;
      result.enemyDefeated = true;
      result.experienceGained = CONFIG.EXP_PER_KILL;

      if (Math.random() < CONFIG.HEALTH_POTION_DROP_CHANCE) {
        result.healthPotionDropped = true;
      }

      for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT + Math.random() * 0.5;
        const speed = 0.05 + Math.random() * 0.1;
        particles.push({
          x: enemy.position.x + 0.5,
          y: enemy.position.y + 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: COLORS.PARTICLE_RED,
          size: 3 + Math.random() * 3,
          life: CONFIG.PARTICLE_DURATION,
          maxLife: CONFIG.PARTICLE_DURATION,
        });
      }
    } else {
      player.health -= enemy.attack;

      damageNumbers.push({
        x: player.position.x,
        y: player.position.y,
        value: enemy.attack,
        color: COLORS.ENEMY,
        life: CONFIG.DAMAGE_NUMBER_DURATION,
        maxLife: CONFIG.DAMAGE_NUMBER_DURATION,
      });

      if (player.health <= 0) {
        result.playerDied = true;
      }
    }

    return { result, particles, damageNumbers };
  }

  updateEnemyAI(
    enemy: Enemy,
    playerPos: Position,
    dungeon: DungeonMap,
    enemies: Enemy[],
    currentTime: number
  ): boolean {
    if (!enemy.isAlive || enemy.isMoving) return false;

    if (this.isAdjacent(enemy.position, playerPos)) {
      return false;
    }

    const direction = this.getDirectionTowardsPlayer(enemy.position, playerPos);
    if (!direction) return false;

    const delta: Position = { x: 0, y: 0 };
    switch (direction) {
      case 'up':
        delta.y = -1;
        break;
      case 'down':
        delta.y = 1;
        break;
      case 'left':
        delta.x = -1;
        break;
      case 'right':
        delta.x = 1;
        break;
    }

    const newX = enemy.position.x + delta.x;
    const newY = enemy.position.y + delta.y;

    if (this.isValidEnemyMove(newX, newY, dungeon, enemies, enemy.id)) {
      enemy.targetPosition = { x: newX, y: newY };
      enemy.isMoving = true;
      enemy.moveStartTime = currentTime;
      return true;
    }

    return false;
  }

  updateEnemyMovement(enemy: Enemy, currentTime: number): void {
    if (!enemy.isMoving || !enemy.isAlive) return;

    const elapsed = currentTime - enemy.moveStartTime;

    if (elapsed >= CONFIG.MOVE_ANIMATION_DURATION) {
      enemy.position = { ...enemy.targetPosition };
      enemy.isMoving = false;
    }
  }

  getInterpolatedEnemyPosition(enemy: Enemy, currentTime: number): Position {
    if (!enemy.isMoving) {
      return { ...enemy.position };
    }

    const elapsed = currentTime - enemy.moveStartTime;
    const progress = Math.min(elapsed / CONFIG.MOVE_ANIMATION_DURATION, 1);
    const easedProgress = this.easeOutQuad(progress);

    return {
      x: enemy.position.x + (enemy.targetPosition.x - enemy.position.x) * easedProgress,
      y: enemy.position.y + (enemy.targetPosition.y - enemy.position.y) * easedProgress,
    };
  }

  isEnemyFlashing(enemy: Enemy, currentTime: number): boolean {
    return currentTime - enemy.flashStartTime < 100;
  }

  private getDirectionTowardsPlayer(enemyPos: Position, playerPos: Position): Direction | null {
    const dx = playerPos.x - enemyPos.x;
    const dy = playerPos.y - enemyPos.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) return 'right';
      if (dx < 0) return 'left';
    } else {
      if (dy > 0) return 'down';
      if (dy < 0) return 'up';
    }

    if (dx !== 0) {
      return dx > 0 ? 'right' : 'left';
    }
    if (dy !== 0) {
      return dy > 0 ? 'down' : 'up';
    }

    return null;
  }

  private isValidEnemyMove(
    x: number,
    y: number,
    dungeon: DungeonMap,
    enemies: Enemy[],
    enemyId: number
  ): boolean {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) {
      return false;
    }

    const tile = dungeon.tiles[y][x];
    if (tile !== TileType.FLOOR && tile !== TileType.EXIT) {
      return false;
    }

    for (const other of enemies) {
      if (
        other.id !== enemyId &&
        other.isAlive &&
        other.position.x === x &&
        other.position.y === y
      ) {
        return false;
      }
    }

    return true;
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }
}
