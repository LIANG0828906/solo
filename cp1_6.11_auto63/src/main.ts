import { Player, GAME_CONFIG as PLAYER_CONFIG } from './player';
import { EnemyManager, ENEMY_CONFIG } from './enemy';
import { CollectibleManager } from './collectible';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_DURATION = 180;

type GameState = 'loading' | 'start' | 'playing' | 'end';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private enemyManager: EnemyManager;
  private collectibleManager: CollectibleManager;
  private keys: Set<string>;
  private gameState: GameState;
  private score: number;
  private timeRemaining: number;
  private lastTime: number;
  private animationId: number | null;
  private stars: Array<{ x: number; y: number; size: number; brightness: number }>;
  private titleBreathTimer: number;
  private blinkTimer: number;
  private loadingProgress: number;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.keys = new Set();
    this.gameState = 'loading';
    this.score = 0;
    this.timeRemaining = GAME_DURATION;
    this.lastTime = 0;
    this.animationId = null;
    this.titleBreathTimer = 0;
    this.blinkTimer = 0;
    this.loadingProgress = 0;

    this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.enemyManager = new EnemyManager();
    this.collectibleManager = new CollectibleManager(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.stars = this.generateStars(100);

    this.setupEventListeners();
    this.simulateLoading();
  }

  private generateStars(count: number): Array<{ x: number; y: number; size: number; brightness: number }> {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }
    return stars;
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);

      if (this.gameState === 'start') {
        this.startGame();
      } else if (this.gameState === 'end' && (e.key === 'r' || e.key === 'R')) {
        this.resetGame();
        this.startGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  private simulateLoading(): void {
    const loadingInterval = setInterval(() => {
      this.loadingProgress += Math.random() * 15 + 5;
      if (this.loadingProgress >= 100) {
        this.loadingProgress = 100;
        clearInterval(loadingInterval);
        this.hideLoadingOverlay();
        this.gameState = 'start';
      }
      this.updateLoadingUI();
    }, 150);
  }

  private updateLoadingUI(): void {
    const progressBar = document.getElementById('progress-bar') as HTMLDivElement;
    const loadingText = document.getElementById('loading-text') as HTMLDivElement;
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, this.loadingProgress)}%`;
    }
    if (loadingText) {
      loadingText.textContent = `正在加载资源... ${Math.floor(Math.min(100, this.loadingProgress))}%`;
    }
  }

  private hideLoadingOverlay(): void {
    const overlay = document.getElementById('loading-overlay') as HTMLDivElement;
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.score = 0;
    this.timeRemaining = GAME_DURATION;
    this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    const enemyCount = ENEMY_CONFIG.COUNT_MIN +
      Math.floor(Math.random() * (ENEMY_CONFIG.COUNT_MAX - ENEMY_CONFIG.COUNT_MIN + 1));
    this.enemyManager.spawnEnemies(enemyCount, CANVAS_WIDTH, CANVAS_HEIGHT, this.player.x, this.player.y);

    this.collectibleManager.reset();

    for (let i = 0; i < 3; i++) {
      this.collectibleManager.spawn();
    }
  }

  private resetGame(): void {
    this.score = 0;
    this.timeRemaining = GAME_DURATION;
    this.enemyManager.reset();
    this.collectibleManager.reset();
    this.keys.clear();
  }

  private checkCollisions(): void {
    for (const enemy of this.enemyManager.enemies) {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = this.player.getRadius() + enemy.getRadius();

      if (distance < minDistance && !this.player.isHit && !enemy.isKnockback) {
        this.player.takeDamage();
        enemy.applyKnockback(this.player.x, this.player.y);
      }
    }

    for (const collectible of this.collectibleManager.collectibles) {
      if (collectible.collected) continue;

      const dx = this.player.x - collectible.x;
      const dy = this.player.y - collectible.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = this.player.getRadius() + collectible.getRadius();

      if (distance < minDistance) {
        this.score += this.collectibleManager.collect(collectible);
        this.player.collectEnergy();
      }
    }
  }

  private update(dt: number): void {
    if (this.gameState === 'playing') {
      this.player.update(this.keys, dt, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.enemyManager.update(this.player.x, this.player.y, dt, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.collectibleManager.update(dt);
      this.checkCollisions();

      this.timeRemaining -= dt;

      if (this.player.energy <= 0 || this.timeRemaining <= 0) {
        this.gameState = 'end';
        this.timeRemaining = Math.max(0, this.timeRemaining);
      }
    } else if (this.gameState === 'start' || this.gameState === 'end') {
      this.titleBreathTimer += dt * 1000;
      this.blinkTimer += dt * 1000;
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0B0A2E');
    gradient.addColorStop(1, '#000000');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const star of this.stars) {
      this.ctx.globalAlpha = star.brightness;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawUI(): void {
    this.ctx.font = '24px "Courier New", monospace';
    this.ctx.textBaseline = 'top';

    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`分数: ${this.score}`, 20, 20);

    const energyBarWidth = 200;
    const energyBarHeight = 20;
    const energyBarX = 20;
    const energyBarY = 55;

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = '#4ade80';
    this.ctx.shadowBlur = 3;
    this.ctx.strokeRect(energyBarX, energyBarY, energyBarWidth, energyBarHeight);

    const energyPercent = this.player.energy / PLAYER_CONFIG.ENERGY_MAX;
    const fillWidth = energyPercent * energyBarWidth;

    const energyGradient = this.ctx.createLinearGradient(energyBarX, energyBarY, energyBarX + energyBarWidth, energyBarY);
    if (energyPercent <= 0.3) {
      energyGradient.addColorStop(0, '#ef4444');
      energyGradient.addColorStop(1, '#dc2626');
      this.ctx.shadowColor = '#ef4444';
    } else {
      energyGradient.addColorStop(0, '#4ade80');
      energyGradient.addColorStop(1, '#22c55e');
      this.ctx.shadowColor = '#4ade80';
    }

    this.ctx.fillStyle = energyGradient;
    this.ctx.fillRect(energyBarX + 1, energyBarY + 1, fillWidth - 2, energyBarHeight - 2);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 5;
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${Math.ceil(this.player.energy)}%`, energyBarX + energyBarWidth / 2, energyBarY + 3);
    this.ctx.textAlign = 'left';

    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = Math.floor(this.timeRemaining % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    this.ctx.font = '24px "Courier New", monospace';
    this.ctx.textAlign = 'right';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(timeStr, CANVAS_WIDTH - 20, 20);
    this.ctx.textAlign = 'left';
    this.ctx.shadowBlur = 0;
  }

  private drawStartScreen(): void {
    this.drawBackground();

    const breathPhase = (this.titleBreathTimer % 2000) / 2000;
    const titleAlpha = 0.7 + Math.sin(breathPhase * Math.PI * 2) * 0.3;

    this.ctx.save();
    this.ctx.globalAlpha = titleAlpha;
    this.ctx.font = '48px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#6366f1';
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('星际逃逸', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    this.ctx.restore();

    const blinkVisible = Math.floor(this.blinkTimer / 500) % 2 === 0;
    if (blinkVisible) {
      this.ctx.font = '24px "Courier New", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#fbbf24';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.fillText('按任意键开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
    this.ctx.textAlign = 'left';
    this.ctx.shadowBlur = 0;
  }

  private drawEndScreen(): void {
    this.drawBackground();
    this.collectibleManager.draw(this.ctx);
    this.enemyManager.draw(this.ctx);
    this.player.draw(this.ctx);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.font = '48px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#ef4444';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    this.ctx.font = '32px "Courier New", monospace';
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillText(`最终得分: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    const blinkVisible = Math.floor(this.blinkTimer / 500) % 2 === 0;
    if (blinkVisible) {
      this.ctx.font = '20px "Courier New", monospace';
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 5;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('按 R 键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
    this.ctx.textAlign = 'left';
    this.ctx.shadowBlur = 0;
  }

  private drawGameScreen(): void {
    this.drawBackground();
    this.collectibleManager.draw(this.ctx);
    this.enemyManager.draw(this.ctx);
    this.player.draw(this.ctx);
    this.drawUI();
  }

  private render(): void {
    switch (this.gameState) {
      case 'loading':
        this.drawBackground();
        break;
      case 'start':
        this.drawStartScreen();
        break;
      case 'playing':
        this.drawGameScreen();
        break;
      case 'end':
        this.drawEndScreen();
        break;
    }
  }

  private gameLoop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  start(): void {
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

const game = new Game();
game.start();
