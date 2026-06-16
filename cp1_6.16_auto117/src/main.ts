import { GameLogic } from './GameLogic';
import { RenderModule } from './RenderModule';

class Game {
  private canvas: HTMLCanvasElement;
  private gameLogic: GameLogic;
  private renderModule: RenderModule;
  private progressIndicator: HTMLElement;
  private lastFrameTime: number;
  private animationFrameId: number | null;
  private readonly TARGET_FPS = 60;
  private readonly FRAME_DURATION = 1000 / this.TARGET_FPS;
  private readonly SCENE_WIDTH = 800;
  private readonly SCENE_HEIGHT = 600;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.progressIndicator = document.getElementById('progressIndicator') as HTMLElement;
    this.gameLogic = new GameLogic();
    this.renderModule = new RenderModule(this.canvas, this.gameLogic);
    this.lastFrameTime = 0;
    this.animationFrameId = null;

    this.setupEventListeners();
    this.handleResize();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.SCENE_WIDTH / rect.width;
    const scaleY = this.SCENE_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    this.gameLogic.createEcho(x, y, performance.now());
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.SCENE_WIDTH / rect.width;
    const scaleY = this.SCENE_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    this.gameLogic.updateMousePosition(x, y);
  }

  private handleResize(): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const maxWidth = window.innerWidth - 160;
    const maxHeight = window.innerHeight - 160;
    const aspectRatio = this.SCENE_WIDTH / this.SCENE_HEIGHT;

    let displayWidth = maxWidth;
    let displayHeight = displayWidth / aspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }

    displayWidth = Math.max(displayWidth, this.SCENE_WIDTH);
    displayHeight = Math.max(displayHeight, this.SCENE_HEIGHT);

    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
  }

  public start(): void {
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime >= this.FRAME_DURATION) {
      const frameStartTime = performance.now();

      this.gameLogic.update(deltaTime, now);
      this.renderModule.render(now);
      this.updateUI();

      const frameDuration = performance.now() - frameStartTime;
      if (frameDuration > 16) {
        console.warn(`Frame exceeded 16ms budget: ${frameDuration.toFixed(2)}ms`);
      }

      this.lastFrameTime = now - (deltaTime % this.FRAME_DURATION);
    }

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private updateUI(): void {
    const state = this.gameLogic.getState();
    this.progressIndicator.textContent = `${state.activatedCount}/3`;
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
