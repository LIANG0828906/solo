import * as THREE from 'three';
import { CatmullRomCurve3 } from 'three';

export interface SceneConfig {
  glowIntensity: number;
  rotationSpeed: number;
  subPointAmplitude: number;
}

export interface StarNode {
  id: string;
  position: THREE.Vector3;
  baseColor: THREE.Color;
  baseScale: number;
  isSelected: boolean;
  isDragging: boolean;
  pulsePhase: number;
  breathSeed: number;
}

export interface SubPoint {
  offset: number;
  phase: number;
}

export interface StarEdge {
  id: string;
  from: string;
  to: string;
  curve: CatmullRomCurve3;
  flowPhase: number;
  subPoints: SubPoint[];
}

export interface StarFace {
  id: string;
  nodeIds: string[];
  avgColor: THREE.Color;
}

export type FrameCallback = (time: number, delta: number) => void;
export type UpdateCallback = () => void;
export type ConfigChangeCallback = (config: Partial<SceneConfig>) => void;
