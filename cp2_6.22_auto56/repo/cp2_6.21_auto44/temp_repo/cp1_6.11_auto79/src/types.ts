import * as THREE from 'three';

export type ElementType = 'fire' | 'water' | 'wind' | 'earth';

export interface IslandData {
  id: number;
  position: THREE.Vector3;
  color: THREE.Color;
  element: ElementType;
  colliderRadius: number;
  mesh: THREE.Group;
  glowMesh: THREE.Mesh;
  rotationSpeed: number;
  cooldown: number;
  hasTreasure: boolean;
  treasureMesh?: THREE.Mesh;
  treasureCollected: boolean;
  treasureRespawnTimer: number;
  glowPulsePhase: number;
}

export interface AirshipState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  pitch: number;
  roll: number;
  targetYaw: number;
  targetPitch: number;
  targetRoll: number;
  baseSpeed: number;
  currentSpeed: number;
  verticalSpeed: number;
  speedBoost: boolean;
  speedBoostTimer: number;
  shieldActive: boolean;
  shieldTimer: number;
  buoyancyBoost: boolean;
  buoyancyBoostTimer: number;
  attackActive: boolean;
  attackTimer: number;
}

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  type: 'thrust' | 'explosion' | 'coin' | 'elemental';
}

export interface GameState {
  score: number;
  isRunning: boolean;
}
