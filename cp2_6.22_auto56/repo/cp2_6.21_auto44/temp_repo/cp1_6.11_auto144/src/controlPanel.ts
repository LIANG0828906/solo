export interface ControlParams {
  starDensity: number;
  trailLength: number;
  haloIntensity: number;
}

export type ControlChangeCallback = (params: ControlParams) => void;
export type ResetCallback = () => void;

export class ControlPanel {
  private densitySlider: HTMLInputElement;
  private densityValue: HTMLSpanElement;
  private trailSlider: HTMLInputElement;
  private trailValue: HTMLSpanElement;
  private haloSlider: HTMLInputElement;
  private haloValue: HTMLSpanElement;
  private resetButton: HTMLButtonElement;
  private onControlChange: ControlChangeCallback;
  private onReset: ResetCallback;
  private params: ControlParams;

  constructor(onControlChange: ControlChangeCallback, onReset: ResetCallback) {
    this.onControlChange = onControlChange;
    this.onReset = onReset;

    this.densitySlider = document.getElementById('density-slider') as HTMLInputElement;
    this.densityValue = document.getElementById('density-value') as HTMLSpanElement;
    this.trailSlider = document.getElementById('trail-slider') as HTMLInputElement;
    this.trailValue = document.getElementById('trail-value') as HTMLSpanElement;
    this.haloSlider = document.getElementById('halo-slider') as HTMLInputElement;
    this.haloValue = document.getElementById('halo-value') as HTMLSpanElement;
    this.resetButton = document.getElementById('reset-btn') as HTMLButtonElement;

    this.params = {
      starDensity: parseInt(this.densitySlider.value),
      trailLength: parseInt(this.trailSlider.value),
      haloIntensity: parseInt(this.haloSlider.value)
    };

    this.bindEvents();
  }

  private bindEvents(): void {
    this.densitySlider.addEventListener('input', () => {
      this.params.starDensity = parseInt(this.densitySlider.value);
      this.densityValue.textContent = this.densitySlider.value;
      this.onControlChange(this.params);
    });

    this.trailSlider.addEventListener('input', () => {
      this.params.trailLength = parseInt(this.trailSlider.value);
      this.trailValue.textContent = this.trailSlider.value;
      this.onControlChange(this.params);
    });

    this.haloSlider.addEventListener('input', () => {
      this.params.haloIntensity = parseInt(this.haloSlider.value);
      this.haloValue.textContent = this.haloSlider.value;
      this.onControlChange(this.params);
    });

    this.resetButton.addEventListener('click', () => {
      this.resetButton.style.animation = 'none';
      this.resetButton.offsetHeight;
      this.resetButton.style.animation = 'buttonPulse 0.5s ease';
      this.onReset();
    });
  }

  public getParams(): ControlParams {
    return { ...this.params };
  }
}
