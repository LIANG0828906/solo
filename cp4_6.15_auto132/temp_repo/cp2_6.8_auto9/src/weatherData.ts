import type { CityWeatherData, WeatherType } from './types';

const PRESET_CITIES = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州'
];

function randomWeatherType(): WeatherType {
  const types: WeatherType[] = ['sunny', 'cloudy', 'rainy'];
  return types[Math.floor(Math.random() * types.length)];
}

function smoothRandom(base: number, variance: number): number {
  return base + (Math.random() - 0.5) * variance;
}

export function generateWeatherData(cityName: string): CityWeatherData {
  const hours: CityWeatherData['hours'] = [];
  const baseTemp = 15 + Math.random() * 10;
  const baseWind = 2 + Math.random() * 4;
  let currentWeather: WeatherType = randomWeatherType();
  let weatherStableHours = 0;

  for (let i = 0; i < 24; i++) {
    if (weatherStableHours >= 4 + Math.floor(Math.random() * 4)) {
      const types: WeatherType[] = ['sunny', 'cloudy', 'rainy'];
      const idx = types.indexOf(currentWeather);
      const change = Math.random() > 0.5 ? 1 : -1;
      currentWeather = types[(idx + change + 3) % 3];
      weatherStableHours = 0;
    }
    weatherStableHours++;

    const tempVariation = Math.sin((i - 6) / 24 * Math.PI * 2) * 6;
    hours.push({
      hour: i,
      temperature: Math.round((baseTemp + tempVariation + (Math.random() - 0.5) * 2) * 10) / 10,
      precipitation: currentWeather === 'rainy' ? Math.round((60 + Math.random() * 40) * 10) / 10 :
                      currentWeather === 'cloudy' ? Math.round((10 + Math.random() * 30) * 10) / 10 :
                      Math.round(Math.random() * 10 * 10) / 10,
      windSpeed: Math.round(smoothRandom(baseWind, 3) * 10) / 10,
      windDirection: Math.floor(Math.random() * 360),
      weatherType: currentWeather
    });
  }

  return { cityName, hours };
}

export function getPresetCities(): string[] {
  return PRESET_CITIES;
}

export function searchCities(query: string): string[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return PRESET_CITIES.filter(city => 
    city.toLowerCase().includes(lowerQuery)
  );
}
