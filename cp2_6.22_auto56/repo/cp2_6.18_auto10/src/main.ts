import { dataParser } from './dataParser';
import type { PlantStemData } from './dataParser';
import { PlantRenderer } from './renderer';
import { UIController } from './uiController';

class PlantMicroverseApp {
  private stemData: PlantStemData | null = null;
  private renderer: PlantRenderer | null = null;
  private uiController: UIController | null = null;
  private canvasContainer: HTMLElement | null = null;

  public async init(): Promise<void> {
    this.canvasContainer = document.getElementById('canvas-container');
    if (!this.canvasContainer) {
      throw new Error('Canvas container not found');
    }

    this.loadData();
    this.initRenderer();
    this.initUI();
    this.bindModules();
    this.start();
  }

  private loadData(): void {
    this.stemData = dataParser.parse();
    console.log('[PlantMicroverse] 植物茎干数据加载完成:', this.stemData);
  }

  private initRenderer(): void {
    if (!this.canvasContainer || !this.stemData) {
      throw new Error('Cannot initialize renderer without container or data');
    }

    this.renderer = new PlantRenderer(this.canvasContainer, this.stemData);
    console.log('[PlantMicroverse] 3D渲染器初始化完成');
  }

  private initUI(): void {
    if (!this.stemData) {
      throw new Error('Cannot initialize UI without data');
    }

    this.uiController = new UIController('gui', this.stemData);
    console.log('[PlantMicroverse] UI控制器初始化完成');
  }

  private bindModules(): void {
    if (!this.renderer || !this.uiController) {
      return;
    }

    this.uiController.setLayerSwitcher((layer: number) => {
      this.renderer!.switchToLayer(layer);
    });

    console.log('[PlantMicroverse] 模块绑定完成');
  }

  private start(): void {
    if (!this.renderer) {
      return;
    }

    this.renderer.start();
    console.log('[PlantMicroverse] 应用启动成功');
    console.log('[PlantMicroverse] 快捷键提示: 1=表皮层, 2=皮层, 3=维管束层');
  }

  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.uiController) {
      this.uiController.dispose();
    }
  }
}

const app = new PlantMicroverseApp();

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.init();
  } catch (error) {
    console.error('[PlantMicroverse] 应用初始化失败:', error);
  }
});

window.addEventListener('beforeunload', () => {
  app.dispose();
});

export default app;
