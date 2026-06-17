import {
  Projectile,
  GameState,
} from '../types';
import {
  COLORS,
  DIMENSIONS,
  GAME,
  ANIMATION,
} from '../utils/constants';
import { SpriteRenderer } from '../utils/SpriteRenderer';
import { EntityManager } from './EntityManager';
import { useGameStore } from '../store/gameStore';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: SpriteRenderer;
  private entityManager: EntityManager;
  private lastTime: number;
  private animationFrameId: number | null;
  isRunning: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new SpriteRenderer(canvas);
    this.entityManager = new EntityManager();
    this.lastTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const fixedDelta = Math.min(deltaTime, 50);

    this.handleInput();
    this.update(fixedDelta);
    this.render();

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  private handleInput(): void {
    const state = useGameStore.getState();
    const { keys, gameStatus } = state;

    if (gameStatus !== 'playing') return;

    if (keys['ArrowLeft'] || keys['KeyA']) {
      state.movePlayer('left');
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      state.movePlayer('right');
    } else if (keys['ArrowUp'] || keys['KeyW']) {
      state.movePlayer('up');
    } else if (keys['ArrowDown'] || keys['KeyS']) {
      state.movePlayer('down');
    }

    if (keys['Space']) {
      state.attack();
    }
  }

  private update(deltaTime: number): void {
    const state = useGameStore.getState();
    const {
      player,
      currentFloor,
      floors,
      projectiles,
      particles,
      gameStatus,
    } = state;

    if (gameStatus !== 'playing') return;

    const floor = floors[currentFloor];
    const bounds = {
      width: this.canvas.width,
      height: this.canvas.height,
    };

    let updatedPlayer = this.entityManager.updatePlayer(
      player,
      deltaTime,
      floor,
      bounds,
      currentFloor
    );

    const spawnProjectile = (p: Projectile) => {
      useGameStore.setState((prev) => ({
        projectiles: [...prev.projectiles, p],
      }));
    };

    const enemiesResult = this.entityManager.updateEnemies(
      floor.enemies,
      updatedPlayer,
      deltaTime,
      spawnProjectile
    );
    let updatedEnemies = enemiesResult.enemies;
    let newParticles = [...particles, ...enemiesResult.particles];

    const attackResult = this.entityManager.checkPlayerAttack(
      updatedPlayer,
      updatedEnemies
    );

    const projectilesResult = this.entityManager.updateProjectiles(
      projectiles,
      updatedPlayer,
      updatedEnemies,
      deltaTime,
      bounds
    );

    const combinedEnemyDamages: Record<string, number> = { ...attackResult.enemyDamages };
    for (const [id, dmg] of Object.entries(projectilesResult.enemyDamages)) {
      combinedEnemyDamages[id] = (combinedEnemyDamages[id] || 0) + dmg;
    }

    const damageResult = this.entityManager.applyEnemyDamage(
      updatedEnemies,
      combinedEnemyDamages
    );
    updatedEnemies = damageResult.enemies;
    newParticles.push(...damageResult.particles, ...attackResult.particles);

    if (projectilesResult.playerDamage > 0) {
      updatedPlayer = this.entityManager.applyPlayerDamage(
        updatedPlayer,
        projectilesResult.playerDamage
      );
    }

    const chestsResult = this.entityManager.updateChests(
      floor.chests,
      updatedPlayer,
      deltaTime
    );

    const trapsResult = this.entityManager.updateTraps(
      floor.traps,
      updatedPlayer,
      deltaTime
    );

    if (trapsResult.playerDamage > 0) {
      updatedPlayer = this.entityManager.applyPlayerDamage(
        updatedPlayer,
        trapsResult.playerDamage
      );
    }

    updatedPlayer.gold += damageResult.goldEarned + chestsResult.goldCollected;
    updatedPlayer.experience += damageResult.expEarned;
    updatedPlayer = this.entityManager.applyLevelUp(updatedPlayer);

    newParticles = this.entityManager.updateParticles(newParticles, deltaTime);

    const updatedFloors = [...floors];
    updatedFloors[currentFloor] = {
      ...floor,
      enemies: updatedEnemies,
      chests: chestsResult.chests,
      traps: trapsResult.traps,
    };

    let newTimeRemaining = Math.max(0, state.timeRemaining - deltaTime / 1000);
    const isTimeWarning = newTimeRemaining <= GAME.WARNING_TIME_THRESHOLD;
    let warningAlpha = state.warningAlpha;
    if (isTimeWarning) {
      warningAlpha = Math.min(
        1,
        warningAlpha + deltaTime / ANIMATION.WARNING_TRANSITION
      );
    }

    const isMoving =
      state.keys['ArrowLeft'] ||
      state.keys['ArrowRight'] ||
      state.keys['ArrowUp'] ||
      state.keys['ArrowDown'] ||
      state.keys['KeyA'] ||
      state.keys['KeyD'] ||
      state.keys['KeyW'] ||
      state.keys['KeyS'];
    updatedPlayer.isMoving = isMoving;

    const newInventory = [...state.inventory, ...chestsResult.itemsCollected];

    let newGameStatus: GameState['gameStatus'] = gameStatus;
    if (updatedPlayer.health <= 0) {
      newGameStatus = 'gameover';
    } else if (newTimeRemaining <= 0) {
      newGameStatus = 'gameover';
    }

    useGameStore.setState({
      player: updatedPlayer,
      floors: updatedFloors,
      projectiles: projectilesResult.projectiles,
      particles: newParticles,
      timeRemaining: newTimeRemaining,
      isTimeWarning,
      warningAlpha,
      inventory: newInventory,
      gameStatus: newGameStatus,
    });

    if (
      this.entityManager.checkStairsCollision(
        updatedPlayer,
        floor.stairsX,
        floor.stairsY
      )
    ) {
      state.nextFloor();
    }
  }

  private render(): void {
    const state = useGameStore.getState();
    const {
      player,
      currentFloor,
      floors,
      projectiles,
      particles,
      warningAlpha,
      isTimeWarning,
      gameStatus,
    } = state;

    this.renderer.clear();

    const floor = floors[currentFloor];
    const floorY =
      DIMENSIONS.CANVAS_MIN_HEIGHT - (currentFloor + 1) * floor.height;

    this.renderer.drawFloor(0, floorY, floor.width, floor.height, floor.floorColor);

    this.renderer.drawStairs(floor.stairsX, floor.stairsY, 32, 32);

    for (const chest of floor.chests) {
      const openProgress =
        chest.openAnimation > 0
          ? 1 - chest.openAnimation / ANIMATION.CHEST_OPEN_DURATION
          : chest.opened
          ? 1
          : 0;
      const glowProgress =
        chest.glowAnimation > 0
          ? chest.glowAnimation / ANIMATION.CHEST_GLOW_DURATION
          : 0;
      this.renderer.drawChest(
        chest.x,
        chest.y,
        chest.width,
        chest.height,
        chest.type,
        openProgress,
        glowProgress
      );
    }

    for (const trap of floor.traps) {
      const animationProgress =
        trap.animationTimer > 0
          ? 1 - trap.animationTimer / 500
          : trap.triggered
          ? 1
          : 0;
      this.renderer.drawTrap(
        trap.x,
        trap.y,
        trap.width,
        trap.height,
        trap.type,
        animationProgress
      );
    }

    for (const enemy of floor.enemies) {
      if (!enemy.alive && enemy.deathTimer <= 0) continue;

      const alpha = enemy.alive ? 1 : enemy.deathTimer / 300;
      this.renderer.ctx.globalAlpha = alpha;

      switch (enemy.type) {
        case 'slime':
          const bounceOffset = Math.sin(Date.now() / 200) * 2;
          this.renderer.drawSlime(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            bounceOffset
          );
          break;
        case 'skeleton':
          this.renderer.drawSkeleton(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            enemy.direction
          );
          break;
        case 'bat':
          const wingOffset = Math.sin(Date.now() / 100) * 3;
          this.renderer.drawBat(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
            wingOffset
          );
          break;
      }

      if (enemy.alive && enemy.health < enemy.maxHealth) {
        this.renderer.drawHealthBar(
          enemy.x,
          enemy.y - 8,
          enemy.width,
          4,
          enemy.health,
          enemy.maxHealth
        );
      }

      this.renderer.ctx.globalAlpha = 1;
    }

    const attackProgress = player.isAttacking
      ? 1 - player.attackTimer / ANIMATION.ATTACK_DURATION
      : 0;
    this.renderer.drawPlayer(
      player.x,
      player.y,
      player.bounceOffset,
      player.direction,
      player.isAttacking,
      attackProgress,
      player.hurtFlash
    );

    for (const proj of projectiles) {
      if (!proj.active) continue;
      this.renderer.drawProjectile(proj.x, proj.y, proj.size, proj.color);
    }

    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      this.renderer.drawParticle(
        particle.x,
        particle.y,
        particle.size,
        particle.color,
        alpha
      );
    }

    if (isTimeWarning && warningAlpha > 0) {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.fillStyle = COLORS.WARNING;
      ctx.globalAlpha = warningAlpha * 0.3;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      const textScale =
        1 + Math.sin((Date.now() / ANIMATION.WARNING_TEXT_SCALE_PERIOD) * Math.PI * 2) * 0.1;
      ctx.font = `${Math.floor(24 * textScale)}px monospace`;
      ctx.fillStyle = COLORS.HP_BAR_START;
      ctx.globalAlpha = warningAlpha;
      ctx.textAlign = 'center';
      ctx.fillText(
        'TIME WARNING!',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      ctx.restore();
    }

    if (gameStatus === 'gameover') {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.font = '48px monospace';
      ctx.fillStyle = COLORS.HP_BAR_START;
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      ctx.font = '20px monospace';
      ctx.fillStyle = COLORS.TEXT;
      ctx.fillText(
        'Press R to Restart',
        this.canvas.width / 2,
        this.canvas.height / 2 + 50
      );
      ctx.restore();
    }

    if (gameStatus === 'victory') {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.font = '48px monospace';
      ctx.fillStyle = COLORS.GOLD_HELMET;
      ctx.textAlign = 'center';
      ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2);
      ctx.font = '20px monospace';
      ctx.fillStyle = COLORS.TEXT;
      ctx.fillText(
        'Press R to Restart',
        this.canvas.width / 2,
        this.canvas.height / 2 + 50
      );
      ctx.restore();
    }
  }

  handleKeyDown(e: KeyboardEvent): void {
    const state = useGameStore.getState();

    if (e.code === 'KeyR') {
      state.restart();
      return;
    }

    state.setKey(e.code, true);

    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
      ].includes(e.code)
    ) {
      e.preventDefault();
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    const state = useGameStore.getState();
    state.setKey(e.code, false);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.ctx.imageSmoothingEnabled = false;
  }
}
