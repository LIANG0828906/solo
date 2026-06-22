import type { WeatherType } from './SceneManager';

export interface UICallbacks {
  onTimeChange: (hour: number) => void;
  onWeatherChange: (weather: WeatherType) => void;
}

export class UIController {
  private slider: HTMLInputElement;
  private timeDisplay: HTMLElement;
  private weatherButtons: NodeListOf<HTMLButtonElement>;
  private callbacks: UICallbacks;
  private currentWeather: WeatherType = 'sunny';

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    const buttons = document.querySelectorAll<HTMLButtonElement>('.weather-btn');

    if (!slider || !(slider instanceof HTMLInputElement)) {
      throw new Error('Time slider not found');
    }
    if (!display) {
      throw new Error('Time display not found');
    }

    this.slider = slider;
    this.timeDisplay = display;
    this.weatherButtons = buttons;

    this.init();
  }

  private init(): void {
    this.slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.updateTimeDisplay(value);
      this.callbacks.onTimeChange(value);
    });

    this.weatherButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const weather = btn.dataset.weather as WeatherType;
        if (!weather || weather === this.currentWeather) return;

        this.setWeatherActive(btn, weather);
        this.callbacks.onWeatherChange(weather);
      });
    });

    const initialValue = parseFloat(this.slider.value);
    this.updateTimeDisplay(initialValue);
  }

  private updateTimeDisplay(hour: number): void {
    const period = this.getTimePeriod(hour);
    this.timeDisplay.textContent = `${hour.toFixed(1)} - ${period}`;
  }

  private getTimePeriod(hour: number): string {
    if (hour >= 5 && hour < 8) return '清晨';
    if (hour >= 8 && hour < 11) return '上午';
    if (hour >= 11 && hour < 13) return '正午';
    if (hour >= 13 && hour < 17) return '午后';
    if (hour >= 17 && hour < 20) return '黄昏';
    if (hour >= 20 && hour < 23) return '夜晚';
    return '深夜';
  }

  private setWeatherActive(activeBtn: HTMLButtonElement, weather: WeatherType): void {
    this.weatherButtons.forEach((btn) => {
      btn.classList.remove('active');
      btn.classList.remove('animating');
    });

    activeBtn.classList.add('active');
    activeBtn.classList.add('animating');

    setTimeout(() => {
      activeBtn.classList.remove('animating');
    }, 200);

    this.currentWeather = weather;
  }

  getCurrentHour(): number {
    return parseFloat(this.slider.value);
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }
}
