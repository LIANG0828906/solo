export type TimeUpdateCallback = (timeRatio: number) => void;

export class TimeController {
  private container: HTMLElement;
  private timeText: HTMLDivElement;
  private slider: HTMLInputElement;
  private playBtn: HTMLButtonElement;
  private timeRatio: number = 0;
  private isPlaying: boolean = false;
  private callbacks: TimeUpdateCallback[] = [];
  private playSpeed: number = 0.01;

  constructor(parentElement: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 40px);
      min-width: 300px;
      max-width: 800px;
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      z-index: 100;
      user-select: none;
    `;

    this.timeText = document.createElement('div');
    this.timeText.style.cssText = `
      color: #fff;
      font-size: 16px;
      text-align: center;
      margin-bottom: 12px;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    `;
    this.timeText.textContent = '黎明 06:00';

    const controlsRow = document.createElement('div');
    controlsRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '24';
    this.slider.step = '0.1';
    this.slider.value = '6';
    this.slider.style.cssText = `
      flex: 1;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(to right, #60a5fa 0%, #60a5fa 25%, #4a5568 25%, #4a5568 100%);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    `;

    const sliderStyle = document.createElement('style');
    sliderStyle.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        transition: transform 0.15s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(sliderStyle);

    this.playBtn = document.createElement('button');
    this.playBtn.style.cssText = `
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: background 0.2s ease;
      flex-shrink: 0;
    `;
    this.playBtn.innerHTML = '▶';

    this.playBtn.addEventListener('mouseenter', () => {
      this.playBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    });
    this.playBtn.addEventListener('mouseleave', () => {
      this.playBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    controlsRow.appendChild(this.slider);
    controlsRow.appendChild(this.playBtn);

    this.container.appendChild(this.timeText);
    this.container.appendChild(controlsRow);

    parentElement.appendChild(this.container);

    this.setupEventListeners();
    this.updateSliderGradient();
    this.setTimeRatio(0.25);
  }

  private setupEventListeners(): void {
    this.slider.addEventListener('input', () => {
      const hour = parseFloat(this.slider.value);
      const ratio = hour / 24;
      this.setTimeRatio(ratio);
    });

    this.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });
  }

  private updateSliderGradient(): void {
    const percent = (this.timeRatio * 100).toFixed(1);
    this.slider.style.background = `linear-gradient(to right, #60a5fa 0%, #60a5fa ${percent}%, #4a5568 ${percent}%, #4a5568 100%)`;
  }

  private updateTimeText(): void {
    const hour = this.timeRatio * 24;
    const hourStr = Math.floor(hour).toString().padStart(2, '0');
    const minuteStr = Math.floor((hour % 1) * 60).toString().padStart(2, '0');
    const timeStr = `${hourStr}:${minuteStr}`;

    let period: string;
    if (hour >= 5 && hour < 8) {
      period = '黎明';
    } else if (hour >= 8 && hour < 11) {
      period = '上午';
    } else if (hour >= 11 && hour < 13) {
      period = '正午';
    } else if (hour >= 13 && hour < 17) {
      period = '下午';
    } else if (hour >= 17 && hour < 20) {
      period = '黄昏';
    } else if (hour >= 20 && hour < 23) {
      period = '夜晚';
    } else {
      period = '深夜';
    }

    this.timeText.textContent = `${period} ${timeStr}`;
  }

  public setTimeRatio(ratio: number): void {
    this.timeRatio = Math.max(0, Math.min(1, ratio));
    this.slider.value = (this.timeRatio * 24).toString();
    this.updateSliderGradient();
    this.updateTimeText();
    this.notifyCallbacks();
  }

  public getTimeRatio(): number {
    return this.timeRatio;
  }

  public togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    this.playBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
  }

  public play(): void {
    this.isPlaying = true;
    this.playBtn.innerHTML = '⏸';
  }

  public pause(): void {
    this.isPlaying = false;
    this.playBtn.innerHTML = '▶';
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public update(deltaTime: number = 1): void {
    if (this.isPlaying) {
      let newRatio = this.timeRatio + this.playSpeed * deltaTime;
      if (newRatio >= 1) {
        newRatio = newRatio - 1;
      }
      this.setTimeRatio(newRatio);
    }
  }

  public onTimeUpdate(callback: TimeUpdateCallback): void {
    this.callbacks.push(callback);
  }

  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      callback(this.timeRatio);
    }
  }

  public destroy(): void {
    this.callbacks = [];
    this.container.remove();
  }
}
