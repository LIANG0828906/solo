import * as THREE from 'three';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface CandleState {
  position: Position3D;
  height: number;
  setPosition: (x: number, y: number, z: number) => void;
  setHeight: (height: number) => void;
  getLightIntensity: () => number;
}

export interface ClothVertex {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  original: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
}

export interface FlameParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  life: number;
  maxLife: number;
}

export interface Constraint {
  p1: ClothVertex;
  p2: ClothVertex;
  restLength: number;
}
