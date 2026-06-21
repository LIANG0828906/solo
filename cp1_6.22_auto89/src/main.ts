import './styles.css';
import { SceneManager } from '@/editor/sceneManager';
import { UIController } from '@/editor/uiController';
import { ExportManager } from '@/export/exportManager';
import { BuildingType } from '@/types';

class App {
  private sceneManager: SceneManager;
  private uiController: UIController;
  private exportManager: ExportManager;
  private animationId: number = 0;

  constructor() {
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('App container #app not found');
    }

    this.sceneManager = new SceneManager(container);
    this.uiController = new UIController(this.sceneManager, container);
    this.exportManager = new ExportManager(this.sceneManager, this.uiController);

    this.addDemoBuildings();
    this.startRenderLoop();
  }

  private addDemoBuildings(): void {
    const demoTypes: BuildingType[] = [
      BuildingType.OFFICE,
      BuildingType.RESIDENTIAL,
      BuildingType.HOTEL,
      BuildingType.TV_TOWER,
      BuildingType.OFFICE,
      BuildingType.CHURCH
    ];

    demoTypes.forEach((type, index) => {
      const angle = (index / demoTypes.length) * Math.PI * 2;
      const radius = 40 + index * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      setTimeout(() => {
        this.sceneManager.addBuilding(type, {
          position: { x, y: 0, z }
        });
      }, index * 150);
    });
  }

  private startRenderLoop(): void {
    const render = () => {
      this.sceneManager.render();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.sceneManager.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});
