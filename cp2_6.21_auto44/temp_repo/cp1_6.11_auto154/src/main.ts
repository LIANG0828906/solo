import { SceneManager } from './scene';
import { UIManager } from './ui';
import { Plate } from './plate';

class App {
  private container: HTMLElement;
  private sceneManager: SceneManager | null = null;
  private uiManager: UIManager | null = null;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private progress: number = 0;
  private speed: number = 1.0;
  private isPlaying: boolean = true;
  private isReversed: boolean = false;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async start(): Promise<void> {
    this.uiManager = new UIManager();
    this.uiManager.showLoading();

    this.sceneManager = new SceneManager(this.container);
    await this.sceneManager.init();

    this.setupEventListeners();

    this.uiManager.hideLoading();

    this.lastTime = performance.now();
    this.animate();
  }

  private setupEventListeners(): void {
    if (!this.uiManager || !this.sceneManager) return;

    this.uiManager.onProgressChange((value: number) => {
      this.progress = value;
    });

    this.uiManager.onSpeedChange((value: number) => {
      this.speed = value;
    });

    this.uiManager.onPlayPause(() => {
      this.isPlaying = this.uiManager?.getIsPlaying() ?? true;
    });

    this.uiManager.onReverse(() => {
      this.isReversed = this.uiManager?.getIsReversed() ?? false;
    });

    this.sceneManager.onPlateClick((plate: Plate | null) => {
      if (plate) {
        this.uiManager?.updateInfoPanel(plate.getInfo());
      } else {
        this.uiManager?.updateInfoPanel(null);
      }
    });
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.updateFPS(deltaTime);

    if (this.isPlaying && this.sceneManager && this.uiManager) {
      const direction = this.isReversed ? -1 : 1;
      this.progress += deltaTime * 0.05 * this.speed * direction;
      this.progress = Math.max(0, Math.min(1, this.progress));
      
      this.sceneManager.update(this.progress, deltaTime);
      this.uiManager.updateTimeLabel(this.progress);
    }
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.fpsTime += deltaTime;

    if (this.fpsTime >= 1.0) {
      this.fps = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;

      if (this.fps < 45 && this.sceneManager) {
        const canvas = this.sceneManager.getCanvas();
        if (canvas) {
          canvas.style.imageRendering = 'auto';
        }
      }
    }
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    if (this.uiManager) {
      this.uiManager.dispose();
    }
  }
}

const container = document.getElementById('canvas-container');
if (!container) {
  console.error('Canvas container not found');
} else {
  const app = new App(container);
  app.start().catch(console.error);

  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
}
