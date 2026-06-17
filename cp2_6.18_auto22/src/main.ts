import { GameEngine } from './GameEngine';
import { Renderer } from './Renderer';
import { UIManager } from './UIManager';

class App {
  private engine: GameEngine;
  private uiManager: UIManager;
  private renderer: Renderer;

  constructor(root: HTMLElement) {
    this.engine = new GameEngine();
    this.uiManager = new UIManager(root, this.engine);
    const canvasContainer = this.uiManager.getCanvasContainer();
    this.renderer = new Renderer(canvasContainer, this.engine);
    this.engine.startLevel(1);
    window.addEventListener('beforeunload', () => this.destroy());
  }

  destroy(): void {
    this.engine.destroy();
    this.renderer.destroy();
    this.uiManager.destroy();
  }
}

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) {
    console.error('#app element not found');
    return;
  }
  new App(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
