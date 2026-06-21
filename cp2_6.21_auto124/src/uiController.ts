import { WeatherType } from './weatherEngine';

interface ParamConfig {
  key: string;
  label: string;
  unit: string;
  weathers: WeatherType[];
}

const PARAM_CONFIGS: ParamConfig[] = [
  { key: 'sunIntensity', label: '太阳光强度', unit: '', weathers: ['sunny'] },
  { key: 'grassHue', label: '草地色相偏移', unit: '°', weathers: ['sunny'] },
  { key: 'cloudSpeed', label: '云层速度', unit: 'x', weathers: ['cloudy'] },
  { key: 'cloudLayers', label: '云层覆盖率', unit: '', weathers: ['cloudy'] },
  { key: 'rainCount', label: '雨量', unit: '', weathers: ['rain', 'thunderstorm'] },
  { key: 'rainWind', label: '风速', unit: '级', weathers: ['rain', 'thunderstorm'] },
  { key: 'lightningFreq', label: '闪电频率', unit: 's', weathers: ['thunderstorm'] },
  { key: 'lightningBright', label: '闪电亮度', unit: '', weathers: ['thunderstorm'] },
  { key: 'snowCount', label: '雪量', unit: '', weathers: ['snow'] },
  { key: 'snowWind', label: '风速', unit: '级', weathers: ['snow'] },
  { key: 'fogDensity', label: '雾浓度', unit: '', weathers: ['fog'] },
  { key: 'fogColor', label: '雾颜色', unit: '', weathers: ['fog'] }
];

const WEATHER_NAMES: Record<WeatherType, string> = {
  sunny: '晴天参数',
  cloudy: '多云参数',
  rain: '降雨参数',
  thunderstorm: '雷暴参数',
  snow: '下雪参数',
  fog: '雾天参数'
};

export class UIController {
  private weatherButtons: NodeListOf<HTMLButtonElement>;
  private paramGroups: NodeListOf<HTMLElement>;
  private panelTitle: HTMLElement;
  private lightningText: HTMLElement;
  private timeSlider: HTMLInputElement;
  private timeDisplay: HTMLElement;

  private onWeatherChange: ((weather: WeatherType) => void) | null = null;
  private onParamChange: ((key: string, value: number | string) => void) | null = null;
  private onTimeChange: ((minutes: number) => void) | null = null;

  private currentWeather: WeatherType = 'sunny';
  private thunderTimeout: number | null = null;

  constructor() {
    this.weatherButtons = document.querySelectorAll('.weather-btn');
    this.paramGroups = document.querySelectorAll('.param-group');
    this.panelTitle = document.getElementById('panel-title')!;
    this.lightningText = document.getElementById('lightning-text')!;
    this.timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    this.timeDisplay = document.getElementById('time-display')!;

    this.bindEvents();
    this.updateParamVisibility('sunny');
  }

  setOnWeatherChange(callback: (weather: WeatherType) => void): void {
    this.onWeatherChange = callback;
  }

  setOnParamChange(callback: (key: string, value: number | string) => void): void {
    this.onParamChange = callback;
  }

  setOnTimeChange(callback: (minutes: number) => void): void {
    this.onTimeChange = callback;
  }

  private bindEvents(): void {
    this.weatherButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const weather = btn.dataset.weather as WeatherType;
        if (weather && weather !== this.currentWeather) {
          this.setActiveWeather(weather);
          if (this.onWeatherChange) {
            this.onWeatherChange(weather);
          }
        }
      });
    });

    this.paramGroups.forEach(group => {
      const paramKey = group.dataset.param;
      if (!paramKey) return;

      const input = group.querySelector('input') as HTMLInputElement;
      if (!input) return;

      input.addEventListener('input', () => {
        const value = input.type === 'range' ? parseFloat(input.value) : input.value;
        this.updateParamValue(paramKey, value);
        if (this.onParamChange) {
          this.onParamChange(paramKey, value);
        }
      });
    });

    this.timeSlider.addEventListener('input', () => {
      const minutes = parseInt(this.timeSlider.value);
      this.updateTimeDisplay(minutes);
      if (this.onTimeChange) {
        this.onTimeChange(minutes);
      }
    });
  }

  private setActiveWeather(weather: WeatherType): void {
    this.currentWeather = weather;

    this.weatherButtons.forEach(btn => {
      if (btn.dataset.weather === weather) {
        btn.classList.add('active');
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = 'scale(1.0)';
        }, 100);
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateParamVisibility(weather);
  }

  private updateParamVisibility(weather: WeatherType): void {
    this.panelTitle.textContent = WEATHER_NAMES[weather] || '天气参数';

    this.paramGroups.forEach(group => {
      const paramKey = group.dataset.param;
      if (!paramKey) return;

      const config = PARAM_CONFIGS.find(c => c.key === paramKey);
      if (config && config.weathers.includes(weather)) {
        group.classList.remove('hidden');
      } else {
        group.classList.add('hidden');
      }
    });
  }

  private updateParamValue(key: string, value: number | string): void {
    const valueEl = document.getElementById(`${key}-value`);
    if (!valueEl) return;

    const config = PARAM_CONFIGS.find(c => c.key === key);
    if (config) {
      if (typeof value === 'number') {
        valueEl.textContent = `${value}${config.unit}`;
      } else {
        valueEl.textContent = value;
      }
    }
  }

  updateTimeDisplay(minutes: number): void {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    this.timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  showThunderText(): void {
    this.lightningText.classList.add('show');

    if (this.thunderTimeout) {
      clearTimeout(this.thunderTimeout);
    }

    this.thunderTimeout = window.setTimeout(() => {
      this.lightningText.classList.remove('show');
      this.thunderTimeout = null;
    }, 1000);
  }

  getParam(key: string): string | number {
    const input = document.getElementById(key) as HTMLInputElement;
    if (!input) return 0;
    return input.type === 'range' ? parseFloat(input.value) : input.value;
  }

  setParam(key: string, value: string | number): void {
    const input = document.getElementById(key) as HTMLInputElement;
    if (input) {
      input.value = String(value);
      this.updateParamValue(key, value);
    }
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  getTime(): number {
    return parseInt(this.timeSlider.value);
  }

  setTime(minutes: number): void {
    this.timeSlider.value = String(minutes);
    this.updateTimeDisplay(minutes);
  }
}
