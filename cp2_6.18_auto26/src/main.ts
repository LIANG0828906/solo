import { ParticleSystem } from './particleSystem';
import { SceneRenderer } from './sceneRenderer';
import { UIController } from './uiController';

class App {
  private particleSystem: ParticleSystem;
  private sceneRenderer: SceneRenderer;

  constructor() {
    this.particleSystem = new ParticleSystem();
    this.sceneRenderer = new SceneRenderer('canvas-container', this.particleSystem);
    new UIController();
  }

  public start(): void {
    this.sceneRenderer.start();
  }
}

const app = new App();
app.start();
