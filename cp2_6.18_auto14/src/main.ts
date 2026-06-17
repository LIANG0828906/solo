import { Player } from './player';
import { EnemyManager } from './enemy';
import { AIManager } from './ai';
import { Renderer } from './renderer';
import { circleCircleCollision } from './collision';
import { createLaserPool, createAsteroidPool, createCapsulePool } from './objectPool';
import type { Star } from './types';
import { GAME_CONFIG } from './config';

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private player: Player;
  private enemyManager: EnemyManager;
  private aiManager: AIManager;
  private laserPool = createLaserPool();
  private asteroidPool = createAsteroidPool();
  private capsulePool = createCapsulePool();
  private starsFar: Star[] = [];
  private starsNear: Star[] = [];
  private score: number = 0;
  private gameOver: boolean = false;
  private lastTime: number = 0;
  private energyDrainTimer: number = 0;
  private animationFrameId: number | null = null;
  private readonly TARGET_FPS: number = GAME_CONFIG.FRAME.TARGET_FPS;
  private readonly FRAME_DURATION: number = 1000 / this.TARGET_FPS;
  private readonly MAX_DELTA_TIME: number = GAME_CONFIG.FRAME.MAX_DELTA_TIME;
  private accumulator: number = 0;
  private fpsCounter: { frames: number; lastUpdate: number; currentFps: number } = {
    frames: 0,
    lastUpdate: 0,
    currentFps: 60
  };

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    this.renderer = new Renderer(this.canvas);

    this.player = new Player(
      {
        startX: GAME_CONFIG.PLAYER.START_X,
        startY: GAME_CONFIG.PLAYER.START_Y,
        speed: GAME_CONFIG.PLAYER.SPEED,
        maxEnergy: GAME_CONFIG.PLAYER.MAX_ENERGY,
        laserSpeed: GAME_CONFIG.LASER.SPEED,
        laserLength: GAME_CONFIG.LASER.LENGTH,
        laserWidth: GAME_CONFIG.LASER.WIDTH,
        fireCooldown: GAME_CONFIG.PLAYER.FIRE_COOLDOWN
      },
      this.laserPool,
      GAME_CONFIG.CANVAS_WIDTH,
      GAME_CONFIG.CANVAS_HEIGHT
    );

    this.enemyManager = new EnemyManager(
      this.asteroidPool,
      this.capsulePool,
      GAME_CONFIG.CANVAS_WIDTH,
      GAME_CONFIG.CANVAS_HEIGHT
    );

    this.aiManager = new AIManager(
      this.laserPool,
      GAME_CONFIG.CANVAS_WIDTH,
      GAME_CONFIG.CANVAS_HEIGHT
    );

    this.renderer.generateStars(this.starsFar, this.starsNear);

    this.setupEventListeners();

    console.log('AI颜色验证:', this.aiManager.validateColors() ? '通过' : '失败');
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }
      this.player.setKey(e.key, true);
    });

    window.addEventListener('keyup', (e) => {
      this.player.setKey(e.key, false);
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.gameOver) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (this.renderer.isRestartButtonClicked(mouseX, mouseY)) {
          this.restart();
        }
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.renderer.updateMousePosition(mouseX, mouseY);
    });
  }

  start(): void {
    this.lastTime = performance.now();
    this.fpsCounter.lastUpdate = this.lastTime;
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;

    if (deltaTime > this.MAX_DELTA_TIME) {
      deltaTime = this.FRAME_DURATION;
    }

    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    this.fpsCounter.frames++;
    if (currentTime - this.fpsCounter.lastUpdate >= 1000) {
      this.fpsCounter.currentFps = this.fpsCounter.frames;
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastUpdate = currentTime;
    }

    let steps = 0;
    const maxSteps = 5;

    while (this.accumulator >= this.FRAME_DURATION && steps < maxSteps) {
      if (!this.gameOver) {
        this.update(this.FRAME_DURATION, currentTime);
      }
      this.accumulator -= this.FRAME_DURATION;
      steps++;
    }

    if (steps >= maxSteps && this.accumulator >= this.FRAME_DURATION) {
      this.accumulator = 0;
    }

    this.renderer.updateHoverEffects(deltaTime);

    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number, currentTime: number): void {
    this.player.update(deltaTime, currentTime);

    this.enemyManager.update(deltaTime);

    const asteroids = this.enemyManager.getAsteroids();
    const broadcastPosition = this.player.getBroadcastPosition();
    this.aiManager.update(
      deltaTime,
      currentTime,
      asteroids,
      this.player.x,
      this.player.y,
      broadcastPosition
    );

    const lasers = this.laserPool.getActive();
    this.renderer.updateLasers(lasers, deltaTime);

    const collisionResult = this.enemyManager.checkLaserCollisions(lasers);
    this.score += collisionResult.score;

    this.renderer.updateStars(this.starsFar, this.starsNear, deltaTime);

    this.energyDrainTimer += deltaTime;
    if (this.energyDrainTimer >= 1000) {
      this.energyDrainTimer -= 1000;
      this.player.consumeEnergy(GAME_CONFIG.PLAYER.ENERGY_DRAIN_PER_SECOND);
      if (this.player.energy <= 0) {
        this.gameOver = true;
      }
    }

    const capsules = this.enemyManager.getCapsules();
    for (const capsule of capsules) {
      if (!capsule.active) continue;

      if (circleCircleCollision(
        { x: this.player.x, y: this.player.y, radius: GAME_CONFIG.PLAYER.RADIUS },
        { x: capsule.x, y: capsule.y, radius: capsule.radius }
      )) {
        this.player.addEnergy(GAME_CONFIG.CAPSULE.ENERGY_RESTORE);
        this.enemyManager.collectCapsule(capsule);
      }
    }
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawStars(this.starsFar, this.starsNear);

    const asteroids = this.enemyManager.getAsteroids();
    const capsules = this.enemyManager.getCapsules();
    const teammates = this.aiManager.getTeammates();
    const lasers = this.laserPool.getActive();
    const broadcastSignal = this.player.getBroadcastSignal();

    this.renderer.drawAsteroids(asteroids);
    this.renderer.drawCapsules(capsules);
    this.renderer.drawLasers(lasers);
    this.renderer.drawAITeammates(teammates);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawBroadcastSignal(broadcastSignal);
    this.renderer.drawUI(this.score, this.player.energy, this.player.maxEnergy);
    this.renderer.drawMinimap(this.player, teammates, asteroids);

    if (this.gameOver) {
      this.renderer.drawGameOver(this.score);
    }
  }

  private restart(): void {
    this.score = 0;
    this.gameOver = false;
    this.energyDrainTimer = 0;
    this.accumulator = 0;

    this.player.reset();
    this.enemyManager.reset();
    this.aiManager.reset();

    this.laserPool.resetAll();

    this.renderer.generateStars(this.starsFar, this.starsNear);
    this.lastTime = performance.now();
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  getCurrentFps(): number {
    return this.fpsCounter.currentFps;
  }
}

const game = new Game();
game.start();
