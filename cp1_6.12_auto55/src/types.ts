import * as THREE from 'three';

export interface Building {
  id: number;
  x: number;
  z: number;
  height: number;
  color: THREE.Color;
  mesh: THREE.Mesh | null;
  haloMesh: THREE.Mesh | null;
  growthProgress: number;
  isGrowing: boolean;
}

export interface CorePoint {
  x: number;
  z: number;
  mesh: THREE.Mesh;
  spreadRadius: number;
}

export interface ControlParams {
  density: number;
  maxHeight: number;
  growthSpeed: number;
  isPaused: boolean;
}

export interface CameraState {
  theta: number;
  phi: number;
  radius: number;
  target: THREE.Vector3;
}

export interface GroundHalo {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  life: number;
  maxLife: number;
}
