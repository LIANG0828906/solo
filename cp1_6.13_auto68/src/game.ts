import { input } from './input';
import { GameLogic } from './logic';
import { renderer } from './render';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

class Game {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private logic: GameLogic;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number = 0;
  private spaceKeyPressed: boolean = false;

  constructor() {
    this.logic = new GameLogic();
  }

  init(canvasId: string): void {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not get 2D context');
    }

    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    input.setup();

    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.start();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const state = this.logic.getState();

    if (state.status === 'idle') {
      this.logic.startGame();
      return;
    }

    if (e.key === ' ' && !this.spaceKeyPressed) {
      this.spaceKeyPressed = true;
      if (state.status === 'playing') {
        this.logic.setStatus('paused');
      } else if (state.status === 'paused') {
        this.logic.setStatus('playing');
      }
    }

    if (e.key.toLowerCase() === 'r' && state.status === 'ended') {
      this.logic.reset();
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop(): void {
    const currentTime = performance.now();
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > 100) {
      deltaTime = FRAME_TIME;
    }

    this.accumulator += deltaTime;

    while (this.accumulator >= FRAME_TIME) {
      this.update(FRAME_TIME / 1000);
      this.accumulator -= FRAME_TIME;
    }

    this.render();

    this.updateKeyStates();

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private updateKeyStates(): void {
    if (!input.isKeyPressed(' ')) {
      this.spaceKeyPressed = false;
    }
  }

  private update(deltaTime: number): void {
    this.logic.update(deltaTime, input.isKeyPressed.bind(input));
  }

  private render(): void {
    if (!this.ctx) return;

    const state = this.logic.getState();
    renderer.render(this.ctx, state);
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    input.destroy();
  }
}

const game = new Game();
game.init('gameCanvas');
