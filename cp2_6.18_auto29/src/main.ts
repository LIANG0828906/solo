import { GameState } from './gameState';
import { GameLogic } from './logic';
import { Renderer } from './renderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private logic: GameLogic;
  private renderer: Renderer;
  private lastTime: number = 0;
  private animationId: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = ctx;
    
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    
    this.state = new GameState();
    this.logic = new GameLogic(this.state);
    this.renderer = new Renderer(this.ctx, this.state);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    this.logic.handleMouseDown(pos.x, pos.y);
    this.updateCursor(pos.x, pos.y);
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    this.logic.handleMouseMove(pos.x, pos.y);
    this.updateCursor(pos.x, pos.y);
  }

  private handleMouseUp(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    this.logic.handleMouseUp(pos.x, pos.y);
  }

  private handleMouseLeave(_e: MouseEvent): void {
    const ship = this.state.getShip();
    if (ship.isDragging) {
      this.logic.handleMouseUp(ship.x, ship.y);
    }
  }

  private updateCursor(x: number, y: number): void {
    const ship = this.state.getShip();
    
    if (ship.isDragging) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    
    if (this.logic.isPointInShip(x, y)) {
      this.canvas.style.cursor = 'grab';
      return;
    }
    
    if (this.logic.isPointInBase(x, y)) {
      this.canvas.style.cursor = 'pointer';
      return;
    }
    
    if (this.state.isBuildMenuOpen()) {
      this.canvas.style.cursor = 'pointer';
      return;
    }
    
    this.canvas.style.cursor = 'default';
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    this.logic.update(dt);
    this.renderer.render();
    
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    game.start();
    console.log('深空殖民地游戏已启动');
  } catch (error) {
    console.error('游戏启动失败:', error);
  }
});
