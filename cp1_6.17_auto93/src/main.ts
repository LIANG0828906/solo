import { StratumRenderer } from './stratumRenderer';
import { UIController } from './uiController';
import { useAppStore, getPresetStrata } from './stratumParser';

class App {
  private renderer: StratumRenderer;
  private uiController: UIController;

  constructor() {
    const container = document.getElementById('canvas-container')!;
    this.renderer = new StratumRenderer(container);
    this.uiController = new UIController();

    this.initialize();
  }

  private initialize(): void {
    const strata = getPresetStrata();

    this.uiController.setStrata(strata);
    this.renderer.loadStrata(strata);

    this.uiController.setOnSelectStratum((stratumId) => {
      this.renderer.highlightStratum(stratumId);
      this.renderer.focusOnStratum(stratumId);
    });

    this.uiController.setOnCutDepthChange((depth) => {
      this.renderer.updateCutDepth(depth);
      useAppStore.getState().setCutDepth(depth);
    });

    this.uiController.setOnOpacityChange((stratumId, opacity) => {
      this.renderer.updateStratumOpacity(stratumId, opacity);
    });

    this.uiController.setOnResetCamera(() => {
      this.renderer.resetCamera();
      useAppStore.getState().setSelectedStratum(null);
      this.renderer.highlightStratum(null);
    });

    this.renderer.setOnMeshClick((stratumId, screenX, screenY) => {
      const store = useAppStore.getState();
      store.setSelectedStratum(stratumId);
      this.renderer.highlightStratum(stratumId);
      store.showInfoCard(stratumId, screenX, screenY);
    });

    this.renderer.start();
  }

  public dispose(): void {
    this.renderer.dispose();
    this.uiController.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
    app = null;
  }
});
