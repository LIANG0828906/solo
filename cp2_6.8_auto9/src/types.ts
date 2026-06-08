export type WeatherType = 'sunny' | 'cloudy' | 'rainy';

export interface WeatherHourData {
  hour: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  weatherType: WeatherType;
}

export interface CityWeatherData {
  cityName: string;
  hours: WeatherHourData[];
}

export interface WeatherUpdate {
  timeIndex: number;
  currentData: WeatherHourData;
  nextData: WeatherHourData;
  progress: number;
}
