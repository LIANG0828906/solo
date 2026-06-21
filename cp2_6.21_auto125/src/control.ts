import { GUI } from 'dat.gui';
import type { CrystalParams } from './crystal';

export type ControlParams = CrystalParams & {
  onExport: () => void;
};

export class ControlPanel {
  private gui: GUI;
  private params: {
    temperature: number;
    supersaturation: number;
    impurityConcentration: number;
  };
  private listeners: Set<(params: CrystalParams) => void> = new Set();
  private smoothParams: CrystalParams;
  private targetParams: CrystalParams;
  private animationId: number | null = null;

  constructor(container: HTMLElement) {
    this.params = {
      temperature: 50,
      supersaturation: 1.0,
      impurityConcentration: 0.2
    };
    this.smoothParams = { ...this.params };
    this.targetParams = { ...this.params };
    this.gui = new GUI({ autoPlace: false, width: 280 });
    container.appendChild(this.gui.domElement);
    this.setupUI();
  }

  private setupUI(): void {
    this.gui.add(this.params, 'temperature', 0, 100, 1)
      .name('温度')
      .onChange((v: number) => {
        this.targetParams.temperature = v;
        this.startSmoothing();
      });
    this.gui.add(this.params, 'supersaturation', 0, 2, 0.01)
      .name('过饱和度')
      .onChange((v: number) => {
        this.targetParams.supersaturation = v;
        this.startSmoothing();
      });
    this.gui.add(this.params, 'impurityConcentration', 0, 1, 0.01)
      .name('杂质浓度')
      .onChange((v: number) => {
        this.targetParams.impurityConcentration = v;
        this.startSmoothing();
      });
  }

  private startSmoothing(): void {
    if (this.animationId !== null) return;
    const animate = () => {
      let needsUpdate = false;
      const keys = ['temperature', 'supersaturation', 'impurityConcentration'] as const;
      keys.forEach(key => {
        const diff = this.targetParams[key] - this.smoothParams[key];
        if (Math.abs(diff) > 0.001) {
          this.smoothParams[key] += diff * 0.05;
          needsUpdate = true;
        } else {
          this.smoothParams[key] = this.targetParams[key];
        }
      });
      if (needsUpdate) {
        this.notifyListeners();
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };
    this.animationId = requestAnimationFrame(animate);
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn({ ...this.smoothParams }));
  }

  public onChange(fn: (params: CrystalParams) => void): void {
    this.listeners.add(fn);
    fn({ ...this.smoothParams });
  }

  public getParams(): CrystalParams {
    return { ...this.smoothParams };
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.gui.destroy();
    this.listeners.clear();
  }
}
