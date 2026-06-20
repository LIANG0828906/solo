export type WeatherState = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy';

export interface ParticleConfig {
  type: 'rain' | 'storm' | 'wind' | 'leaf' | 'sparkle';
  density: number;
  speed: number;
  directionX: number;
  directionY: number;
  color: string;
  size: number;
  length?: number;
}

export interface WeatherData {
  state: WeatherState;
  particles: ParticleConfig[];
  bgColor: string;
  growthMultiplier: number;
  autoWater: boolean;
  damageChance: number;
  moistureDelta: number;
  label: string;
  icon: string;
}

const WEATHER_CONFIGS: Record<WeatherState, WeatherData> = {
  sunny: {
    state: 'sunny',
    particles: [
      { type: 'sparkle', density: 5, speed: 0.3, directionX: 0, directionY: 0.2, color: 'rgba(255,215,0,0.6)', size: 3 },
    ],
    bgColor: '#87CEEB',
    growthMultiplier: 1.5,
    autoWater: false,
    damageChance: 0,
    moistureDelta: -0.04,
    label: '晴朗',
    icon: '☀️',
  },
  cloudy: {
    state: 'cloudy',
    particles: [
      { type: 'wind', density: 8, speed: 0.8, directionX: 1, directionY: 0.1, color: 'rgba(200,200,200,0.3)', size: 2 },
    ],
    bgColor: '#A9A9A9',
    growthMultiplier: 1.0,
    autoWater: false,
    damageChance: 0,
    moistureDelta: -0.02,
    label: '多云',
    icon: '☁️',
  },
  rainy: {
    state: 'rainy',
    particles: [
      { type: 'rain', density: 60, speed: 3, directionX: -0.5, directionY: 1, color: 'rgba(65,105,225,0.5)', size: 2, length: 8 },
    ],
    bgColor: '#708090',
    growthMultiplier: 0.8,
    autoWater: true,
    damageChance: 0.05,
    moistureDelta: 0.08,
    label: '小雨',
    icon: '🌧️',
  },
  stormy: {
    state: 'stormy',
    particles: [
      { type: 'storm', density: 120, speed: 6, directionX: 0, directionY: 1, color: 'rgba(255,255,255,0.7)', size: 1, length: 14 },
    ],
    bgColor: '#4A4A4A',
    growthMultiplier: 0.5,
    autoWater: true,
    damageChance: 0.15,
    moistureDelta: 0.12,
    label: '暴雨',
    icon: '⛈️',
  },
  windy: {
    state: 'windy',
    particles: [
      { type: 'wind', density: 30, speed: 4, directionX: 1, directionY: 0, color: 'rgba(139,134,130,0.5)', size: 1, length: 20 },
      { type: 'leaf', density: 10, speed: 3, directionX: 1, directionY: 0.3, color: '#8B4513', size: 4 },
    ],
    bgColor: '#9EA7B0',
    growthMultiplier: 0.7,
    autoWater: false,
    damageChance: 0.1,
    moistureDelta: -0.03,
    label: '暴风',
    icon: '🌬️',
  },
};

const ALL_WEATHERS: WeatherState[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'windy'];
const WEATHER_WEIGHTS: Record<WeatherState, number> = {
  sunny: 30, cloudy: 25, rainy: 20, stormy: 10, windy: 15,
};

export class WeatherSystem {
  private current: WeatherState = 'sunny';
  private forecast: WeatherState[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.forecast = Array.from({ length: 4 }, () => this.randomWeather());
  }

  start(onChange: (data: WeatherData, forecast: WeatherState[]) => void) {
    onChange(WEATHER_CONFIGS[this.current], this.getForecast());
    this.intervalId = setInterval(() => {
      this.advance();
      onChange(WEATHER_CONFIGS[this.current], this.getForecast());
    }, 30000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  advance() {
    this.current = this.forecast.shift() || this.randomWeather();
    this.forecast.push(this.randomWeather());
  }

  getData(): WeatherData {
    return WEATHER_CONFIGS[this.current];
  }

  getForecast(): WeatherState[] {
    return this.forecast.slice(0, 3);
  }

  getConfig(state: WeatherState): WeatherData {
    return WEATHER_CONFIGS[state];
  }

  private randomWeather(): WeatherState {
    const total = Object.values(WEATHER_WEIGHTS).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const w of ALL_WEATHERS) {
      r -= WEATHER_WEIGHTS[w];
      if (r <= 0) return w;
    }
    return 'sunny';
  }
}
