import { WeatherDataType } from './weatherData';

export const HEIGHT_LABELS = ['低云', '较低云', '中云', '较高云', '高云'];
export const WEATHER_LABELS: Record<WeatherDataType, string> = {
  temperature: '温度',
  humidity: '湿度',
  windSpeed: '风速'
};

export interface UICallbacks {
  onHeightChange: (level: number) => void;
  onDataTypeChange: (type: WeatherDataType) => void;
  onTimeChange: (hour: number) => void;
  onPlayToggle: (playing: boolean) => void;
}

export class UIManager {
  private heightSlider: HTMLInputElement;
  private dataButtons: NodeListOf<HTMLButtonElement>;
  private timeSlider: HTMLInputElement;
  private playBtn: HTMLButtonElement;
  private iconPlay: SVGSVGElement;
  private iconPause: SVGSVGElement;
  private cloudHeightText: HTMLElement;
  private weatherTypeText: HTMLElement;
  private timeText: HTMLElement;
  private timelineTicks: HTMLElement;

  private callbacks: UICallbacks;

  private currentHeightLevel: number = 2;
  private currentDataType: WeatherDataType = 'temperature';
  private currentHour: number = 0;
  private isPlaying: boolean = false;
  private playIntervalId: number | null = null;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.heightSlider = document.getElementById('height-slider') as HTMLInputElement;
    this.dataButtons = document.querySelectorAll('#data-buttons .data-btn');
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    this.iconPlay = this.playBtn.querySelector('.icon-play') as SVGSVGElement;
    this.iconPause = this.playBtn.querySelector('.icon-pause') as SVGSVGElement;
    this.cloudHeightText = document.getElementById('cloud-height-text') as HTMLElement;
    this.weatherTypeText = document.getElementById('weather-type-text') as HTMLElement;
    this.timeText = document.getElementById('time-text') as HTMLElement;
    this.timelineTicks = document.getElementById('timeline-ticks') as HTMLElement;

    this.buildTimelineTicks();
    this.bindEvents();
    this.updateInfoPanel();
  }

  private buildTimelineTicks(): void {
    this.timelineTicks.innerHTML = '';
    const ticks = [0, 12, 24, 36, 48, 60, 71];
    const totalWidth = this.timelineTicks.clientWidth || 400;

    ticks.forEach(t => {
      const span = document.createElement('span');
      span.textContent = `${t}h`;
      const percent = (t / 71) * 100;
      span.style.left = `${percent}%`;
      this.timelineTicks.appendChild(span);
    });
  }

  private bindEvents(): void {
    this.heightSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      const level = Math.round(value / 25);
      if (level !== this.currentHeightLevel) {
        this.currentHeightLevel = level;
        this.callbacks.onHeightChange(level);
        this.updateInfoPanel();
      }
    });

    this.dataButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type as WeatherDataType;
        if (!type || type === this.currentDataType) return;

        this.dataButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDataType = type;
        this.callbacks.onDataTypeChange(type);
        this.updateInfoPanel();
      });
    });

    this.timeSlider.addEventListener('input', (e) => {
      const hour = parseInt((e.target as HTMLInputElement).value);
      this.setHour(hour, true);
    });

    this.timeSlider.addEventListener('change', (e) => {
      const hour = parseInt((e.target as HTMLInputElement).value);
      this.setHour(hour, true);
    });

    this.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    window.addEventListener('resize', () => {
      this.buildTimelineTicks();
    });
  }

  private setHour(hour: number, emit: boolean): void {
    const clamped = Math.max(0, Math.min(71, hour));
    if (clamped === this.currentHour && !emit) return;
    this.currentHour = clamped;
    this.timeSlider.value = String(clamped);
    if (emit) {
      this.callbacks.onTimeChange(clamped);
    }
    this.updateInfoPanel();
  }

  private togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    this.updatePlayIcon();

    if (this.isPlaying) {
      this.playIntervalId = window.setInterval(() => {
        let next = this.currentHour + 1;
        if (next > 71) next = 0;
        this.setHour(next, true);
      }, 120);
    } else if (this.playIntervalId !== null) {
      clearInterval(this.playIntervalId);
      this.playIntervalId = null;
    }

    this.callbacks.onPlayToggle(this.isPlaying);
  }

  private updatePlayIcon(): void {
    if (this.isPlaying) {
      this.iconPlay.style.display = 'none';
      this.iconPause.style.display = 'block';
    } else {
      this.iconPlay.style.display = 'block';
      this.iconPause.style.display = 'none';
    }
  }

  private updateInfoPanel(): void {
    this.cloudHeightText.textContent = HEIGHT_LABELS[this.currentHeightLevel] || '中云';
    this.weatherTypeText.textContent = WEATHER_LABELS[this.currentDataType] || '温度';
    this.timeText.textContent = `第 ${this.currentHour} 小时`;
  }

  public getCurrentHeight(): number {
    return this.currentHeightLevel;
  }

  public getCurrentDataType(): WeatherDataType {
    return this.currentDataType;
  }

  public getCurrentHour(): number {
    return this.currentHour;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setPlayingExternal(playing: boolean): void {
    if (playing === this.isPlaying) return;
    this.isPlaying = playing;
    this.updatePlayIcon();

    if (this.isPlaying) {
      this.playIntervalId = window.setInterval(() => {
        let next = this.currentHour + 1;
        if (next > 71) next = 0;
        this.setHour(next, true);
      }, 120);
    } else if (this.playIntervalId !== null) {
      clearInterval(this.playIntervalId);
      this.playIntervalId = null;
    }
  }

  public dispose(): void {
    if (this.playIntervalId !== null) {
      clearInterval(this.playIntervalId);
      this.playIntervalId = null;
    }
  }
}
