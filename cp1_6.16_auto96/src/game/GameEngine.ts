import { EventBus } from './PuzzleState';
import { LogicManager } from './LogicManager';
import { RenderManager } from '../render/RenderManager';

class GameEngine {
  private canvas: HTMLCanvasElement;
  private eventBus: EventBus;
  private logicManager: LogicManager;
  private renderManager: RenderManager;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private frameInterval: number = 1000 / 60;
  private deltaTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.eventBus = new EventBus();
    this.logicManager = new LogicManager(this.eventBus);
    this.renderManager = new RenderManager(this.canvas, this.eventBus);

    this.setupInputListeners();
    this.setupRestartButton();
  }

  private setupInputListeners(): void {
    const canvas = this.canvas;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.logicManager.handleMouseDown(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.logicManager.handleMouseMove(x, y);
    });

    canvas.addEventListener('mouseup', () => {
      this.logicManager.handleMouseUp();
    });

    canvas.addEventListener('mouseleave', () => {
      this.logicManager.handleMouseUp();
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.logicManager.handleMouseDown(x, y);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.logicManager.handleMouseMove(x, y);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.logicManager.handleMouseUp();
    }, { passive: false });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  private setupRestartButton(): void {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        const completeDiv = document.getElementById('game-complete');
        if (completeDiv) {
          completeDiv.classList.remove('show');
        }
        this.reset();
      });
    }
  }

  start(): void {
    if (this.isRunning) return;

    this.resize();
    this.logicManager.initialize(this.canvas.width, this.canvas.height);
    this.renderManager.initialize(this.canvas.width, this.canvas.height);

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  reset(): void {
    this.logicManager.reset();
    this.renderManager.clear();
  }

  private resize(): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    if (this.isRunning) {
      this.logicManager.initialize(width, height);
      this.renderManager.initialize(width, height);
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= this.frameInterval) {
      this.deltaTime = Math.min(elapsed / 1000, 0.1);
      this.lastTime = currentTime - (elapsed % this.frameInterval);

      this.update(this.deltaTime);
      this.render();
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    this.logicManager.update(deltaTime);
    
    const singularityProgress = this.logicManager.getSingularityProgress();
    if (singularityProgress > 0) {
      this.renderManager.setSingularityProgress(singularityProgress);
    }

    const noiseTimer = this.logicManager.getNoiseTimer();
    if (noiseTimer > 0) {
      this.renderManager.setNoiseTimer(noiseTimer);
    }
  }

  private render(): void {
    const fragments = this.logicManager.getFragments();
    const slots = this.logicManager.getSlots();
    
    this.renderManager.render(fragments, slots, this.deltaTime);
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getLogicManager(): LogicManager {
    return this.logicManager;
  }

  getRenderManager(): RenderManager {
    return this.renderManager;
  }
}

const game = new GameEngine();

window.addEventListener('load', () => {
  game.start();
});

window.addEventListener('beforeunload', () => {
  game.stop();
});

export default game;
