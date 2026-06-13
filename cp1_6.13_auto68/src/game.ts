import { input } from './input';
import { GameLogic } from './logic';
import { renderer } from './render';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const TARGET_FPS = 60;
const FIXED_DELTA_TIME = 1 / TARGET_FPS;
const FRAME_TIME_MS = 1000 / TARGET_FPS;
const MAX_DELTA_TIME_MS = 100;

class Game {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private logic: GameLogic;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number = 0;
  private spaceKeyPressed: boolean = false;
  private boundHandleKeyDown: ((e: KeyboardEvent) => void) | null = null;

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

    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.boundHandleKeyDown);

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
      e.preventDefault();
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
    this.accumulator = 0;
    this.loop();
  }

  private loop(): void {
    const currentTime = performance.now();
    let deltaTimeMs = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTimeMs > MAX_DELTA_TIME_MS) {
      deltaTimeMs = FRAME_TIME_MS;
    }

    this.accumulator += deltaTimeMs;

    let updateCount = 0;
    while (this.accumulator >= FRAME_TIME_MS && updateCount < 5) {
      this.update(FIXED_DELTA_TIME);
      this.accumulator -= FRAME_TIME_MS;
      updateCount++;
    }

    if (this.accumulator >= FRAME_TIME_MS) {
      this.accumulator = 0;
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
    this.logic.update(deltaTime, (key: string) => input.isKeyPressed(key));
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
    if (this.boundHandleKeyDown) {
      window.removeEventListener('keydown', this.boundHandleKeyDown);
    }
    input.destroy();
  }
}

const game = new Game();
game.init('gameCanvas');
