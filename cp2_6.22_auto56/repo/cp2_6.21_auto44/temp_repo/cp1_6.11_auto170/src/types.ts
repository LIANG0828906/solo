import * as THREE from 'three';

export interface TrainPart {
  id: string;
  name: string;
  description: string;
  mesh: THREE.Object3D;
}

export interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export interface UIState {
  speed: number;
  isRunning: boolean;
  selectedPart: string | null;
  currentView: string;
}

export type ViewType = 'top' | 'side' | 'front' | 'perspective';
