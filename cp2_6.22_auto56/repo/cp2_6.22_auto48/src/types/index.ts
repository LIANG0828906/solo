import * as THREE from 'three';

export interface SonarConfig {
  horizontalAngle: number;
  verticalAngle: number;
  frequency: number;
  reverbDecay: number;
  noiseThreshold: number;
  pulseRepetitionFreq: number;
  beamWidth: number;
  maxRange: number;
}

export type MaterialType = 'rock' | 'metal' | 'fish';

export interface TargetInfo {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  distance: number;
  azimuth: number;
  elevation: number;
  echoStrength: number;
  dopplerShift: number;
  materialType: MaterialType;
  detected: boolean;
}

export interface EchoPathData {
  id: string;
  start: THREE.Vector3;
  hitPoint: THREE.Vector3;
  end: THREE.Vector3;
  strength: number;
  timestamp: number;
  lifetime: number;
}

export interface ReverbParticle {
  position: THREE.Vector3;
  baseIntensity: number;
  phase: number;
  speed: number;
}

export interface FishData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
}

export interface ObstacleData {
  id: string;
  type: 'shipwreck' | 'rock' | 'seabed';
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  material: MaterialType;
}

export interface WaveformSample {
  value: number;
  frequency: number;
  timestamp: number;
}

export interface SNRSample {
  value: number;
  timestamp: number;
}

export interface PerformanceStats {
  fps: number;
  particleCount: number;
  frameTime: number;
}
