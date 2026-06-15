import { LevelGenerator } from './LevelGenerator';
import { PlayerController } from './PlayerController';
import { Renderer } from './Renderer';
import { AudioManager } from './AudioManager';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLATFORM_UPDATE_INTERVAL = 15000;

class Game {
  private canvas: HTMLCanvasElement;
  private difficultyCanvas: HTMLCanvasElement;
  private levelGenerator: LevelGenerator;
  private playerController: PlayerController;
  private renderer: Renderer;
  private audioManager: AudioManager;

  private lastTime: number = 0;
  private timeSinceLastPlatform: number = 0;
  private mouseX: number = -100;
  private mouseY: number = -100;

  private scoreDisplay: HTMLElement;
  private timerDisplay: HTMLElement;
  private levelNumber: HTMLElement;
  private platformCount: HTMLElement;
  private regenButton: HTMLElement;

  constructor() {
    const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const diffCanvas = document.getElementById('difficultyCanvas') as HTMLCanvasElement;

    if (!gameCanvas || !diffCanvas) {
      throw new Error('Canvas元素未找到');
    }

    this.canvas = gameCanvas;
    this.difficultyCanvas = diffCanvas;
    this.audioManager = new AudioManager();
    this.levelGenerator = new LevelGenerator();
    this.playerController = new PlayerController(this.audioManager);
    this.renderer = new Renderer(this.canvas);
    this.renderer.setLevelGenerator(this.levelGenerator);

    this.scoreDisplay = document.getElementById('scoreDisplay')!;
    this.timerDisplay = document.getElementById('timerDisplay')!;
    this.levelNumber = document.getElementById('levelNumber')!;
    this.platformCount = document.getElementById('platformCount')!;
    this.regenButton = document.getElementById('regenButton')!;

    this.setupEventListeners();
    this.levelGenerator.generateInitialLevel();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.playerController.handleKeyDown(e.key);
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.playerController.handleKeyUp(e.key);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseX = -100;
      this.mouseY = -100;
    });

    this.regenButton.addEventListener('click', () => {
      this.regenerateLevel();
    });
  }

  private regenerateLevel(): void {
    this.levelGenerator.reset();
    this.playerController.reset();
    this.timeSinceLastPlatform = 0;
    this.updateUI();
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = Math.min(currentTime - this.lastTime, 33.33);
    this.lastTime = currentTime;

    this.update(deltaTime, currentTime);
    this.render(currentTime);
    this.updateUI();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number, currentTime: number): void {
    this.timeSinceLastPlatform += deltaTime;

    if (this.timeSinceLastPlatform >= PLATFORM_UPDATE_INTERVAL) {
      this.timeSinceLastPlatform = 0;

      const player = this.playerController.player;
      this.levelGenerator.addPlatform(
        player.x + player.width / 2,
        player.y + player.height / 2,
        currentTime
      );
      this.levelGenerator.removeOldestPlatform(currentTime);
    }

    this.levelGenerator.updatePlatforms(currentTime);
    this.playerController.update(deltaTime, this.levelGenerator.getPlatforms(), currentTime);
  }

  private render(currentTime: number): void {
    const shake = this.playerController.screenShake;

    this.renderer.clear();
    this.renderer.applyShake(shake.offsetX, shake.offsetY);

    this.renderer.drawGround();
    this.renderer.drawPlatforms(
      this.levelGenerator.getPlatforms(),
      currentTime,
      this.mouseX,
      this.mouseY
    );
    this.renderer.drawParticles(this.playerController.particles);
    this.renderer.drawPlayer(this.playerController.player);
    this.renderer.drawRipples(this.playerController.ripples);

    this.renderer.resetShake();

    this.renderer.drawDifficultyChart(
      this.difficultyCanvas,
      this.levelGenerator.getDifficultyHistory()
    );
  }

  private updateUI(): void {
    this.scoreDisplay.textContent = `得分: ${this.playerController.score}`;

    const timeLeft = Math.max(0, (PLATFORM_UPDATE_INTERVAL - this.timeSinceLastPlatform) / 1000);
    this.timerDisplay.textContent = `${timeLeft.toFixed(1)}s`;

    this.levelNumber.textContent = `第 ${this.levelGenerator.getLevelNumber()} 关`;
    this.platformCount.textContent = `平台数量: ${this.levelGenerator.getActivePlatformCount()}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
