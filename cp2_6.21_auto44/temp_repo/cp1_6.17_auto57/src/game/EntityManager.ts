import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  Enemy,
  Projectile,
  Chest,
  Trap,
  Particle,
  Floor,
  Item,
  Direction,
} from '../types';
import {
  ANIMATION,
  GAME,
  COLORS,
  DIMENSIONS,
} from '../utils/constants';
import { SlimeAI, SkeletonAI, BatAI } from '../ai/EnemyAI';

export class EntityManager {
  private slimeAI: SlimeAI;
  private skeletonAI: SkeletonAI;
  private batAI: BatAI;

  constructor() {
    this.slimeAI = new SlimeAI();
    this.skeletonAI = new SkeletonAI();
    this.batAI = new BatAI();
  }

  updatePlayer(
    player: Player,
    deltaTime: number,
    floor: Floor,
    bounds: { width: number; height: number },
    currentFloorIdx: number
  ): Player {
    const floorY = bounds.height - (currentFloorIdx + 1) * floor.height;
    const newPlayer = { ...player };

    newPlayer.attackTimer = Math.max(0, newPlayer.attackTimer - deltaTime);
    newPlayer.isAttacking = newPlayer.attackTimer > 0;

    newPlayer.bounceTimer = (newPlayer.bounceTimer + deltaTime) % ANIMATION.BOUNCE_PERIOD;
    const bounceProgress = (Math.PI * 2 * newPlayer.bounceTimer) / ANIMATION.BOUNCE_PERIOD;
    newPlayer.bounceOffset = newPlayer.isMoving
      ? Math.sin(bounceProgress) * ANIMATION.BOUNCE_AMPLITUDE
      : 0;

    newPlayer.invincibleTimer = Math.max(0, newPlayer.invincibleTimer - deltaTime);
    newPlayer.invincible = newPlayer.invincibleTimer > 0;

    newPlayer.hurtFlashTimer = Math.max(0, newPlayer.hurtFlashTimer - deltaTime);
    if (newPlayer.hurtFlashTimer > 0) {
      const flashInterval = ANIMATION.HURT_FLASH_DURATION / ANIMATION.HURT_FLASH_COUNT;
      const flashCount = Math.floor(
        (ANIMATION.HURT_FLASH_DURATION - newPlayer.hurtFlashTimer) / flashInterval
      );
      newPlayer.hurtFlash = flashCount % 2 === 0;
    } else {
      newPlayer.hurtFlash = false;
    }

    newPlayer.x = Math.max(0, Math.min(newPlayer.x, floor.width - newPlayer.width));
    newPlayer.y = Math.max(
      floorY,
      Math.min(newPlayer.y, floorY + floor.height - newPlayer.height - 4)
    );

    return newPlayer;
  }

  updateEnemies(
    enemies: Enemy[],
    player: Player,
    deltaTime: number,
    spawnProjectile: (p: Projectile) => void
  ): { enemies: Enemy[]; particles: Particle[] } {
    const particles: Particle[] = [];
    const updatedEnemies: Enemy[] = [];

    for (const enemy of enemies) {
      if (!enemy.alive) {
        const newDeathTimer = enemy.deathTimer - deltaTime;
        if (newDeathTimer <= 0) {
          continue;
        }
        updatedEnemies.push({ ...enemy, deathTimer: newDeathTimer });
        continue;
      }

      let result;
      switch (enemy.type) {
        case 'slime':
          result = this.slimeAI.update(enemy, player.x, player.y, deltaTime, spawnProjectile);
          break;
        case 'skeleton':
          result = this.skeletonAI.update(enemy, player.x, player.y, deltaTime, spawnProjectile);
          break;
        case 'bat':
          result = this.batAI.update(enemy, player.x, player.y, deltaTime, spawnProjectile);
          break;
        default:
          result = { vx: 0, vy: 0, shouldShoot: false };
      }

      let newX = enemy.x + result.vx;
      let newY = enemy.y + result.vy;

      newX = Math.max(0, Math.min(newX, DIMENSIONS.CANVAS_MIN_WIDTH - enemy.width));
      newY = Math.max(0, Math.min(newY, DIMENSIONS.CANVAS_MIN_HEIGHT - enemy.height));

      let newDirection: Direction = enemy.direction;
      if (result.vx < 0) newDirection = 'left';
      else if (result.vx > 0) newDirection = 'right';

      updatedEnemies.push({
        ...enemy,
        x: newX,
        y: newY,
        direction: newDirection,
      });
    }

    return { enemies: updatedEnemies, particles };
  }

