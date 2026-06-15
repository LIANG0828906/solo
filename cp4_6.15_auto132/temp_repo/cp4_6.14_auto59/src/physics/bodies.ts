export type ObstacleType = 'woodbox' | 'ironblock' | 'rubberball' | 'springboard' | 'spiketrap';

export interface BodyConfig {
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  isStatic: boolean;
  density: number;
  friction: number;
  restitution: number;
}

export interface ObstaclePreset {
  type: ObstacleType;
  label: string;
  width: number;
  height: number;
  isStatic: boolean;
  density: number;
  friction: number;
  restitution: number;
  color: string;
  strokeColor: string;
}

export const OBSTACLE_PRESETS: Record<ObstacleType, ObstaclePreset> = {
  woodbox: {
    type: 'woodbox',
    label: '木箱',
    width: 50,
    height: 50,
    isStatic: false,
    density: 0.005,
    friction: 0.6,
    restitution: 0.2,
    color: '#92400e',
    strokeColor: '#78350f',
  },
  ironblock: {
    type: 'ironblock',
    label: '铁块',
    width: 50,
    height: 50,
    isStatic: false,
    density: 0.02,
    friction: 0.4,
    restitution: 0.7,
    color: '#6b7280',
    strokeColor: '#4b5563',
  },
  rubberball: {
    type: 'rubberball',
    label: '橡皮球',
    width: 40,
    height: 40,
    isStatic: false,
    density: 0.002,
    friction: 0.3,
    restitution: 0.95,
    color: '#16a34a',
    strokeColor: '#15803d',
  },
  springboard: {
    type: 'springboard',
    label: '弹簧板',
    width: 80,
    height: 15,
    isStatic: true,
    density: 0.01,
    friction: 0.1,
    restitution: 1.2,
    color: '#2563eb',
    strokeColor: '#1d4ed8',
  },
  spiketrap: {
    type: 'spiketrap',
    label: '尖刺陷阱',
    width: 60,
    height: 30,
    isStatic: true,
    density: 0.01,
    friction: 0.8,
    restitution: 0.0,
    color: '#dc2626',
    strokeColor: '#991b1b',
  },
};

export const BALL_CONFIG = {
  radius: 12,
  density: 0.004,
  friction: 0.3,
  restitution: 0.5,
  color: '#f97316',
  strokeColor: '#ea580c',
};

export const TARGET_CONFIG = {
  width: 36,
  height: 36,
  color: '#fbbf24',
  strokeColor: '#d97706',
  label: '★',
};

export function createBodyConfig(type: ObstacleType, x: number, y: number, angle: number = 0): BodyConfig {
  const preset = OBSTACLE_PRESETS[type];
  return {
    type,
    x,
    y,
    width: preset.width,
    height: preset.height,
    angle,
    isStatic: preset.isStatic,
    density: preset.density,
    friction: preset.friction,
    restitution: preset.restitution,
  };
}
