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
  private readonly TRANSITION_DURATION: number = 1500;

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
      });
    this.gui.add(this.params, 'supersaturation', 0, 2, 0.01)
      .name('过饱和度')
      .onChange((v: number) => {
        this.targetParams.supersaturation = v;
      });
    this.gui.add(this.params, 'impurityConcentration', 0, 1, 0.01)
      .name('杂质浓度')
      .onChange((v: number) => {
        this.targetParams.impurityConcentration = v;
      });
  }

  public update(deltaMs: number): boolean {
    let changed = false;
    const lerpFactor = Math.min(1, deltaMs / this.TRANSITION_DURATION);
    const keys = ['temperature', 'supersaturation', 'impurityConcentration'] as const;
    keys.forEach(key => {
      const diff = this.targetParams[key] - this.smoothParams[key];
      if (Math.abs(diff) > 0.001) {
        this.smoothParams[key] += diff * lerpFactor * 3;
        if (Math.abs(this.targetParams[key] - this.smoothParams[key]) < 0.001) {
          this.smoothParams[key] = this.targetParams[key];
        }
        changed = true;
      }
    });
    if (changed) {
      this.notifyListeners();
    }
    return changed;
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
    this.gui.destroy();
    this.listeners.clear();
  }
}
