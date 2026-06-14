export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'stormy';

export type RegionType = 'forest' | 'desert' | 'snowfield' | 'town';

export interface ParticleConfig {
  density: number;
  speedRange: [number, number];
  color: string;
  size: number;
  hasTrail: boolean;
  swayAmount: number;
  maxCount: number;
}

export interface RegionConfig {
  id: RegionType;
  name: string;
  icon: string;
  weatherWeights: Record<WeatherType, number>;
  transitionDuration: number;
}

export interface WeatherStatus {
  type: WeatherType;
  temperature: number;
  visibility: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface RippleEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
}

export interface SnowBurstEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  particles: Array<{
    dx: number;
    dy: number;
    size: number;
  }>;
}

export interface HeatEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export type ClickEffect =
  | { kind: 'ripple'; data: RippleEffect }
  | { kind: 'snowburst'; data: SnowBurstEffect }
  | { kind: 'heat'; data: HeatEffect };