  updateProjectiles(
    projectiles: Projectile[],
    player: Player,
    enemies: Enemy[],
    _deltaTime: number,
    bounds: { width: number; height: number }
  ): {
    projectiles: Projectile[];
    playerDamage: number;
    enemyDamages: Record<string, number>;
  } {
    const playerDamage = 0;
    const enemyDamages: Record<string, number> = {};
    const updatedProjectiles: Projectile[] = [];

    for (const proj of projectiles) {
      if (!proj.active) continue;

      const newX = proj.x + proj.vx;
      const newY = proj.y + proj.vy;

      if (
        newX < 0 ||
        newX > bounds.width ||
        newY < 0 ||
        newY > bounds.height
      ) {
        continue;
      }

      let hit = false;

      if (proj.owner === 'enemy' && !player.invincible) {
        if (this.checkCollision(
          { x: newX - proj.size / 2, y: newY - proj.size / 2, width: proj.size, height: proj.size },
          player
        )) {
          hit = true;
        }
      }

      if (proj.owner === 'player') {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (this.checkCollision(
            { x: newX - proj.size / 2, y: newY - proj.size / 2, width: proj.size, height: proj.size },
            enemy
          )) {
            enemyDamages[enemy.id] = (enemyDamages[enemy.id] || 0) + proj.damage;
            hit = true;
            break;
          }
        }
      }

      if (!hit) {
        updatedProjectiles.push({ ...proj, x: newX, y: newY });
      }
    }

