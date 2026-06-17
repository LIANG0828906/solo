export enum WeatherType {
  Sunny = 'sunny',
  Rainy = 'rainy',
  Snowy = 'snowy',
  Thunderstorm = 'thunderstorm',
}

export type ParticleShape = 'circle' | 'ellipse' | 'hexagon' | 'rectangle';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  sizeY?: number;
  color: string;
  opacity: number;
  shape: ParticleShape;
  rotation?: number;
  rotationSpeed?: number;
  phase?: number;
  life?: number;
  maxLife?: number;
  active: boolean;
  isHighlight?: boolean;
  blinkOffset?: number;
  blinkSpeed?: number;
}

export interface ParticleParams {
  count: number;
  shape: ParticleShape;
  colors: string[];
  minSize: number;
  maxSize: number;
  minSizeY?: number;
  maxSizeY?: number;
  minSpeed: number;
  maxSpeed: number;
  angleDeg?: number;
  angleVarianceDeg?: number;
  opacityRange: [number, number];
  blinkEnabled?: boolean;
}

export interface ThemeColors {
  background: string;
  gradient: [string, string];
  glow: string;
  border: string;
}

export interface CityConfig {
  id: string;
  name: string;
  weatherType: WeatherType;
  weatherIcon: string;
  weatherDesc: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  particleParams: ParticleParams;
  themeColors: ThemeColors;
}

export interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}
