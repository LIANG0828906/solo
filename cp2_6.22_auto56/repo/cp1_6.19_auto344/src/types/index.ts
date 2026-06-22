export interface Exhibit {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
}

export interface LightConfig {
  position: { x: number; y: number; z: number };
  angle: number;
  colorTemp: number;
  intensity: number;
  color: string;
}

export interface Viewpoint {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  thumbnail?: string;
  createdAt: number;
}

export interface HeatPoint {
  x: number;
  z: number;
  intensity: number;
}

export const EXHIBIT_COLORS: string[] = [
  '#64B5F6',
  '#E57373',
  '#81C784',
  '#FFD54F',
  '#BA68C8',
];

export const FLOOR_SIZE = 50;
export const FLOOR_HALF = FLOOR_SIZE / 2;
