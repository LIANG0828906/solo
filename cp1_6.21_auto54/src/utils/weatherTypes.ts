export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export type ThemeStyle = 'realistic' | 'minimal' | 'dreamy';

export interface WeatherData {
  city: string;
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  icon: string;
  hourlyForecast: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
}

export interface ThemeSettings {
  style: ThemeStyle;
  particleDensity: number;
}

export interface Poem {
  text: string;
  source: string;
}

export interface City {
  name: string;
  country: string;
}
