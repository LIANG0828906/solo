import * as THREE from 'three';

export interface ModelTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface ModelInstance {
  id: 'A' | 'B';
  scene: THREE.Group | null;
  transform: ModelTransform;
  loaded: boolean;
  fileName: string;
  edgeColor: string;
  loadingProgress: number;
}

export type ComparisonMode = 'split' | 'overlay';

export interface Annotation {
  id: string;
  componentName: string;
  eraRange: string;
  description: string;
  worldPosition: [number, number, number];
  viewed: boolean;
  modelId: 'A' | 'B';
}

export interface AnnotationMockData {
  id: string;
  componentName: string;
  eraRange: string;
  description: string;
  meshNamePattern: string;
}

export interface MeasurementPoint {
  position: [number, number, number];
  screenPosition: { x: number; y: number };
}

export interface MeasurementLine {
  id: string;
  start: MeasurementPoint;
  end: MeasurementPoint | null;
  distance: number;
  complete: boolean;
}

export type ThemeType = 'dusk' | 'daylight' | 'night';

export interface ThemeConfig {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  backgroundColor: string;
  hasPointLight?: boolean;
  pointLightColor?: string;
  pointLightPosition?: [number, number, number];
  pointLightIntensity?: number;
}

export interface EraPreset {
  year: number;
  label: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface ViewSynchronization {
  enabled: boolean;
  source: 'A' | 'B';
}

export interface HitResult {
  point: THREE.Vector3;
  object: THREE.Object3D;
  modelId: 'A' | 'B';
  face?: THREE.Face | null;
}
