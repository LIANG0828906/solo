export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherType: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'foggy';
}

export const PRESET_CITIES = ['北京', '东京', '纽约', '伦敦', '悉尼'] as const;

type CityRange = {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  windMin: number;
  windMax: number;
};

const CITY_RANGES: Record<string, CityRange> = {
  '北京': { tempMin: -5, tempMax: 35, humidityMin: 20, humidityMax: 80, windMin: 5, windMax: 30 },
  '东京': { tempMin: 5, tempMax: 32, humidityMin: 40, humidityMax: 90, windMin: 3, windMax: 20 },
  '纽约': { tempMin: -10, tempMax: 35, humidityMin: 30, humidityMax: 85, windMin: 5, windMax: 35 },
  '伦敦': { tempMin: 0, tempMax: 28, humidityMin: 50, humidityMax: 95, windMin: 5, windMax: 25 },
  '悉尼': { tempMin: 5, tempMax: 38, humidityMin: 30, humidityMax: 80, windMin: 5, windMax: 30 },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSeed(city: string): number {
  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = (hash << 5) - hash + city.charCodeAt(i);
    hash |= 0;
  }
  const currentHour = new Date().getHours();
  return hash + currentHour * 1000;
}

function randomInRange(rand: () => number, min: number, max: number): number {
  return Math.round((rand() * (max - min) + min) * 10) / 10;
}

function determineWeatherType(humidity: number, windSpeed: number): WeatherData['weatherType'] {
  if (humidity > 80) return 'rainy';
  if (windSpeed > 25) return 'windy';
  if (humidity > 70) return 'cloudy';
  if (humidity < 30) return 'sunny';
  return 'foggy';
}

export function getWeather(city: string): Promise<WeatherData> {
  const delay = Math.floor(Math.random() * 201) + 100;

  return new Promise((resolve) => {
    setTimeout(() => {
      const seed = generateSeed(city);
      const rand = seededRandom(seed);

      const range = CITY_RANGES[city] ?? {
        tempMin: -10,
        tempMax: 35,
        humidityMin: 20,
        humidityMax: 90,
        windMin: 3,
        windMax: 30,
      };

      const temperature = randomInRange(rand, range.tempMin, range.tempMax);
      const humidity = Math.round(randomInRange(rand, range.humidityMin, range.humidityMax));
      const windSpeed = randomInRange(rand, range.windMin, range.windMax);
      const weatherType = determineWeatherType(humidity, windSpeed);

      resolve({
        city,
        temperature,
        humidity,
        windSpeed,
        weatherType,
      });
    }, delay);
  });
}
