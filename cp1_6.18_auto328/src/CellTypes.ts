export interface ICellOrganelle {
  id: string;
  name: string;
  type: 'nucleus' | 'mitochondria' | 'golgi' | 'er' | 'vacuole' | 'membrane';
  position: [number, number, number];
  targetPosition?: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  rotation: [number, number, number];
  rotationSpeed: [number, number, number];
  scale?: [number, number, number];
  pulsePhase?: number;
  pulseSpeed?: number;
  cellIndex?: number;
  opacity?: number;
}

export interface IAnimationState {
  isAnimating: boolean;
  progress: number;
  phase: 'idle' | 'stretching' | 'splitting' | 'separating' | 'resetting';
}

export const CELL_RADIUS = 5;
export const ANIMATION_DURATION = 4000;
