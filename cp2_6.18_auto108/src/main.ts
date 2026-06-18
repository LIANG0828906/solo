import { Car } from './car';
import { Arena } from './arena';
import { Renderer } from './renderer';
import type { InputState, GameStatus, HudData } from './types';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const FPS_SAMPLE_SIZE = 10;
const LOW_FPS_THRESHOLD = 50;

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private car: Car;
  private arena: Arena;
  private input: InputState;
  private gameStatus: GameStatus;

  private lastTime: number = 0;
  private score: number = 0;
  private survivalTime: number = 0;

  private fpsHistory: number[] = [];
  private currentFps: number = 60;
  private particleScale: number = 1.0;

  private animationId: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.renderer = new Renderer(this.canvas, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.arena = new Arena(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.car = new Car(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    };

    this.gameStatus = 'playing';

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    switch (key) {
      case 'w':
      case 'arrowup':
        this.input.up = true;
        break;
      case 's':
      case 'arrowdown':
        this.input.down = true;
        break;
      case 'a':
      case 'arrowleft':
        this.input.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.input.right = true;
        break;
      case ' ':
        this.input.space = true;
        e.preventDefault();
        break;
      case 'r':
        if (this.gameStatus === 'gameover') {
          this.restart();
        }
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    switch (key) {
      case 'w':
      case 'arrowup':
        this.input.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.input.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.input.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.input.right = false;
        break;
      case ' ':
        this.input.space = false;
        break;
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.updateFPS(deltaTime);
    this.update(deltaTime, currentTime / 1000);
    this.render();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private updateFPS(deltaTime: number): void {
    if (deltaTime > 0) {
      const fps = 1 / deltaTime;
      this.fpsHistory.push(fps);

      if (this.fpsHistory.length > FPS_SAMPLE_SIZE) {
        this.fpsHistory.shift();
      }

      const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
      this.currentFps = sum / this.fpsHistory.length;

      if (this.currentFps < LOW_FPS_THRESHOLD) {
        this.particleScale = 0.4;
      } else if (this.currentFps >= 58) {
        this.particleScale = Math.min(this.particleScale + 0.01, 1.0);
      }
    }
  }

  private update(deltaTime: number, currentTime: number): void {
    if (this.gameStatus !== 'playing') return;

    this.survivalTime += deltaTime;

    this.score += deltaTime * (10 + Math.abs(this.car.state.speed) * 0.05);

    this.car.setInput(this.input);
    this.car.setParticleScale(this.particleScale);
    this.car.update(deltaTime, currentTime);

    this.arena.update(deltaTime);

    this.checkCollisions();
  }

  private checkCollisions(): void {
    const carState = this.car.state;
    const carRadius = this.car.getRadius();

    const onPlatform = this.arena.isOnPlatform(carState.x, carState.y, 0);

    if (!onPlatform) {
      this.gameOver();
      return;
    }

    const obstacle = this.arena.checkCarCollision(carState.x, carState.y, carRadius * 0.7);

    if (obstacle && this.car.state.controlLockTimer <= 0) {
      this.car.applyCollision();

      const dx = carState.x - obstacle.x;
      const dy = carState.y - obstacle.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const pushDist = carRadius + obstacle.radius - dist + 2;

      this.car.state.x += (dx / dist) * pushDist;
      this.car.state.y += (dy / dist) * pushDist;
    }
  }

  private gameOver(): void {
    this.gameStatus = 'gameover';
  }

  private restart(): void {
    this.car.reset(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
    this.arena.reset();
    this.score = 0;
    this.survivalTime = 0;
    this.gameStatus = 'playing';
    this.fpsHistory = [];
    this.particleScale = 1.0;
  }

  private render(): void {
    const hudData: HudData = {
      score: this.score,
      survivalTime: this.survivalTime,
      diameterPercent: this.arena.getDiameterPercent(),
      fps: this.currentFps,
      gameStatus: this.gameStatus,
    };

    this.renderer.render(
      this.car.state,
      this.arena.state,
      this.arena.getObstacles(),
      this.car.getTireMarks(),
      hudData
    );
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

let game: Game | null = null;

window.addEventListener('DOMContentLoaded', () => {
  try {
    game = new Game();
    game.start();
  } catch (error) {
    console.error('Failed to start game:', error);
  }
});

export { Game };
