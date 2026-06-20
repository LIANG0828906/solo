export interface WeatherData {
  date: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  precipitationProbability: number;
  weatherType: WeatherType;
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface CityWeather {
  city: string;
  days: WeatherData[];
}

const cityConfigs: Record<string, { baseTemp: number; tempVariance: number; weatherBias: WeatherType[] }> = {
  '雷克雅未克': {
    baseTemp: 5,
    tempVariance: 8,
    weatherBias: ['cloudy', 'rainy', 'snowy', 'cloudy']
  },
  '开罗': {
    baseTemp: 28,
    tempVariance: 10,
    weatherBias: ['sunny', 'sunny', 'sunny', 'cloudy']
  },
  '孟买': {
    baseTemp: 30,
    tempVariance: 5,
    weatherBias: ['rainy', 'rainy', 'cloudy', 'sunny']
  }
};

function generateWeatherData(city: string, days: number): WeatherData[] {
  const config = cityConfigs[city] || cityConfigs['雷克雅未克'];
  const result: WeatherData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    const temp = Math.round(config.baseTemp + (Math.random() - 0.5) * config.tempVariance * 2);
    const humidity = Math.round(40 + Math.random() * 50);
    const windSpeed = Math.round(5 + Math.random() * 20);
    const cloudCover = Math.round(Math.random() * 100);
    const precipitationProbability = Math.round(Math.random() * 100);

    const biasIndex = Math.floor(Math.random() * config.weatherBias.length);
    let weatherType = config.weatherBias[biasIndex];
    
    if (precipitationProbability > 70 && temp <= 2) {
      weatherType = 'snowy';
    } else if (precipitationProbability > 60) {
      weatherType = 'rainy';
    } else if (cloudCover > 70) {
      weatherType = 'cloudy';
    } else if (cloudCover < 30) {
      weatherType = 'sunny';
    }

    result.push({
      date: dateStr,
      temperature: temp,
      humidity,
      windSpeed,
      cloudCover,
      precipitationProbability,
      weatherType
    });
  }

  return result;
}

export async function fetchWeatherData(city: string, days: number): Promise<CityWeather> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        city,
        days: generateWeatherData(city, days)
      });
    }, 800);
  });
}

export const CITIES = ['雷克雅未克', '开罗', '孟买'] as const;