    return { projectiles: updatedProjectiles, playerDamage, enemyDamages };
  }

  updateChests(
    chests: Chest[],
    player: Player,
    deltaTime: number
  ): { chests: Chest[]; goldCollected: number; itemsCollected: Item[] } {
    let goldCollected = 0;
    const itemsCollected: Item[] = [];
    const updatedChests: Chest[] = [];

    for (const chest of chests) {
      const newChest = { ...chest };

      if (!chest.opened && this.checkCollision(player, chest)) {
        newChest.opened = true;
        newChest.openAnimation = ANIMATION.CHEST_OPEN_DURATION;
        newChest.glowAnimation = ANIMATION.CHEST_GLOW_DURATION;

        if (chest.contents.gold) {
          goldCollected = chest.contents.gold;
        }
        if (chest.contents.item) {
          itemsCollected.push(chest.contents.item);
        }
      }

      if (newChest.openAnimation > 0) {
        newChest.openAnimation = Math.max(0, newChest.openAnimation - deltaTime);
      }
      if (newChest.glowAnimation > 0) {
        newChest.glowAnimation = Math.max(0, newChest.glowAnimation - deltaTime);
      }

      updatedChests.push(newChest);
    }

    return { chests: updatedChests, goldCollected, itemsCollected };
  }

  updateTraps(
    traps: Trap[],
    player: Player,
    deltaTime: number
  ): { traps: Trap[]; playerDamage: number } {
    let playerDamage = 0;
    const updatedTraps: Trap[] = [];

    for (const trap of traps) {
      const newTrap = { ...trap };

      if (trap.active && !trap.triggered && this.checkCollision(player, trap)) {
        newTrap.triggered = true;
        newTrap.animationTimer = 500;
        if (!player.invincible) {
          playerDamage = GAME.TRAP_DAMAGE;
        }
      }

      if (newTrap.animationTimer > 0) {
        newTrap.animationTimer = Math.max(0, newTrap.animationTimer - deltaTime);
      }

      if (trap.type === 'spike') {
        newTrap.active = true;
      }

      updatedTraps.push(newTrap);
    }

    return { traps: updatedTraps, playerDamage };
  }

  updateParticles(particles: Particle[], deltaTime: number): Particle[] {
    const updated: Particle[] = [];

    for (const particle of particles) {
      const newLife = particle.life - deltaTime;
      if (newLife <= 0) continue;

      updated.push({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: newLife,
      });
    }

    return updated;
  }

  checkCollision(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  createDeathParticles(x: number, y: number, color: string): Particle[] {
    const count = 4 + Math.floor(Math.random() * 3);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2;

      particles.push({
        id: uuidv4(),
        x: x + Math.random() * 10 - 5,
        y: y + Math.random() * 10 - 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: 3 + Math.random() * 3,
        life: ANIMATION.PARTICLE_DURATION,
        maxLife: ANIMATION.PARTICLE_DURATION,
      });
    }

    return particles;
  }

  checkPlayerAttack(
    player: Player,
    enemies: Enemy[]
  ): { enemyDamages: Record<string, number>; particles: Particle[] } {
    const enemyDamages: Record<string, number> = {};
    const particles: Particle[] = [];

    if (!player.isAttacking) {
      return { enemyDamages, particles };
    }

    const attackProgress = 1 - player.attackTimer / ANIMATION.ATTACK_DURATION;
    if (attackProgress < 0.3 || attackProgress > 0.7) {
      return { enemyDamages, particles };
    }

    const attackRange = 30;
    let attackX = player.x + player.width / 2;
    const attackY = player.y + player.height / 2;

    if (player.direction === 'left') {
      attackX -= attackRange;
    } else {
      attackX += attackRange;
    }

    const attackBox = {
      x: attackX - 15,
      y: attackY - 15,
      width: 30,
      height: 30,
    };

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      if (this.checkCollision(attackBox, enemy)) {
        enemyDamages[enemy.id] = player.attack;
        particles.push(...this.createDeathParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, COLORS.HP_BAR_START));
      }
    }

    return { enemyDamages, particles };
  }

  checkStairsCollision(
    player: Player,
    stairsX: number,
    stairsY: number,
    stairsWidth: number = 32,
    stairsHeight: number = 32
  ): boolean {
    return this.checkCollision(player, {
      x: stairsX,
      y: stairsY,
      width: stairsWidth,
      height: stairsHeight,
    });
  }

  applyEnemyDamage(
    enemies: Enemy[],
    enemyDamages: Record<string, number>
  ): { enemies: Enemy[]; goldEarned: number; expEarned: number; particles: Particle[] } {
    let goldEarned = 0;
    let expEarned = 0;
    const particles: Particle[] = [];
    const updatedEnemies: Enemy[] = [];

    for (const enemy of enemies) {
      const damage = enemyDamages[enemy.id] || 0;
      if (damage > 0 && enemy.alive) {
        const newHealth = enemy.health - damage;
        if (newHealth <= 0) {
          goldEarned += GAME.ENEMY_GOLD_REWARD;
          expEarned += GAME.ENEMY_EXP_REWARD;
          particles.push(...this.createDeathParticles(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            enemy.type === 'slime' ? COLORS.SLIME :
            enemy.type === 'skeleton' ? COLORS.SKELETON : COLORS.BAT
          ));
          updatedEnemies.push({
            ...enemy,
            health: 0,
            alive: false,
            deathTimer: 300,
          });
        } else {
          updatedEnemies.push({ ...enemy, health: newHealth });
        }
      } else {
        updatedEnemies.push(enemy);
      }
    }

    return { enemies: updatedEnemies, goldEarned, expEarned, particles };
  }

  applyPlayerDamage(player: Player, damage: number): Player {
    if (player.invincible || damage <= 0) return player;

    const actualDamage = Math.max(1, damage - player.defense);
    const newHealth = Math.max(0, player.health - actualDamage);

    return {
      ...player,
      health: newHealth,
      invincible: true,
      invincibleTimer: GAME.INVINCIBLE_DURATION,
      hurtFlash: true,
      hurtFlashTimer: ANIMATION.HURT_FLASH_DURATION,
    };
  }

  applyLevelUp(player: Player): Player {
    let newPlayer = { ...player };

    while (newPlayer.experience >= newPlayer.experienceToNext) {
      newPlayer.experience -= newPlayer.experienceToNext;
      newPlayer.level += 1;
      newPlayer.experienceToNext = Math.floor(newPlayer.experienceToNext * 1.5);
      newPlayer.maxHealth += 10;
      newPlayer.health = newPlayer.maxHealth;
      newPlayer.attack += 2;
      newPlayer.defense += 1;
    }

    return newPlayer;
  }
}
