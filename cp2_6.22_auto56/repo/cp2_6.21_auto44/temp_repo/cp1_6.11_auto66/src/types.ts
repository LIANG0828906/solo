import * as THREE from 'three';

export type ArrayType = 'hexagram' | 'spiral' | 'ring';
export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'dark';
export type RuneState = 'idle' | 'flying' | 'dragging' | 'placed';

export interface ArraySlot {
  position: THREE.Vector3;
  requiredElement: ElementType;
  occupied: boolean;
  runeId: string | null;
  outlineMesh?: THREE.Mesh;
}

export interface RuneData {
  id: string;
  element: ElementType;
  state: RuneState;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  mesh: THREE.Group;
  flyProgress: number;
  trailParticles: THREE.Points | null;
}

export interface ArrayConfig {
  type: ArrayType;
  name: string;
  slots: ArraySlot[];
  lineColor: number;
  particleColor: number;
  particleCount: number;
  elementColors: Record<ElementType, number>;
}

export interface CameraState {
  target: THREE.Vector3;
  theta: number;
  phi: number;
  distance: number;
  targetTheta: number;
  targetPhi: number;
  targetDistance: number;
  targetLookAt: THREE.Vector3;
}

export const ELEMENT_COLORS: Record<ElementType, number> = {
  fire: 0xff4444,
  water: 0x4488ff,
  wind: 0x44ffff,
  earth: 0xaa7744,
  light: 0xffdd44,
  dark: 0xaa44ff
};

export const ELEMENT_ORDER: ElementType[] = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];
