export type FlowDirection = 'left' | 'right';

export interface UIStats {
  rpm: number;
  waterFlow: number;
  irrigatedCount: number;
  runTime: number;
}

export class UIController {
  private gateSlider!: HTMLInputElement;
  private gateValueDisplay!: HTMLSpanElement;
  private btnLeft!: HTMLButtonElement;
  private btnRight!: HTMLButtonElement;
  private rpmValueDisplay!: HTMLSpanElement;
  private gaugePointer!: HTMLElement;
  private waterFlowDisplay!: HTMLSpanElement;
  private irrigatedCountDisplay!: HTMLSpanElement;
  private runTimeDisplay!: HTMLSpanElement;
  private gaugeTicksContainer!: HTMLElement;

  private onGateChangeCallback: ((value: number) => void) | null = null;
  private onDirectionChangeCallback: ((dir: FlowDirection) => void) | null = null;

  private currentDirection: FlowDirection = 'left';
  private lastRPM: number = -1;

  init(
    onGateChange: (value: number) => void,
    onDirectionChange: (dir: FlowDirection) => void
  ): void {
    this.gateSlider = document.getElementById('gate-slider') as HTMLInputElement;
    this.gateValueDisplay = document.getElementById('gate-value') as HTMLSpanElement;
    this.btnLeft = document.getElementById('btn-left') as HTMLButtonElement;
    this.btnRight = document.getElementById('btn-right') as HTMLButtonElement;
    this.rpmValueDisplay = document.getElementById('rpm-value') as HTMLSpanElement;
    this.gaugePointer = document.getElementById('gauge-pointer') as HTMLElement;
    this.waterFlowDisplay = document.getElementById('water-flow') as HTMLSpanElement;
    this.irrigatedCountDisplay = document.getElementById('irrigated-count') as HTMLSpanElement;
    this.runTimeDisplay = document.getElementById('run-time') as HTMLSpanElement;
    this.gaugeTicksContainer = document.getElementById('gauge-ticks') as HTMLElement;

    this.onGateChangeCallback = onGateChange;
    this.onDirectionChangeCallback = onDirectionChange;

    this.buildGaugeTicks();
    this.bindEvents();
  }

  private buildGaugeTicks(): void {
    const tickCount = 11;
    for (let i = 0; i < tickCount; i++) {
      const tick = document.createElement('div');
      tick.className = 'gauge-tick';
      const angle = -90 + (i / (tickCount - 1)) * 180;
      tick.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      if (i % 2 === 0) {
        tick.style.height = '12px';
        tick.style.backgroundColor = '#3D2914';
        tick.style.width = '3px';
      }
      this.gaugeTicksContainer.appendChild(tick);
    }
  }

  private bindEvents(): void {
    this.gateSlider.addEventListener('input', () => {
      const value = parseInt(this.gateSlider.value, 10);
      this.gateValueDisplay.textContent = value.toString();
      if (this.onGateChangeCallback) {
        this.onGateChangeCallback(value);
      }
    });

    this.btnLeft.addEventListener('click', () => {
      if (this.currentDirection === 'left') return;
      this.currentDirection = 'left';
      this.updateDirectionButtons();
      if (this.onDirectionChangeCallback) {
        this.onDirectionChangeCallback('left');
      }
    });

    this.btnRight.addEventListener('click', () => {
      if (this.currentDirection === 'right') return;
      this.currentDirection = 'right';
      this.updateDirectionButtons();
      if (this.onDirectionChangeCallback) {
        this.onDirectionChangeCallback('right');
      }
    });
  }

  private updateDirectionButtons(): void {
    this.btnLeft.classList.toggle('active', this.currentDirection === 'left');
    this.btnRight.classList.toggle('active', this.currentDirection === 'right');
  }

  updateStats(stats: UIStats): void {
    this.rpmValueDisplay.textContent = stats.rpm.toFixed(1);
    this.waterFlowDisplay.textContent = stats.waterFlow.toString();
    this.irrigatedCountDisplay.textContent = stats.irrigatedCount.toString();
    this.runTimeDisplay.textContent = Math.floor(stats.runTime).toString();

    if (Math.abs(stats.rpm - this.lastRPM) > 0.1) {
      this.lastRPM = stats.rpm;
      const maxRPM = 60;
      const clampedRPM = Math.max(0, Math.min(maxRPM, stats.rpm));
      const normalized = clampedRPM / maxRPM;
      const angle = -90 + normalized * 180;
      this.gaugePointer.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
  }

  setGateValue(value: number): void {
    const v = Math.max(0, Math.min(100, value));
    this.gateSlider.value = v.toString();
    this.gateValueDisplay.textContent = v.toString();
  }

  getGateValue(): number {
    return parseInt(this.gateSlider.value, 10);
  }

  getDirection(): FlowDirection {
    return this.currentDirection;
  }
}
