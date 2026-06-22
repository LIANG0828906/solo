import * as THREE from 'three';

export interface WindParams {
  direction: number;
  speed: number;
  turbulence: 'low' | 'medium' | 'high';
}

export interface PollutionSource {
  id: number;
  position: THREE.Vector3;
  rate: number;
  mesh: THREE.Mesh;
  rangeMesh: THREE.Mesh;
}

export interface CityConfig {
  buildingCount: number;
  areaSize: number;
}

export interface TransitionState {
  active: boolean;
  startTime: number;
  duration: number;
}

export type WindChangeCallback = (params: WindParams) => void;
export type SpeedChangeCallback = (speed: number) => void;
export type TurbChangeCallback = (turb: 'low' | 'medium' | 'high') => void;
