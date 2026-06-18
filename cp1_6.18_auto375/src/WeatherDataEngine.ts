export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  city: string;
  timestamp: number;
}

interface CityBaseline {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
}

type WeatherCallback = (data: WeatherData) => void;

const CITY_BASELINES: Record<string, CityBaseline> = {
  北京: { temperature: 15, humidity: 50, windSpeed: 5, windDirection: 90, pressure: 1013 },
  上海: { temperature: 20, humidity: 65, windSpeed: 4, windDirection: 135, pressure: 1015 },
  东京: { temperature: 18, humidity: 60, windSpeed: 6, windDirection: 45, pressure: 1012 },
  纽约: { temperature: 12, humidity: 55, windSpeed: 7, windDirection: 270, pressure: 1010 },
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const workerCode = `
  const CITY_BASELINES = ${JSON.stringify(CITY_BASELINES)};

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let intervalId = null;
  let currentCity = null;

  function generateWeatherData(city) {
    const baseline = CITY_BASELINES[city];
    if (!baseline) return null;

    const fluctuation = 0.1;

    const temperature = clamp(
      baseline.temperature * (1 + (Math.random() * 2 - 1) * fluctuation),
      -10,
      40
    );

    const humidity = clamp(
      baseline.humidity * (1 + (Math.random() * 2 - 1) * fluctuation),
      20,
      90
    );

    const windSpeed = clamp(
      baseline.windSpeed * (1 + (Math.random() * 2 - 1) * fluctuation),
      0,
      20
    );

    const windDirection = clamp(
      baseline.windDirection * (1 + (Math.random() * 2 - 1) * fluctuation),
      0,
      360
    );

    const pressure = clamp(
      baseline.pressure * (1 + (Math.random() * 2 - 1) * fluctuation),
      980,
      1040
    );

    return {
      temperature: Math.round(temperature * 100) / 100,
      humidity: Math.round(humidity * 100) / 100,
      windSpeed: Math.round(windSpeed * 100) / 100,
      windDirection: Math.round(windDirection * 100) / 100,
      pressure: Math.round(pressure * 100) / 100,
      city,
      timestamp: Date.now(),
    };
  }

  self.onmessage = function (e) {
    const { type, city } = e.data;

    if (type === 'START') {
      if (intervalId) {
        clearInterval(intervalId);
      }
      currentCity = city;
      const firstData = generateWeatherData(city);
      if (firstData) {
        self.postMessage({ type: 'WEATHER_UPDATE', data: firstData });
      }
      intervalId = setInterval(() => {
        const data = generateWeatherData(currentCity);
        if (data) {
          self.postMessage({ type: 'WEATHER_UPDATE', data });
        }
      }, 2000);
    } else if (type === 'STOP') {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      currentCity = null;
    }
  };
`;

export class WeatherDataEngine {
  private worker: Worker | null = null;
  private callback: WeatherCallback | null = null;
  private blobUrl: string | null = null;

  constructor() {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.blobUrl = URL.createObjectURL(blob);
    this.worker = new Worker(this.blobUrl);

    this.worker.onmessage = (e) => {
      const { type, data } = e.data;
      if (type === 'WEATHER_UPDATE' && this.callback) {
        this.callback(data);
      }
    };
  }

  start(city: string): void {
    if (!this.worker) return;
    this.worker.postMessage({ type: 'START', city });
  }

  stop(): void {
    if (!this.worker) return;
    this.worker.postMessage({ type: 'STOP' });
  }

  onUpdate(callback: WeatherCallback): void {
    this.callback = callback;
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.callback = null;
  }
}
