import { DataLoader } from './DataLoader';
import { SceneManager } from './SceneManager';
import { UIManager } from './UIManager';

class App {
  sceneManager: SceneManager | null = null;
  uiManager: UIManager | null = null;
  dataLoader: DataLoader | null = null;

  constructor() {
    try {
      const container = document.getElementById('app') as HTMLElement;
      (window as any)._app = this;

      this.uiManager = new UIManager();
      this.sceneManager = new SceneManager(container);
      this.dataLoader = new DataLoader();

      this.sceneManager.start();
      this.dataLoader.load();
    } catch (e: any) {
      (window as any)._initError = e.message + '\n' + e.stack;
      console.error('App init error:', e);
    }
  }
}

(window as any)._App = App;

function bootstrap() {
  try {
    new App();
  } catch (e: any) {
    (window as any)._bootstrapError = e.message + '\n' + e.stack;
    console.error('Bootstrap error:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
