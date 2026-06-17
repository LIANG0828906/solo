import { Player } from './player';
import { EnemyManager } from './enemy';
import { AIManager } from './ai';
import { Renderer } from './renderer';
import { circleCircleCollision } from './collision';
import { createLaserPool, createAsteroidPool, createCapsulePool } from './objectPool';
import type { Star } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

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

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.renderer = new Renderer(this.canvas);

    this.player = new Player(
      {
        startX: 100,
        startY: 500,
        speed: 4,
        maxEnergy: 100,
        laserSpeed: 8,
        laserLength: 20,
        laserWidth: 4,
        fireCooldown: 200
      },
      this.laserPool,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    this.enemyManager = new EnemyManager(
      this.asteroidPool,
      this.capsulePool,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    this.aiManager = new AIManager(
      this.laserPool,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    this.renderer.generateStars(this.starsFar, this.starsNear);

    this.setupEventListeners();
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
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.gameOver) {
      this.update(deltaTime, currentTime);
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
      this.player.consumeEnergy(1);
      if (this.player.energy <= 0) {
        this.gameOver = true;
      }
    }

    const capsules = this.enemyManager.getCapsules();
    for (const capsule of capsules) {
      if (!capsule.active) continue;
      
      if (circleCircleCollision(
        { x: this.player.x, y: this.player.y, radius: 15 },
        { x: capsule.x, y: capsule.y, radius: capsule.radius }
      )) {
        this.player.addEnergy(20);
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
    
    this.player.reset();
    this.enemyManager.reset();
    this.aiManager.reset();
    
    for (const laser of this.laserPool.getAll()) {
      this.laserPool.release(laser);
    }
    
    this.renderer.generateStars(this.starsFar, this.starsNear);
    this.lastTime = performance.now();
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

const game = new Game();
game.start();
