import { SceneManager } from './scene/SceneManager';
import { UIManager } from './ui/UIManager';

class App {
  private sceneManager: SceneManager;
  private uiManager: UIManager;
  private lastTime = 0;

  constructor() {
    const canvasContainer = document.getElementById('canvas-container');
    const uiContainer = document.getElementById('ui-container');

    if (!canvasContainer || !uiContainer) {
      throw new Error('Required DOM containers not found');
    }

    this.sceneManager = new SceneManager(canvasContainer);
    this.uiManager = new UIManager(canvasContainer, uiContainer, this.sceneManager);

    this.animate = this.animate.bind(this);
    this.animate(0);
  }

  private animate(currentTime: number): void {
    requestAnimationFrame(this.animate);

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.sceneManager.update(deltaTime);
    this.uiManager.updateLabels();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
