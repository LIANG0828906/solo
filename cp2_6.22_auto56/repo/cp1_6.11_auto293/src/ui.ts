import type { BoatState, BoatInput } from './boat';

export interface UIState {
  cargoWeight: number;
  centerOffset: number;
}

export type UIChangeCallback = (input: BoatInput) => void;

const STABILITY_LABELS: Record<string, string> = {
  safe: '安全',
  warning: '警戒',
  danger: '危险',
  sunk: '沉没'
};

const STABILITY_CLASSES: Record<string, string> = {
  safe: 'stability-safe',
  warning: 'stability-warning',
  danger: 'stability-danger',
  sunk: 'stability-sunk'
};

export class ControlPanel {
  private weightSlider: HTMLInputElement;
  private weightInput: HTMLInputElement;
  private offsetSlider: HTMLInputElement;
  private offsetInput: HTMLInputElement;
  private draftValue: HTMLElement;
  private rollValue: HTMLElement;
  private gmValue: HTMLElement;
  private floodValue: HTMLElement;
  private stabilityTag: HTMLElement;
  private fpsCounter: HTMLElement;
  private state: UIState;
  private onChangeCallback: UIChangeCallback | null = null;

  constructor() {
    this.state = {
      cargoWeight: 200,
      centerOffset: 0
    };

    this.weightSlider = document.getElementById('weight-slider') as HTMLInputElement;
    this.weightInput = document.getElementById('weight-input') as HTMLInputElement;
    this.offsetSlider = document.getElementById('offset-slider') as HTMLInputElement;
    this.offsetInput = document.getElementById('offset-input') as HTMLInputElement;
    this.draftValue = document.getElementById('draft-value') as HTMLElement;
    this.rollValue = document.getElementById('roll-value') as HTMLElement;
    this.gmValue = document.getElementById('gm-value') as HTMLElement;
    this.floodValue = document.getElementById('flood-value') as HTMLElement;
    this.stabilityTag = document.getElementById('stability-tag') as HTMLElement;
    this.fpsCounter = document.getElementById('fps-counter') as HTMLElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.weightSlider.addEventListener('input', (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      this.state.cargoWeight = value;
      this.weightInput.value = String(value);
      this.notifyChange();
    });

    this.weightInput.addEventListener('input', (e) => {
      let value = Number((e.target as HTMLInputElement).value);
      value = Math.max(0, Math.min(800, value));
      value = Math.round(value / 10) * 10;
      this.state.cargoWeight = value;
      this.weightSlider.value = String(value);
      this.notifyChange();
    });

    this.weightInput.addEventListener('blur', () => {
      this.weightInput.value = String(this.state.cargoWeight);
    });

    this.offsetSlider.addEventListener('input', (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      this.state.centerOffset = value;
      this.offsetInput.value = String(value);
      this.notifyChange();
    });

    this.offsetInput.addEventListener('input', (e) => {
      let value = Number((e.target as HTMLInputElement).value);
      value = Math.max(-30, Math.min(30, value));
      value = Math.round(value);
      this.state.centerOffset = value;
      this.offsetSlider.value = String(value);
      this.notifyChange();
    });

    this.offsetInput.addEventListener('blur', () => {
      this.offsetInput.value = String(this.state.centerOffset);
    });
  }

  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback({
        cargoWeight: this.state.cargoWeight,
        centerOffset: this.state.centerOffset
      });
    }
  }

  public onChange(callback: UIChangeCallback): void {
    this.onChangeCallback = callback;
  }

  public updateBoatState(boatState: BoatState): void {
    const draftCm = boatState.draftDepth * 10;
    const rollDeg = boatState.rollAngle * 180 / Math.PI;
    const gmCm = boatState.gmHeight;
    const floodPct = boatState.floodPercentage;

    this.draftValue.textContent = `${draftCm.toFixed(2)} cm`;
    this.rollValue.textContent = `${rollDeg.toFixed(2)}°`;
    this.gmValue.textContent = `${gmCm.toFixed(2)} cm`;
    this.floodValue.textContent = `${floodPct.toFixed(1)}%`;

    this.updateStabilityTag(boatState.stabilityLevel);
  }

  private updateStabilityTag(level: string): void {
    this.stabilityTag.textContent = STABILITY_LABELS[level] || '未知';
    
    Object.values(STABILITY_CLASSES).forEach(cls => {
      this.stabilityTag.classList.remove(cls);
    });
    
    const cssClass = STABILITY_CLASSES[level];
    if (cssClass) {
      this.stabilityTag.classList.add(cssClass);
    }
  }

  public updateFPS(fps: number): void {
    this.fpsCounter.textContent = `FPS: ${fps.toFixed(0)}`;
    
    if (fps >= 55) {
      this.fpsCounter.style.color = '#4CAF50';
    } else if (fps >= 45) {
      this.fpsCounter.style.color = '#FFC107';
    } else {
      this.fpsCounter.style.color = '#F44336';
    }
  }

  public getState(): BoatInput {
    return {
      cargoWeight: this.state.cargoWeight,
      centerOffset: this.state.centerOffset
    };
  }
}
