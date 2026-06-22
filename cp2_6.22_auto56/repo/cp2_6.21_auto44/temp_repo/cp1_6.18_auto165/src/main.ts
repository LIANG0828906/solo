import { SceneManager } from './scene';
import { UIControls } from './uiControls';

class App {
  private sceneManager: SceneManager;
  private uiControls: UIControls;

  constructor() {
    const container = document.getElementById('canvas-container');
    const app = document.getElementById('app');

    if (!container || !app) {
      throw new Error('Container elements not found');
    }

    this.sceneManager = new SceneManager(container);
    this.uiControls = new UIControls(app, this.sceneManager);

    this.sceneManager.setOnBurstCallback((center) => {
      console.log('Burst triggered at:', center);
    });

    window.addEventListener('beforeunload', this.dispose.bind(this));
  }

  private dispose(): void {
    this.sceneManager.dispose();
    this.uiControls.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
