export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'windy' | 'cloudy';

export interface WeatherCardData {
  id: string;
  city: string;
  date: string;
  temperature: number;
  condition: WeatherCondition;
  conditionText: string;
}

export const CITIES = ['北京', '上海', '东京', '纽约', '伦敦'];

const CONDITION_MAP: Record<WeatherCondition, string> = {
  sunny: '晴',
  rainy: '雨',
  snowy: '雪',
  windy: '风',
  cloudy: '多云'
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateWeatherCard(city: string, date: Date): WeatherCardData {
  const dateStr = formatDate(date);
  const seed = hashString(city + dateStr);
  const rand = seededRandom(seed);

  const conditions: WeatherCondition[] = ['sunny', 'rainy', 'snowy', 'windy', 'cloudy'];
  const month = date.getMonth() + 1;

  let weights: number[];
  if (month >= 12 || month <= 2) {
    weights = [25, 15, 35, 10, 15];
  } else if (month >= 3 && month <= 5) {
    weights = [35, 20, 5, 20, 20];
  } else if (month >= 6 && month <= 8) {
    weights = [30, 40, 0, 10, 20];
  } else {
    weights = [30, 25, 5, 20, 20];
  }

  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  let condition: WeatherCondition = 'sunny';
  for (let i = 0; i < conditions.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      condition = conditions[i];
      break;
    }
  }

  let baseTemp: number;
  if (month >= 12 || month <= 2) {
    baseTemp = rand() * 15 - 5;
  } else if (month >= 3 && month <= 5) {
    baseTemp = rand() * 15 + 10;
  } else if (month >= 6 && month <= 8) {
    baseTemp = rand() * 10 + 25;
  } else {
    baseTemp = rand() * 15 + 10;
  }

  if (condition === 'snowy') baseTemp = Math.min(baseTemp, 2);
  if (condition === 'rainy') baseTemp -= 2;

  const temperature = Math.round(baseTemp);

  return {
    id: `${city}-${dateStr}`,
    city,
    date: dateStr,
    temperature,
    condition,
    conditionText: CONDITION_MAP[condition]
  };
}

export function getDateNDaysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export function getTodayStr(): string {
  return formatDate(new Date());
}

export { formatDate };
