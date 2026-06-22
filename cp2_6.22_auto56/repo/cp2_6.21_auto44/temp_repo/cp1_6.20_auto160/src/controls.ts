import { GeometryParams, DEFAULT_PARAMS } from './geometry';

export interface ControlCallbacks {
  onParamsChange: (params: GeometryParams) => void;
  onRandom: (oldParams: GeometryParams, newParams: GeometryParams) => void;
  onReset: () => void;
  onScreenshot: () => void;
}

const PARAM_CONFIG: Record<keyof GeometryParams, { unit: string; decimals: number }> = {
  thickness: { unit: '', decimals: 2 },
  bend: { unit: '°', decimals: 0 },
  tilt: { unit: '°', decimals: 0 },
  texture: { unit: '', decimals: 0 },
  twist: { unit: '', decimals: 2 },
  colorPhase: { unit: '°', decimals: 0 }
};

export class ControlsManager {
  private params: GeometryParams;
  private callbacks: ControlCallbacks;
  private sliderGroups: Map<keyof GeometryParams, HTMLElement> = new Map();
  private floatingTimeouts: Map<keyof GeometryParams, number> = new Map();

  constructor(callbacks: ControlCallbacks) {
    this.params = { ...DEFAULT_PARAMS };
    this.callbacks = callbacks;
    this.init();
  }

  private init(): void {
    const groups = document.querySelectorAll<HTMLElement>('.slider-group');
    groups.forEach((group) => {
      const param = group.dataset.param as keyof GeometryParams;
      if (!param) return;
      this.sliderGroups.set(param, group);

      const input = group.querySelector('input[type="range"]');
      const valueEl = group.querySelector('.slider-value');
      if (!input || !valueEl) return;

      this.createFloatingLabel(group, param);

      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const value = parseFloat(target.value);
        this.params[param] = value;
        this.updateValueDisplay(param, valueEl, value);
        this.showFloatingValue(param, value);
        this.callbacks.onParamsChange({ ...this.params });
      });
    });

    this.initButtons();
  }

  private createFloatingLabel(group: HTMLElement, param: keyof GeometryParams): void {
    const floating = document.createElement('div');
    floating.className = 'floating-value';
    floating.dataset.param = param;
    group.appendChild(floating);
  }

  private updateValueDisplay(param: keyof GeometryParams, el: Element, value: number): void {
    const config = PARAM_CONFIG[param];
    const formatted = value.toFixed(config.decimals) + config.unit;
    el.textContent = formatted;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 200);
  }

  private showFloatingValue(param: keyof GeometryParams, value: number): void {
    const group = this.sliderGroups.get(param);
    if (!group) return;
    const floating = group.querySelector<HTMLElement>('.floating-value');
    if (!floating) return;

    const config = PARAM_CONFIG[param];
    floating.textContent = value.toFixed(config.decimals) + config.unit;
    floating.classList.add('visible');

    const existingTimeout = this.floatingTimeouts.get(param);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const timeout = window.setTimeout(() => {
      floating.classList.remove('visible');
      this.floatingTimeouts.delete(param);
    }, 600);

    this.floatingTimeouts.set(param, timeout);
  }

  private initButtons(): void {
    const btnReset = document.getElementById('btn-reset');
    const btnRandom = document.getElementById('btn-random');
    const btnScreenshot = document.getElementById('btn-screenshot');

    if (btnReset) {
      btnReset.addEventListener('click', () => this.handleReset());
    }

    if (btnRandom) {
      btnRandom.addEventListener('click', () => this.handleRandom());
    }

    if (btnScreenshot) {
      btnScreenshot.addEventListener('click', () => this.handleScreenshot());
    }
  }

  private handleReset(): void {
    const oldParams = { ...this.params };
    this.params = { ...DEFAULT_PARAMS };
    this.syncSlidersToParams();
    this.callbacks.onReset();
  }

  private handleRandom(): void {
    const oldParams = { ...this.params };
    this.params = {
      thickness: this.randomRange(0.2, 2.0),
      bend: this.randomRange(0, 180),
      tilt: this.randomRange(-45, 45),
      texture: Math.floor(this.randomRange(1, 11)),
      twist: this.randomRange(0, 2.0),
      colorPhase: this.randomRange(0, 360)
    };
    this.syncSlidersToParams();
    this.callbacks.onRandom(oldParams, { ...this.params });
  }

  private handleScreenshot(): void {
    const btn = document.getElementById('btn-screenshot');
    if (!btn) return;

    const progress = btn.querySelector<HTMLElement>('.btn-progress');
    if (progress) {
      progress.classList.add('active');
    }

    setTimeout(() => {
      this.callbacks.onScreenshot();
      setTimeout(() => {
        if (progress) {
          progress.classList.remove('active');
        }
      }, 500);
    }, 400);
  }

  private syncSlidersToParams(): void {
    this.sliderGroups.forEach((group, param) => {
      const input = group.querySelector<HTMLInputElement>('input[type="range"]');
      const valueEl = group.querySelector<HTMLElement>('.slider-value');
      if (!input || !valueEl) return;

      const value = this.params[param];
      input.value = value.toString();
      this.updateValueDisplay(param, valueEl, value);
    });
  }

  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  public getParams(): GeometryParams {
    return { ...this.params };
  }

  public setParams(params: GeometryParams): void {
    this.params = { ...params };
    this.syncSlidersToParams();
  }
}
