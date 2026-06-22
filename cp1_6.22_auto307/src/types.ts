export interface CloudParams {
  humidity: number;
  temperature: number;
  updraft: number;
}

export interface CloudParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  opacity: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  targetRadius: number;
  targetColor: string;
  targetOpacity: number;
}

export interface RainDrop {
  id: number;
  x: number;
  y: number;
  z: number;
  velocityY: number;
  windOffsetX: number;
  windOffsetZ: number;
}

export interface CloudBounds {
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

export type CloudStatus = 'generating' | 'active' | 'raining';

export type PresetMode = 'storm' | 'cloudy' | 'clear';

export const PRESET_VALUES: Record<PresetMode, CloudParams> = {
  storm: { humidity: 85, temperature: 12, updraft: 8 },
  cloudy: { humidity: 70, temperature: 20, updraft: 4 },
  clear: { humidity: 40, temperature: 28, updraft: 2 },
};

export const DEFAULT_PARAMS: CloudParams = {
  humidity: 50,
  temperature: 15,
  updraft: 5,
};
