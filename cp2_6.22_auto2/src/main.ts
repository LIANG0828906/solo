import { SceneManager } from './core/sceneManager';
import { BuildingGenerator, BuildingParams } from './core/buildingGenerator';
import { createControlPanel } from './ui/controlPanel';
import { ColorTheme, THEMES } from './utils/colorTheme';

class App {
  private sceneManager: SceneManager;
  private buildingGenerator: BuildingGenerator;
  private running: boolean = false;
  private rafId: number = 0;

  constructor() {
    this.sceneManager = new SceneManager();
    this.buildingGenerator = new BuildingGenerator(this.sceneManager, THEMES.sunsetGold);
  }

  public start(container: HTMLElement): void {
    this.sceneManager.init(container);

    const defaultParams: BuildingParams = {
      density: 30,
      minHeight: 10,
      maxHeight: 150,
      minBase: 5,
      maxBase: 20
    };
    this.buildingGenerator.generate(defaultParams);
    this.buildingGenerator.updateTheme(THEMES.sunsetGold);

    createControlPanel(container, {
      onBuildingChange: (params: BuildingParams) => {
        this.buildingGenerator.rebuild(params);
      },
      onThemeChange: (theme: ColorTheme) => {
        this.buildingGenerator.updateTheme(theme);
      },
      onTimeChange: (hour: number) => {
        this.sceneManager.updateTime(hour);
        this.buildingGenerator.updateHour(hour);
      },
      onAutoRotate: (enabled: boolean) => {
        this.sceneManager.setAutoRotate(enabled);
      }
    });

    this.running = true;
    this.animate();
  }

  private animate = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.animate);
    this.sceneManager.update();
    this.sceneManager.render();
  };

  public dispose(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.buildingGenerator.dispose();
    this.sceneManager.dispose();
  }
}

const container = document.getElementById('app');
if (container) {
  const app = new App();
  app.start(container);

  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
}
