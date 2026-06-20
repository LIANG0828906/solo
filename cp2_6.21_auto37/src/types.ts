export enum WeatherMode {
  SUNNY = 'sunny',
  RAIN = 'rain',
  SNOW = 'snow',
  SANDSTORM = 'sandstorm'
}

export interface ParticleConfig {
  count: number;
  color: number;
  size: number;
  speed: number;
  opacity: number;
}

export interface ControlParams {
  particleDensity: number;
  windStrength: number;
  terrainScale: number;
}

export type WeatherConfig = Record<WeatherMode, ParticleConfig>;

export const WEATHER_CONFIGS: WeatherConfig = {
  [WeatherMode.SUNNY]: {
    count: 3000,
    color: 0xffd700,
    size: 0.12,
    speed: 0.3,
    opacity: 0.9
  },
  [WeatherMode.RAIN]: {
    count: 5000,
    color: 0x2f2f2f,
    size: 0.06,
    speed: 2.0,
    opacity: 0.7
  },
  [WeatherMode.SNOW]: {
    count: 4000,
    color: 0xffffff,
    size: 0.1,
    speed: 0.8,
    opacity: 0.85
  },
  [WeatherMode.SANDSTORM]: {
    count: 4500,
    color: 0xb8860b,
    size: 0.15,
    speed: 1.5,
    opacity: 0.6
  }
};
