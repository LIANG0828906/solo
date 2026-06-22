import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT, ASPECT_RATIO, COLORS, BulletType, PLAYER_MAX_HEALTH } from './types';
import type { InputState } from './types';
import type { UIState } from './UI';
import { Player } from './Player';
import { EnemyManager } from './EnemyManager';
import { BulletManager } from './BulletManager';
import { ParticleSystem } from './ParticleSystem';
import { Background } from './Background';
import { UI } from './UI';
import { audioManager } from './AudioManager';
import { checkRectCollision } from './utils';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private score: number;
  private finalScore: number;
  private finalWave: number;

  private player: Player;
  private enemyManager: EnemyManager;
  private bulletManager: BulletManager;
  private particleSystem: ParticleSystem;
  private background: Background;
  private ui: UI;

  private inputState: InputState;
  private lastTime: number;
  private accumulator: number;
  private fixedTimeStep: number;
  private animationId: number | null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.gameState = GameState.MENU;
    this.score = 0;
    this.finalScore = 0;
    this.finalWave = 0;

    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false
    };

    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = 1000 / 60;
    this.animationId = null;

    this.bulletManager = new BulletManager();
    this.particleSystem = new ParticleSystem();
    this.background = new Background();
    
    this.player = new Player(this.bulletManager, this.particleSystem, audioManager);
    
    this.enemyManager = new EnemyManager(this.bulletManager, this.particleSystem, {
      onScoreAdded: (score, x, y) => this.addScore(score, x, y),
      onEnemyKilled: () => audioManager.playExplosionSound()
    });

    this.ui = new UI(this.canvas, {
      onStart: () => this.startGame(),
      onRestart: () => this.restartGame()
    });

    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.inputState.up = true;
      e.preventDefault();
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.inputState.down = true;
      e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.inputState.left = true;
      e.preventDefault();
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.inputState.right = true;
      e.preventDefault();
    }
    if (e.code === 'Space') {
      e.preventDefault();
      
      if (this.gameState === GameState.MENU) {
        this.startGame();
      } else if (this.gameState === GameState.GAME_OVER) {
        this.restartGame();
      } else if (this.gameState === GameState.PLAYING) {
        this.inputState.shoot = true;
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.inputState.up = false;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.inputState.down = false;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.inputState.left = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.inputState.right = false;
    }
    if (e.code === 'Space') {
      this.inputState.shoot = false;
    }
  }

  private resizeCanvas(): void {
    const container = document.getElementById('game-container')!;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let scale: number;
    if (containerWidth / containerHeight > ASPECT_RATIO) {
      scale = containerHeight / CANVAS_HEIGHT;
    } else {
      scale = containerWidth / CANVAS_WIDTH;
    }

    this.canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
  }

  private startGame(): void {
    audioManager.init();
    audioManager.resume();
    
    this.gameState = GameState.PLAYING;
    this.score = 0;
    this.player.reset();
    this.enemyManager.reset();
    this.bulletManager.clear();
    this.particleSystem.clear();
    this.enemyManager.start(performance.now());
    
    this.lastTime = performance.now();
    if (this.animationId === null) {
      this.loop(this.lastTime);
    }
  }

  private restartGame(): void {
    audioManager.resume();
    this.startGame();
  }

  private addScore(amount: number, x: number, y: number): void {
    this.score += amount;
    this.particleSystem.spawnScorePopup(x, y, amount);
  }

  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    this.finalScore = this.score;
    this.finalWave = this.enemyManager.getWaveNumber();
    this.inputState.shoot = false;
  }

  private loop(currentTime: number): void {
    const deltaTime = Math.min(currentTime - this.lastTime, this.fixedTimeStep * 3);
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep / 1000, currentTime);
      this.accumulator -= this.fixedTimeStep;
    }

    this.render();
    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number, currentTime: number): void {
    this.background.update(dt);
    this.ui.update(dt);

    if (this.gameState !== GameState.PLAYING) {
      this.particleSystem.update(dt);
      return;
    }

    this.player.update(dt, this.inputState, currentTime);
    this.enemyManager.update(dt, currentTime, this.player.getY());
    this.bulletManager.update(dt);
    this.particleSystem.update(dt);

    this.checkCollisions();

    if (this.player.isDead() && !this.player.isDying) {
      this.gameOver();
    }
  }

  private checkCollisions(): void {
    this.enemyManager.checkCollisionsWithPlayerBullets(this.bulletManager);

    if (!this.player.isInvincible && !this.player.isDead()) {
      const enemyBullets = this.bulletManager.getActiveBullets(BulletType.ENEMY);
      const playerRect = this.player.getRect();

      for (const bullet of enemyBullets) {
        if (!bullet.active) continue;
        
        const bulletRect = bullet.getRect();
        if (checkRectCollision(playerRect, bulletRect)) {
          bullet.active = false;
          const isDead = this.player.hit();
          if (isDead) {
            setTimeout(() => this.gameOver(), 2000);
          }
          break;
        }
      }
    }
  }

  private render(): void {
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.background.render(this.ctx);
    
    if (this.gameState === GameState.PLAYING || this.gameState === GameState.GAME_OVER) {
      this.bulletManager.render(this.ctx);
      this.enemyManager.render(this.ctx);
      this.player.render(this.ctx);
      this.particleSystem.render(this.ctx);
    }

    const uiState: UIState = {
      score: this.score,
      health: Math.max(0, this.player.health),
      maxHealth: PLAYER_MAX_HEALTH,
      wave: this.enemyManager.getWaveNumber(),
      finalScore: this.finalScore,
      finalWave: this.finalWave
    };

    this.ui.render(this.ctx, uiState, this.gameState);
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }
}

const game = new Game();
game.start();
