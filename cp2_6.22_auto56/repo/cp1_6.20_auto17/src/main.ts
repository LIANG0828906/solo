import { Player } from './Player';
import { EnemyManager } from './Enemy';
import { Renderer } from './Renderer';
import type { RenderData } from './Renderer';

type GameState = 'playing' | 'gameover';

class Game {
  private canvas: HTMLCanvasElement;
  private player: Player;
  private enemyManager: EnemyManager;
  private renderer: Renderer;
  private gameState: GameState = 'playing';
  private lastTime: number = 0;
  private animationId: number = 0;
  private gameTime: number = 0;
  private mouseDown: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.resizeCanvas();

    this.player = new Player(this.canvas.width, this.canvas.height);
    this.enemyManager = new EnemyManager(this.canvas.width, this.canvas.height);
    this.renderer = new Renderer(this.canvas);

    this.setupEventListeners();
    this.startGameLoop();
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    const ctx = this.canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.player.resize(this.canvas.width, this.canvas.height);
      this.enemyManager.resize(this.canvas.width, this.canvas.height);
      this.renderer.resize(this.canvas.width, this.canvas.height);
    });

    window.addEventListener('keydown', (e) => {
      this.player.keys[e.key] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (this.gameState === 'playing') {
          this.player.activateShield();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.player.keys[e.key] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.player.mouseX = e.clientX - rect.left;
      this.player.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      if (this.gameState === 'gameover') {
        if (this.renderer.isPointInRestartButton(px, py)) {
          this.restartGame();
          return;
        }
      }

      if (this.gameState === 'playing') {
        if (this.renderer.isPointInShieldButton(px, py)) {
          this.player.activateShield();
          return;
        }
      }

      this.mouseDown = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private startGameLoop(): void {
    const loop = (timestamp: number) => {
      if (this.lastTime === 0) this.lastTime = timestamp;
      const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;
      this.gameTime += deltaTime;

      this.update(deltaTime);
      this.render();

      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  private update(dt: number): void {
    const gameActive = this.gameState === 'playing' && this.player.state.active;

    this.player.update(dt, gameActive);

    if (this.mouseDown && gameActive) {
      this.player.shoot();
    }

    this.enemyManager.update(
      dt,
      this.player.state.x,
      this.player.state.y,
      this.player.state.survivalTime,
      gameActive
    );

    if (gameActive) {
      const scoreGained = this.enemyManager.checkBulletCollisions(
        this.player.bullets,
        (x, y, type) => {
          if (type === 'enemy' || type === 'asteroid') {
            this.player.spawnExplosion(x, y, 5, '#ffaa00');
          } else if (type === 'enemy_destroy') {
            this.player.spawnExplosion(x, y, 20, '#ff4444');
          } else if (type === 'asteroid_destroy') {
            this.player.spawnExplosion(x, y, 15, '#8b7355');
          }
        }
      );
      this.player.state.score += scoreGained;

      this.player.checkCrystalPickup(this.enemyManager.crystals);

      if (!this.player.state.shieldActive) {
        const hit = this.enemyManager.checkPlayerCollision(
          this.player.state.x,
          this.player.state.y,
          this.player.state.width / 2
        );
        if (hit) {
          this.onPlayerDeath();
        }
      }
    }
  }

  private onPlayerDeath(): void {
    if (this.gameState !== 'playing') return;

    this.player.state.active = false;
    this.player.spawnShipExplosion(this.player.state.x, this.player.state.y);

    setTimeout(() => {
      this.gameState = 'gameover';
    }, 1500);
  }

  private restartGame(): void {
    this.player.reset();
    this.enemyManager.reset();
    this.gameState = 'playing';
    this.gameTime = 0;
    this.lastTime = 0;
  }

  private render(): void {
    const shieldButtonActive = this.player.canActivateShield();
    const shieldCooldownPercent = this.player.state.shieldCooldown > 0
      ? 1 - (this.player.state.shieldCooldown / this.player.state.shieldMaxCooldown)
      : 1;

    const renderData: RenderData = {
      gameState: this.gameState,
      player: this.player.state,
      bullets: this.player.bullets,
      particles: this.player.particles,
      debris: this.player.debris,
      enemies: this.enemyManager.enemies,
      asteroids: this.enemyManager.asteroids,
      crystals: this.enemyManager.crystals,
      shieldButtonActive,
      shieldCooldownPercent,
      mouseX: this.player.mouseX,
      mouseY: this.player.mouseY,
      time: this.gameTime
    };

    this.renderer.render(renderData);
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
