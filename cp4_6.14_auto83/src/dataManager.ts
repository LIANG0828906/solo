export type MetricType = 'temperature' | 'humidity' | 'precipitation';

export interface WeatherDataPoint {
  city: string;
  cityIndex: number;
  dayIndex: number;
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
}

export interface CityInfo {
  name: string;
  index: number;
  color: string;
  zPosition: number;
}

const CITIES: CityInfo[] = [
  { name: '北京', index: 0, color: '#ef4444', zPosition: 0 },
  { name: '上海', index: 1, color: '#f97316', zPosition: 0 },
  { name: '广州', index: 2, color: '#eab308', zPosition: 0 },
  { name: '深圳', index: 3, color: '#22c55e', zPosition: 0 },
  { name: '成都', index: 4, color: '#14b8a6', zPosition: 0 },
  { name: '杭州', index: 5, color: '#06b6d4', zPosition: 0 },
  { name: '武汉', index: 6, color: '#3b82f6', zPosition: 0 },
  { name: '西安', index: 7, color: '#8b5cf6', zPosition: 0 },
  { name: '哈尔滨', index: 8, color: '#d946ef', zPosition: 0 },
  { name: '昆明', index: 9, color: '#ec4899', zPosition: 0 },
];

const TOTAL_DAYS = 90;
const START_DATE = new Date('2026-03-01');

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateTemperature(dayIndex: number, cityIndex: number, rand: () => number): number {
  const baseTempByCity = [12, 15, 22, 23, 17, 16, 15, 13, 2, 16];
  const seasonalWave = Math.sin((dayIndex / TOTAL_DAYS) * Math.PI * 2) * 12;
  const cityWave = Math.sin((dayIndex / 14 + cityIndex) * Math.PI) * 4;
  const noise = (rand() - 0.5) * 6;
  return Math.round((baseTempByCity[cityIndex] + seasonalWave + cityWave + noise) * 10) / 10;
}

function generateHumidity(dayIndex: number, cityIndex: number, rand: () => number): number {
  const baseHumidityByCity = [45, 65, 78, 75, 72, 70, 68, 55, 58, 65];
  const wave = Math.sin((dayIndex / 20 + cityIndex * 0.7) * Math.PI) * 15;
  const noise = (rand() - 0.5) * 10;
  const val = baseHumidityByCity[cityIndex] + wave + noise;
  return Math.round(Math.max(10, Math.min(100, val)) * 10) / 10;
}

function generatePrecipitation(dayIndex: number, cityIndex: number, rand: () => number): number {
  const baseRainChance = [0.25, 0.4, 0.55, 0.5, 0.45, 0.5, 0.42, 0.3, 0.35, 0.48];
  const rainBoost = Math.sin((dayIndex / TOTAL_DAYS) * Math.PI) * 0.2;
  const chance = baseRainChance[cityIndex] + rainBoost;
  if (rand() > chance) return 0;
  const intensity = Math.pow(rand(), 2) * 250;
  return Math.round(intensity * 10) / 10;
}

class DataManager {
  private data: WeatherDataPoint[] = [];
  private cities: CityInfo[] = [];

  constructor() {
    this.cities = CITIES.map((c, i) => ({
      ...c,
      zPosition: (i / 9) * 10,
    }));
    this.generateDataset();
  }

  private generateDataset(): void {
    const dataset: WeatherDataPoint[] = [];
    for (let cityIdx = 0; cityIdx < this.cities.length; cityIdx++) {
      const rand = seededRandom(cityIdx * 1000 + 7);
      for (let dayIdx = 0; dayIdx < TOTAL_DAYS; dayIdx++) {
        const currentDate = new Date(START_DATE);
        currentDate.setDate(currentDate.getDate() + dayIdx);
        dataset.push({
          city: this.cities[cityIdx].name,
          cityIndex: cityIdx,
          dayIndex: dayIdx,
          date: formatDate(currentDate),
          temperature: generateTemperature(dayIdx, cityIdx, rand),
          humidity: generateHumidity(dayIdx, cityIdx, rand),
          precipitation: generatePrecipitation(dayIdx, cityIdx, rand),
        });
      }
    }
    this.data = dataset;
  }

  getCities(): CityInfo[] {
    return [...this.cities];
  }

  getTotalDays(): number {
    return TOTAL_DAYS;
  }

  getDateByIndex(dayIndex: number): string {
    const d = new Date(START_DATE);
    d.setDate(d.getDate() + Math.max(0, Math.min(TOTAL_DAYS - 1, dayIndex)));
    return formatDate(d);
  }

  getAllData(): WeatherDataPoint[] {
    return [...this.data];
  }

  query(params: {
    cities?: string[];
    cityIndices?: number[];
    startDay?: number;
    endDay?: number;
    dayIndex?: number;
    metrics?: MetricType[];
  }): WeatherDataPoint[] {
    let result = this.data;

    if (params.cityIndices !== undefined && params.cityIndices.length > 0) {
      const idxSet = new Set(params.cityIndices);
      result = result.filter((d) => idxSet.has(d.cityIndex));
    } else if (params.cities !== undefined && params.cities.length > 0) {
      const citySet = new Set(params.cities);
      result = result.filter((d) => citySet.has(d.city));
    }

    if (params.dayIndex !== undefined) {
      result = result.filter((d) => d.dayIndex === params.dayIndex);
    } else if (params.startDay !== undefined || params.endDay !== undefined) {
      const s = params.startDay ?? 0;
      const e = params.endDay ?? TOTAL_DAYS - 1;
      result = result.filter((d) => d.dayIndex >= s && d.dayIndex <= e);
    }

    return [...result];
  }

  getMetricRange(metric: MetricType): { min: number; max: number } {
    switch (metric) {
      case 'temperature':
        return { min: -10, max: 45 };
      case 'humidity':
        return { min: 0, max: 100 };
      case 'precipitation':
        return { min: 0, max: 300 };
    }
  }

  getMetricUnit(metric: MetricType): string {
    switch (metric) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'precipitation':
        return 'mm';
    }
  }

  getMetricLabel(metric: MetricType): string {
    switch (metric) {
      case 'temperature':
        return '温度';
      case 'humidity':
        return '湿度';
      case 'precipitation':
        return '降水量';
    }
  }
}

export const dataManager = new DataManager();
export default dataManager;
