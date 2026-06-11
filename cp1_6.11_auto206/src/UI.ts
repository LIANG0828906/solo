import * as THREE from 'three';

export interface FireParams {
  weight: number;
  leverRatio: number;
  angle: number;
}

export interface HistoryRecord {
  time: string;
  weight: number;
  leverRatio: number;
  angle: number;
  distance: number;
  x: number;
  z: number;
}

export class UI {
  weightSlider: HTMLInputElement;
  leverSlider: HTMLInputElement;
  angleSlider: HTMLInputElement;
  fireBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  quickTestBtn: HTMLButtonElement;

  weightValue: HTMLElement;
  leverValue: HTMLElement;
  angleValue: HTMLElement;

  infoWeight: HTMLElement;
  infoLever: HTMLElement;
  infoAngle: HTMLElement;
  infoDistance: HTMLElement;
  infoX: HTMLElement;
  infoZ: HTMLElement;

  historyItems: HTMLElement;

  private historyRecords: HistoryRecord[] = [];
  private readonly MAX_HISTORY = 10;

  private weightCallback: ((kg: number) => void) | null = null;
  private leverCallback: ((ratio: number) => void) | null = null;
  private angleCallback: ((deg: number) => void) | null = null;
  private fireCallback: (() => void) | null = null;
  private resetCallback: (() => void) | null = null;
  private quickTestCallback: (() => void) | null = null;

  constructor() {
    this.weightSlider = document.getElementById('weight-slider') as HTMLInputElement;
    this.leverSlider = document.getElementById('lever-slider') as HTMLInputElement;
    this.angleSlider = document.getElementById('angle-slider') as HTMLInputElement;
    this.fireBtn = document.getElementById('fire-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.quickTestBtn = document.getElementById('quick-test-btn') as HTMLButtonElement;

    this.weightValue = document.getElementById('weight-value') as HTMLElement;
    this.leverValue = document.getElementById('lever-value') as HTMLElement;
    this.angleValue = document.getElementById('angle-value') as HTMLElement;

    this.infoWeight = document.getElementById('info-weight') as HTMLElement;
    this.infoLever = document.getElementById('info-lever') as HTMLElement;
    this.infoAngle = document.getElementById('info-angle') as HTMLElement;
    this.infoDistance = document.getElementById('info-distance') as HTMLElement;
    this.infoX = document.getElementById('info-x') as HTMLElement;
    this.infoZ = document.getElementById('info-z') as HTMLElement;

    this.historyItems = document.getElementById('history-items') as HTMLElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.weightSlider.addEventListener('input', () => {
      const value = parseFloat(this.weightSlider.value);
      this.weightValue.textContent = `${value} kg`;
      this.triggerVibration();
      if (this.weightCallback) this.weightCallback(value);
    });

    this.leverSlider.addEventListener('input', () => {
      const value = parseFloat(this.leverSlider.value);
      this.leverValue.textContent = value.toFixed(2);
      this.triggerVibration();
      if (this.leverCallback) this.leverCallback(value);
    });

    this.angleSlider.addEventListener('input', () => {
      const value = parseFloat(this.angleSlider.value);
      this.angleValue.textContent = `${value}°`;
      this.triggerVibration();
      if (this.angleCallback) this.angleCallback(value);
    });

    this.fireBtn.addEventListener('click', () => {
      if (this.fireCallback) this.fireCallback();
    });

    this.resetBtn.addEventListener('click', () => {
      if (this.resetCallback) this.resetCallback();
    });

    this.quickTestBtn.addEventListener('click', () => {
      if (this.quickTestCallback) this.quickTestCallback();
    });
  }

  private triggerVibration(): void {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  onWeightChange(callback: (kg: number) => void): void {
    this.weightCallback = callback;
  }

  onLeverChange(callback: (ratio: number) => void): void {
    this.leverCallback = callback;
  }

  onAngleChange(callback: (deg: number) => void): void {
    this.angleCallback = callback;
  }

  onFire(callback: () => void): void {
    this.fireCallback = callback;
  }

  onReset(callback: () => void): void {
    this.resetCallback = callback;
  }

  onQuickTest(callback: () => void): void {
    this.quickTestCallback = callback;
  }

  setFireButtonDisabled(disabled: boolean): void {
    this.fireBtn.disabled = disabled;
    this.quickTestBtn.disabled = disabled;
  }

  setAllButtonsDisabled(disabled: boolean): void {
    this.fireBtn.disabled = disabled;
    this.resetBtn.disabled = disabled;
    this.quickTestBtn.disabled = disabled;
  }

  updateDisplay(
    params: FireParams,
    distance: number,
    point: THREE.Vector3
  ): void {
    this.infoWeight.textContent = `${params.weight} kg`;
    this.infoLever.textContent = params.leverRatio.toFixed(2);
    this.infoAngle.textContent = `${params.angle}°`;
    this.infoDistance.textContent = `${distance.toFixed(1)} 单位`;
    this.infoX.textContent = point.x.toFixed(2);
    this.infoZ.textContent = point.z.toFixed(2);
  }

  clearDisplay(): void {
    this.infoWeight.textContent = '--';
    this.infoLever.textContent = '--';
    this.infoAngle.textContent = '--';
    this.infoDistance.textContent = '--';
    this.infoX.textContent = '--';
    this.infoZ.textContent = '--';
  }

  addHistoryRecord(record: HistoryRecord): void {
    this.historyRecords.unshift(record);
    if (this.historyRecords.length > this.MAX_HISTORY) {
      this.historyRecords = this.historyRecords.slice(0, this.MAX_HISTORY);
    }
    this.renderHistory();
  }

  clearHistory(): void {
    this.historyRecords = [];
    this.renderHistory();
  }

  private renderHistory(): void {
    if (this.historyRecords.length === 0) {
      this.historyItems.innerHTML = '<div class="empty-history">暂无发射记录</div>';
      return;
    }

    this.historyItems.innerHTML = this.historyRecords.map((r) => `
      <div class="history-item">
        <div class="history-time">${r.time}</div>
        <div class="history-params">
          ${r.weight}kg | ${r.angle}° | ${r.distance.toFixed(1)}u
        </div>
      </div>
    `).join('');
  }

  getCurrentSliderValues(): FireParams {
    return {
      weight: parseFloat(this.weightSlider.value),
      leverRatio: parseFloat(this.leverSlider.value),
      angle: parseFloat(this.angleSlider.value)
    };
  }

  setSliderValues(params: FireParams): void {
    this.weightSlider.value = params.weight.toString();
    this.leverSlider.value = params.leverRatio.toString();
    this.angleSlider.value = params.angle.toString();
    this.weightValue.textContent = `${params.weight} kg`;
    this.leverValue.textContent = params.leverRatio.toFixed(2);
    this.angleValue.textContent = `${params.angle}°`;
  }

  static formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
