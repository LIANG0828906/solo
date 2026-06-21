export interface UICallbacks {
  onDensityChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
  onColorChange: (color: string) => void;
  onToggle: () => void;
  onResetView: () => void;
}

export class UIManager {
  private densitySlider: HTMLInputElement;
  private speedSlider: HTMLInputElement;
  private colorPicker: HTMLInputElement;
  private toggleBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private densityValue: HTMLElement;
  private speedValue: HTMLElement;
  private fpsDisplay: HTMLElement;
  private fpsValue: HTMLElement;

  private callbacks: UICallbacks;
  private isPaused: boolean = false;

  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private isFirstUpdate: boolean = true;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.densitySlider = document.getElementById('density-slider') as HTMLInputElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.colorPicker = document.getElementById('color-picker') as HTMLInputElement;
    this.toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.densityValue = document.getElementById('density-value') as HTMLElement;
    this.speedValue = document.getElementById('speed-value') as HTMLElement;
    this.fpsDisplay = document.getElementById('fps-display') as HTMLElement;
    this.fpsValue = document.getElementById('fps-value') as HTMLElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.densitySlider.addEventListener('input', () => {
      const value = parseInt(this.densitySlider.value);
      this.densityValue.textContent = value.toString();
      this.callbacks.onDensityChange(value);
    });

    this.speedSlider.addEventListener('input', () => {
      const value = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = value.toFixed(1);
      this.callbacks.onSpeedChange(value);
    });

    this.colorPicker.addEventListener('input', () => {
      this.callbacks.onColorChange(this.colorPicker.value);
    });

    this.toggleBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      this.toggleBtn.textContent = this.isPaused ? '继续' : '暂停';
      this.callbacks.onToggle();
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onResetView();
    });

    this.toggleBtn.addEventListener('mousedown', () => {
      this.toggleBtn.style.transform = 'scale(0.95)';
    });
    this.toggleBtn.addEventListener('mouseup', () => {
      this.toggleBtn.style.transform = '';
    });
    this.toggleBtn.addEventListener('mouseleave', () => {
      this.toggleBtn.style.transform = '';
    });

    this.resetBtn.addEventListener('mousedown', () => {
      this.resetBtn.style.transform = 'scale(0.95)';
    });
    this.resetBtn.addEventListener('mouseup', () => {
      this.resetBtn.style.transform = '';
    });
    this.resetBtn.addEventListener('mouseleave', () => {
      this.resetBtn.style.transform = '';
    });
  }

  updateFPS(timestamp: number): void {
    this.frameCount++;
    
    if (this.isFirstUpdate) {
      this.isFirstUpdate = false;
      this.lastFpsUpdate = timestamp;
      return;
    }
    
    if (timestamp - this.lastFpsUpdate >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (timestamp - this.lastFpsUpdate));
      this.fpsValue.textContent = fps.toString();
      
      if (fps < 15) {
        this.fpsDisplay.classList.add('low');
      } else {
        this.fpsDisplay.classList.remove('low');
      }

      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }
}
