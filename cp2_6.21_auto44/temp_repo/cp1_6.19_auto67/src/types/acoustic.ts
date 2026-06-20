export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SoundSource {
  id: string;
  position: Vector3;
  radius: number;
  frequency: number;
  power: number;
}

export interface Listener {
  id: string;
  position: Vector3;
  dbValue: number;
  displayDbValue: number;
}

export type MaterialType = 'concrete' | 'glass' | 'carpet';

export interface MaterialProps {
  color: string;
  transparent: boolean;
  opacity: number;
  absorption: number;
  reflection: number;
  label: string;
}

export interface Obstacle {
  id: string;
  position: Vector3;
  size: Vector3;
  material: MaterialType;
}

export interface SoundWave {
  id: string;
  sourceId: string;
  startTime: number;
  maxRadius: number;
}

export interface ReflectionLine {
  id: string;
  start: Vector3;
  end: Vector3;
  normal: Vector3;
  startTime: number;
  duration: number;
}

export interface DiffractionArc {
  id: string;
  center: Vector3;
  radius: number;
  startAngle: number;
  endAngle: number;
  normal: Vector3;
  startTime: number;
  duration: number;
}

export interface RT60DataPoint {
  frequency: number;
  rt60: number;
  confidence: [number, number];
  decayCurve: number[];
}

export interface RayHit {
  point: Vector3;
  normal: Vector3;
  distance: number;
  obstacle: Obstacle | null;
  isWall: boolean;
  wallNormal?: Vector3;
}

export interface AcousticState {
  roomSize: Vector3;
  soundSources: SoundSource[];
  listeners: Listener[];
  obstacles: Obstacle[];
  soundWaves: SoundWave[];
  reflectionLines: ReflectionLine[];
  diffractionArcs: DiffractionArc[];
  rt60Data: RT60DataPoint[];
  selectedObjectId: string | null;
  selectedObjectType: 'source' | 'listener' | 'obstacle' | null;
  addMode: 'source' | 'listener' | 'obstacle' | null;
  cameraPosition: Vector3;
  showDecayDetail: boolean;
  selectedFrequency: number;
}

export const MATERIAL_PROPS: Record<MaterialType, MaterialProps> = {
  concrete: {
    color: '#808080',
    transparent: false,
    opacity: 1,
    absorption: 0.05,
    reflection: 0.9,
    label: '混凝土',
  },
  glass: {
    color: '#87CEEB',
    transparent: true,
    opacity: 0.4,
    absorption: 0.03,
    reflection: 0.9,
    label: '玻璃',
  },
  carpet: {
    color: '#2D5016',
    transparent: false,
    opacity: 1,
    absorption: 0.4,
    reflection: 0.5,
    label: '地毯',
  },
};

export const FREQUENCIES = [125, 250, 500, 1000, 2000, 4000];

export const WALL_ABSORPTION: Record<number, number> = {
  125: 0.02,
  250: 0.03,
  500: 0.03,
  1000: 0.04,
  2000: 0.05,
  4000: 0.06,
};
