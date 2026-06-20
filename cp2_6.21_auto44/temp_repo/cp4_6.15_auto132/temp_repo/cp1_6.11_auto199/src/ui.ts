import { Sundial } from './sundial';
import { ConstellationProjection } from './constellation';
import {
  formatTime,
  getSeasonFromMonth
} from './utils';

export interface UICallbacks {
  onTimeChange: (hour: number, minute: number) => void;
  onConstellationToggle: () => void;
  onDayNightToggle: () => void;
}

export class UIManager {
  private callbacks: UICallbacks;
  private sundial: Sundial;
  private constellation: ConstellationProjection;

  private timeSlider!: HTMLInputElement;
  private sliderValue!: HTMLSpanElement;
  private constellationBtn!: HTMLButtonElement;
  private dayNightToggle!: HTMLButtonElement;
  private backgroundLayer!: HTMLDivElement;

  private infoTime!: HTMLSpanElement;
  private infoShichen!: HTMLSpanElement;
  private infoSeason!: HTMLSpanElement;
  private infoConstellation!: HTMLSpanElement;

  private isDayMode: boolean = false;

  constructor(
    sundial: Sundial,
    constellation: ConstellationProjection,
    callbacks: UICallbacks
  ) {
    this.sundial = sundial;
    this.constellation = constellation;
    this.callbacks = callbacks;

    this.cacheElements();
    this.bindEvents();
    this.updateInfoPanel();
  }

  private cacheElements(): void {
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.sliderValue = document.getElementById('slider-value') as HTMLSpanElement;
    this.constellationBtn = document.getElementById('constellation-btn') as HTMLButtonElement;
    this.dayNightToggle = document.getElementById('day-night-toggle') as HTMLButtonElement;
    this.backgroundLayer = document.getElementById('background-layer') as HTMLDivElement;

    this.infoTime = document.getElementById('info-time') as HTMLSpanElement;
    this.infoShichen = document.getElementById('info-shichen') as HTMLSpanElement;
    this.infoSeason = document.getElementById('info-season') as HTMLSpanElement;
    this.infoConstellation = document.getElementById('info-constellation') as HTMLSpanElement;
  }

  private bindEvents(): void {
    this.timeSlider.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const rawValue = parseFloat(target.value);
      const hour = Math.floor(rawValue);
      const minute = Math.round((rawValue - hour) * 60);

      this.callbacks.onTimeChange(hour, minute);
      this.updateSliderDisplay(hour, minute);
    });

    this.constellationBtn.addEventListener('click', () => {
      this.callbacks.onConstellationToggle();
    });

    this.dayNightToggle.addEventListener('click', () => {
      this.callbacks.onDayNightToggle();
    });
  }

  private updateSliderDisplay(hour: number, minute: number): void {
    this.sliderValue.textContent = formatTime(hour, minute);
  }

  public updateInfoPanel(): void {
    const hour = this.sundial.state.currentHour;
    const minute = this.sundial.state.currentMinute;

    this.infoTime.textContent = formatTime(hour, minute);
    this.infoShichen.textContent = this.sundial.state.currentShichen;
    this.infoSeason.textContent = this.sundial.state.season;

    const constellationName = this.constellation.getCurrentConstellationName();
    this.infoConstellation.textContent = constellationName || '—';

    if (this.constellation.isConstellationVisible()) {
      this.constellationBtn.classList.add('active');
      this.constellationBtn.textContent = '隐藏星座';
    } else {
      this.constellationBtn.classList.remove('active');
      this.constellationBtn.textContent = '投影星座';
    }
  }

  public toggleDayNight(): boolean {
    this.isDayMode = !this.isDayMode;

    if (this.isDayMode) {
      this.backgroundLayer.classList.add('day-mode');
      const iconSpan = this.dayNightToggle.querySelector('span');
      if (iconSpan) {
        iconSpan.className = 'icon-sun';
        iconSpan.textContent = '☀';
      }
    } else {
      this.backgroundLayer.classList.remove('day-mode');
      const iconSpan = this.dayNightToggle.querySelector('span');
      if (iconSpan) {
        iconSpan.className = 'icon-moon';
        iconSpan.textContent = '☾';
      }
    }

    return this.isDayMode;
  }

  public setTimeSliderValue(hour: number, minute: number): void {
    const value = hour + minute / 60;
    this.timeSlider.value = value.toString();
    this.updateSliderDisplay(hour, minute);
  }

  public setDefaultSeason(): void {
    const currentMonth = new Date().getMonth() + 1;
    const season = getSeasonFromMonth(currentMonth);
    this.sundial.setSeason(season);
  }

  public getIsDayMode(): boolean {
    return this.isDayMode;
  }
}
