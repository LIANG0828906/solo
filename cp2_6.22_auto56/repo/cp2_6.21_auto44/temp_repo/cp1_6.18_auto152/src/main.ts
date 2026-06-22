import { AudioEngine } from './engine/audioEngine';
import { TrackGenerator } from './engine/trackGenerator';
import { GameLoop } from './engine/gameLoop';
import { GameRenderer } from './renderer/gameRenderer';
import { HUDRenderer } from './ui/hudRenderer';

class Game {
  private canvas: HTMLCanvasElement;
  private audioEngine: AudioEngine;
  private trackGenerator: TrackGenerator;
  private gameLoop: GameLoop;
  private gameRenderer: GameRenderer;
  private hudRenderer: HUDRenderer;

  private renderFrameId: number | null = null;
  private isInitialized: boolean = false;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvas;

    this.audioEngine = new AudioEngine();

    this.gameRenderer = new GameRenderer(this.canvas);

    const width = this.gameRenderer.getWidth();
    const height = this.gameRenderer.getHeight();

    this.trackGenerator = new TrackGenerator(width, height);

    this.gameLoop = new GameLoop(this.canvas, this.audioEngine, this.trackGenerator);

    this.hudRenderer = new HUDRenderer(this.canvas);
    this.hudRenderer.resize(width, height);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);

    this.canvas.addEventListener('click', this.handleCanvasClick);
  }

  private handleResize = (): void => {
    this.gameRenderer.resize();

    const width = this.gameRenderer.getWidth();
    const height = this.gameRenderer.getHeight();

    this.trackGenerator.resize(width, height);
    this.hudRenderer.resize(width, height);
  };

  private handleCanvasClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const state = this.gameLoop.getGameState();

    if (state.gamePhase === 'menu') {
      if (this.hudRenderer.isClickOnButton(clickX, clickY, 'menu')) {
        this.startGame();
      }
    } else if (state.gamePhase === 'gameover') {
      if (this.hudRenderer.isClickOnButton(clickX, clickY, 'gameover')) {
        this.startGame();
      }
    }
  };

  public async init(): Promise<void> {
    await this.audioEngine.init();
    this.isInitialized = true;
    this.render();
  }

  private startGame(): void {
    if (!this.isInitialized) return;
    this.gameLoop.startGame();
  }

  private render = (): void => {
    const state = this.gameLoop.getGameState();

    if (state.gamePhase === 'menu') {
      this.gameRenderer.clear();
      this.hudRenderer.drawMenu();
    } else if (state.gamePhase === 'playing') {
      this.gameRenderer.render(
        this.trackGenerator.getNodes(),
        this.gameLoop.getShip(),
        this.trackGenerator.getObstacles(),
        this.trackGenerator.getNotes(),
        this.gameLoop.getParticles()
      );
      this.hudRenderer.render(state);
    } else if (state.gamePhase === 'gameover') {
      this.gameRenderer.render(
        this.trackGenerator.getNodes(),
        this.gameLoop.getShip(),
        this.trackGenerator.getObstacles(),
        this.trackGenerator.getNotes(),
        this.gameLoop.getParticles()
      );
      this.hudRenderer.drawGameOver(state.score, state.highScore);
    }

    this.renderFrameId = requestAnimationFrame(this.render);
  };

  public destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.gameLoop.removeInputHandlers();
    this.gameLoop.stopGame();

    if (this.renderFrameId !== null) {
      cancelAnimationFrame(this.renderFrameId);
    }
  }
}

const game = new Game();
game.init().catch((err) => {
  console.error('Failed to initialize game:', err);
});
