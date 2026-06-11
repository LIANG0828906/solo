import * as THREE from 'three';

export interface GroupInfo {
  id: string;
  name: string;
  color: string;
  mesh: THREE.Mesh;
  initialPosition: THREE.Vector3;
  initialMatrix: THREE.Matrix4;
  vertexCount: number;
  faceCount: number;
  selected: boolean;
  explodeOffset: THREE.Vector3;
  randomAngle: number;
}

export interface AnimationState {
  progress: number;
  isAnimating: boolean;
  isExploding: boolean;
  startTime: number;
}

export interface ScreenshotItem {
  id: string;
  dataUrl: string;
  timestamp: number;
}
