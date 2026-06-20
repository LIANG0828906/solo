import type { FilterType } from './filterEngine';

export interface UIControllerOptions {
  onFilterChange: (filter: FilterType) => void;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onCapture: () => void;
}

export class UIController {
  private fpsCounter: HTMLElement;
  private controlsRight: HTMLElement;
  private brightnessSlider: HTMLInputElement;
  private brightnessValue: HTMLElement;
  private contrastSlider: HTMLInputElement;
  private contrastValue: HTMLElement;
  private captureBtn: HTMLElement;
  private flashOverlay: HTMLElement;
  private filterBtns: NodeListOf<HTMLElement>;
  private loading: HTMLElement;

  private currentFilter: FilterType = 'original';
  private fpsFrames: number = 0;
  private fpsLastTime: number = 0;
  private currentFps: number = 0;

  constructor(private options: UIControllerOptions) {
    this.fpsCounter = document.getElementById('fpsCounter')!;
    this.controlsRight = document.getElementById('controlsRight')!;
    this.brightnessSlider = document.getElementById('brightnessSlider') as HTMLInputElement;
    this.brightnessValue = document.getElementById('brightnessValue')!;
    this.contrastSlider = document.getElementById('contrastSlider') as HTMLInputElement;
    this.contrastValue = document.getElementById('contrastValue')!;
    this.captureBtn = document.getElementById('captureBtn')!;
    this.flashOverlay = document.getElementById('flashOverlay')!;
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.loading = document.getElementById('loading')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter as FilterType;
        if (filter && filter !== this.currentFilter) {
          this.setActiveFilter(filter);
          this.fadeControls();
          this.options.onFilterChange(filter);
        }
      });
    });

    this.brightnessSlider.addEventListener('input', () => {
      const value = parseInt(this.brightnessSlider.value, 10);
      this.brightnessValue.textContent = value.toString();
      this.options.onBrightnessChange(value);
    });

    this.contrastSlider.addEventListener('input', () => {
      const value = parseFloat(this.contrastSlider.value);
      this.contrastValue.textContent = value.toFixed(1);
      this.options.onContrastChange(value);
    });

    this.captureBtn.addEventListener('click', () => {
      this.triggerFlash();
      this.options.onCapture();
    });
  }

  setActiveFilter(filter: FilterType): void {
    this.currentFilter = filter;
    this.filterBtns.forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  showControls(): void {
    this.fpsCounter.classList.add('visible');
    this.controlsRight.classList.add('visible');
    this.loading.style.display = 'none';
  }

  private fadeControls(): void {
    this.fpsCounter.classList.remove('visible');
    this.controlsRight.classList.remove('visible');

    setTimeout(() => {
      this.fpsCounter.classList.add('visible');
      this.controlsRight.classList.add('visible');
    }, 100);
  }

  updateFps(): void {
    const now = performance.now();
    this.fpsFrames++;

    if (now - this.fpsLastTime >= 1000) {
      this.currentFps = Math.round(
        (this.fpsFrames * 1000) / (now - this.fpsLastTime)
      );
      this.fpsFrames = 0;
      this.fpsLastTime = now;

      this.fpsCounter.textContent = `${this.currentFps} FPS`;

      if (this.currentFps < 20) {
        this.fpsCounter.classList.add('low');
      } else {
        this.fpsCounter.classList.remove('low');
      }
    }
  }

  triggerFlash(): void {
    this.flashOverlay.classList.add('active');
    setTimeout(() => {
      this.flashOverlay.classList.remove('active');
    }, 200);
  }

  getBrightness(): number {
    return parseInt(this.brightnessSlider.value, 10);
  }

  getContrast(): number {
    return parseFloat(this.contrastSlider.value);
  }

  getCurrentFilter(): FilterType {
    return this.currentFilter;
  }
}
