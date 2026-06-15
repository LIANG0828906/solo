import * as dat from 'dat.gui';

export interface UIParams {
  terrainSize: number;
  heightScale: number;
  frequency: number;
  seed: number;
  vegetationDensity: number;
  waterHeight: number;
}

export type ChangeHandler = (params: UIParams) => void;

export class UIController {
  private gui: dat.GUI;
  private params: UIParams;
  private onChangeHandler: ChangeHandler | null = null;
  private rebuildTimeout: number | null = null;
  private fpsValueSpan: HTMLElement | null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`GUI container #${containerId} not found`);
    }

    this.gui = new dat.GUI({
      autoPlace: false,
      width: 280
    });

    container.appendChild(this.gui.domElement);

    this.params = {
      terrainSize: 128,
      heightScale: 2.5,
      frequency: 0.04,
      seed: 1234,
      vegetationDensity: 50,
      waterHeight: 0.2
    };

    this.fpsValueSpan = document.getElementById('fps-value');

    this.buildUI();
  }

  private buildUI(): void {
    const terrainFolder = this.gui.addFolder('地形参数');
    terrainFolder.open();

    terrainFolder
      .add(this.params, 'terrainSize', [64, 128, 256])
      .name('地形尺寸')
      .onChange(() => this.scheduleRebuild());

    terrainFolder
      .add(this.params, 'heightScale', 0.5, 5.0, 0.1)
      .name('高度缩放')
      .onChange(() => this.scheduleRebuild());

    terrainFolder
      .add(this.params, 'frequency', 0.01, 0.1, 0.005)
      .name('频率')
      .onChange(() => this.scheduleRebuild());

    terrainFolder
      .add(this.params, 'seed', 0, 9999, 1)
      .name('随机种子')
      .onChange(() => this.scheduleRebuild());

    const vegetationFolder = this.gui.addFolder('植被设置');
    vegetationFolder.open();

    vegetationFolder
      .add(this.params, 'vegetationDensity', 0, 100, 5)
      .name('植被密度 (%)')
      .onChange(() => this.scheduleRebuild());

    const waterFolder = this.gui.addFolder('水体设置');
    waterFolder.open();

    waterFolder
      .add(this.params, 'waterHeight', 0.0, 0.5, 0.01)
      .name('水体高度')
      .onChange(() => this.scheduleRebuild());
  }

  private scheduleRebuild(): void {
    if (this.rebuildTimeout !== null) {
      window.clearTimeout(this.rebuildTimeout);
    }

    this.rebuildTimeout = window.setTimeout(() => {
      if (this.onChangeHandler) {
        this.onChangeHandler({ ...this.params });
      }
      this.rebuildTimeout = null;
    }, 100);
  }

  public onChange(handler: ChangeHandler): void {
    this.onChangeHandler = handler;
  }

  public getParams(): UIParams {
    return { ...this.params };
  }

  public updateFPS(fps: number): void {
    if (this.fpsValueSpan) {
      this.fpsValueSpan.textContent = fps.toFixed(0);
      if (fps < 30) {
        this.fpsValueSpan.style.color = '#FF4444';
      } else {
        this.fpsValueSpan.style.color = '#00FF00';
      }
    }
  }

  public dispose(): void {
    if (this.rebuildTimeout !== null) {
      window.clearTimeout(this.rebuildTimeout);
    }
    this.gui.destroy();
  }
}
