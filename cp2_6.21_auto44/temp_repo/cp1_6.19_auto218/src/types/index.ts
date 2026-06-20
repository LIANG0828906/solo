export type RainType = 'frontal' | 'convective' | 'typhoon';

export interface RainParticleConfig {
  count: number;
  speed: number;
  angle: number;
  color: string;
  size: number;
  bgColor: string;
  rainfallMmPerHour: number;
}

export interface GridCell {
  x: number;
  y: number;
  elevation: number;
  waterDepth: number;
  riskLevel: number;
}

export type RiskLevel = 'low' | 'warning' | 'danger';

export interface FloodEvent {
  id: number;
  timestamp: number;
  level: RiskLevel;
  cellCount: number;
  message: string;
}
