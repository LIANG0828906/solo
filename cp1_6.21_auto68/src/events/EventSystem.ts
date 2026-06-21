import type { PlotData, WeatherType } from '../farm/CropManager';

export type EventType = 'pest' | 'drought' | 'blessing';

export interface EventInfo {
  type: EventType;
  message: string;
  timestamp: number;
}

export interface EventSystemOptions {
  onEvent?: (event: EventInfo) => void;
  onPlotsUpdate?: (plots: PlotData[]) => void;
  onWeatherUpdate?: (weather: WeatherType) => void;
}

export class EventSystem {
  private eventInterval: number = 60000;
  private weatherInterval: number = 120000;
  private eventTimer: number | null = null;
  private weatherTimer: number | null = null;
  private options: EventSystemOptions;
  private isRunning: boolean = false;

  constructor(options: EventSystemOptions = {}) {
    this.options = options;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextEvent();
    this.scheduleNextWeather();
  }

  stop(): void {
    this.isRunning = false;
    if (this.eventTimer) {
      clearInterval(this.eventTimer);
      this.eventTimer = null;
    }
    if (this.weatherTimer) {
      clearInterval(this.weatherTimer);
      this.weatherTimer = null;
    }
  }

  private scheduleNextEvent(): void {
    this.eventTimer = window.setInterval(() => {
      if (Math.random() < 0.4) {
        this.triggerRandomEvent();
      }
    }, this.eventInterval);
  }

  private scheduleNextWeather(): void {
    this.weatherTimer = window.setInterval(() => {
      const weathers: WeatherType[] = ['sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'rainy'];
      const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      this.options.onWeatherUpdate?.(newWeather);
    }, this.weatherInterval);
  }

  triggerRandomEvent(): void {
    const events: EventType[] = ['pest', 'drought', 'blessing'];
    const event = events[Math.floor(Math.random() * events.length)];
    this.triggerEvent(event);
  }

  triggerEvent(eventType: EventType): void {
    const messages: Record<EventType, string> = {
      pest: '🐛 虫害来袭！部分作物受到影响',
      drought: '☀️ 干旱警报！作物生长暂时减缓',
      blessing: '✨ 好运降临！作物生长加速',
    };

    const eventInfo: EventInfo = {
      type: eventType,
      message: messages[eventType],
      timestamp: Date.now(),
    };

    this.options.onEvent?.(eventInfo);
  }

  setEventInterval(interval: number): void {
    this.eventInterval = interval;
    if (this.isRunning && this.eventTimer) {
      clearInterval(this.eventTimer);
      this.scheduleNextEvent();
    }
  }

  setWeatherInterval(interval: number): void {
    this.weatherInterval = interval;
    if (this.isRunning && this.weatherTimer) {
      clearInterval(this.weatherTimer);
      this.scheduleNextWeather();
    }
  }

  setOptions(options: Partial<EventSystemOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
