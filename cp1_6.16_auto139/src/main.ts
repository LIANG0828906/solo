import { SimulationEngine } from './core/SimulationEngine';
import { Renderer } from './render/Renderer';
import { UIController } from './ui/UIController';

class Application {
  private engine: SimulationEngine;
  private renderer: Renderer;
  private uiController: UIController;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsLastUpdate: number = 0;
  private animationId: number = 0;

  constructor() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    this.engine = new SimulationEngine();
    this.renderer = new Renderer(canvas, this.engine);
    this.uiController = new UIController(this.engine, this.renderer);

    this.handleResize = this.handleResize.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  public start(): void {
    this.handleResize();
    this.engine.initializeRandomParticles();

    window.addEventListener('resize', this.handleResize);

    this.lastTime = performance.now();
    this.fpsLastUpdate = this.lastTime;
    this.gameLoop(this.lastTime);
  }

  private handleResize(): void {
    this.renderer.resize();
  }

  private gameLoop(currentTime: number): void {
    this.frameCount++;

    if (currentTime - this.fpsLastUpdate >= 1000) {
      this.fps = this.frameCount * 1000 / (currentTime - this.fpsLastUpdate);
      this.frameCount = 0;
      this.fpsLastUpdate = currentTime;

      const stats = this.engine.getStats(this.fps);
      this.uiController.updateStats(stats);
    }

    this.engine.update();
    this.renderer.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
  }
}

const app = new Application();
app.start();

(window as any).particleApp = app;
(window as any).particleEngine = app['engine'];
