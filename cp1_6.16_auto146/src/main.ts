import { RuneEngine, Difficulty } from './core/RuneEngine';
import { GameRenderer } from './renderer/GameRenderer';
import { UIPanel } from './ui/UIPanel';

class GameApp {
  private engine: RuneEngine;
  private renderer: GameRenderer;
  private uiPanel: UIPanel;
  private canvas: HTMLCanvasElement;
  private container: HTMLDivElement;
  private lastTime = 0;
  private rafId = 0;
  private isPointerDown = false;

  constructor() {
    this.container = document.getElementById('app') as HTMLDivElement;
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

    if (!this.container || !this.canvas) {
      throw new Error('Required DOM elements not found');
    }

    this.engine = new RuneEngine();
    this.renderer = new GameRenderer(this.canvas, this.engine);
    this.uiPanel = new UIPanel(this.container, this.engine);

    this.bindDifficultyFlip();
    this.bindEvents();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.startLoop();
  }

  private currentDifficulty: Difficulty = 'normal';

  private bindDifficultyFlip(): void {
    this.engine.on((event) => {
      if (event.type === 'difficultyChanged') {
        const colors: Record<Difficulty, string> = {
          easy: '#0E1A10',
          normal: '#0B0C10',
          hard: '#1A0B0B'
        };
        const fromColor = colors[this.currentDifficulty];
        this.currentDifficulty = event.difficulty;
        this.renderer.triggerFlip(fromColor, colors[event.difficulty]);
      }
    });
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
    this.canvas.addEventListener('mouseup', () => this.onPointerUp());
    this.canvas.addEventListener('mouseleave', () => this.onPointerUp());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onPointerDown(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onPointerMove(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onPointerUp();
    }, { passive: false });

    this.canvas.addEventListener('touchcancel', () => this.onPointerUp());

    this.canvas.style.touchAction = 'none';
  }

  private onPointerDown(x: number, y: number): void {
    this.isPointerDown = true;
    this.engine.startDrawing(x, y);
  }

  private onPointerMove(x: number, y: number): void {
    if (!this.isPointerDown) return;
    this.engine.continueDrawing(x, y);
  }

  private onPointerUp(): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    this.engine.endDrawing();
  }

  private startLoop(): void {
    const loop = (now: number) => {
      const delta = this.lastTime ? Math.min(50, now - this.lastTime) : 16;
      this.lastTime = now;

      this.engine.update(delta);
      this.renderer.render(now);

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.uiPanel.destroy();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new GameApp();
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
});
